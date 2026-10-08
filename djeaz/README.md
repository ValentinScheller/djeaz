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

| Variable                 | Rôle actuel                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Connexion runtime de l'application, base `djeaz_dev`                                    |
| `DATABASE_MIGRATION_URL` | Connexion Drizzle Kit. En local, la même base que `DATABASE_URL`                        |
| `BETTER_AUTH_SECRET`     | Secret Better Auth. Chaîne non vide exigée au premier appel de la configuration serveur |
| `BETTER_AUTH_URL`        | URL absolue `http` ou `https` de l'application, exigée au même moment                   |

`BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` seront réellement utilisées lorsque Better Auth sera implémenté en P2. Aucune authentification n'est en place. Les tests fournissent leurs propres valeurs factices : ces deux variables peuvent rester vides dans `.env.local` pour lancer le socle actuel. `pnpm dev` et `pnpm build` ne les lisent pas tant que le code n'appelle pas la configuration serveur.

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

`db:generate` écrit les migrations dans `drizzle/` à partir de `db/schema.ts`. `db:migrate` les applique. Le schéma métier est vide : les premières tables arriveront en P2. `db:migrate` s'exécute déjà dans cet état.

## Développement

```bash
pnpm dev
```

Next.js sert l'application sur [http://localhost:3000](http://localhost:3000).

La page d'accueil se charge. L'authentification, le dashboard et le sondage ne sont pas encore implémentés.

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

P0 établit le socle technique. Les fonctionnalités métier arrivent dans les phases suivantes.
