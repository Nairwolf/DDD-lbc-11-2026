package domain

import (
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

// Statut of an annonce. Moderation will add more.
type Statut string

const (
	Activee   Statut = "Activee"
	Supprimee Statut = "Supprimee"
)

// Annonce is the aggregate root: a good a vendeur puts up for sale.
type Annonce struct {
	id           string
	titre        string
	description  string
	prix         Prix
	categorie    Categorie
	localisation Localisation
	vendeur      Vendeur
	motDePasse   MotDePasse
	images       []string
	deposeeLe    time.Time
	statut       Statut
}

// Lengths of the titre and the description, counted in characters once
// trimmed.
const (
	titreMin       = 3
	titreMax       = 100
	descriptionMin = 10
	descriptionMax = 4000
)

// NewAnnonceArgs carries the primitives an annonce is built from.
type NewAnnonceArgs struct {
	Titre       string
	Description string
	Prix        int64
	Categorie   string
	Ville       string
	CodePostal  string
	Pseudo      string
	Email       string
	Telephone   string
	MotDePasse  string // clear text, hashed by the constructor and never kept
	DeposeeLe   time.Time
}

// NewAnnonce builds an annonce with a fresh ID, activee from the start.
func NewAnnonce(args NewAnnonceArgs) (*Annonce, error) {
	return RestoreAnnonce(uuid.NewString(), Activee, args)
}

// RestoreAnnonce rebuilds an annonce whose ID and statut are already known,
// as a persistence adapter does when it loads one.
func RestoreAnnonce(id string, statut Statut, args NewAnnonceArgs) (*Annonce, error) {
	titre := strings.TrimSpace(args.Titre)
	if n := utf8.RuneCountInString(titre); n < titreMin || n > titreMax {
		return nil, ErrTitreInvalide
	}
	description := strings.TrimSpace(args.Description)
	if n := utf8.RuneCountInString(description); n < descriptionMin || n > descriptionMax {
		return nil, ErrDescriptionInvalide
	}
	prix, err := NewPrix(args.Prix)
	if err != nil {
		return nil, err
	}
	categorie, err := NewCategorie(args.Categorie)
	if err != nil {
		return nil, err
	}
	localisation, err := NewLocalisation(args.Ville, args.CodePostal)
	if err != nil {
		return nil, err
	}
	vendeur, err := NewVendeur(args.Pseudo, args.Email, args.Telephone)
	if err != nil {
		return nil, err
	}
	motDePasse, err := NewMotDePasse(args.MotDePasse)
	if err != nil {
		return nil, err
	}
	return &Annonce{
		id:           id,
		titre:        titre,
		description:  description,
		prix:         prix,
		categorie:    categorie,
		localisation: localisation,
		vendeur:      vendeur,
		motDePasse:   motDePasse,
		images:       []string{},
		deposeeLe:    args.DeposeeLe,
		statut:       statut,
	}, nil
}

// ParseAnnonceID checks that id is a UUID, the shape of every annonce ID.
func ParseAnnonceID(id string) (string, error) {
	parsed, err := uuid.Parse(id)
	if err != nil {
		return "", ErrIDAnnonceInvalide
	}
	return parsed.String(), nil
}

func (a *Annonce) ID() string                 { return a.id }
func (a *Annonce) Titre() string              { return a.titre }
func (a *Annonce) Description() string        { return a.description }
func (a *Annonce) Prix() Prix                 { return a.prix }
func (a *Annonce) Categorie() Categorie       { return a.categorie }
func (a *Annonce) Localisation() Localisation { return a.localisation }
func (a *Annonce) Vendeur() Vendeur           { return a.vendeur }

// MotDePasseCorrespond tells whether saisie is the mot de passe de l'annonce.
func (a *Annonce) MotDePasseCorrespond(saisie string) bool { return a.motDePasse.Correspond(saisie) }
func (a *Annonce) Images() []string                        { return append([]string{}, a.images...) }
func (a *Annonce) DeposeeLe() time.Time                    { return a.deposeeLe }
func (a *Annonce) Statut() Statut                          { return a.statut }
func (a *Annonce) EstActivee() bool                        { return a.statut == Activee }

// Supprimer withdraws the annonce when saisie is its mot de passe. A
// non-activee annonce answers ErrAnnonceIntrouvable, so that its existence
// does not leak; a wrong mot de passe answers ErrMotDePasseIncorrect and
// leaves the annonce en ligne.
func (a *Annonce) Supprimer(saisie string) error {
	if !a.EstActivee() {
		return ErrAnnonceIntrouvable
	}
	if !a.MotDePasseCorrespond(saisie) {
		return ErrMotDePasseIncorrect
	}
	a.statut = Supprimee
	return nil
}
