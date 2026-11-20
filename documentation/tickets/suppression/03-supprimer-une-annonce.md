# 03: Supprimer une annonce avec son mot de passe

**What to build:** depuis le lien de l'email, le vendeur arrive sur la page de suppression de son annonce. Il y voit un récapitulatif (titre, prix, première photo), choisit une raison, saisit le mot de passe de l'annonce et clique sur « Supprimer l'annonce ». L'annonce n'est plus en ligne, et une page lui confirme « Votre annonce a été supprimée ».

**Blocked by:** 01 (Choisir le mot de passe de l'annonce au dépôt)

**Status:** done

- [x] La commande `SupprimerAnnonce` vérifie le mot de passe, fait passer l'annonce au statut `Supprimee` sans l'effacer du repository, la persiste, puis publie `AnnonceSupprimee` (ID, raison, date de suppression). Aucun consommateur n'existe encore.
- [x] La raison est obligatoire, dans une liste fermée aux codes stables :

  | Code | Libellé |
  | --- | --- |
  | `vendue-sur-le-site` | Vendue grâce au site |
  | `vendue-ailleurs` | Vendue ailleurs |
  | `plus-envie-de-vendre` | Je ne souhaite plus vendre |
  | `autre` | Autre |

  « Autre » n'a pas de texte libre. La raison n'est portée que par l'événement : elle n'est pas conservée sur l'annonce.
- [x] L'API répond aux cas d'erreur ainsi :
  - mot de passe incorrect : une erreur métier dédiée, soit un 400 sur `champ` `motDePasse`, et l'annonce reste en ligne ;
  - raison absente ou inconnue : un 400 sur `champ` `raison` ;
  - ID malformé : `ErrIDAnnonceInvalide` ;
  - annonce inconnue ou déjà supprimée : `ErrAnnonceIntrouvable`, sans rien laisser fuiter.
- [x] Une fois supprimée, l'annonce sort de la recherche et sa page répond 404, comme toute annonce non activée.
- [x] L'API accepte `POST /annonces/{id}/suppression` avec `{motDePasse, raison}`.
- [x] La page `/annonces/$id/supprimer` utilise les composants Spark. Quand l'annonce est introuvable, elle affiche « Annonce introuvable » au lieu du formulaire. Il n'y a pas de seconde confirmation : le mot de passe en tient lieu. Les essais ne sont pas limités.
- [x] Les tests couvrent :
  - le domaine et la commande : succès, mot de passe incorrect, annonce déjà supprimée, et l'événement émis vérifié avec le collecteur d'événements ;
  - la page, sur la gateway en mémoire : succès, mot de passe incorrect, annonce introuvable.
- [x] Le glossaire et l'`AGENTS.md` du bounded context `annonce` sont à jour (commande, événement, statut `Supprimee`).
- [x] `make check` est vert.
