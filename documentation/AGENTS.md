# DJEAZ — Instructions aux agents IA

> Livrer des changements fiables et ciblés, avec du code simple et une consommation de contexte proportionnée au besoin.

## 1. Comprendre le projet

DJEAZ recueille les préférences musicales des invités pour aider les DJs à préparer leurs événements : dashboard privé et sondage public sans compte. Aucun générateur automatique de playlist.

L'application se trouve dans `djeaz/`, les sources dans `documentation/`. Conserver cette organisation, sans introduire `src/`.

Consulter les documents selon la tâche :
- `PROJECT.md` : finalité et périmètre.
- `STACK.md` : technologies retenues.
- `ARCHITECTURE.md` : responsabilités, données et règles métier.
- `CONVENTIONS.md` : code, commandes, tests et livraison.
- `charte-graphique-djeaz.pdf` : identité visuelle ; **Plus Jakarta Sans** est la police d'interface validée.

Les instructions explicites de l'utilisateur priment. Ce fichier précise le comportement des agents ; les autres sources détaillent l'implémentation. Signaler une contradiction importante. Distinguer architecture cible et code réellement existant.

## 2. Autonomie et périmètre

- Un seul agent, sans délégation.
- Analyser, implémenter et vérifier jusqu'au bout. Annoncer un plan bref pour une tâche complexe, sans demander de validation à chaque étape.
- Décider des détails mineurs compatibles avec les sources ; questionner les ambiguïtés touchant périmètre, règles métier, sécurité ou données.
- Réaliser uniquement la tâche et ses ajustements indispensables ; signaler les autres améliorations.
- Préserver les modifications préexistantes. Éviter écrasements, renommages, déplacements et reformatages sans rapport avec la demande.

## 3. Git : interdiction absolue

**Aucun agent IA n'est autorisé à utiliser Git, sauf en lecture seule.** Aucune commande, intégration équivalente, opération déléguée ou manipulation directe des métadonnées du dépôt.

L'utilisateur prépare `develop` et réalise commits, pushes, merges et tags. Les merges directs vers `main` et la livraison par tag `vX.Y.Z` restent son workflow ; ils n'autorisent aucune action de l'agent.

Modifier les fichiers de travail uniquement. Ne pas lancer de livraison. Proposer éventuellement un message de commit court en anglais : `fix(surveys): preserve selections after retry`.

## 4. Code propre et proportionné

- Chercher et réutiliser composants, fonctions, schémas et conventions existants.
- Choisir la solution la plus simple couvrant le besoin. Aucune couche, configuration ou fonctionnalité anticipée.
- Créer une abstraction pour simplifier un usage réel ; éviter wrappers sans valeur et généralisations prématurées.
- Fonctions ciblées, noms explicites, types précis. Commenter les décisions non évidentes, sans paraphraser le code.
- Préférer la lisibilité aux astuces compactes. Aucun quota de lignes : justifier la taille par le comportement.
- Retirer le code rendu inutile ; éviter duplication, code mort et solutions temporaires présentées comme définitives.
- Autoriser une petite dépendance justifiée et compatible ; consulter l'utilisateur avant nouveau service, coût ou changement d'architecture. Éviter les mises à jour générales.

## 5. Données et interface

Appliquer validation serveur, session et propriété, séparation serveur/client, transactions et règles historiques des sources. Protéger secrets et données personnelles ; ne pas affaiblir les contrôles.

Créer et appliquer des migrations sur une **base locale dédiée** est autorisé après vérification de la cible. Tout environnement partagé nécessite une instruction explicite ; la production passe par le workflow de tag. Aucune suppression de données existantes sans autorisation.

Respecter charte, tokens et composants. Choisir les dispositions et espacements manquants de manière cohérente. Prévoir mobile, clavier, focus, chargement, vide et erreur ; conserver les saisies après un échec récupérable.

## 6. Économie de contexte

- Lire les consignes applicables puis les seules sections et fichiers utiles ; réutiliser le contexte fiable.
- Ne pas relire toute la documentation à chaque passage. Relire si une source change, manque au contexte ou conditionne une décision.
- Recherches ciblées, extraits courts ; éviter sorties volumineuses et inspections répétées.
- Vérifier une API incertaine dans la documentation officielle correspondant à sa version ; ne rien inventer.
- Communiquer brièvement les décisions, progrès utiles et blocages, sans raconter chaque commande.
- Économiser les tokens sans omettre contrôle essentiel ni information nécessaire.

## 7. Vérification et documentation

Utiliser **pnpm** depuis `djeaz/` et les scripts réellement disponibles dans `package.json`. Appliquer les conventions : format, lint, types, tests concernés et build. Couvrir les comportements critiques ; test de régression pour une correction métier, sans tests recopiant l'implémentation.

Corriger les échecs introduits. Si un contrôle est bloqué, poursuivre les travaux indépendants et préciser cause et limite restante. Ne jamais annoncer une validation complète sans preuve, ni désactiver un contrôle pour obtenir un résultat vert.

Actualiser les documents concernés lorsqu'une règle, commande ou fonctionnalité documentée change, sans dupliquer leurs contenus ici.

## 8. Bilan de fin de tâche

En français, synthétique mais complet :
- résultat et principaux changements ;
- contrôles exécutés et résultats ;
- blocages, limites ou action utilisateur nécessaire, si présents ;
- message de commit proposé, court et en anglais.

N'annoncer comme exécuté ou vérifié que ce qui l'a réellement été.

## 9. Documentation Next.js

La version installée peut différer des connaissances de l’agent : API, conventions et structure des fichiers.

Avant toute modification liée à Next.js, consulter les guides pertinents dans `node_modules/next/dist/docs/`, depuis le dossier de l’application. Respecter les avertissements de dépréciation et privilégier cette documentation aux connaissances mémorisées.

Limiter la lecture aux sections utiles.
