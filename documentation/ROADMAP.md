# DJEAZ — Roadmap d'implémentation

> Plan ordonné des travaux nécessaires pour réaliser l'ensemble du périmètre validé du MVP. Fondé sur `PROJECT.md`, `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `GRAPHICS.md`, la charte PDF et l'état réel du dépôt observé le 7 octobre 2026, puis révisé le 12 octobre 2026 pour le **pivot « bibliothèque musicale globale et catalogue personnel »** (§2.4). Ce document dit **quoi construire, dans quel ordre, pourquoi et comment vérifier** ; les règles techniques détaillées restent dans leurs sources respectives et ne sont pas recopiées ici.

Chaque phase (`P0` à `P8`) et chaque étape (`P3.4`, etc.) possède un identifiant stable destiné au découpage en tickets ; les identifiants déjà utilisés avant le pivot sont conservés, y compris pour les étapes terminées, et `P2.9` a été ajouté. Quatre jalons (`J0` à `J3`) marquent les états intermédiaires utiles. Aucune estimation de durée n'est fournie : le dépôt ne contient aucune base vérifiable pour en produire.

---

## 1. Objectif et périmètre

### 1.1 Ce que la roadmap doit permettre de livrer

Une application **multi-DJ** de préparation musicale, en production sur Vercel avec PostgreSQL Neon, livrée par tag Git, comprenant :

- un **site vitrine** et un **sondage public** festifs, conçus d'abord pour téléphone, sans compte invité ;
- un **dashboard DJ** sobre et professionnel : authentification email/mot de passe (Better Auth), catalogue personnel construit par le DJ (catégories libres, morceaux choisis), événements, partage par lien et QR code, résultats et statistiques ;
- une **bibliothèque musicale globale** partagée, alimentée par un import initial contrôlé puis par les sélections explicites des utilisateurs, avec recherche local-first et fournisseurs externes de métadonnées en repli ; aucune lecture audio ;
- la **conservation des choix historiques** lorsque le catalogue ou les métadonnées évoluent ;
- la **sécurité** (validation, autorisation, isolation entre DJs, limitation de débit persistante, appels aux fournisseurs côté serveur uniquement, cookies, journaux) ;
- une **chaîne de qualité** complète (format, lint, types, tests unitaires, d'intégration et de bout en bout) et une **CI/CD par tag** déployant le commit exact après contrôles, build et migrations.

Les règles métier, le modèle de données et les contraintes d'exécution sont ceux d'`ARCHITECTURE.md` ; la mise en œuvre suit `CONVENTIONS.md` ; la direction artistique suit `GRAPHICS.md`. Cette roadmap ne modifie aucun de ces choix.

### 1.2 Hors périmètre (explicitement exclu du MVP)

Les éléments suivants ne figurent pas dans les sources validées. Ils ne sont planifiés nulle part ci-dessous et doivent faire l'objet d'une décision avant toute réalisation :

- génération automatique de playlist ou de set, recommandation algorithmique de morceaux, machine learning, export de set ;
- lecture audio, extraits audio, streaming, compte Spotify/Deezer connecté, synchronisation d'une bibliothèque de streaming, achat musical — la **recherche de métadonnées musicales** externes, elle, est dans le périmètre (P2.9, P4.11) ;
- cron de synchronisation musicale, mise à jour automatique invasive des catalogues des DJs, administration ou modération complexe de la bibliothèque musicale, cache d'images massif ;
- temps réel (mises à jour live des résultats), notifications, e-mails transactionnels ;
- vérification d'adresse e-mail et réinitialisation de mot de passe (nécessitent un service d'envoi d'e-mails absent de la stack, voir §6) ;
- connexion sociale, comptes invités, équipes ou multi-utilisateurs par DJ ;
- un même morceau dans plusieurs catégories d'un catalogue (les genres musicaux globaux restent N:N), personnalisation du catalogue par événement, réouverture d'un sondage clôturé ;
- export CSV/PDF des résultats, back-office d'administration, facturation ou plans payants ;
- internationalisation (interface en français uniquement), PWA/hors-ligne ;
- Redux, backend séparé, microservices, cache partagé des données privées, tâches planifiées.

Les propositions utiles mais non validées sont regroupées en **§6.3** afin de rester séparées du travail nécessaire.

---

## 2. État initial observé

Bilan au 7 octobre 2026. Les constats reposent sur le contenu des fichiers et sur deux contrôles réellement exécutés depuis `djeaz/` : `pnpm lint` et `pnpm exec tsc --noEmit`, tous deux sans erreur. `pnpm build` et `pnpm dev` n'ont pas été lancés. Git n'a pas été consulté.

### 2.1 Synthèse par domaine

| Domaine | Constat | Références |
|---|---|---|
| Cadrage | Six documents complets et cohérents entre eux ; `ARCHITECTURE.md` décrit explicitement une **cible non implémentée**. `GRAPHICS.md` et la charte PDF fixent palette (`#5755C9`, `#FFBD99`, `#FAF9F6`, `#252631`), police Plus Jakarta Sans et mascotte. | `documentation/*.md`, `charte-graphique-djeaz.pdf` |
| Application | Bootstrap `create-next-app` : Next.js **16.3.8**, React **19.2.8**, TypeScript 5.9, Tailwind CSS **4** (`@tailwindcss/postcss`), ESLint 9 en flat config. Deux fichiers applicatifs seulement : un layout racine et une page d'accueil de remplissage. | `djeaz/app/layout.tsx`, `djeaz/app/page.tsx` |
| Layout et styles | Police **Geist** (non conforme), `lang="en"`, description/OpenGraph erronés (« platform for DJs to share their music… », URL `https://djeaz.com` non vérifiée). `globals.css` contient les tokens par défaut du bootstrap et une police Arial. | `djeaz/app/layout.tsx`, `djeaz/app/globals.css` |
| Configurations | `tsconfig.json` en `strict` avec alias `@/*` conforme ; ESLint Next/TypeScript ; `next.config.ts` vide ; `postcss.config.mjs` Tailwind 4 ; `pnpm-workspace.yaml` avec `ignoredBuiltDependencies` ; `packageManager` fixé à `pnpm@10.15.1`. **Absents** : `.nvmrc`, `engines`, Prettier. | `djeaz/*.json`, `djeaz/*.mjs`, `djeaz/*.ts` |
| Scripts | `dev`, `build`, `start`, `lint`, `lint:fix`. **Absents** : `typecheck`, `format`, `format:check`, `test*`, `db:*` exigés par `CONVENTIONS.md` §2. | `djeaz/package.json` |
| Données | Aucune dépendance Drizzle/`pg`, aucun schéma, aucune migration, aucun seed, aucun `.env.example`. Le `.gitignore` de `djeaz/` ignore `.env*` sans exception : un futur `.env.example` serait ignoré. | `djeaz/.gitignore` |
| Authentification | Aucune dépendance ni configuration Better Auth. | — |
| Domaines métier | Aucun dossier `features/`, `components/`, `db/`, `lib/`, `drizzle/`, `tests/`. | arborescence `djeaz/` |
| Tests et qualité | Aucun test, aucune configuration Vitest/RTL/Playwright. Lint et typecheck passent sur l'existant. | — |
| CI/CD | Aucun dossier `.github/`, aucun `vercel.json`. État des projets Vercel/Neon/GitHub **non vérifiable** depuis le dépôt. | — |
| Assets | `logo-light.svg` et `logo-dark.svg` : vectoriels (37 Ko). `mascotte.svg` : **872 Ko** contenant deux images PNG embarquées (raster dans un SVG). `mascotte-animated-happy.mp4` : 1,5 Mo. `favicon.ico` présent, contenu non vérifié. **Absents** : jeu d'icônes, icônes d'application multi-tailles, image OpenGraph, variantes de mascotte pour états (vide, erreur), variante compacte du logo. | `djeaz/public/`, `djeaz/app/favicon.ico` |
| Documentation projet | `README.md` racine réduit à un titre ; `djeaz/README.md` est le texte générique de `create-next-app` (mentionne Geist). | `README.md`, `djeaz/README.md` |
| Notes de travail | `step.txt` à la racine : liste informelle de l'utilisateur mentionnant une route `/app/[dj_uuid]` **absente** de l'architecture validée (voir §6.1). | `step.txt` |
| Environnement local | Node **v20.19.5** (compatible avec le minimum 20.9 de Next 16), pnpm **10.15.1**, `node_modules` installés, documentation Next.js locale disponible dans `node_modules/next/dist/docs/`. **Docker non détecté** dans le shell utilisé pour l'analyse. | — |

### 2.2 Points de version Next.js 16 à retenir pour la suite

Vérifiés dans la documentation locale installée :

- les API de requête (`cookies`, `headers`, `params`, `searchParams`) sont **exclusivement asynchrones** ;
- l'écriture de cookies n'est possible que dans une **Server Function/Server Action ou un Route Handler**, jamais pendant le rendu d'un Server Component ;
- `middleware` est renommé **`proxy`** (runtime Node.js uniquement) ;
- `next lint` a disparu : le script `lint` appelle déjà ESLint directement, ce qui est conforme ;
- Turbopack est le bundler par défaut ;
- Vitest ne prend pas en charge les Server Components asynchrones : leurs comportements se testent en E2E ;
- `serverActions.bodySizeLimit` et `serverActions.allowedOrigins` sont les options disponibles pour borner et sécuriser les Server Actions.

### 2.3 Classification

- **Cadrage validé** : l'ensemble des documents de `documentation/`.
- **Réellement implémenté** : squelette Next.js fonctionnel (lint et types OK), alias `@/`, Tailwind 4 branché, ESLint flat config, assets logo/mascotte.
- **Partiellement implémenté** : layout racine (structure présente, police/langue/métadonnées non conformes) ; page d'accueil (placeholder).
- **Travail restant** : tout le reste du périmètre (§1.1).
- **Non confirmable** : état des comptes Vercel/Neon/GitHub, propriété du domaine `djeaz.com`, contenu du favicon, existence de la branche `develop`, réussite de `pnpm build`.

### 2.4 État au pivot du 12 octobre 2026

Le pivot a été décidé après la réalisation de P0, P1 et P2.1 à P2.4, et avant P2.5. Constats dans le dépôt à cette date :

- trois migrations appliquées, `0000` (tables Better Auth, `catalogs` avec `seed_version` et `revision`, `genres`, `tracks`, `rate_limits`), `0001` (table de limitation de débit Better Auth) et `0002` (`user.artist_name`) ; ces migrations **ne sont jamais modifiées** ;
- `db/schema.ts` décrit encore l'**ancien modèle** de catalogue (`catalogs.seedVersion`, `genres`, `tracks`), conçu pour la copie d'un catalogue de référence ;
- aucune opération de catalogue, aucun seed, aucun dossier `features/catalog` ni `features/music` ; `/catalog` est une page de garde ;
- authentification, garde serveur et pages `/sign-up` et `/sign-in` en place ; la coque dashboard déconnecte réellement mais affiche encore une identité factice (P2.8 restant à faire).

Ce que l'ancien modèle supposait est abandonné : plus de catalogue de référence versionné, plus de copie à l'inscription, plus de `seedVersion`. Enchaînement retenu : **ancien schéma déjà appliqué → pivot décidé → migration successive en P2.5 → modèle cible d'`ARCHITECTURE.md` §4**. `revision` est conservée.

---

## 3. Vue d'ensemble

### 3.1 Phases et jalons

| Phase | Objectif | Dépend de | Principaux livrables | Jalon |
|---|---|---|---|---|
| **P0** Socle technique *(terminée)* | Outils de qualité, scripts, PostgreSQL local, configuration validée, harnais de tests, CI minimale | — | Scripts conformes, Prettier, Docker PostgreSQL, Drizzle configuré, Vitest/RTL/Playwright opérationnels, `ci.yml` | **J0** socle fiable |
| **P1** Identité visuelle et socle UI *(terminée)* | Tokens, Plus Jakarta Sans, thèmes, primitives shadcn/ui, trois coques (vitrine, dashboard, sondage), états globaux, page vitrine | P0 | Design system DJEAZ aux deux intensités, navigation dashboard ancrée à gauche, page `/` | — |
| **P2** Données, authentification, catalogue et bibliothèque musicale | Inscription/connexion/déconnexion, protection serveur, nouveau modèle catalogue, catalogue vide à l'inscription, bibliothèque musicale globale, isolation multi-DJ, seed synthétique, dashboard connecté, première version de `/catalog` | P0, P1 | Better Auth branché, migrations, garde de session, `/sign-up`, `/sign-in`, recherche local-first, import contrôlé, DJ capable de construire son catalogue avant ses événements | — |
| **P3** Événements et partage | Dashboard des événements, création, modification, suppression, statuts, lien public, QR code | P2 | `/dashboard`, `/events/new`, `/events/[eventId]` (gestion et partage) | — |
| **P4** Sondage public et participation | Accès par lien, identification, navigation par catégories du DJ, sélection, panier, envies structurées ou libres, soumission, modification, cas limites | P1, P2, P3 | `/survey/[publicId]` complet et mobile-first, cookie de participation, transaction de soumission, recherche publique limitée en débit | — |
| **P5** Résultats et statistiques | Participants, réponses individuelles, classements, popularité des catégories, répartitions, envies | P4 | Agrégations SQL exactes et vues résultats sur `/events/[eventId]` | **J1** premier parcours complet de bout en bout |
| **P6** Catalogue avancé et conservation historique | Renommage, réordonnancement, déplacement, suppression, révision, comportements sur sondages déjà utilisés, concurrence, confort avec de nombreux morceaux | P2, P4, P5 | `/catalog` complet, règles historiques prouvées de bout en bout | — |
| **P7** Sécurité, qualité, paramètres, documentation | Contrat d'erreurs, durcissement, intégrité, finitions UX/accessibilité/performance, `/settings`, README | P2 à P6 | Audit clos, checklist `GRAPHICS.md` §7 passée partout, documentation d'exploitation | **J2** périmètre complet |
| **P8** CI/CD, environnements, première livraison | CI complète, Vercel, Neon, environnement GitHub `production`, `release.yml`, vérification post-livraison, reprise | P0, P7, interventions utilisateur | Release par tag fonctionnelle, previews, runbook, première version en production | **J3** première livraison |

### 3.2 Logique de progression

1. **J0** : un socle sur lequel chaque phase suivante peut ajouter code, migrations et tests sans réoutillage.
2. **P1** avant les features : éviter de reprendre chaque écran après coup ; limité aux tokens, primitives et coques réellement nécessaires, les autres composants s'ajoutent dans la phase qui les consomme.
3. **P2 → P5** : le parcours DJ → catalogue → événement → invité → résultats est construit dans l'ordre de ses dépendances et constitue **J1**. Le DJ part d'un catalogue vide : la bibliothèque musicale et la première version de `/catalog` (**P2.9**) sont donc indispensables **avant** P3/P4, sans quoi un sondage n'aurait rien à proposer. **P6** approfondit ensuite la gestion du catalogue et prouve la conservation historique sur des sondages déjà utilisés.
4. Les dimensions **interface, tests et sécurité sont intégrées à chaque phase** ; **P7** consolide et audite, il ne rattrape pas.
5. La CI existe dès **P0** et s'enrichit automatiquement des suites ajoutées ; **P8** ajoute la livraison et les environnements externes. La CI ne dépend jamais d'un fournisseur de métadonnées ni du réseau public : adaptateurs factices et morceaux synthétiques.
6. **Écrans sur données synthétiques et parcours connectés sont distingués explicitement** : la coque dashboard (P1.6) peut être construite avec une session factice avant d'être branchée en P2.8 ; le compteur de réponses (P3.4) et la zone résultats (P3.6) restent à zéro ou vides jusqu'à P4 et P5. Le seed (P2.7) alimente le développement et les previews avec des morceaux synthétiques ; la bibliothèque réelle est alimentée séparément par l'outil d'import (P2.9) ; les tests d'intégration et de bout en bout créent leurs propres données.

### 3.3 Dépendances

```text
P0 ──► P1 ──► P2 ──► P3 ──► P4 ──► P5 ──► P6 ──► P7 ──► P8
 J0                                   J1            J2     J3
```

La chaîne est linéaire : chaque phase s'appuie sur la précédente. Les tables sont créées par **migrations successives** au fil des phases (P2.1, déjà appliquée : authentification, ancien catalogue, limitation de débit ; P2.5 : bibliothèque musicale et modèle cible du catalogue, retrait de l'ancien modèle ; P3 : événements ; P4 : réponses, sélections, envies) et le seed est étendu en P2, P3, P4 et P6. Le modèle complet reste celui d'`ARCHITECTURE.md` §4 ; les migrations déjà appliquées ne sont jamais réécrites.

