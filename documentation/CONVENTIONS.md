# DJEAZ — Conventions

> Règles communes aux développeurs et agents IA pour le MVP. `ARCHITECTURE.md` définit les responsabilités et comportements ; ce document définit leur mise en œuvre cohérente.

Les chemins applicatifs sont relatifs à **`djeaz/`**. La documentation reste dans `documentation/` ; les workflows dans `.github/workflows/` à la racine du dépôt. Conserver `app/` sans introduire de dossier `src/`.

## 1. Langue et nommage

- Documentation, commentaires utiles et interface en français ; code, routes, schéma et commits en anglais.
- Fichiers et dossiers en `kebab-case`, sauf noms conventionnels (`README.md`, `AGENTS.md`, `CLAUDE.md` et documents de référence en majuscules) ; composants/types en `PascalCase` ; variables/fonctions en `camelCase` ; constantes fixes en `UPPER_SNAKE_CASE`.
- SQL en `snake_case`, tables métier au pluriel ; propriétés TypeScript en `camelCase`. Mapper explicitement le schéma Better Auth si nécessaire.
- Imports internes via `@/` vers la racine de `djeaz/` : `"@/*": ["./*"]` dans son `tsconfig.json` ; imports relatifs courts autorisés. Exports nommés, sauf conventions Next.js imposant un export par défaut.
- Terminologie stable : `event`, `catalog`, `genre`, `track`, `response`, `selection`, `freeRequest`. Une réponse représente un participant ; ne pas créer un second modèle invité.

## 2. Outils et qualité du code

**pnpm** est l'unique gestionnaire de paquets. Versionner le lockfile ; fixer pnpm dans `packageManager` et Node.js LTS dans `.nvmrc`/`engines`. Versions stables compatibles, sans `latest` flottant.

Exécuter les commandes depuis `djeaz/`, ou avec `pnpm --dir djeaz <script>` depuis la racine. Les configurations et dépendances restent dans ce dossier ; conserver son `pnpm-workspace.yaml`. Ignorer `node_modules/`, `.next/`, rapports de tests et secrets locaux dans les `.gitignore` existants.

TypeScript `strict`, `unknown` aux frontières, types inférés de Zod/Drizzle. Aucun `any`, assertion ou diagnostic supprimé sans justification.

ESLint Next.js/TypeScript ; Prettier : deux espaces, points-virgules, guillemets doubles, virgules finales, largeur 100. Configurations versionnées ; formatage limité au changement.

| Script pnpm | Contrat |
|---|---|
| `dev`, `build`, `start` | Développement, build et démarrage |
| `lint`, `typecheck` | ESLint, puis TypeScript sans émission |
| `format`, `format:check` | Formatage et vérification Prettier |
| `test`, `test:integration`, `test:e2e` | Vitest, intégration PostgreSQL et Playwright, sans mode watch en CI |
| `db:generate`, `db:migrate`, `db:seed` | Génération, application des migrations et données synthétiques |

## 3. Frontières et logique métier

- `app/` compose les pages et adapte les requêtes ; la logique métier appartient aux features.
- Les modules `.server.ts` importent `server-only`. Réserver `"use server"` aux points d'entrée Server Actions ; ce n'est pas un marqueur général de confidentialité.
- Ajouter `"use client"` uniquement aux composants interactifs. Aucun import DB, secret ou module serveur depuis du code client.
- Les opérations de feature partagent validations et contrôles, quel que soit leur appelant. Aucun appel HTTP interne pour lire ses propres données côté serveur.
- Toute mutation suit : validation → identité/permission → règles métier → transaction si nécessaire → actualisation de l'interface.
- Ne jamais croire un `ownerId`, un statut, un libellé historique ou un total envoyé par le client. Reconstituer ces valeurs côté serveur.
- Pas de dépendances circulaires. Une dépendance entre features passe par une fonction explicite ; une abstraction partagée nécessite un usage réel.

## 4. Entrées, erreurs et sécurité

Schémas Zod partagés, validation serveur obligatoire. Normaliser les espaces périphériques ; pseudonyme de 1 à 80 caractères, nom d'événement de 1 à 160, genre de 1 à 80, titre/artiste de 1 à 200, demande libre de 1 à 500. Dédupliquer les IDs de morceaux. Une réponse contient au moins un morceau ou une demande. Centraliser les bornes, tranches d'âge et transitions.

