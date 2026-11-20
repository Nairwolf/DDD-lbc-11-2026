# 02: Recevoir l'email de confirmation de dépôt

**What to build:** une fois son annonce déposée, donc en ligne tant que la modération n'existe pas, le vendeur reçoit un email de confirmation de dépôt. L'email contient le lien vers son annonce et le lien vers la page de suppression de l'annonce.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Un consumer du bounded context `annonce`, abonné à `AnnonceDeposee` sur le bus asynchrone, lance le cas d'usage qui envoie l'email de confirmation de dépôt via le port mailer. C'est le premier usage du mailer : il est injecté par la composition root.
- [x] L'email part à l'adresse email du vendeur, depuis une adresse d'expéditeur fixe. Il contient :
  - l'objet « Votre annonce « {titre} » est en ligne » ;
  - le pseudo et le titre ;
  - le lien vers l'annonce, `/annonces/{id}` ;
  - le lien de suppression, `/annonces/{id}/supprimer` ;
  - une phrase qui précise que la suppression demandera le mot de passe choisi au dépôt.
- [x] L'email ne contient jamais le mot de passe.
- [x] L'URL de base des liens est celle du frontend. Elle vient d'une variable d'environnement, `http://localhost:3000` par défaut.
- [x] Un échec d'envoi est journalisé, sans nouvel essai, et ne fait pas échouer le dépôt.
- [x] Le cas d'usage est testé avec le mailer espion : destinataire, objet, présence des deux liens, absence du mot de passe.
- [x] En dev, un dépôt fait arriver l'email dans Mailcatcher. Le lien de suppression répond 404 tant que le ticket 03 n'est pas livré, c'est accepté.
- [x] Le glossaire et l'`AGENTS.md` du bounded context `annonce` sont à jour (consumer, événement consommé).
- [x] `make check` est vert.