---

## 4. Roadmap détaillée

### P0 — Socle technique et environnement local *(terminée)*

**Statut : terminée (J0 atteint).** Les éléments ci-dessous décrivent le travail livré ; ne rien réinstaller ni reconstruire. Node 24 (`.nvmrc`, `engines`), pnpm 10.15.1, Docker Compose (`djeaz/docker-compose.yml`, bases `djeaz_dev` et `djeaz_test`), Drizzle, Vitest/RTL/Playwright et `ci.yml` sont en place ; `djeaz/README.md` documente la mise en route. Seul `db:seed` arrive plus tard (P2.7), avec l'outil qu'il configure.

**Objectif.** Disposer d'un environnement de développement reproductible et d'une chaîne de vérification complète avant d'écrire la première ligne métier : scripts conformes, formatage, base PostgreSQL locale, configuration serveur validée, tests exécutables, CI qui échoue quand il le faut.

**Prérequis.** Node 24 LTS, pnpm 10.15.1, Docker Compose, dépôt GitHub accessible pour la CI.

**Travaux.** À conserver tel quel, sans reconstruction : `tsconfig.json` (`strict`, alias `@/*`), `eslint.config.mjs`, `postcss.config.mjs`, `pnpm-workspace.yaml`, `packageManager`, `.vscode/settings.json`.

- **P0.1 — Versions et scripts.** Ajouter `.nvmrc` et `engines` (Node 24 LTS) ; conserver `packageManager`. Compléter `package.json` avec les scripts du contrat de `CONVENTIONS.md` §2 (`typecheck`, `format`, `format:check`, `test`, `test:integration`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`) au fur et à mesure que l'outil correspondant est réellement configuré dans cette phase ; aucun script fictif. Conserver `lint:fix`. Figer les versions des dépendances ajoutées (pas de `latest`).
- **P0.2 — Prettier.** Configuration conforme à `CONVENTIONS.md` §2 (deux espaces, points-virgules, guillemets doubles, virgules finales, largeur 100) et fichier d'exclusions. Formater une seule fois les fichiers existants du bootstrap ; ensuite, formatage limité aux changements.
- **P0.3 — Organisation et configuration serveur.** Préparer les frontières d'`ARCHITECTURE.md` §2 (`features/`, `components/ui/`, `db/`, `lib/`, `drizzle/`, `tests/`) en ne créant chaque dossier qu'au premier usage ; ajouter la dépendance `server-only`. Créer dans `lib/` un module de configuration serveur validé par Zod pour `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, avec échec explicite au premier usage serveur (et non au build, afin que `next build` reste possible sans secrets). Fournir `djeaz/.env.example` sans valeur sensible et corriger `djeaz/.gitignore` pour qu'il ne soit plus ignoré (`.env*` ignore tout aujourd'hui).
- **P0.4 — PostgreSQL local et Drizzle.** Fichier Docker Compose dans `djeaz/` fournissant une base de développement et une base de tests distinctes. Installer Drizzle ORM, Drizzle Kit et `pg` ; client PostgreSQL avec pool borné dans `db/` ; configuration Drizzle Kit utilisant `DATABASE_MIGRATION_URL` et le dossier `drizzle/` ; scripts `db:generate` et `db:migrate` fonctionnels même sans migration encore présente.
- **P0.5 — Harnais de tests.** Vitest avec environnement DOM pour React Testing Library (et matchers DOM) ; projet ou configuration d'intégration ciblant la base de tests avec remise à zéro entre tests ; Playwright avec démarrage automatique de l'application et deux projets (mobile ~390 px et desktop). Un test minimal de chaque type pour prouver le câblage : validation de la configuration (unitaire), connexion à la base (intégration), chargement de la page d'accueil (E2E).
- **P0.6 — CI minimale.** `.github/workflows/ci.yml` déclenché par push sur `develop` et `main` : installation avec lockfile figé, Node depuis `.nvmrc`, puis `format:check`, `lint`, `typecheck`, `test`, `test:integration` (service PostgreSQL), `test:e2e` (navigateurs Playwright en cache), `build` avec variables factices. Aucun déploiement. Ce workflow s'enrichit ensuite seul des tests ajoutés par les phases suivantes.
- **P0.7 — README de mise en route.** Remplacer le texte générique de `djeaz/README.md` par les commandes réelles (installation, base Docker, variables, scripts). La documentation complète d'exploitation relève de P7.6.

**Zones concernées.** `djeaz/package.json`, `djeaz/.gitignore`, `djeaz/lib/`, `djeaz/db/`, `djeaz/drizzle/`, `djeaz/tests/`, configurations racine de `djeaz/`, `.github/workflows/`.

**Livrables.** Scripts conformes ; Prettier ; `.env.example` versionné ; base locale Docker ; Drizzle configuré ; Vitest/RTL/Playwright opérationnels avec un test témoin chacun ; `ci.yml` vert sur `develop`.

