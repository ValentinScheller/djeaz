# DJEAZ

Ce dossier contient l'application Next.js de DJEAZ.

Les commandes ci-dessous s'exécutent depuis `djeaz/`.

## Prérequis

- Node.js 24 (`.nvmrc`, champ `engines`)
- pnpm 10.15.1 (champ `packageManager`)
- Docker et Docker Compose

## Installation

```bash
pnpm install
```

Le lockfile `pnpm-lock.yaml` est versionné. En local, `pnpm install` installe les versions qu'il fige. La CI utilise `pnpm install --frozen-lockfile` : la commande échoue si le lockfile n'est pas à jour par rapport à `package.json`.

## Variables d'environnement

Copier `.env.example` vers `.env.local`. Le fichier local n'est pas versionné.

Renseigner les deux chaînes PostgreSQL de développement :

```bash
DATABASE_URL=postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_dev
DATABASE_MIGRATION_URL=postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_dev
```

Identifiants locaux uniquement, ceux du conteneur Docker.

| Variable                 | Rôle actuel                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Connexion runtime de l'application, base `djeaz_dev`                                           |
| `DATABASE_MIGRATION_URL` | Connexion Drizzle Kit. En local, la même base que `DATABASE_URL`                               |
| `BETTER_AUTH_SECRET`     | Secret Better Auth, au moins 32 caractères, exigé au premier appel de la configuration serveur |
| `BETTER_AUTH_URL`        | URL absolue `http` ou `https` de l'application, exigée au même moment                          |

`BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` sont utilisées par Better Auth, en place depuis P2 : les renseigner dans `.env.local` (secret d'au moins 32 caractères, par exemple `openssl rand -base64 32` ; URL `http://localhost:3000` en local) pour que l'inscription, la connexion et les espaces privés fonctionnent avec `pnpm dev`. Les tests fournissent leurs propres valeurs factices. `pnpm build` ne les lit pas : la configuration serveur est validée au premier usage, pas au build.

`djeaz_test` ne doit pas figurer dans `.env.local`.

## PostgreSQL local

```bash
docker compose up -d
docker compose ps
docker compose down
```

L'image `postgres:17.11` expose deux bases sur le port 5432 :

- `djeaz_dev` — développement ;
- `djeaz_test` — tests d'intégration, créée par le script d'initialisation au premier démarrage du volume.

Les données de développement restent dans le volume Docker. `docker compose down` arrête le conteneur et conserve ce volume.

Pour recréer uniquement `djeaz_test` :

```bash
docker compose exec postgres dropdb --if-exists --force -U djeaz djeaz_test
docker compose exec postgres createdb -U djeaz djeaz_test
```

## Drizzle

Les scripts lisent `DATABASE_MIGRATION_URL` dans `.env.local`.

```bash
pnpm db:generate
pnpm db:migrate
```

`db:generate` écrit les migrations dans `drizzle/` à partir de `db/schema.ts`. `db:migrate` les applique sur la base indiquée par `DATABASE_MIGRATION_URL`.

## Seed synthétique

```bash
pnpm db:seed
```

La commande alimente la base de `DATABASE_URL` pour le développement et les previews. Elle crée un DJ de démonstration, son catalogue, quelques genres et morceaux globaux fictifs, puis quelques catégories et associations. Tout est synthétique : aucun catalogue réel, aucun fournisseur externe.

Elle est idempotente. La relancer ne duplique pas les fixtures et ne réinitialise ni les utilisateurs, ni les catalogues, ni `revision`.

Compte de démonstration, réservé au développement :

| Champ         | Valeur               |
| ------------- | -------------------- |
| E-mail        | `demo@djeaz.example` |
| Mot de passe  | `demo-djeaz-2026`    |
| Nom           | `Compte Démo`        |
| Nom d'artiste | `DJ Démo`            |

Si ce compte existe déjà, le seed ne le recrée pas et ne change pas son mot de passe. Il n'est pas lancé au démarrage, par les migrations, ni en CI.

## Import musical

```bash
pnpm music:import -- --limit 20
```

Commande distincte du seed. Elle n'est lancée ni au démarrage, ni par une migration, ni par une Server Action, ni en CI. ListenBrainz propose des candidats par popularité ; MusicBrainz canonicalise chaque recording ; Cover Art Archive peut fournir une URL de pochette. `--limit` est obligatoire. Un checkpoint `.music-import-checkpoint.json` permet de reprendre sans doublon. Un fichier absent démarre un checkpoint neuf. Un fichier présent mais illisible ou invalide arrête l'import sans le modifier. Un recording en échec n'est pas marqué fait : il est réessayé au lancement suivant et reprend alors une place dans `--limit`. La cible est la base de `DATABASE_URL`, affichée sans mot de passe. Le User-Agent non secret `MUSICBRAINZ_USER_AGENT` est requis pour un appel réel (voir `.env.example`).

## Développement

```bash
pnpm dev
```

Next.js sert l'application sur [http://localhost:3000](http://localhost:3000).

En place : page d'accueil, Better Auth (inscription sur `/sign-up`, connexion sur `/sign-in`, déconnexion, sessions, nom d'artiste `artistName`), protection serveur des espaces privés (`/dashboard`, `/catalog`, `/settings`), catalogue vide créé à l'inscription. La sidebar du dashboard affiche le nom d'artiste et l'e-mail de la session. `/dashboard` indique qu'aucun événement n'existe encore. `/catalog` permet de créer une catégorie, de rechercher la bibliothèque DJEAZ, d'élargir explicitement vers MusicBrainz, puis d'ajouter, retirer, déplacer et réordonner des morceaux. La création d'événements et le sondage ne sont pas encore implémentés.

## Qualité et tests

| Commande                | Rôle                                             |
| ----------------------- | ------------------------------------------------ |
| `pnpm format`           | Formate le dépôt avec Prettier                   |
| `pnpm format:check`     | Vérifie le formatage                             |
| `pnpm lint`             | ESLint                                           |
| `pnpm lint:fix`         | ESLint, avec corrections                         |
| `pnpm typecheck`        | TypeScript, sans émission de fichiers            |
| `pnpm test`             | Vitest et React Testing Library                  |
| `pnpm test:integration` | PostgreSQL sur `djeaz_test`                      |
| `pnpm test:e2e`         | Playwright, Chromium mobile (~390 px) et desktop |
| `pnpm build`            | Build de production                              |
| `pnpm start`            | Sert le build                                    |

PostgreSQL doit être démarré pour `pnpm test:integration`. Ces tests ciblent `djeaz_test` (`postgresql://djeaz:djeaz@127.0.0.1:5432/djeaz_test`, ou `TEST_DATABASE_URL` si elle est définie) et remettent son schéma à zéro entre les tests. Ils ne modifient pas `djeaz_dev`.

Sur une nouvelle machine, installer Chromium pour Playwright :

```bash
pnpm exec playwright install chromium
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) s'exécute à chaque push sur `develop` et `main`. Le workflow enchaîne le formatage, le lint, le typecheck, les tests unitaires, les tests d'intégration, les tests de bout en bout et le build. Il ne déploie pas.

## État du projet

P0 (socle technique), P1 (identité visuelle) et P2.1 à P2.9 (données initiales, Better Auth, garde serveur, pages d'inscription et de connexion, bibliothèque musicale, catalogue, isolation multi-DJ, seed synthétique, dashboard connecté, recherche musicale et import contrôlé) sont livrées. Les fonctionnalités métier suivantes arrivent selon `documentation/ROADMAP.md`.
