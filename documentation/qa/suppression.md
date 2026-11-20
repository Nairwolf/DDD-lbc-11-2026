# Guide de QA : suppression d'une annonce

Valide les tickets `documentation/tickets/suppression/` (01, 02, 03) dans un navigateur.

Partie automatisée : `apps/e2e` (`make e2e`).

## Prérequis

- `make mail` (Mailcatcher : SMTP `:1025`, interface http://localhost:1080).
- API : `SMTP_ADDR=localhost:1025 make dev-api` (`:8080`). Frontend : `make dev-web` (`:3000`).
- Les annonces de démo ont le mot de passe `demo1234`.
- Mémoire seule : redémarrer l'API remet l'état à zéro.

## Scénarios

### A. Mot de passe au dépôt (ticket 01)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| A1 | Ouvrir `/annonces/deposer` | Le champ « Mot de passe de l'annonce » est présent, sans champ de confirmation. |
| A2 | Cliquer sur afficher/masquer | La saisie passe de masquée à visible, et inversement. |
| A3 | Remplir le formulaire avec un mot de passe de 7 caractères, soumettre | Message d'erreur en français sous le champ, aucun dépôt. |
| A4 | Laisser le mot de passe vide, soumettre | Message d'erreur sous le champ, aucun dépôt. |
| A5 | Mot de passe de 8 caractères (ex. `secret12`), soumettre | Dépôt réussi, l'annonce est consultable. |
| A6 | Inspecter la réponse API et l'onglet réseau | Aucun mot de passe (clair ou haché) dans les réponses. |

### B. Email de confirmation (ticket 02)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| B1 | Après A5, ouvrir Mailcatcher | Un email est arrivé pour l'adresse du vendeur. |
| B2 | Lire l'objet | « Votre annonce « {titre} » est en ligne ». |
| B3 | Lire le corps | Pseudo, titre, lien `/annonces/{id}`, lien `/annonces/{id}/supprimer`, phrase sur le mot de passe choisi au dépôt. |
| B4 | Chercher le mot de passe dans l'email | Absent. |
| B5 | Cliquer sur le lien de l'annonce | La page de l'annonce s'affiche. |
| B6 | Arrêter Mailcatcher, déposer une annonce | Le dépôt réussit quand même ; l'échec d'envoi est dans les logs de l'API. |

### C. Suppression (ticket 03)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| C1 | Cliquer sur le lien de suppression de l'email | Page avec titre, prix, première photo, choix de raison, champ mot de passe, bouton « Supprimer l'annonce ». |
| C2 | Vérifier les raisons proposées | Vendue grâce au site, Vendue ailleurs, Je ne souhaite plus vendre, Autre (sans texte libre). |
| C3 | Soumettre sans raison | Erreur sous le champ raison. |
| C4 | Choisir une raison, mauvais mot de passe | Erreur sous le champ mot de passe ; l'annonce reste en ligne ; on peut réessayer sans limite. |
| C5 | Choisir une raison, bon mot de passe | Page « Votre annonce a été supprimée », sans seconde confirmation. |
| C6 | Rouvrir `/annonces/{id}` | 404. |
| C7 | Chercher l'annonce sur `/recherche` | Elle n'apparaît plus. |
| C8 | Rouvrir `/annonces/{id}/supprimer` | « Annonce introuvable » au lieu du formulaire. |
| C9 | Ouvrir `/annonces/inconnu/supprimer` | « Annonce introuvable ». |
| C10 | Supprimer une annonce de démo avec `demo1234` | Suppression réussie. |

### D. API directe (complément)

- `POST /api/annonces/{id}/suppression` avec `{"motDePasse":"mauvais","raison":"autre"}` : 400, `champ` `motDePasse`.
- Même appel avec `raison` absente ou inconnue : 400, `champ` `raison`.
- ID malformé : erreur `ErrIDAnnonceInvalide`. Annonce déjà supprimée : `ErrAnnonceIntrouvable`.

## Preuves attendues

Une capture par scénario clé (A3, A5, B3 dans Mailcatcher, C1, C4, C5, C6, C8) et une vidéo du parcours complet : dépôt → email → suppression → 404.