**Critères de fin (J0).**

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e` et `pnpm build` passent localement et dans la CI.
- Une base vide démarre avec Docker et `pnpm db:migrate` s'exécute sans erreur.
- `.env.example` apparaît dans le dépôt ; aucun fichier `.env` local n'est versionnable.

**Vigilance.** Vérifier à l'installation la compatibilité de chaque bibliothèque avec Next 16.3 / React 19.2 (Better Auth, Drizzle, shadcn/ui, Testing Library, Playwright) ; ne pas « descendre » Next pour accommoder une dépendance sans décision de l'utilisateur. Les tests de Server Components asynchrones passent par Playwright (§2.2).

---

### P1 — Identité visuelle et socle d'interface *(terminée)*

**Statut : terminée.** Les éléments ci-dessous décrivent le travail livré ; ne rien réinstaller ni reconstruire. Précision sur P1.5 : la mascotte animée livrée repose sur le composant `AnimatedMascot` et des fichiers `.lottie` (`@lottiefiles/dotlottie-react`), avec repli sur la mascotte statique côté serveur, sous `prefers-reduced-motion` ou en cas d'échec du player ; l'ancien asset vidéo MP4 a été retiré. Le `mascotte.svg` de 872 Ko reste en place en attendant l'export optimisé demandé en §5.

**Objectif.** Un design system DJEAZ exploitable par toutes les phases : tokens sémantiques, Plus Jakarta Sans, thèmes clair/sombre mémorisés, primitives shadcn/ui aux états complets, trois coques (vitrine, dashboard, sondage), états globaux, et la page vitrine. Deux intensités d'une même marque : **festive et colorée** côté public, **sobre et confortable** côté dashboard (`GRAPHICS.md` §1).

**Prérequis.** P0.

**Travaux.**

- **P1.1 — Tokens.** Dans `globals.css` via le mécanisme de thème de Tailwind 4 : couleurs de marque, tokens sémantiques (fond, surface, texte, texte secondaire, action, sélection, bordure, focus, succès/erreur/avertissement) en clair et en sombre ; rayons (12 px champs, 16–20 px cartes, pilules), échelle d'espacement en multiples de 4 px, deux niveaux d'ombres (public plus présent, dashboard atténué), durées d'animation (150–250 ms contrôles, 250–450 ms apparitions) et neutralisation sous `prefers-reduced-motion`. Vérifier chaque combinaison texte/fond au regard de `GRAPHICS.md` §2 (AA 4,5:1 texte courant, 3:1 grand texte).
- **P1.2 — Typographie, langue et métadonnées.** Charger Plus Jakarta Sans (400/500/600/700) via `next/font` en remplacement de Geist ; `lang="fr"` ; corps 16 px / interligne 1,5 ; échelle de titres plus expressive et fluide côté public. Corriger titre, description et OpenGraph en français et conformes au produit ; l'URL canonique reste à confirmer (§5).
- **P1.3 — Thème clair/sombre.** Préférence système au premier chargement, choix utilisateur mémorisé, bascule accessible disponible dans les deux expériences, sans flash au rendu. Le support de mémorisation (cookie lu côté serveur ou stockage local avec script d'initialisation) est un détail laissé au développeur ; l'exigence est l'absence de flash et la persistance.
- **P1.4 — Primitives shadcn/ui.** Initialiser shadcn/ui dans `components/ui/` en reliant ses variables aux tokens DJEAZ (et non l'inverse). N'installer que les primitives nécessaires au MVP : bouton, champ, libellé, zone de texte, sélection/boutons radio, case à cocher, carte, badge, dialogue et dialogue de confirmation, tiroir latéral, onglets, squelette, notifications, menu déroulant, infobulle, séparateur, tableau. Définir pour chacune les états survol, actif, focus visible, désactivé, chargement, erreur, et une variante d'intensité publique/dashboard. Cibles tactiles ≥ 44 px côté public.
- **P1.5 — Assets de marque et iconographie.** Composant logo basculant clair/sombre selon le thème ; composant mascotte statique ; composant mascotte animée (animations Lottie muettes, chargées à la demande, mascotte statique affichée en attente et en remplacement sous `prefers-reduced-motion`) ; jeu d'icônes en contour arrondi cohérent avec shadcn/ui. Le `mascotte.svg` actuel (872 Ko, PNG embarqués) n'est pas acceptable sur mobile : demander une exportation optimisée (vrai vectoriel ou PNG/WebP aux tailles utiles) et, en attendant, l'utiliser uniquement via l'optimisation d'images Next.js aux dimensions réelles. Lister les déclinaisons manquantes (§5) plutôt que de les approximer.
- **P1.6 — Coques et navigation.** Layout racine (police, fournisseur de thème, zone de notifications). **Coque publique** : en-tête avec logo et accès connexion/inscription, pied de page, composition festive. **Coque dashboard** : sidebar ancrée au bord gauche du viewport, indépendante du centrage du contenu et du zoom, entrées Dashboard / Catalogue / Paramètres et menu utilisateur avec déconnexion ; compactée quand l'espace diminue, puis tiroir ouvrant depuis la gauche ; peut être construite avec une session factice jusqu'à P2. **Coque sondage** : mobile-first, en-tête minimal avec le nom de l'événement, barre inférieure fixe pour panier et validation respectant les zones sûres et le clavier virtuel.
- **P1.7 — États globaux.** Pages `not-found` (style public, mascotte) et `error` racine (message français, identifiant de diagnostic affiché, action de réessai), motifs de squelettes de chargement, composant d'état vide avec mascotte, motif d'erreur de champ de formulaire.
- **P1.8 — Page vitrine `/`.** Contenu statique : promesse du produit, fonctionnement côté DJ et côté invité, appels à l'action vers inscription et connexion, mascotte et touches musicales, composition expressive mais lisible ; remplace le placeholder actuel.

**Zones concernées.** `djeaz/app/layout.tsx`, `djeaz/app/globals.css`, `djeaz/app/page.tsx`, `djeaz/app/not-found.tsx`, `djeaz/app/error.tsx`, `djeaz/components/`, `djeaz/components/ui/`, `djeaz/public/`.

**Livrables.** Tokens et thèmes ; police conforme ; primitives thématisées ; trois coques ; états globaux ; page vitrine ; composants logo/mascotte.

**Critères de fin.**

- Vitrine et coques vérifiées en clair/sombre aux largeurs 320, 390, 768 et 1440 px, aux zooms 80/125/150/200 % et au reflow équivalent à 320 px (`GRAPHICS.md` §7) ; aucun défilement horizontal global ; zoom jamais bloqué.
- Contrastes AA vérifiés avec un outil pour chaque token de texte sur chaque fond.
- Sidebar : repliement et tiroir vérifiés au clavier ; focus visible partout.
- Tests RTL de la bascule de thème et de l'ouverture/fermeture du tiroir ; CI verte.

**Vigilance.** Une seule marque, deux intensités : pas de second système de composants pour le dashboard. Pas de décoration qui gêne une action ni d'animation qui déplace une cible de clic.

---

### P2 — Données, authentification, catalogue personnel et bibliothèque musicale

**Objectif.** Un DJ peut s'inscrire, se connecter, se déconnecter ; les espaces privés sont protégés côté serveur ; le modèle cible du catalogue et de la bibliothèque musicale existe en base ; chaque nouveau compte reçoit un **catalogue vide** (`revision = 0`, aucune catégorie, aucun morceau) ; la bibliothèque musicale globale est alimentée par un import contrôlé puis par les sélections explicites des utilisateurs ; les données de deux DJs sont strictement isolées ; des données synthétiques sont disponibles pour le développement et les previews ; le dashboard est connecté ; le DJ peut construire son catalogue avant de créer ses événements.

**Prérequis.** P0 (base, configuration), P1 (formulaires, coques).

**Travaux.** P2.1 à P2.8 sont réalisées. P2.1 a été implémentée **avant le pivot** et portait l'ancien modèle de catalogue ; P2.5 l'a migré. L'état observé juste avant ce pivot est au §2.4.

- **P2.1 — Première migration** *(réalisée avant le pivot)*. Schéma Drizzle et migration `0000` pour : tables Better Auth (générées pour la version installée, mappage `snake_case`/`camelCase` conforme à `CONVENTIONS.md` §1), `catalogs` (propriétaire unique, `seedVersion`, `revision`), `genres`, `tracks` (ordre d'affichage, un genre par morceau), et un stockage persistant de limitation de débit en PostgreSQL (empreinte temporaire d'IP + opération, expiration). Ce schéma de catalogue appartient au modèle abandonné (copie d'un catalogue de référence) ; il reste tel quel dans l'historique et est remplacé par une migration successive en P2.5. Les migrations `0000`, `0001` et `0002` ne sont jamais modifiées.
- **P2.2 — Better Auth** *(réalisée)*. Installation et configuration serveur : email + mot de passe, inscription libre, adaptateur Drizzle sur la même base, secret et URL issus de la configuration validée, origines de confiance, attributs de cookies de session. Route Handler sous `/api/auth/[...all]`. Limitation de débit des endpoints d'authentification par le limiteur intégré de Better Auth 1.7.7, persistée en PostgreSQL (table `rate_limit`, migration `0001`) aux seuils par défaut, validés : 3 requêtes par 10 s et par IP sur inscription, connexion et changement de mot de passe ou d'e-mail, 100 par 10 s sur les autres endpoints ; le stockage `rate_limits` de P2.1 reste réservé aux écritures et recherches publiques de P4. Politique de mot de passe validée et centralisée : 8 à 128 caractères, aucune règle de complexité supplémentaire.
- **P2.3 — Garde serveur des espaces privés** *(réalisée)*. Un point unique dans `features/auth` qui lit la session et renvoie `UNAUTHENTICATED` ou redirige vers `/sign-in` avec retour ; utilisé par chaque page, requête et action privée (`ARCHITECTURE.md` §3 : une protection de layout seule ne suffit pas). Optionnellement, `proxy.ts` pour une redirection optimiste des URL privées sur simple présence du cookie, jamais comme contrôle d'autorisation. Groupe de routes pour la coque dashboard sans changer les URL publiques.
- **P2.4 — Pages `/sign-up` et `/sign-in`** *(réalisée)*. Formulaires validés par Zod (serveur obligatoire), messages d'erreur en français, états de chargement et de désactivation, saisies conservées après échec, redirection vers `/dashboard` après succès ; un utilisateur déjà connecté arrivant sur ces pages est redirigé. Déconnexion depuis le menu utilisateur de la sidebar. Style public (festif) pour ces pages.
- **P2.5 — Pivot catalogue personnel et bibliothèque musicale** *(réalisée)*. Nouvelle migration successive (`0003` ou suivante), conçue et testée proprement bien qu'aucune donnée utilisateur de catalogue n'existe encore : création de `music_tracks`, `music_track_sources` (unicité `(provider, externalId)`), `music_genres`, `music_track_genres`, `catalog_categories` (avec contrainte unique `(id, catalog_id)`) et `catalog_tracks` (unicité `(catalogId, musicTrackId)` et clé étrangère composite `(category_id, catalog_id)` → `catalog_categories(id, catalog_id)`, afin que la base refuse toute association vers une catégorie d'un autre catalogue) selon `ARCHITECTURE.md` §4 ; suppression de `catalogs.seed_version` ; retrait de l'ancien modèle `genres`/`tracks` (suppression des tables — aucune donnée réelle n'existant encore ; si des données devaient exister au moment de l'exécution, les transférer avant suppression et documenter sauvegarde et reprise selon `CONVENTIONS.md` §5) ; schéma Drizzle, SQL relu et métadonnées versionnés ensemble ; les migrations déjà appliquées sont préservées. Opération idempotente créant le catalogue vide à la création du compte (point d'accroche Better Auth après création d'utilisateur) et reprise au premier accès privé si le catalogue manque ; `revision = 0`, aucune catégorie, aucun morceau ; aucun contenu n'est jamais ajouté automatiquement à un catalogue vide (`ARCHITECTURE.md` §6). La page `/catalog` de garde passe à un état vide invitant à « Créer ma première catégorie », rendu fonctionnel en P2.9.
- **P2.6 — Isolation multi-DJ** *(réalisée)*. Toute requête privée filtre par le propriétaire issu de la session ; catégories et associations de catalogue sont toujours filtrées par propriétaire ; une ressource d'un autre DJ répond `NOT_FOUND` (`CONVENTIONS.md` §4) ; un DJ ne peut jamais modifier directement les données privées d'un autre DJ. La bibliothèque musicale globale n'a pas de propriétaire : lisible par tous, elle ne s'enrichit que par les chemins de P2.9.
- **P2.7 — Seed synthétique** *(réalisée)*. Script `db:seed` idempotent, sans aucun téléchargement externe : un DJ de démonstration (identifiants connus en développement uniquement), quelques morceaux globaux **synthétiques** avec leurs genres musicaux, un petit catalogue personnel avec quelques catégories et les associations correspondantes ; étendu en P3, P4 et P6 ; ne réinitialise jamais de données utilisateur ; destiné au développement et aux previews, jamais à la bibliothèque réelle.
- **P2.8 — Dashboard connecté** *(réalisée)*. Sidebar alimentée par la vraie session (nom d'artiste `artistName` et e-mail, pas le nom / prénom privé), déconnexion fonctionnelle, `/dashboard` affichant l'état vide « aucun événement » en attendant P3.
- **P2.9 — Bibliothèque musicale et construction initiale du catalogue** *(réalisée)*. Dans `features/music` : recherche locale sur `music_tracks` (titre et artiste, exact puis préfixe puis contenu, 20 résultats, minimum 2 caractères) ; abstraction d'adaptateurs avec MusicBrainz réel et adaptateur factice ; Recording MBID comme unité canonique ; déduplication `(provider, externalId)` puis Recording MBID puis ISRC exact non ambigu puis titre/artiste/durée en signal secondaire, sans fusion aveugle des variantes ; repli externe uniquement après « Rechercher plus largement » (10 candidats), persistance seulement après sélection et revalidation MusicBrainz ; URL Cover Art Archive et placeholder DJEAZ, sans téléchargement ni cache. Outil `pnpm music:import` (ni seed, ni migration, ni Server Action, ni démarrage, ni CI, ni cron) : ListenBrainz pour la popularité (artistes, puis recordings, puis complément global et équilibrage optionnel), MusicBrainz pour l'identité, checkpoint reprenable, `--limit` obligatoire. Dans `/catalog` : création de catégorie (1–80), recherche, ajout local ou MusicBrainz, retrait, déplacement et réordonnancement monter/descendre ; chaque mutation sous verrou du catalogue avec `revision + 1` en cas de succès. Tests unitaires, d'intégration PostgreSQL et E2E sur fixtures ; aucun appel réseau en CI. La suppression d'une catégorie retire ses associations, conserve `music_tracks` et incrémente `revision` une seule fois ; un autre DJ reçoit `NOT_FOUND`. L'écran `/catalog` regroupe la création et la recherche dans des modales, et les actions de morceau sur des boutons icône.

**Zones concernées.** `djeaz/db/`, `djeaz/drizzle/`, `djeaz/features/auth/`, `djeaz/features/catalog/`, `djeaz/features/music/`, `djeaz/scripts/`, `djeaz/app/api/auth/`, `djeaz/app/(dashboard)/` (dont `catalog/`), `djeaz/app/(public)/sign-up/`, `djeaz/app/(public)/sign-in/`, `djeaz/proxy.ts` (optionnel).

**Livrables.** Migration de pivot appliquée depuis une base vierge et depuis une base portant `0000`–`0002` ; authentification complète ; garde serveur ; pages d'inscription/connexion ; catalogue vide à l'inscription ; seed synthétique ; dashboard connecté ; recherche local-first avec repli externe ; outil d'import ; `/catalog` fonctionnel ; tests associés.

**Critères de fin.**

- E2E : inscription → arrivée sur un dashboard vide → `/catalog` vide → création d'une catégorie → recherche et ajout d'un morceau → déconnexion → connexion ; accès non authentifié à `/dashboard` redirigé vers `/sign-in`.
- Intégration : deux DJs ne voient jamais les données de catalogue l'un de l'autre ; la création du catalogue vide est idempotente, y compris sous déclenchement concurrent ; un catalogue vide n'est jamais rempli automatiquement ; deux sélections concurrentes du même résultat fournisseur produisent un seul morceau global ; un `musicTrackId` ne peut apparaître deux fois dans un même catalogue ; la base refuse une association portant le catalogue A et une catégorie du catalogue B, indépendamment du contrôle applicatif.
- Les migrations s'appliquent depuis une base vierge ; `seed_version`, `genres` et `tracks` n'existent plus dans le schéma cible ; `db:seed` est rejouable sans effet de bord ; aucune suite ne dépend du réseau ; CI verte.

**Vigilance.** Le schéma Better Auth doit correspondre exactement à la version installée. Cookie `Secure` uniquement en HTTPS pour permettre le développement local. Aucune vérification d'e-mail ni réinitialisation de mot de passe dans le périmètre (§6.1). Ne réintroduire aucun catalogue prédéfini, même sous forme d'onboarding caché. MusicBrainz est la source canonique de la recherche ; ListenBrainz sert uniquement à l'import. TheAudioDB et Last.fm ne sont pas utilisés. La liste finale des genres d'équilibrage et la validation juridique des sources et des pochettes restent ouvertes avant la production (§5, §6.1).

---

### P3 — Événements : dashboard, cycle de vie et partage

**Objectif.** Le DJ crée, consulte, modifie et supprime ses événements, distingue à venir et passés, ouvre et clôture le sondage, récupère le lien public et le QR code. Tous ses événements s'appuient sur son **catalogue courant** : aucune copie ni personnalisation du catalogue par événement.

**Prérequis.** P2, dont P2.9 : le DJ dispose d'un catalogue à proposer.

**Travaux.**

- **P3.1 — Migration `events`.** Propriétaire, nom, date (type `date`, sans heure), `publicId` unique, statut contrôlé (`draft/open/closed`), horodatages ; index propriétaire/date (`ARCHITECTURE.md` §4).
- **P3.2 — Opérations métier.** Création en brouillon avec `publicId` de 32 octets aléatoires en base64url (réessai en cas de collision) ; modification du nom et de la date ; transitions `draft → open → closed` uniquement, manuelles, sous verrou de la ligne événement, sans réouverture ; suppression définitive après confirmation avec cascade vers réponses, sélections et demandes, sans toucher au catalogue ; liste du propriétaire séparée en à venir/passés calculés en `Europe/Paris`, « aujourd'hui » restant à venir, sans effet sur le statut du sondage.
- **P3.3 — Validations et constantes.** Schémas Zod (nom 1–160 caractères normalisés, date valide), statuts et transitions centralisés ; tranches d'âge centralisées dès maintenant pour P4 et P5.
- **P3.4 — `/dashboard`.** Deux sections (à venir triés par date croissante, passés par date décroissante), cartes avec nom, date au format français, badge de statut du sondage distinct du regroupement temporel, nombre de réponses (zéro jusqu'à P4, puis compté), appel à la création, état vide avec mascotte, squelettes de chargement. Intensité dashboard : surfaces calmes, hiérarchie nette.
- **P3.5 — `/events/new`.** Formulaire de création, saisies conservées en cas d'erreur, redirection vers la page de l'événement.
- **P3.6 — `/events/[eventId]` (gestion et partage).** Page unique organisée en sections ou onglets, sans nouvelle route : informations et modification ; actions de statut (« Ouvrir le sondage », « Clôturer » avec confirmation rappelant l'irréversibilité) ; suppression via dialogue listant les conséquences ; bloc de partage avec copie du lien et retour visuel, QR code affiché et téléchargeable ; en brouillon, indiquer clairement que le sondage reste indisponible tant qu'il n'est pas ouvert ; zone résultats en état vide jusqu'à P5.
- **P3.7 — QR code.** Génération à la demande côté serveur, sans stockage, à partir de l'URL publique du sondage dérivée d'une URL de base configurée côté serveur (réutiliser `BETTER_AUTH_URL` comme URL canonique est l'option la plus simple ; à confirmer en §5) plutôt que de l'en-tête `Host`. Si un endpoint HTTP est utilisé, il vérifie session et propriété et mappe les erreurs aux statuts HTTP. Nécessite une petite dépendance de génération de QR code, figée en version.
- **P3.8 — Tests.** Unitaires : transitions autorisées et refusées, format et longueur du `publicId`, calcul à venir/passé (aujourd'hui, veille, changement d'heure). Intégration : `NOT_FOUND` pour un événement d'un autre DJ, unicité du `publicId`, suppression. RTL : dialogues de confirmation. E2E : connexion → création → ouverture → lien et QR visibles.
- **P3.9 — Seed.** Événements dans les trois statuts, passés et à venir.

**Zones concernées.** `djeaz/features/events/`, `djeaz/app/(dashboard)/dashboard/`, `djeaz/app/(dashboard)/events/`, `djeaz/drizzle/`.

**Livrables.** Dashboard des événements, création, page événement avec cycle de vie et partage, QR code, tests, seed.

**Critères de fin.**

- E2E : un DJ connecté crée un événement, l'ouvre et obtient lien et QR ; la clôture est confirmée et irréversible ; la suppression est confirmée et retire l'événement du dashboard.
- Les regroupements à venir/passés sont corrects aux bornes testées ; les statuts ne changent jamais automatiquement.
- Pages dashboard vérifiées selon `GRAPHICS.md` §7 (sidebar à 320 et 768 px, zoom 200 %) ; CI verte.

**Vigilance.** Serveur en UTC : le calcul « aujourd'hui » se fait explicitement en `Europe/Paris`. Ne jamais faire confiance à un statut ou un propriétaire envoyé par le navigateur. Un événement ne stocke aucune copie du catalogue ; le comportement à l'ouverture d'un sondage alors que le catalogue est vide (avertissement ou blocage) reste à confirmer (§6.1).

---

### P4 — Sondage public et participation des invités

**Objectif.** Un invité ouvre le lien ou le QR code, s'identifie par pseudonyme et tranche d'âge, parcourt les **catégories du catalogue du DJ**, sélectionne des morceaux, soumet des envies (morceau identifié dans la bibliothèque musicale, ou texte libre) et valide ; il peut relire et modifier sa réponse tant que le sondage est ouvert, sans jamais être compté deux fois ; les liens indisponibles, le sondage fermé, les erreurs et les changements concurrents sont traités proprement. Expérience **festive, pensée d'abord pour téléphone**.

**Prérequis.** P1 (coque sondage), P2 (catalogue construit par le DJ, bibliothèque et recherche de P2.9), P3 (événements ouverts).

**Travaux.**

- **P4.1 — Migration réponses.** `responses` (événement, pseudonyme, tranche d'âge contrôlée, empreinte du secret, version, dates de soumission et de modification ; unicité événement/empreinte), `response_selections` (référence nullable vers `catalog_tracks` mise à `NULL` au retrait, `musicTrackId` durable, clé historique de catégorie, copies obligatoires du titre, de l'artiste et du libellé de catégorie ; unicité réponse/`musicTrackId`), `free_requests` (`musicTrackId` nullable, `text` nullable, copies titre/artiste si structurée, ordre ; contrainte `CHECK` imposant exactement l'un des deux contenus) ; cascades depuis l'événement ; index événement/réponse et réponse/sélections (`ARCHITECTURE.md` §4).
- **P4.2 — Accès public `/survey/[publicId]`.** Résolution par `publicId` sans fuite d'information : lien inconnu ou événement supprimé → page introuvable publique indistincte ; brouillon → page « sondage pas encore disponible » ; clôturé → confirmation de clôture en lecture seule, refusant toute écriture ; ouvert → sondage. Rendu dynamique (lecture des cookies). Pages de sondage non indexables (à confirmer, §6.1).
- **P4.3 — Cookie de participation.** Secret aléatoire de 32 octets propre à l'événement, `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, 180 jours ; seule l'empreinte SHA-256 est stockée. Contrainte Next.js 16 : le cookie ne peut être écrit que dans une Server Action ou un Route Handler ; la solution la plus simple est de l'émettre dans l'action de première soumission, avant l'insertion. Un cookie absent, expiré ou un autre navigateur créent une nouvelle participation, sans promesse d'identité forte.
- **P4.4 — Parcours mobile-first.** Étape d'identification (pseudonyme 1–80, tranche d'âge parmi les sept valeurs, commandes en pilules tactiles) ; navigation par **catégories du DJ** (puces défilantes, onglets ou liste dépliable), dans l'ordre d'affichage qu'il a choisi, en employant le mot « catégorie » et jamais « genre » ; listes de morceaux du catalogue faciles à parcourir, cibles ≥ 44 px, pochette ou placeholder DJEAZ, état sélectionné évident sans dépendre de la couleur seule, micro-retour animé (150–250 ms, neutralisé sous réduction des mouvements) ; panier en état React local, compteur dans la barre inférieure fixe et tiroir listant la sélection avec retrait ; section « Soumettre une envie » (P4.11) listant les envies ajoutées, structurées ou libres, avec retrait et ordre d'ajout conservé ; bouton de validation actif seulement si au moins un morceau ou une envie ; clavier virtuel et zones sûres respectés ; aucun usage dépendant du survol.
- **P4.5 — Soumission.** Server Action recevant pseudonyme, tranche d'âge, identifiants d'associations de catalogue sélectionnées, envies (identifiants de morceaux globaux ou textes libres), révision de catalogue vue et version de réponse éventuelle. Côté serveur : validation Zod, normalisation, déduplication, règle « au moins un morceau ou une envie », bornes techniques (nombre maximal d'identifiants et d'envies par requête, taille du corps) ; limitation de débit persistante des écritures publiques par empreinte temporaire d'IP et opération, avec expiration et purge opportuniste → `RATE_LIMITED` ; transaction avec verrous dans l'ordre **événement → catalogue → réponse** : statut ouvert vérifié, révision du catalogue comparée (obsolète → `CONFLICT` accompagné du catalogue rafraîchi), appartenance de chaque association au catalogue courant du propriétaire de l'événement, existence de chaque morceau global référencé par une envie structurée, copie des libellés et clés (`musicTrackId`, clé de catégorie, titre, artiste, libellé de catégorie) au moment du choix, création ou remplacement de la réponse identifiée par (événement, empreinte) avec contrôle de version, remplacement complet des sélections et envies ; cookie émis si nouveau ; rafraîchissement des vues concernées. Une envie n'est jamais ajoutée au catalogue du DJ. Union discriminée et codes stables de `CONVENTIONS.md` §4.
- **P4.6 — Modification d'une réponse.** Revisite avec cookie valide pendant l'ouverture : préremplissage (pseudonyme, tranche d'âge, sélections, envies) ; les choix historiques dont le morceau a été retiré du catalogue sont affichés comme « retiré du catalogue », conservés, retirables mais plus ajoutables via le catalogue ; la nouvelle soumission remplace l'ancienne sans ajouter de participant ; une version obsolète (deux onglets) → `CONFLICT` expliqué, saisies conservées ; après clôture, lecture seule.
- **P4.7 — Cas limites.** Sondage clôturé entre le chargement et la validation → `SURVEY_CLOSED` sans mutation ; événement supprimé → introuvable ; catalogue modifié pendant la participation → rafraîchissement, sélections encore valides conservées, morceaux disparus signalés, nouvelle validation demandée, aucune perte silencieuse ; erreur réseau ou `INTERNAL_ERROR` → message français avec identifiant de diagnostic, réessai possible, saisies conservées ; limitation de débit → explication et invitation à réessayer plus tard.
- **P4.8 — Confirmation.** Écran de succès avec célébration par la mascotte (animée, avec repli statique), récapitulatif de la sélection et des demandes, accès « Modifier ma réponse » tant que le sondage est ouvert ; aucun compte proposé.
- **P4.9 — Tests.** Unitaires : schémas, déduplication, règle du minimum, règle « exactement un contenu » d'une envie, calcul d'empreinte. Intégration : unicité (événement, empreinte) ; nouvelle soumission → toujours une seule réponse ; conflit de version ; refus après clôture ; rejet d'une association d'un autre catalogue ; rejet d'une envie structurée vers un morceau inexistant ; révision obsolète ; cascade à la suppression de l'événement ; comptage et purge de la limitation de débit, y compris pour la recherche publique ; recherche publique avec adaptateur factice (résultat local, repli, sélection → un seul morceau global). RTL : panier, état sélectionné, bascule recherche/texte libre. E2E sur viewport mobile : ouverture du lien → identification → sélection par catégories → envie trouvée dans la bibliothèque → envie en texte libre → validation → confirmation → réouverture → modification → un seul participant.
- **P4.10 — Seed.** Réponses variées (tranches d'âge, sélections communes, sélections historiques avec référence `NULL`, envies structurées et libres).
- **P4.11 — « Soumettre une envie » : recherche publique et texte libre.** Réutilise la recherche local-first de P2.9 depuis le sondage public : recherche dans la bibliothèque DJEAZ, repli MusicBrainz uniquement après l'action explicite « Rechercher plus largement », affichage des candidats, sélection explicite de l'invité, puis upsert idempotent du morceau choisi (et de sa provenance) dans la bibliothèque globale et ajout d'une envie structurée au panier ; aucun candidat non choisi n'est enregistré. Repli en **texte libre** (1–500) toujours disponible, notamment pour un mashup, un remix introuvable, une version locale ou un morceau non identifié. Limitation de débit persistante dédiée aux recherches publiques, locale comme externe, par empreinte temporaire d'IP ; requêtes bornées, timeout, échec propre : si un fournisseur est indisponible, la recherche locale et le texte libre restent utilisables. Une envie n'entre jamais dans le catalogue du DJ. Pochette externe affichée avec placeholder DJEAZ en repli.

**Zones concernées.** `djeaz/features/surveys/`, `djeaz/features/music/` (recherche publique), `djeaz/app/survey/[publicId]/`, `djeaz/drizzle/`, `djeaz/lib/` (limitation de débit, empreintes).

**Livrables.** Sondage public complet et mobile-first ; navigation par catégories ; cookie de participation ; transaction de soumission ; envies structurées et libres avec recherche publique limitée en débit ; modification sans double comptage ; pages d'indisponibilité ; tests ; seed.

**Critères de fin.**

- E2E invité verte sur 390 px ; parcours également vérifié à 320 px (barre fixe ne masquant ni morceaux, ni focus, ni clavier) et en sombre.
- Tests d'intégration prouvant l'absence de double comptage, le refus après clôture, la gestion des conflits et l'enregistrement d'un seul morceau global après sélection d'une envie.
- Pages inconnu/brouillon/clôturé vérifiées ; aucun défilement horizontal ; aucune suite ne dépend du réseau ; CI verte.

**Vigilance.** Adresse IP lue depuis l'en-tête transmis par Vercel, jamais stockée en clair. Pooler Neon en mode transaction : verrous limités à la transaction (verrous de lignes ou verrous consultatifs transactionnels), jamais de verrou de session. Ne jamais croire un libellé ou un total venant du client. Les requêtes vers un fournisseur ne transportent que les termes de recherche : ni pseudonyme, ni cookie, ni événement. Ne jamais afficher « genre » pour une catégorie du DJ.

---

### P5 — Résultats et statistiques (→ J1)

**Objectif.** Le DJ consulte participants, réponses individuelles, classement des morceaux, popularité des **catégories de son catalogue**, répartition des préférences, tranches d'âge, tendances communes et envies (structurées ou libres), avec des agrégations exactes, des dénominateurs explicites et une présentation lisible même sans réponse. Les genres musicaux globaux ne sont pas mêlés à ces statistiques.

**Prérequis.** P4.

**Travaux.**

- **P5.1 — Agrégations SQL.** Requêtes paramétrées dans `features/analytics`, filtrées par propriétaire et événement, selon `ARCHITECTURE.md` §8 : nombre de participants ; classement des morceaux par réponses distinctes sur le `musicTrackId` historique avec libellé le plus récemment enregistré et catégorie associée ; popularité des catégories par participants distincts sur la clé historique de catégorie ; part des préférences (sélections de la catégorie / total des sélections) avec dénominateurs retournés ; répartition par tranche d'âge avec les sept tranches toujours présentes ; tendances communes (morceaux et catégories partagés par au moins deux participants, sans recommandation ; définition à confirmer, §6.1) ; liste des envies avec pseudonyme et date, structurées (regroupables par `musicTrackId`) et libres, jamais comptées comme votes du catalogue ; réponses individuelles avec sélections (libellés historiques) et envies. Ensemble vide → zéro partout.
- **P5.2 — Vues résultats sur `/events/[eventId]`.** Sections : Aperçu (participants, sélections, envies, premiers morceaux et catégories), Morceaux (tableau classé avec votes et part des participants, défilement dans son propre conteneur si nécessaire), Catégories (popularité et part avec barres, dénominateurs explicités en légende), Participants (liste puis détail d'un participant), Envies (morceaux identifiés avec titre/artiste, textes libres rendus comme texte, jamais comme HTML), Âges (barres avec effectifs et pourcentages). Graphiques accessibles : barres HTML/CSS avec équivalents textuels d'abord ; une bibliothèque de graphiques n'est ajoutée qu'en cas de besoin réel (§6.3). État vide avec rappel du partage ; vues rafraîchies après mutation ; aucun temps réel ; morceaux retirés du catalogue marqués comme tels. Intensité dashboard.
- **P5.3 — Compteur de réponses.** Branchement du nombre de réponses sur les cartes du dashboard (P3.4).
- **P5.4 — Tests.** Intégration avec jeux de données précis (réponses se recoupant, morceau retiré, catégorie renommée, resoumission, envies structurées vers un même morceau) vérifiant comptes distincts, dénominateurs, choix du libellé, zéros et séparation envies/votes ; unitaires pour le formatage des pourcentages en français ; E2E : après le parcours invité, le DJ voit un participant, un vote sur le morceau choisi et les envies listées.

**Zones concernées.** `djeaz/features/analytics/`, `djeaz/app/(dashboard)/events/[eventId]/`, `djeaz/features/events/` (compteur).

**Livrables.** Agrégations exactes ; vues résultats complètes ; compteur de réponses ; tests.

**Critères de fin (J1).**

- Parcours complet vert en CI : inscription → construction du catalogue → création d'événement → ouverture → réponse invité → résultats.
- Valeurs vérifiées par tests d'intégration ; les pourcentages sont cohérents avec leurs dénominateurs.
- Vue résultats vérifiée aux largeurs 320, 768 et 1440 px et au zoom 200 % ; état vide vérifié.

**Vigilance.** Distinguer comptes distincts et comptes bruts ; aucun cache partagé des résultats privés ; requêtes indexées pour des centaines de réponses ; ne jamais agréger par genre musical global dans les vues du MVP.

---

### P6 — Catalogue avancé et conservation historique

**Objectif.** Le minimum fonctionnel du catalogue existe depuis P2.9 ; P6 le complète et le prouve sur des sondages déjà utilisés : renommage, réordonnancement complet, déplacement entre catégories, suppression de catégories, révision, comportements face aux participations en cours, historique après retrait ou modification, concurrence et confort avec de nombreux morceaux. Les choix historiques restent lisibles et comptabilisés après toute modification.

**Prérequis.** P2 (modèle et première version de `/catalog`), P4 et P5 (pour prouver la conservation de bout en bout).

**Travaux.**

- **P6.1 — Opérations métier complètes.** Renommage et réordonnancement des catégories ; déplacement d'un morceau vers une autre catégorie (reclassement de l'association, jamais de copie) et réordonnancement au sein d'une catégorie ; suppression de catégorie déjà livrée (associations retirées après confirmation, morceaux globaux conservés) ; chaque mutation en transaction sous verrou du catalogue avec incrément de `revision` ; bornes de `CONVENTIONS.md` §4 (catégorie 1–80) ; une référence vers une catégorie ou une association d'un autre DJ répond `NOT_FOUND`. Compléter les opérations de P2.9 sans les dupliquer.
- **P6.2 — `/catalog` complet.** Liste des catégories avec nombre de morceaux, dépliage vers les morceaux (titre, artiste, pochette ou placeholder) ; renommage en ligne ou en dialogue ; réordonnancement et déplacement par commandes accessibles au clavier (glisser-déposer facultatif, jamais seul) ; suppression confirmée (pour une catégorie : nombre de morceaux concernés et rappel que les choix passés sont conservés) ; état vide avec mascotte et « Créer ma première catégorie » ; squelettes, notifications, saisies conservées après erreur. Intensité dashboard.
- **P6.3 — Conservation historique de bout en bout.** Vérifier : morceau retiré après des réponses → référence vers `catalog_tracks` à `NULL`, `musicTrackId` et libellés conservés, résultats inchangés avec marqueur « retiré du catalogue » ; dans la modification d'une réponse, le choix historique reste visible, retirable et non ajoutable via le catalogue ; catégorie renommée, morceau déplacé ou catégorie supprimée → les nouvelles sélections portent les nouvelles clés et libellés, les regroupements continuent sur les clés historiques et le libellé affiché est la copie la plus récente ; évolution des métadonnées globales d'un morceau → réponses inchangées (`ARCHITECTURE.md` §6 et §8).
- **P6.4 — Révision et participations en cours.** Scénario complet : sondage chargé avec une révision, mutation du catalogue par le DJ, soumission de l'invité → `CONFLICT`, rafraîchissement et nouvelle validation sans perte (P4.7) ; mutations concurrentes du catalogue par deux onglets du DJ sérialisées par le verrou.
- **P6.5 — Tests.** Unitaires : bornes, calcul des ordres. Intégration : propriété, cascade catégorie → associations, unicité `(catalogId, musicTrackId)` lors d'un déplacement, incrément de révision, conservation après retrait, déplacement, renommage et suppression de catégorie, comptes inchangés, concurrence. RTL : commandes de réordonnancement et de déplacement. E2E : un morceau ajouté apparaît immédiatement dans un sondage ouvert ; un morceau retiré laisse les résultats intacts.
- **P6.6 — Seed et volume.** Modifications de catalogue et sélections historiques correspondantes ; jeu de données synthétique volumineux (plusieurs centaines d'associations) pour vérifier le confort de `/catalog` et des sondages.

**Zones concernées.** `djeaz/features/catalog/`, `djeaz/app/(dashboard)/catalog/`, tests d'intégration et E2E.

**Livrables.** Page catalogue complète ; révision opérationnelle ; conservation historique prouvée ; tests ; seed.

**Critères de fin.**

- Toutes les opérations fonctionnent et se reflètent immédiatement dans les sondages ouverts.
- Suites d'intégration et E2E de conservation historique vertes ; `/catalog` vérifié selon `GRAPHICS.md` §7.

**Vigilance.** Aucune opération du catalogue ne modifie ni ne supprime un morceau de la bibliothèque globale. Vérifier le confort de la page avec plusieurs centaines de morceaux sans introduire de pagination non demandée.

---

### P7 — Sécurité, qualité, paramètres et documentation (→ J2)

**Objectif.** Consolider ce qui a été intégré phase par phase : contrat d'erreurs homogène, contrôles de sécurité vérifiés en conditions proches de la production, intégrité et performance des données, finitions UX/accessibilité/performance sur tous les écrans, page `/settings`, documentation d'utilisation et de maintenance.

**Prérequis.** P2 à P6.

**Travaux.**

- **P7.1 — Contrat d'erreurs et diagnostics.** Audit de toutes les actions (union discriminée, codes stables, `fieldErrors` quand utile), mappage HTTP des endpoints métier éventuels, frontières `error` par segment affichant l'identifiant de diagnostic (le digest fourni par Next.js convient) et une action de réessai, journalisation serveur des erreurs inattendues avec cet identifiant et sans mot de passe, jeton, cookie, chaîne de connexion ni contenu de réponse ; pages introuvables cohérentes par espace.
- **P7.2 — Durcissement.** Origines de confiance Better Auth et attributs de cookies vérifiés en HTTPS ; protection d'origine des Server Actions et vérification d'origine de tout Route Handler écrivant avec cookies ; bornes techniques centralisées (taille du corps, nombre d'éléments par requête, longueurs) ; texte libre toujours rendu comme texte ; réponses privées et pages de sondage non indexables ; aucun secret sous `NEXT_PUBLIC_*` ; échec explicite au démarrage si la configuration est invalide ; seuils de limitation de débit revus et purge vérifiée, y compris pour les recherches publiques ; appels aux fournisseurs vérifiés (serveur uniquement, timeout, données minimales, échec propre, aucune réponse brute ni credential dans l'interface ou les journaux) ; durée de session confirmée, politique de mot de passe et seuils Better Auth validés en P2.2 inchangés ; audit des dépendances.
- **P7.3 — Intégrité et performance des données.** Relecture des contraintes et index face aux requêtes réelles (plans d'exécution sur un volume seedé réaliste, dont la recherche titre/artiste sur une bibliothèque de plusieurs milliers de morceaux synthétiques), unicités `(provider, externalId)` et `(catalogId, musicTrackId)` éprouvées, ordre des verrous documenté dans le code, couverture transactionnelle des mutations, politique de migrations successives compatibles avec le code encore déployé, procédure documentée pour toute migration destructive (sauvegarde et reprise), taille du pool adaptée au serverless, usage des URL poolée et directe de Neon.
- **P7.4 — Finitions UX, accessibilité et performance.** Passe complète de `GRAPHICS.md` §7 sur chaque écran des deux expériences (clair/sombre, largeurs, zooms, reflow), ordre de focus, libellés, annonces des retours de mutation aux technologies d'assistance, réduction des mouvements, textes longs, états chargement/vide/erreur/succès ; poids des assets (mascotte optimisée, animations Lottie chargées à la demande avec repli statique), dimensions d'images ; mesure de performance mobile sur le sondage et correction des régressions évidentes, sans cible chiffrée arbitraire.
- **P7.5 — `/settings`.** Périmètre minimal retenu tant que le contenu n'est pas précisé (§6.1) : informations du compte, préférence de thème, déconnexion. Toute fonction supplémentaire (modification du nom, de l'e-mail ou du mot de passe, suppression du compte) attend une décision.
- **P7.6 — Documentation.** `README.md` racine (présentation, organisation, liens vers `documentation/`) ; `djeaz/README.md` (installation, base Docker, variables, scripts, tests, seed, résumé du déploiement, renvoi au runbook de P8) ; mise à jour de `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` ou `GRAPHICS.md` uniquement si l'implémentation a fait évoluer une règle documentée.

**Zones concernées.** Transversal ; `djeaz/app/(dashboard)/settings/`, `djeaz/lib/`, `README.md`, `djeaz/README.md`, `documentation/`.

**Livrables.** Liste d'audit close ; checklist de finition passée partout ; `/settings` ; documentation à jour.

**Critères de fin (J2).**

- Toutes les suites de tests vertes ; chaque écran passe `GRAPHICS.md` §7 ; aucun secret ni donnée personnelle dans les journaux de test.
- Tout le périmètre de §1.1 est implémenté et vérifié, hors mise en production.

**Vigilance.** Ne pas affaiblir un contrôle pour obtenir un résultat vert ; tout test ignoré est expliqué et suivi.

---

### P8 — CI/CD, environnements et première livraison (→ J3)

**Objectif.** CI complète sur `develop` et `main`, previews avec données synthétiques, livraison déclenchée par tag `vX.Y.Z` qui vérifie et déploie le commit exact après contrôles, build et migrations, vérification post-livraison et procédure de reprise ; puis première version en production.

**Prérequis.** P0.6, P7, et les interventions utilisateur de §5 (GitHub, Vercel, Neon).

**Travaux.**

- **P8.1 — CI complète.** Finaliser `ci.yml` : suites complètes (intégration avec service PostgreSQL, E2E avec navigateurs en cache), build avec variables de CI, caches pnpm/Node, aucun déploiement de production. Convention : `main` doit être verte avant tout tag.
- **P8.2 — Projet Vercel.** Root Directory `djeaz`, framework Next.js, Node 24 ; désactivation des déploiements Git automatiques de `main` (previews de `develop` conservées) ; variables par environnement : Preview (base synthétique, `BETTER_AUTH_URL` et origines adaptées aux URL variables des previews — approche à confirmer, §6.1), Production (URL poolée Neon de production, secret, URL canonique).
- **P8.3 — Neon.** Projet de production (région européenne), chaîne poolée pour `DATABASE_URL`, chaîne directe pour `DATABASE_MIGRATION_URL` ; base de preview distincte alimentée par `db:seed` (morceaux synthétiques, jamais l'import réel) ; vérification de la rétention et de la restauration ponctuelle offertes par le plan.
- **P8.4 — GitHub.** Environnement `production` contenant les secrets de livraison (jeton et identifiants Vercel, `DATABASE_MIGRATION_URL` de production et variables nécessaires au build), sans approbation manuelle ; règles de branches `main` et `develop` interdisant force-push et suppression sans imposer de PR (`CONVENTIONS.md` §8).
- **P8.5 — `release.yml`.** Déclenchement sur tag `v*` puis validation stricte du format SemVer ; récupération du commit **du tag** avec historique complet ; vérification que ce commit appartient à l'historique de `main` et que la version est supérieure à la dernière livrée ; contrôles complets sur ce commit (format, lint, types, tests, build) ; build de production avec la CLI Vercel depuis la racine du dépôt en respectant le Root Directory ; application des migrations de production avec l'URL directe ; déploiement du **même artefact** en production ; groupe de concurrence commun sans annulation d'une release en cours ; tout échec de contrôle ou de migration bloque le déploiement ; le build ne migre jamais la base.
- **P8.6 — Vérification post-livraison et reprise.** Checklist de fumée manuelle (accueil, inscription ou connexion, création et ouverture d'un événement, sondage sur téléphone, soumission, résultats, clôture) ; consultation des journaux Vercel par identifiant de diagnostic ; runbook : relance maîtrisée du même workflow en cas d'échec sans déplacer le tag, correctif urgent depuis le tag déployé (`CONVENTIONS.md` §8), restauration de base via Neon en rappelant que restaurer le code ne restaure pas la base.
- **P8.7 — Première livraison.** Choix du numéro de version (§5), création par l'utilisateur d'un tag annoté sur un commit validé de `main`, push, suivi du workflow, exécution de la checklist de fumée. Alimentation de la bibliothèque musicale de production par l'outil d'import (P2.9), exécuté volontairement hors CI et hors workflow de release, une fois les sources et leurs conditions validées (§5) ; l'application reste fonctionnelle avant et pendant cet import grâce à la recherche de repli.

**Zones concernées.** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, configuration Vercel (dashboard ou `vercel.json`), `djeaz/README.md` ou `documentation/` pour le runbook.

**Livrables.** CI complète ; previews fonctionnelles ; workflow de release ; environnements configurés ; runbook ; première version en production.

**Critères de fin (J3).**

- Un tag déploie en production de bout en bout au moins une fois, avec migrations appliquées avant le déploiement du même artefact.
- Un push sur `main` déclenche la CI mais aucun déploiement ; une preview de `develop` fonctionne sur des données synthétiques sans accès à la production.
- Checklist de fumée passée ; runbook relu.

**Vigilance.** Aucun secret dans les journaux de workflow ; les previews n'atteignent jamais la base de production ; le plan Vercel Hobby est limité à un usage non commercial (`STACK.md`) ; l'ordre « migrer puis déployer » impose des migrations compatibles avec la version encore en ligne.

---

## 5. Interventions de l'utilisateur

Actions que seul l'utilisateur peut réaliser ou décider. Aucune n'est effectuée par un agent IA ; Git en particulier lui est réservé.

| Intervention | Phase | Détail |
|---|---|---|
| Workflow Git | Toutes | Créer et maintenir `develop`, réaliser commits, merges directs vers `main`, tags annotés `vX.Y.Z` et pushes. |
| Docker local *(réalisée)* | P0.4 | Docker Compose en place pour les bases PostgreSQL de développement et de tests. |
| Règles GitHub | P0.6, P8.4 | Protéger `main` et `develop` contre force-push et suppression, sans PR obligatoire ; créer l'environnement `production` et y déposer les secrets de livraison. |
| Bootstrap de la bibliothèque musicale | P2.9, P8.7 | La stratégie est figée : artistes populaires, puis leurs recordings populaires, puis complément global et équilibrage optionnel, sans quota par genre. Reste à arrêter la liste des genres d'équilibrage de production et le moment d'exécution de l'import. |
| Fournisseurs de métadonnées | P2.9, P8.7 | MusicBrainz (recherche et identité) et ListenBrainz (popularité d'import uniquement) sont retenus. Cover Art Archive fournit une URL de pochette, sans cache. TheAudioDB et Last.fm ne sont pas intégrés. La validation juridique reste à faire avant la production. |
| Validation juridique des sources | P8.7 | Vérifier conditions d'utilisation, quotas, licences des métadonnées et droits d'affichage des pochettes avant la mise en production. |
| Seuils de limitation de débit des écritures et recherches publiques | P4.5, P4.11 | Valider les seuils proposés par le développeur pour la soumission de réponses et la recherche musicale publique, locale et externe. La politique de mot de passe (8–128 caractères) et les seuils Better Auth de P2.2 sont déjà validés et implémentés. |
| Assets manquants | P1.5 | Fournir une mascotte optimisée (vectoriel réel ou PNG/WebP), les variantes de mascotte pour états (vide, erreur), les icônes d'application multi-tailles, une image OpenGraph et, si souhaité, une variante compacte du logo. |
| Contenu de `/settings` | P7.5 | Préciser les paramètres attendus au-delà du minimum retenu. |
| Service d'e-mail | P2 | Décider si vérification d'e-mail et réinitialisation de mot de passe entrent au MVP (nouveau service, hors stack actuelle) ou restent exclues. |
| URL canonique et domaine | P1.2, P3.7, P8.2 | Confirmer le domaine (le code actuel mentionne `https://djeaz.com`), base des liens publics et de `BETTER_AUTH_URL` par environnement. |
| Compte et projet Vercel | P8.2 | Créer le projet, Root Directory `djeaz`, désactiver les déploiements automatiques de `main`, saisir les variables, choisir un plan compatible avec l'usage visé. |
| Compte et projets Neon | P8.3 | Créer production et preview, transmettre les chaînes poolée et directe via les environnements prévus, vérifier la rétention des sauvegardes. |
| Numéro de première version | P8.7 | `v0.1.0` ou `v1.0.0`. |

---

## 6. Points à clarifier et risques concrets

### 6.1 Points à clarifier

| Point | Impact | Étapes concernées | Bloquant |
|---|---|---|---|
| `step.txt` mentionne `/app/[dj_uuid]` ; l'architecture validée définit `/dashboard`, `/events/*`, `/catalog`, `/settings`, `/survey/[publicId]`. La roadmap suit l'architecture. | Structure des routes et de la garde serveur. | P2.3, P3 | Non, sauf si l'utilisateur confirme l'autre schéma |
| Contenu de `/settings` non défini dans les sources. | Périmètre de la page ; une suppression de compte aurait des conséquences en cascade à spécifier. | P7.5 | Non (minimum retenu) |
| Vérification d'e-mail et réinitialisation de mot de passe absentes des sources et impossibles sans service d'e-mail. | Un DJ perdant son mot de passe n'a aucune reprise au MVP. | P2.2 | Oui pour la décision, non pour avancer |
| Liste finale des genres d'équilibrage de l'import, configurable, à figer avant la production. La stratégie artistes → recordings → complément global est déjà retenue, sans quota par genre. | Contenu de la bibliothèque au lancement ; sans import, la bibliothèque démarre vide et se remplit par les sélections. | P8.7 | Non pour le code ; oui avant l'import de production |
| Validation juridique et contractuelle des sources de métadonnées et des pochettes Cover Art Archive (affichage par URL, sans cache ni téléchargement). MusicBrainz, ListenBrainz et Cover Art Archive sont les seules sources de P2.9 ; TheAudioDB et Last.fm ne sont pas utilisés. | Conditions d'exploitation avant la première livraison. | P8.7 | Oui avant la première livraison |
| Déclenchement du repli externe : action explicite « Rechercher plus largement », jamais automatique, au plus 10 candidats MusicBrainz, résultats locaux conservés. | Parcours de recherche du DJ et, plus tard, de l'invité. | P4.11 | Non, décision figée en P2.9 |
| Comportement à l'ouverture d'un sondage avec un catalogue vide (avertissement ou blocage). | Page événement et sondage. | P3.6, P4.2 | Non (hypothèse : avertissement) |
| Définition exacte des « tendances communes » (seuil, tri, nombre affiché). | Agrégation et vue Aperçu. | P5.1, P5.2 | Non (hypothèse : partagés par au moins deux participants) |
| Indexation des pages de sondage : non indexables proposé (liens non listés). | Métadonnées et en-têtes. | P4.2, P7.2 | Non |
| Base des URL publiques : dériver de `BETTER_AUTH_URL` plutôt que de l'en-tête `Host`. | Lien et QR code corrects dans chaque environnement. | P3.7, P8.2 | Non |
| Gestion de `BETTER_AUTH_URL` et des origines de confiance pour les URL variables des previews Vercel. | Connexion fonctionnelle en preview. | P8.2 | Non, mais à trancher avant P8 |
| Modification du nom et de la date d'un événement après ouverture ou clôture : non interdite par les sources, supposée autorisée. | Formulaire d'édition. | P3.6 | Non |
| Pseudonymes en doublon dans un même événement : aucune unicité dans les sources, supposés autorisés. | Affichage des participants. | P4.4, P5.2 | Non |
| Collecte de données personnelles d'invités (pseudonyme, tranche d'âge, empreintes d'IP temporaires) : aucune mention d'information légale dans les sources. | Éventuelle page d'information ou mention dans le sondage. | P4, P7 | Non (voir §6.3) |
| Plan Vercel : Hobby non commercial. | Conditions d'exploitation. | P8.2 | Non avant exploitation commerciale |

### 6.2 Risques techniques

| Risque | Conséquence | Mitigation | Étapes |
|---|---|---|---|
| Next.js 16.3 très récent : compatibilité de Better Auth, shadcn/ui, Drizzle, Testing Library avec React 19.2 et Tailwind 4. | Blocages à l'installation ou comportements inattendus. | Vérifier la compatibilité à chaque ajout, figer les versions, consulter la documentation locale de Next.js avant chaque usage d'API. | P0, P1, P2 |
| Pooler Neon en mode transaction. | Verrous de session et instructions préparées nommées inopérants. | Verrous de lignes ou consultatifs transactionnels, URL directe pour les migrations, ordre de verrous fixe. | P4.5, P6.1, P7.3, P8.3 |
| Écriture de cookies impossible pendant le rendu. | Conception du cookie de participation. | Émission dans la Server Action de première soumission. | P4.3 |
| Calcul de « aujourd'hui » en `Europe/Paris` sur un serveur UTC, changements d'heure. | Mauvais classement à venir/passé. | Calcul explicite et tests aux bornes. | P3.2, P3.8 |
| Vitest ne couvre pas les Server Components asynchrones. | Faux sentiment de couverture. | Comportements critiques couverts par intégration et Playwright. | P0.5, P2 à P6 |
| Durée et fragilité de la CI avec PostgreSQL et Playwright. | Retours lents, faux négatifs. | Caches, base dédiée par exécution, tests E2E ciblés sur les parcours critiques. | P0.6, P8.1 |
| Validation de configuration exécutée au build sans secrets. | Build impossible en CI ou chez Vercel. | Validation au premier usage serveur, variables factices en CI. | P0.3, P8.1, P8.5 |
| Migrations appliquées avant le déploiement du nouvel artefact. | Incompatibilité temporaire avec la version en ligne. | Migrations additives et compatibles ; procédure documentée pour les cas destructifs. | P7.3, P8.5 |
| Mascotte SVG de 872 Ko et animations Lottie d'environ 650 Ko chacune. | Sondage lent sur téléphone. | Export optimisé demandé, chargement à la demande, repli statique. | P1.5, P7.4 |
| Limitation de débit par IP derrière Vercel. | Blocage de groupes d'invités partageant une IP (salle, Wi-Fi). | Seuils par opération raisonnables, fenêtres courtes, message clair ; valider les seuils avec l'utilisateur. | P4.5, P7.2 |
| Taille du pool PostgreSQL en serverless. | Épuisement des connexions Neon. | Pool borné par instance et URL poolée en production. | P0.4, P7.3 |
| Quotas et pannes des fournisseurs de métadonnées. | Recherche externe lente, refusée ou indisponible. | Local-first, abstraction d'adaptateurs, timeouts, respect des limites de débit, échec propre ; bibliothèque et texte libre utilisables sans fournisseur. | P2.9, P4.11, P7.2 |
| Qualité des données : doublons, variantes live/remaster/remix/radio edit. | Fusions erronées ou morceaux en double dans la bibliothèque. | Rapprochement par identifiants (externe, Recording ID, ISRC) avant tout signal textuel, aucune fusion aveugle, provenance tracée, tests d'intégration de déduplication et de concurrence. | P2.9, P7.3 |
| Droits et licences des métadonnées et des pochettes. | Obligation de retirer une source ou des images en production. | Validation juridique avant livraison, artwork optionnel avec placeholder, aucune copie massive d'images, provenance par morceau. | P2.9, P8.7 |
| Lenteur de l'import initial (heures ou jours). | Bibliothèque incomplète au lancement, exécution interrompue. | Outil idempotent et reprenable, exécuté hors CI et hors release ; l'application fonctionne avec une bibliothèque partielle grâce au repli externe. | P2.9, P8.7 |
| Dépendance excessive à un fournisseur. | Blocage du produit si ses conditions changent. | Identifiant DJEAZ indépendant, provenance multi-fournisseurs, adaptateurs interchangeables, bibliothèque locale comme cache durable. | P2.9 |
| Abus du repli externe depuis le sondage public. | Explosion des appels externes, quotas épuisés. | Limitation de débit persistante dédiée aux recherches publiques, requêtes bornées, recherche locale d'abord. | P4.11, P7.2 |
| URLs de pochettes devenant indisponibles. | Images cassées dans le sondage et le dashboard. | Placeholder DJEAZ systématique ; stratégie de cache ou de stockage décidée plus tard dans le respect des conditions des sources. | P2.9, P7.4 |

### 6.3 Propositions hors périmètre (à ne pas réaliser sans décision)

- Page d'information sur les données collectées et mention dans le sondage.
- Bibliothèque de graphiques (par exemple le composant Chart de shadcn/ui) si les barres HTML/CSS se révèlent insuffisantes.
- Filtre ou recherche dans le catalogue du DJ depuis le sondage pour les grands catalogues (distinct de la recherche dans la bibliothèque globale de P4.11).
- Suggestions de noms de catégories dans `/catalog`, sans création automatique.
- Observation du taux de résolution locale des recherches (sans objectif chiffré).
- Cache ou stockage des pochettes, selon les conditions des sources.
- Politique de sécurité du contenu (CSP) stricte et en-têtes de sécurité complémentaires.
- Service de suivi des erreurs en production au-delà des journaux Vercel.
- Service d'e-mail pour vérification et réinitialisation de mot de passe.
- Suppression de compte en libre-service et export des résultats.

---

## 7. Critères de préparation à la première livraison

Checklist courte, vérifiable avant de créer le premier tag :

- [ ] Toutes les étapes P0 à P7 sont terminées et leurs critères de fin satisfaits ; la CI est verte sur `main`.
- [ ] Le parcours complet (inscription → construction du catalogue → événement → ouverture → réponse invité → modification sans double comptage → résultats → clôture) passe en E2E en CI.
- [ ] L'isolation multi-DJ, la conservation historique et la déduplication concurrente de la bibliothèque sont couvertes par des tests d'intégration verts.
- [ ] Les fournisseurs de métadonnées retenus et leurs conditions sont validés ; l'outil d'import initial est prêt et son exécution sur la base de production est planifiée (ou le démarrage avec une bibliothèque réduite est explicitement accepté).
- [ ] `.env.example` est complet ; aucune valeur secrète n'est versionnée ; aucun secret sous `NEXT_PUBLIC_*`.
- [ ] Les migrations s'appliquent depuis une base vierge et sont compatibles avec le code encore déployé.
- [ ] Limitation de débit, cookies, origines de confiance et journaux sans données sensibles vérifiés en environnement HTTPS.
- [ ] Chaque écran passe la checklist `GRAPHICS.md` §7 en clair et en sombre ; la mascotte optimisée est en place.
- [ ] Projet Vercel configuré (Root Directory `djeaz`, déploiements automatiques de `main` désactivés, variables de production) ; previews de `develop` fonctionnelles sur données synthétiques.
- [ ] Neon production et preview créés ; URL poolée et directe distinctes ; sauvegardes vérifiées.
- [ ] Environnement GitHub `production` alimenté ; règles de branches en place.
- [ ] `release.yml` validé sur un tag d'essai ou par exécution contrôlée ; procédure de relance et de correctif urgent documentée.
- [ ] README racine et `djeaz/README.md` à jour ; runbook post-livraison rédigé.
- [ ] Numéro de version choisi ; tag annoté créé par l'utilisateur sur un commit validé de `main`.

---

## Annexe A — Matrice de couverture

Recoupement des exigences des sources avec les étapes de la roadmap.

| Thème | Exigences couvertes | Étapes |
|---|---|---|
| Socle et environnement | Organisation et frontières, dépendances, variables et `.env.example`, PostgreSQL/Drizzle/migrations/seed, séparation des environnements, outils de qualité | P0.1–P0.7, P2.1, P2.7, P8.2–P8.4 |
| Identité visuelle | Tokens, Plus Jakarta Sans, palette, thèmes clair/sombre, composants et états, logo/mascotte/icônes, navigation et layouts, responsive/zoom/accessibilité/animations, états chargement/vide/erreur/succès, deux expériences | P1.1–P1.8, P3.4, P4.4, P5.2, P6.2, P7.4 |
| Authentification et isolation | Better Auth, inscription/connexion/sessions/déconnexion, protection serveur, création du catalogue vide, isolation, paramètres | P2.1–P2.8, P7.5 |
| Bibliothèque musicale | Modèle global partagé, provenance et unicité `(provider, externalId)`, genres musicaux N:N, recherche local-first, repli externe après sélection explicite, déduplication et concurrence, import initial contrôlé, artwork optionnel, sécurité des appels externes, tests sans réseau | P2.5, P2.9, P4.11, P7.2, P7.3, P8.7 |
| Catalogue | Catalogue vide à l'inscription, catégories libres, ajout/retrait/déplacement/réordonnancement de morceaux, catalogue courant dans les événements, révision, conservation historique | P2.5, P2.9, P6.1–P6.6 |
| Événements et partage | Dashboard, création/consultation/modification/suppression, statuts et passé/à venir, ouverture/clôture, lien et QR, confirmations et conséquences | P3.1–P3.9 |
| Sondage | Accès public et liens indisponibles, pseudonyme et tranche d'âge, catégories et sélection, panier, envies structurées ou libres, validation et confirmation, modification, prévention du double comptage, sondage fermé, erreurs récupérables, concurrence et évolution du catalogue | P4.1–P4.11, P6.4 |
| Résultats | Participants et réponses individuelles, classements et popularité des catégories, répartitions et tranches d'âge, envies, exactitude des dénominateurs, présentation sans réponses | P5.1–P5.4 |
| Sécurité, qualité, exploitation | Validations/autorisations/limites, secrets/cookies/données personnelles/journaux, limitation de débit, contraintes/transactions/concurrence, tests unitaires/intégration/E2E, performance, diagnostics, documentation | P0.5, P2.2, P4.5, P7.1–P7.6 et tests de chaque phase |
| CI/CD et livraison | Contrôles automatiques, previews, livraison par tag, commit exact, build/migrations/échecs, services et secrets, vérification et reprise | P0.6, P8.1–P8.7 |