Les actions métier retournent une union discriminée : `{ ok: true, data }` ou `{ ok: false, error: { code, message, fieldErrors? } }`. Codes stables : `VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`, `SURVEY_CLOSED`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`. Une ressource privée appartenant à un autre DJ produit `NOT_FOUND`. Les endpoints HTTP métier mappent les mêmes erreurs aux statuts adéquats ; Better Auth conserve son contrat natif.

Messages affichés en français, sans détails SQL ni stack trace. Journaliser les erreurs inattendues avec leur identifiant de diagnostic, sans mot de passe, token, cookie, connexion DB ou contenu de réponse.

Réutiliser la protection d'origine des Server Actions ; vérifier l'origine des Route Handlers métier qui écrivent avec des cookies. Configurer les origines autorisées de Better Auth. Le rendu de texte libre reste du texte, jamais du HTML injecté.

## 5. Données et migrations

Drizzle par défaut ; SQL paramétré pour agrégations et verrous. Filtrer les requêtes privées par propriétaire et contrôler toutes les références publiques.

Appliquer les contraintes et transactions de l'architecture. Respecter l'ordre des verrous ; une version obsolète renvoie `CONFLICT`, sans mutation partielle.

Versionner ensemble schéma, migration SQL et métadonnées Drizzle. Relire le SQL généré ; ne jamais modifier une migration déjà appliquée ni utiliser `db push` sur un environnement partagé. Un seed est idempotent, synthétique et ne réinitialise pas les données utilisateur. Le catalogue de référence a sa propre version.

Toute migration destructive documente sa sauvegarde préalable et sa reprise ; restaurer le code ne restaure pas la base.

## 6. Interface

Composants partagés et shadcn/ui ; tokens CSS centralisés pour Tailwind. L'identité visuelle est définie dans `GRAPHICS.md`.

Sondage conçu pour mobile ; HTML sémantique, labels, clavier et focus visible. Prévoir chargement, vide et erreur ; signaler les mutations et confirmer les suppressions. Conserver les saisies après un échec récupérable.

## 7. Tests et validation

- **Vitest** : transitions, validations, calculs et règles métier ; tests `*.test.ts` près du code.
- **React Testing Library** : comportements interactifs utiles ; tests `*.test.tsx`, sans dépendre des détails internes.
- **Intégration PostgreSQL** : isolation multi-DJ, contraintes, transactions, concurrence, suppression et conservation historique.
- **Playwright** : inscription/connexion → événement → ouverture → réponse → résultats ; modification sans double comptage, clôture et refus d'accès entre DJs.

Base de test dédiée et reproductible. Couvrir secrets invalides, IDs d'un autre catalogue et changements concurrents. Aucun objectif arbitraire de couverture ; test de régression pour chaque correction métier.

Validation : format, lint, types, tests concernés et build passent ; comportements critiques couverts et documentation à jour. La CI des pushes sur `develop`/`main` inclut intégration/E2E ; la release répète les contrôles sur le commit tagué. Tout test ignoré est expliqué et suivi.

## 8. Git et livraison

GitHub : **`develop` = développement/intégration**, **`main` = code prêt à livrer**. Travailler directement sur `develop` ou sur une branche courte (`feat/*`, `fix/*`, `refactor/*`, `docs/*`) fusionnée dans `develop`. Après validation, fusionner directement `develop` dans `main` et pousser : **aucune PR obligatoire**. Les règles GitHub doivent permettre ces pushes ; interdire les force-pushes et suppressions de `main`/`develop` sans imposer de revue par PR.

Conventional Commits, sujet court en anglais : `feat(surveys): allow response editing`. Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`. Commits cohérents ; ne pas mélanger des changements indépendants.

Une livraison exige un **nouveau tag annoté `vX.Y.Z`** selon SemVer, créé sur un commit validé et présent dans l'historique de `main`, puis poussé sur GitHub. Créer un tag local seul ne déclenche rien ; une GitHub Release n'est pas nécessaire. Ne jamais déplacer, réutiliser ou supprimer un tag publié. Un merge/push sur `main` déclenche la CI, mais ne livre pas en production.

Le workflow de tag déploie uniquement son commit après réussite des contrôles, du build et des migrations. Conserver les secrets DB de production et Vercel dans l'environnement GitHub `production` ; aucune approbation manuelle supplémentaire requise. Un échec impose une correction ou une relance maîtrisée du même workflow ; ne pas modifier le tag. Éviter plusieurs releases simultanées et toute livraison d'une version antérieure à celle déjà publiée.

Correctif urgent : branche `fix/*` depuis le tag actuellement déployé, fusion directe dans `main` et réintégration dans `develop`, puis nouveau tag de livraison. Vérifier le contenu complet du commit tagué : il peut inclure d'autres changements déjà intégrés à `main`.

Les previews ne contiennent ni secrets ni données de production. Les migrations de production passent uniquement par le workflow de tag, jamais depuis une preview. Fournir `djeaz/.env.example` sans valeur sensible et ignorer les fichiers `.env` locaux.
