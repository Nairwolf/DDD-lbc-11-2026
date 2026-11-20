# Guide de QA : dépôt et recherche d'annonces

Valide les tickets `documentation/tickets/depot-et-recherche/` (01 à 06) dans un navigateur.

Partie automatisée : `apps/e2e` (`make e2e`).

## Prérequis

- API : `make dev-api` (`:8080`). Frontend : `make dev-web` (`:3000`). Ou les deux avec `make dev`.
- 11 annonces de démo sont chargées au démarrage ; `DEMO_DATA=off make dev-api` démarre sans elles.
- Mémoire seule : redémarrer l'API remet l'état à zéro.
- Depuis la suppression, le dépôt exige aussi un mot de passe (8 caractères minimum) : il est couvert par `suppression.md`, ici on saisit toujours `secret12`.
- Annonces de démo utiles : « Cartons de déménagement à donner » (don, Lille), « Vélo électrique de ville » (Saint-Étienne), « Scooter 50 cm³ » (Ajaccio, 2A), « Planche de surf 7'2 » (Saint-Denis 97400), « Table de jardin en teck » (Saint-Denis 93200), « iPhone 13 128 Go » (Paris 75015).

## Scénarios

### A. Design system Spark (ticket 01)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| A1 | Ouvrir `/` | Header, footer et accueil au look leboncoin, police Nunito Sans (vérifier dans l'inspecteur). |
| A2 | Parcourir l'accueil, la recherche, une annonce, le formulaire de dépôt | Aucun rendu cassé (marges, couleurs, tailles de texte). |
| A3 | Basculer le thème clair / sombre (s'il est proposé) | Le thème change partout, les textes restent lisibles. |
| A4 | Recharger directement `/` avec JavaScript désactivé | La page est rendue côté serveur. |

### B. Consulter une annonce (ticket 02)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| B1 | Depuis l'accueil, ouvrir une annonce de démo | Placeholder d'image, titre, prix en euros, catégorie, description, ville, code postal, département, région, pseudo du vendeur, date de dépôt. |
| B2 | Ouvrir « Cartons de déménagement à donner » | Le prix affiché est « Don ». |
| B3 | Ouvrir « Scooter 50 cm³ » | Département Corse-du-Sud (2A), région Corse. |
| B4 | Ouvrir « Planche de surf 7'2 » | Département La Réunion (974), région La Réunion. |
| B5 | Inspecter la réponse de `GET /api/annonces/{id}` | Le pseudo est présent ; ni email ni téléphone. |
| B6 | Ouvrir `/annonces/00000000-0000-4000-8000-000000000000` | Page « Annonce introuvable ». |
| B7 | Redémarrer l'API avec `DEMO_DATA=off` | L'accueil n'affiche aucune annonce. |

### C. Déposer une annonce (ticket 03)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| C1 | Cliquer sur « Déposer une annonce » dans le header | Le formulaire `/annonces/deposer` s'ouvre, avec les composants Spark. |
| C2 | Soumettre le formulaire vide | Un message d'erreur en français sous chaque champ obligatoire ; aucun dépôt. |
| C3 | Titre de 2 caractères, description de 9 caractères | Erreur sous chacun des deux champs. |
| C4 | Code postal `1234`, puis `96000` | Erreur « 5 chiffres », puis « ne désigne aucun département ». |
| C5 | Pseudo d'un caractère, email `vendeur@`, téléphone `612345678` | Erreur sous chacun des trois champs. |
| C6 | Prix `-1` | Erreur sous le prix. |
| C7 | Formulaire valide, prix `12,50`, sans téléphone | Redirection vers `/annonces/{id}`, toast « Annonce déposée », prix 12,50 €. |
| C8 | Inspecter la requête `POST /api/annonces` de C7 | Clés en français, `prix` à `1250` (centimes) ; la réponse contient l'`id`. |
| C9 | Déposer avec un prix de `0` | Dépôt réussi, l'annonce affiche « Don ». |
| C10 | Déposer avec le code postal `20090` | L'annonce affiche le département 2A, région Corse. |
| C11 | Retourner à l'accueil | L'annonce déposée est en tête des dernières annonces. |

### D. Rechercher par mot-clé (ticket 04)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| D1 | Ouvrir `/` | Barre de recherche et dernières annonces (20 au plus), de la plus récente à la plus ancienne. Plus de contrôle de santé de l'API. |
| D2 | Cliquer sur une carte | La vue de l'annonce s'ouvre. |
| D3 | Rechercher `velo electrique` | `/recherche?motCle=…` ; « Vélo électrique de ville » est trouvée, total affiché. |
| D4 | Rechercher `VÉLO` | Même résultat : casse et accents ignorés. |
| D5 | Rechercher `velo guitare` | Aucun résultat (ET logique), message dédié. |
| D6 | Rechercher `antivol` (présent seulement dans une description) | « Vélo électrique de ville » est trouvée. |
| D7 | Rechercher avec un mot-clé vide | Toutes les annonces, avec leur total. |
| D8 | Chaque résultat | Placeholder, titre, prix ou « Don », ville, date. |
| D9 | Copier l'URL de résultats, l'ouvrir dans un nouvel onglet | Mêmes critères, mêmes résultats. |
| D10 | Déposer des annonces jusqu'à dépasser 20 au total, rechercher sans mot-clé | 20 résultats en page 1, pagination Spark ; la page 2 affiche le reste et `page=2` apparaît dans l'URL. |
| D11 | Ouvrir `/recherche?page=abc` | Pas de plantage : le paramètre invalide est ignoré ou corrigé. |

### E. Filtrer par catégorie et prix (ticket 05)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| E1 | Sur l'accueil, choisir la catégorie Véhicules, rechercher | `/recherche` avec `categorie=vehicules` : Peugeot 208 et Scooter seulement. |
| E2 | Sur `/recherche`, vérifier le sélecteur | Les 8 catégories : Véhicules, Immobilier, Multimédia, Maison & Jardin, Mode, Loisirs, Emploi & Services, Autres. |
| E3 | Prix min `100`, max `1000` (euros) | Seules les annonces entre 100 € et 1 000 €, bornes incluses ; `prixMin=10000&prixMax=100000` dans l'URL. |
| E4 | Prix min `0`, max `0` | Seuls les dons. |
| E5 | Catégorie Loisirs et mot-clé `surf` | Seule la planche de surf. |
| E6 | Depuis la page 2, changer un filtre | Retour en page 1. |
| E7 | Prix min `500`, max `100` | Erreur explicite, pas de plantage. |
| E8 | Ouvrir `/recherche?categorie=inconnue` | Erreur explicite, pas de plantage. |

### F. Filtrer par lieu (ticket 06)

| # | Étapes | Résultat attendu |
| - | ------ | ---------------- |
| F1 | Ouvrir le sélecteur de lieu sur `/recherche` | Les régions, puis leurs départements, dans un seul sélecteur. |
| F2 | Choisir la région Île-de-France | L'iPhone (Paris) et la table de jardin (Saint-Denis 93) ; `region=11` dans l'URL. |
| F3 | Choisir le département Corse-du-Sud (2A) | Seul le scooter d'Ajaccio ; `departement=2A` dans l'URL. |
| F4 | Saisir `Saint-Denis` sans lieu | Les deux homonymes (93 et 974). |
| F5 | Saisir `Saint-Denis` avec la région La Réunion | Seule la planche de surf. |
| F6 | Saisir `saint etienne` | « Vélo électrique de ville » (Saint-Étienne). |
| F7 | Saisir `97400` | Seule la planche de surf. |
| F8 | Saisir `Paris 15e`, puis `Paris` | Aucun résultat, puis l'iPhone : la ville doit être identique. |
| F9 | Saisir `Lyon` avec la région Bretagne | Zéro résultat, sans erreur. |
| F10 | Combiner lieu, mot-clé, catégorie et prix | Les critères se cumulent ; tous sont dans l'URL. |
| F11 | Depuis la page 2, changer le lieu | Retour en page 1. |
| F12 | Sur l'accueil, renseigner les champs de lieu et rechercher | Mêmes champs qu'en recherche ; les critères arrivent dans l'URL de `/recherche`. |

### G. API directe (complément)

- `GET /api/annonces/{id}` : 200 ; inconnue, 404 ; ID mal formé (`abc`), 400. Erreurs en JSON `{"erreur": …}`.
- `POST /api/annonces` avec un titre trop court : 400, `champ` `titre`. Idem pour chaque règle du ticket 03.
- `GET /api/annonces?motCle=velo&categorie=loisirs&prixMin=0&prixMax=100000&page=1` : `annonces`, `total`, `page`, `parPage` (20).
- `GET /api/annonces?categorie=inconnue` : 400 (`ErrCategorieInconnue`).
- `GET /api/annonces?prixMin=500&prixMax=100` : 400 (`ErrFourchettePrixInvalide`).
- `GET /api/annonces?region=11&departement=93` : 400 (`ErrLieuAmbigu`).
- `GET /api/annonces?region=99` : 400 (`ErrRegionInconnue`) ; `departement=99` : 400 (`ErrCodeDepartementInconnu`).
- `GET /api/annonces?page=0` : 400 (`ErrPageInvalide`).
- `GET /api/regions` : les régions et leurs départements, dont 2A, 2B et 971 à 976.

## Preuves attendues

Une capture par scénario clé (A1, B1, B6, C2, C7, D3, D5, D10, E3, F5, F8) et une vidéo du parcours complet : dépôt → toast → accueil → recherche filtrée → ouverture de l'annonce.
