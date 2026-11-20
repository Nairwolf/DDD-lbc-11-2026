# 01: Choisir le mot de passe de l'annonce au dépôt

**What to build:** en déposant son annonce, le vendeur choisit un mot de passe de l'annonce. C'est lui qui, plus tard, l'autorisera à supprimer l'annonce, puisque le vendeur n'a pas de compte. Le champ a un bouton afficher/masquer. Un mot de passe trop court affiche un message en français sous le champ.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Le mot de passe de l'annonce est obligatoire au dépôt, et doit compter au moins 8 caractères, sans autre règle de composition.
- [x] Un value object `MotDePasse`, dans le domaine, le hache à la construction (pbkdf2 de la bibliothèque standard, avec un sel aléatoire) et sait dire s'il `Correspond` à une saisie. Le mot de passe n'est jamais conservé en clair.
- [x] Un mot de passe trop court est refusé par une erreur métier dédiée, soit un 400 sur `champ` `motDePasse`. L'erreur a sa ligne dans la table des champs invalides du handler.
- [x] Le mot de passe, en clair comme haché, n'apparaît dans aucune vue, dans aucun événement et dans aucun log.
- [x] Le formulaire `/annonces/deposer` gagne le champ « Mot de passe de l'annonce » (composant Spark, avec afficher/masquer), sans champ de confirmation. Le schéma Zod reprend la règle des 8 caractères.
- [x] Les annonces de démo ont toutes le mot de passe `demo1234`.
- [x] Les tests couvrent les deux côtés : règle et correspondance dans le domaine, dépôt avec et sans mot de passe sur la gateway en mémoire.
- [x] Le glossaire et l'`AGENTS.md` du bounded context `annonce` sont à jour.
- [x] `make check` est vert.
