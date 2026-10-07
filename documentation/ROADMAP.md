# DJEAZ — Roadmap d'implémentation

> Plan ordonné des travaux nécessaires pour réaliser l'ensemble du périmètre validé du MVP. Fondé sur `PROJECT.md`, `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `GRAPHICS.md`, la charte PDF et l'état réel du dépôt observé le 7 octobre 2026. Ce document dit **quoi construire, dans quel ordre, pourquoi et comment vérifier** ; les règles techniques détaillées restent dans leurs sources respectives et ne sont pas recopiées ici.

Chaque phase (`P0` à `P8`) et chaque étape (`P3.4`, etc.) possède un identifiant stable destiné au découpage en tickets. Quatre jalons (`J0` à `J3`) marquent les états intermédiaires utiles. Aucune estimation de durée n'est fournie : le dépôt ne contient aucune base vérifiable pour en produire.

---

## 1. Objectif et périmètre

### 1.1 Ce que la roadmap doit permettre de livrer

Une application **multi-DJ** de préparation musicale, en production sur Vercel avec PostgreSQL Neon, livrée par tag Git, comprenant :

- un **site vitrine** et un **sondage public** festifs, conçus d'abord pour téléphone, sans compte invité ;
- un **dashboard DJ** sobre et professionnel : authentification email/mot de passe (Better Auth), catalogue personnel, événements, partage par lien et QR code, résultats et statistiques ;
- la **conservation des choix historiques** lorsque le catalogue évolue ;
- la **sécurité** (validation, autorisation, isolation entre DJs, limitation de débit persistante, cookies, journaux) ;
- une **chaîne de qualité** complète (format, lint, types, tests unitaires, d'intégration et de bout en bout) et une **CI/CD par tag** déployant le commit exact après contrôles, build et migrations.

Les règles métier, le modèle de données et les contraintes d'exécution sont ceux d'`ARCHITECTURE.md` ; la mise en œuvre suit `CONVENTIONS.md` ; la direction artistique suit `GRAPHICS.md`. Cette roadmap ne modifie aucun de ces choix.

### 1.2 Hors périmètre (explicitement exclu du MVP)

Les éléments suivants ne figurent pas dans les sources validées. Ils ne sont planifiés nulle part ci-dessous et doivent faire l'objet d'une décision avant toute réalisation :

- génération automatique de playlist, recommandations, export de set ;
- intégration d'un service musical externe (Spotify, Deezer, etc.), recherche de titres en ligne, extraits audio ;
- temps réel (mises à jour live des résultats), notifications, e-mails transactionnels ;
- vérification d'adresse e-mail et réinitialisation de mot de passe (nécessitent un service d'envoi d'e-mails absent de la stack, voir §6) ;
- connexion sociale, comptes invités, équipes ou multi-utilisateurs par DJ ;
- plusieurs genres par morceau, personnalisation du catalogue par événement, réouverture d'un sondage clôturé ;
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

---

## 3. Vue d'ensemble

### 3.1 Phases et jalons

| Phase | Objectif | Dépend de | Principaux livrables | Jalon |
|---|---|---|---|---|
| **P0** Socle technique | Outils de qualité, scripts, PostgreSQL local, configuration validée, harnais de tests, CI minimale | — | Scripts conformes, Prettier, Docker PostgreSQL, Drizzle configuré, Vitest/RTL/Playwright opérationnels, `ci.yml` | **J0** socle fiable |
| **P1** Identité visuelle et socle UI | Tokens, Plus Jakarta Sans, thèmes, primitives shadcn/ui, trois coques (vitrine, dashboard, sondage), états globaux, page vitrine | P0 | Design system DJEAZ aux deux intensités, navigation dashboard ancrée à gauche, page `/` | — |
| **P2** Données, authentification, catalogue initial | Inscription/connexion/déconnexion, protection serveur, premières tables, copie du catalogue de référence, isolation multi-DJ, seed | P0, P1 | Better Auth branché, migrations initiales, garde de session, `/sign-up`, `/sign-in`, catalogue personnel initialisé | — |
| **P3** Événements et partage | Dashboard des événements, création, modification, suppression, statuts, lien public, QR code | P2 | `/dashboard`, `/events/new`, `/events/[eventId]` (gestion et partage) | — |
| **P4** Sondage public et participation | Accès par lien, identification, navigation par genres, sélection, panier, demandes libres, soumission, modification, cas limites | P1, P2, P3 | `/survey/[publicId]` complet et mobile-first, cookie de participation, transaction de soumission | — |
| **P5** Résultats et statistiques | Participants, réponses individuelles, classements, popularité, répartitions, demandes libres | P4 | Agrégations SQL exactes et vues résultats sur `/events/[eventId]` | **J1** premier parcours complet de bout en bout |
| **P6** Catalogue personnel et conservation historique | Gestion des genres et morceaux, révision, vérification de la conservation des choix | P2, P4, P5 | `/catalog`, règles historiques prouvées de bout en bout | — |
| **P7** Sécurité, qualité, paramètres, documentation | Contrat d'erreurs, durcissement, intégrité, finitions UX/accessibilité/performance, `/settings`, README | P2 à P6 | Audit clos, checklist `GRAPHICS.md` §7 passée partout, documentation d'exploitation | **J2** périmètre complet |
| **P8** CI/CD, environnements, première livraison | CI complète, Vercel, Neon, environnement GitHub `production`, `release.yml`, vérification post-livraison, reprise | P0, P7, interventions utilisateur | Release par tag fonctionnelle, previews, runbook, première version en production | **J3** première livraison |

### 3.2 Logique de progression

1. **J0** : un socle sur lequel chaque phase suivante peut ajouter code, migrations et tests sans réoutillage.
2. **P1** avant les features : éviter de reprendre chaque écran après coup ; limité aux tokens, primitives et coques réellement nécessaires, les autres composants s'ajoutent dans la phase qui les consomme.
3. **P2 → P5** : le parcours DJ → événement → invité → résultats est construit dans l'ordre de ses dépendances et constitue **J1**. La gestion du catalogue (**P6**) n'est pas nécessaire à ce parcours puisque le catalogue de référence est copié dès l'inscription ; elle vient ensuite et permet de prouver la conservation historique.
4. Les dimensions **interface, tests et sécurité sont intégrées à chaque phase** ; **P7** consolide et audite, il ne rattrape pas.
5. La CI existe dès **P0** et s'enrichit automatiquement des suites ajoutées ; **P8** ajoute la livraison et les environnements externes.
6. **Écrans sur données synthétiques et parcours connectés sont distingués explicitement** : la coque dashboard (P1.6) peut être construite avec une session factice avant d'être branchée en P2.8 ; le compteur de réponses (P3.4) et la zone résultats (P3.6) restent à zéro ou vides jusqu'à P4 et P5. Le seed (P2.7) alimente le développement et les previews ; les tests d'intégration et de bout en bout créent leurs propres données.

### 3.3 Dépendances

```text
P0 ──► P1 ──► P2 ──► P3 ──► P4 ──► P5 ──► P6 ──► P7 ──► P8
 J0                                   J1            J2     J3
```

La chaîne est linéaire : chaque phase s'appuie sur la précédente. Les tables sont créées par **migrations additives** au fil des phases (P2 : authentification, catalogue, limitation de débit ; P3 : événements ; P4 : réponses, sélections, demandes) et le seed est étendu en P2, P3, P4 et P6. Le modèle complet reste celui d'`ARCHITECTURE.md` §4.

---

## 4. Roadmap détaillée

### P0 — Socle technique et environnement local

**Objectif.** Disposer d'un environnement de développement reproductible et d'une chaîne de vérification complète avant d'écrire la première ligne métier : scripts conformes, formatage, base PostgreSQL locale, configuration serveur validée, tests exécutables, CI qui échoue quand il le faut.

**Prérequis.** Node 24 LTS, pnpm 10.15.1 (présent), Docker disponible localement (non détecté lors de l'analyse : à installer, ou à remplacer par une autre PostgreSQL locale dédiée sur décision de l'utilisateur), dépôt GitHub accessible pour la CI.

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

### P1 — Identité visuelle et socle d'interface

**Objectif.** Un design system DJEAZ exploitable par toutes les phases : tokens sémantiques, Plus Jakarta Sans, thèmes clair/sombre mémorisés, primitives shadcn/ui aux états complets, trois coques (vitrine, dashboard, sondage), états globaux, et la page vitrine. Deux intensités d'une même marque : **festive et colorée** côté public, **sobre et confortable** côté dashboard (`GRAPHICS.md` §1).

**Prérequis.** P0.

**Travaux.**

- **P1.1 — Tokens.** Dans `globals.css` via le mécanisme de thème de Tailwind 4 : couleurs de marque, tokens sémantiques (fond, surface, texte, texte secondaire, action, sélection, bordure, focus, succès/erreur/avertissement) en clair et en sombre ; rayons (12 px champs, 16–20 px cartes, pilules), échelle d'espacement en multiples de 4 px, deux niveaux d'ombres (public plus présent, dashboard atténué), durées d'animation (150–250 ms contrôles, 250–450 ms apparitions) et neutralisation sous `prefers-reduced-motion`. Vérifier chaque combinaison texte/fond au regard de `GRAPHICS.md` §2 (AA 4,5:1 texte courant, 3:1 grand texte).
- **P1.2 — Typographie, langue et métadonnées.** Charger Plus Jakarta Sans (400/500/600/700) via `next/font` en remplacement de Geist ; `lang="fr"` ; corps 16 px / interligne 1,5 ; échelle de titres plus expressive et fluide côté public. Corriger titre, description et OpenGraph en français et conformes au produit ; l'URL canonique reste à confirmer (§5).
- **P1.3 — Thème clair/sombre.** Préférence système au premier chargement, choix utilisateur mémorisé, bascule accessible disponible dans les deux expériences, sans flash au rendu. Le support de mémorisation (cookie lu côté serveur ou stockage local avec script d'initialisation) est un détail laissé au développeur ; l'exigence est l'absence de flash et la persistance.
- **P1.4 — Primitives shadcn/ui.** Initialiser shadcn/ui dans `components/ui/` en reliant ses variables aux tokens DJEAZ (et non l'inverse). N'installer que les primitives nécessaires au MVP : bouton, champ, libellé, zone de texte, sélection/boutons radio, case à cocher, carte, badge, dialogue et dialogue de confirmation, tiroir latéral, onglets, squelette, notifications, menu déroulant, infobulle, séparateur, tableau. Définir pour chacune les états survol, actif, focus visible, désactivé, chargement, erreur, et une variante d'intensité publique/dashboard. Cibles tactiles ≥ 44 px côté public.
- **P1.5 — Assets de marque et iconographie.** Composant logo basculant clair/sombre selon le thème ; composant mascotte statique ; composant mascotte animée (vidéo muette, sans lecture sonore, image d'attente, remplacement par l'image statique sous `prefers-reduced-motion`) ; jeu d'icônes en contour arrondi cohérent avec shadcn/ui. Le `mascotte.svg` actuel (872 Ko, PNG embarqués) n'est pas acceptable sur mobile : demander une exportation optimisée (vrai vectoriel ou PNG/WebP aux tailles utiles) et, en attendant, l'utiliser uniquement via l'optimisation d'images Next.js aux dimensions réelles. Lister les déclinaisons manquantes (§5) plutôt que de les approximer.
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

### P2 — Données, authentification et catalogue initial

**Objectif.** Un DJ peut s'inscrire, se connecter, se déconnecter ; les espaces privés sont protégés côté serveur ; les premières tables existent ; chaque nouveau compte reçoit une copie du catalogue de référence ; les données de deux DJs sont strictement isolées ; des données synthétiques sont disponibles pour le développement et les previews.

**Prérequis.** P0 (base, configuration), P1 (formulaires, coques).

**Travaux.**

- **P2.1 — Première migration.** Schéma Drizzle et migration pour : tables Better Auth (générées pour la version installée, mappage `snake_case`/`camelCase` conforme à `CONVENTIONS.md` §1), `catalogs` (propriétaire unique, `seedVersion`, `revision`), `genres`, `tracks` (ordre d'affichage, un genre par morceau), et un stockage persistant de limitation de débit en PostgreSQL (empreinte temporaire d'IP + opération, expiration). Contraintes et index d'`ARCHITECTURE.md` §4 pour ces tables ; relecture du SQL généré ; versionnement conjoint schéma/migration/métadonnées.
- **P2.2 — Better Auth.** Installation et configuration serveur : email + mot de passe, inscription libre, adaptateur Drizzle sur la même base, secret et URL issus de la configuration validée, origines de confiance, attributs de cookies de session. Route Handler sous `/api/auth/[...all]`. Limitation de débit des endpoints d'authentification avec stockage en base (vérifier dans la documentation Better Auth de la version installée si son limiteur intégré sait persister en base ; sinon, réutiliser le stockage de P2.1). Politique de mot de passe centralisée (bornes à proposer, voir §5).
- **P2.3 — Garde serveur des espaces privés.** Un point unique dans `features/auth` qui lit la session et renvoie `UNAUTHENTICATED` ou redirige vers `/sign-in` avec retour ; utilisé par chaque page, requête et action privée (`ARCHITECTURE.md` §3 : une protection de layout seule ne suffit pas). Optionnellement, `proxy.ts` pour une redirection optimiste des URL privées sur simple présence du cookie, jamais comme contrôle d'autorisation. Groupe de routes pour la coque dashboard sans changer les URL publiques.
- **P2.4 — Pages `/sign-up` et `/sign-in`.** Formulaires validés par Zod (serveur obligatoire), messages d'erreur en français, états de chargement et de désactivation, saisies conservées après échec, redirection vers `/dashboard` après succès ; un utilisateur déjà connecté arrivant sur ces pages est redirigé. Déconnexion depuis le menu utilisateur de la sidebar. Style public (festif) pour ces pages.
- **P2.5 — Catalogue de référence et initialisation.** Fichier de référence versionné dans le dépôt avec sa propre version, genres et morceaux (contenu définitif à fournir par l'utilisateur, §5 ; liste provisoire explicitement marquée en attendant). Opération transactionnelle et idempotente copiant la référence avec de nouveaux identifiants à la création du compte (point d'accroche Better Auth après création d'utilisateur) et reprise au premier accès privé si le catalogue manque ; l'existence de la ligne `catalogs` sert de marqueur et empêche de remplir à nouveau un catalogue volontairement vidé ; une évolution de la référence ne modifie jamais les copies existantes (`ARCHITECTURE.md` §5).
- **P2.6 — Isolation multi-DJ.** Toute requête privée filtre par le propriétaire issu de la session ; une ressource d'un autre DJ répond `NOT_FOUND` (`CONVENTIONS.md` §4).
- **P2.7 — Seed synthétique.** Script `db:seed` idempotent : un DJ de démonstration (identifiants connus en développement uniquement) et son catalogue ; étendu en P3, P4 et P6 ; ne réinitialise jamais de données utilisateur ; destiné au développement et aux previews.
- **P2.8 — Dashboard connecté.** Sidebar alimentée par la vraie session (nom, e-mail), déconnexion fonctionnelle, `/dashboard` affichant l'état vide « aucun événement » en attendant P3.

**Zones concernées.** `djeaz/db/`, `djeaz/drizzle/`, `djeaz/features/auth/`, `djeaz/features/catalog/`, `djeaz/app/api/auth/`, `djeaz/app/(dashboard)/` ou équivalent, `djeaz/app/sign-up/`, `djeaz/app/sign-in/`, `djeaz/proxy.ts` (optionnel), scripts de seed.

**Livrables.** Migration initiale appliquée ; authentification complète ; garde serveur ; pages d'inscription/connexion ; copie du catalogue à l'inscription ; seed ; tests associés.

**Critères de fin.**

- E2E : inscription → arrivée sur un dashboard vide → déconnexion → connexion ; accès non authentifié à `/dashboard` redirigé vers `/sign-in`.
- Intégration : deux DJs ne voient jamais les données l'un de l'autre ; l'initialisation du catalogue est idempotente, y compris sous déclenchement concurrent ; un catalogue vidé n'est pas rempli à nouveau.
- Les migrations s'appliquent depuis une base vierge ; `db:seed` est rejouable sans effet de bord ; CI verte.

**Vigilance.** Le schéma Better Auth doit correspondre exactement à la version installée. Cookie `Secure` uniquement en HTTPS pour permettre le développement local. Aucune vérification d'e-mail ni réinitialisation de mot de passe dans le périmètre (§6.1).

---

### P3 — Événements : dashboard, cycle de vie et partage

**Objectif.** Le DJ crée, consulte, modifie et supprime ses événements, distingue à venir et passés, ouvre et clôture le sondage, récupère le lien public et le QR code.

**Prérequis.** P2.

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

**Vigilance.** Serveur en UTC : le calcul « aujourd'hui » se fait explicitement en `Europe/Paris`. Ne jamais faire confiance à un statut ou un propriétaire envoyé par le navigateur.

---

### P4 — Sondage public et participation des invités

**Objectif.** Un invité ouvre le lien ou le QR code, s'identifie par pseudonyme et tranche d'âge, parcourt les genres, sélectionne des morceaux, ajoute des demandes libres et valide ; il peut relire et modifier sa réponse tant que le sondage est ouvert, sans jamais être compté deux fois ; les liens indisponibles, le sondage fermé, les erreurs et les changements concurrents sont traités proprement. Expérience **festive, pensée d'abord pour téléphone**.

**Prérequis.** P1 (coque sondage), P2 (catalogue), P3 (événements ouverts).

**Travaux.**

- **P4.1 — Migration réponses.** `responses` (événement, pseudonyme, tranche d'âge contrôlée, empreinte du secret, version, dates de soumission et de modification ; unicité événement/empreinte), `response_selections` (référence nullable au morceau courant mise à `NULL` à la suppression, clés historiques morceau/genre et copies des libellés obligatoires ; unicité réponse/clé de morceau), `free_requests` (texte, ordre) ; cascades depuis l'événement ; index événement/réponse et réponse/sélections (`ARCHITECTURE.md` §4).
- **P4.2 — Accès public `/survey/[publicId]`.** Résolution par `publicId` sans fuite d'information : lien inconnu ou événement supprimé → page introuvable publique indistincte ; brouillon → page « sondage pas encore disponible » ; clôturé → confirmation de clôture en lecture seule, refusant toute écriture ; ouvert → sondage. Rendu dynamique (lecture des cookies). Pages de sondage non indexables (à confirmer, §6.1).
- **P4.3 — Cookie de participation.** Secret aléatoire de 32 octets propre à l'événement, `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, 180 jours ; seule l'empreinte SHA-256 est stockée. Contrainte Next.js 16 : le cookie ne peut être écrit que dans une Server Action ou un Route Handler ; la solution la plus simple est de l'émettre dans l'action de première soumission, avant l'insertion. Un cookie absent, expiré ou un autre navigateur créent une nouvelle participation, sans promesse d'identité forte.
- **P4.4 — Parcours mobile-first.** Étape d'identification (pseudonyme 1–80, tranche d'âge parmi les sept valeurs, commandes en pilules tactiles) ; navigation par genres (puces défilantes, onglets ou liste dépliable) ; listes de morceaux faciles à parcourir, cibles ≥ 44 px, état sélectionné évident sans dépendre de la couleur seule, micro-retour animé (150–250 ms, neutralisé sous réduction des mouvements) ; panier en état React local, compteur dans la barre inférieure fixe et tiroir listant la sélection avec retrait ; section « Soumettre une envie » (texte 1–500, plusieurs demandes, retrait, ordre d'ajout conservé) ; bouton de validation actif seulement si au moins un morceau ou une demande ; clavier virtuel et zones sûres respectés ; aucun usage dépendant du survol.
- **P4.5 — Soumission.** Server Action recevant pseudonyme, tranche d'âge, identifiants de morceaux, demandes libres, révision de catalogue vue et version de réponse éventuelle. Côté serveur : validation Zod, normalisation, déduplication, règle « au moins un morceau ou une demande », bornes techniques (nombre maximal d'identifiants et de demandes par requête, taille du corps) ; limitation de débit persistante des écritures publiques par empreinte temporaire d'IP et opération, avec expiration et purge opportuniste → `RATE_LIMITED` ; transaction avec verrous dans l'ordre **événement → catalogue → réponse** : statut ouvert vérifié, révision du catalogue comparée (obsolète → `CONFLICT` accompagné du catalogue rafraîchi), appartenance de chaque morceau au catalogue du propriétaire de l'événement, copie des libellés et clés au moment du choix, création ou remplacement de la réponse identifiée par (événement, empreinte) avec contrôle de version, remplacement complet des sélections et demandes ; cookie émis si nouveau ; rafraîchissement des vues concernées. Union discriminée et codes stables de `CONVENTIONS.md` §4.
- **P4.6 — Modification d'une réponse.** Revisite avec cookie valide pendant l'ouverture : préremplissage (pseudonyme, tranche d'âge, sélections, demandes) ; les choix historiques dont le morceau a disparu du catalogue sont affichés comme « retiré du catalogue », conservés, retirables mais plus ajoutables ; la nouvelle soumission remplace l'ancienne sans ajouter de participant ; une version obsolète (deux onglets) → `CONFLICT` expliqué, saisies conservées ; après clôture, lecture seule.
- **P4.7 — Cas limites.** Sondage clôturé entre le chargement et la validation → `SURVEY_CLOSED` sans mutation ; événement supprimé → introuvable ; catalogue modifié pendant la participation → rafraîchissement, sélections encore valides conservées, morceaux disparus signalés, nouvelle validation demandée, aucune perte silencieuse ; erreur réseau ou `INTERNAL_ERROR` → message français avec identifiant de diagnostic, réessai possible, saisies conservées ; limitation de débit → explication et invitation à réessayer plus tard.
- **P4.8 — Confirmation.** Écran de succès avec célébration par la mascotte (animée, avec repli statique), récapitulatif de la sélection et des demandes, accès « Modifier ma réponse » tant que le sondage est ouvert ; aucun compte proposé.
- **P4.9 — Tests.** Unitaires : schémas, déduplication, règle du minimum, calcul d'empreinte. Intégration : unicité (événement, empreinte) ; nouvelle soumission → toujours une seule réponse ; conflit de version ; refus après clôture ; rejet d'un morceau d'un autre catalogue ; révision obsolète ; cascade à la suppression de l'événement ; comptage et purge de la limitation de débit. RTL : panier et état sélectionné. E2E sur viewport mobile : ouverture du lien → identification → sélection → demande libre → validation → confirmation → réouverture → modification → un seul participant.
- **P4.10 — Seed.** Réponses variées (tranches d'âge, sélections communes, sélections historiques avec référence `NULL`, demandes libres).

**Zones concernées.** `djeaz/features/surveys/`, `djeaz/app/survey/[publicId]/`, `djeaz/drizzle/`, `djeaz/lib/` (limitation de débit, empreintes).

**Livrables.** Sondage public complet et mobile-first ; cookie de participation ; transaction de soumission ; modification sans double comptage ; pages d'indisponibilité ; tests ; seed.

**Critères de fin.**

- E2E invité verte sur 390 px ; parcours également vérifié à 320 px (barre fixe ne masquant ni morceaux, ni focus, ni clavier) et en sombre.
- Tests d'intégration prouvant l'absence de double comptage, le refus après clôture et la gestion des conflits.
- Pages inconnu/brouillon/clôturé vérifiées ; aucun défilement horizontal ; CI verte.

**Vigilance.** Adresse IP lue depuis l'en-tête transmis par Vercel, jamais stockée en clair. Pooler Neon en mode transaction : verrous limités à la transaction (verrous de lignes ou verrous consultatifs transactionnels), jamais de verrou de session. Ne jamais croire un libellé ou un total venant du client.

---

### P5 — Résultats et statistiques (→ J1)

**Objectif.** Le DJ consulte participants, réponses individuelles, classement des morceaux, popularité des genres, répartition des préférences, tranches d'âge, tendances communes et demandes libres, avec des agrégations exactes, des dénominateurs explicites et une présentation lisible même sans réponse.

**Prérequis.** P4.

**Travaux.**

- **P5.1 — Agrégations SQL.** Requêtes paramétrées dans `features/analytics`, filtrées par propriétaire et événement, selon `ARCHITECTURE.md` §7 : nombre de participants ; classement des morceaux par réponses distinctes sur la clé historique avec libellé le plus récemment enregistré et genre associé ; popularité des genres par participants distincts ; part des préférences (sélections du genre / total des sélections) avec dénominateurs retournés ; répartition par tranche d'âge avec les sept tranches toujours présentes ; tendances communes (morceaux et genres partagés par au moins deux participants, sans recommandation ; définition à confirmer, §6.1) ; liste des demandes libres avec pseudonyme et date ; réponses individuelles avec sélections (libellés historiques) et demandes. Ensemble vide → zéro partout.
- **P5.2 — Vues résultats sur `/events/[eventId]`.** Sections : Aperçu (participants, sélections, demandes, premiers morceaux et genres), Morceaux (tableau classé avec votes et part des participants, défilement dans son propre conteneur si nécessaire), Genres (popularité et part avec barres, dénominateurs explicités en légende), Participants (liste puis détail d'un participant), Demandes libres (texte rendu comme texte, jamais comme HTML), Âges (barres avec effectifs et pourcentages). Graphiques accessibles : barres HTML/CSS avec équivalents textuels d'abord ; une bibliothèque de graphiques n'est ajoutée qu'en cas de besoin réel (§6.3). État vide avec rappel du partage ; vues rafraîchies après mutation ; aucun temps réel ; morceaux retirés du catalogue marqués comme tels. Intensité dashboard.
- **P5.3 — Compteur de réponses.** Branchement du nombre de réponses sur les cartes du dashboard (P3.4).
- **P5.4 — Tests.** Intégration avec jeux de données précis (réponses se recoupant, morceau supprimé, resoumission) vérifiant comptes distincts, dénominateurs, choix du libellé, zéros ; unitaires pour le formatage des pourcentages en français ; E2E : après le parcours invité, le DJ voit un participant, un vote sur le morceau choisi et la demande libre listée.

**Zones concernées.** `djeaz/features/analytics/`, `djeaz/app/(dashboard)/events/[eventId]/`, `djeaz/features/events/` (compteur).

**Livrables.** Agrégations exactes ; vues résultats complètes ; compteur de réponses ; tests.

**Critères de fin (J1).**

- Parcours complet vert en CI : inscription → événement → ouverture → réponse invité → résultats.
- Valeurs vérifiées par tests d'intégration ; les pourcentages sont cohérents avec leurs dénominateurs.
- Vue résultats vérifiée aux largeurs 320, 768 et 1440 px et au zoom 200 % ; état vide vérifié.

**Vigilance.** Distinguer comptes distincts et comptes bruts ; aucun cache partagé des résultats privés ; requêtes indexées pour des centaines de réponses.

---

### P6 — Catalogue personnel et conservation historique

**Objectif.** Le DJ gère ses genres et morceaux (ajout, modification, ordre, suppression) ; tous ses événements utilisent le catalogue courant ; chaque mutation incrémente la révision ; les choix historiques restent lisibles et comptabilisés après toute modification.

**Prérequis.** P2 (tables du catalogue), P4 et P5 (pour prouver la conservation de bout en bout).

**Travaux.**

- **P6.1 — Opérations métier.** Création, modification, réordonnancement et suppression de genres et de morceaux dans le catalogue du propriétaire ; suppression d'un genre supprimant ses morceaux après confirmation ; chaque mutation en transaction sous verrou du catalogue avec incrément de `revision` ; bornes de `CONVENTIONS.md` §4 (genre 1–80, titre et artiste 1–200) ; une référence vers un genre ou un morceau d'un autre DJ répond `NOT_FOUND`.
- **P6.2 — `/catalog`.** Liste des genres avec nombre de morceaux, dépliage vers les morceaux ; formulaires d'ajout et de modification en ligne ou en dialogue ; réordonnancement par commandes accessibles au clavier (glisser-déposer facultatif, jamais seul) ; suppression confirmée (pour un genre : nombre de morceaux concernés et rappel que les choix passés sont conservés) ; état vide (catalogue volontairement vidé) avec mascotte et invitation à créer un genre ; squelettes, notifications, saisies conservées après erreur. Intensité dashboard.
- **P6.3 — Conservation historique de bout en bout.** Vérifier : morceau supprimé après des réponses → référence `NULL`, libellés conservés, résultats inchangés avec marqueur « retiré du catalogue » ; dans la modification d'une réponse, le choix historique reste visible, retirable et non ajoutable ; morceau renommé → les nouvelles sélections portent le nouveau libellé, les regroupements continuent sur la clé historique et le libellé affiché est la copie la plus récente (`ARCHITECTURE.md` §7).
- **P6.4 — Révision et participations en cours.** Scénario complet : sondage chargé avec une révision, mutation du catalogue par le DJ, soumission de l'invité → `CONFLICT`, rafraîchissement et nouvelle validation sans perte (P4.7).
- **P6.5 — Tests.** Unitaires : bornes, calcul des ordres. Intégration : propriété, cascade genre → morceaux, incrément de révision, conservation après suppression et renommage, comptes inchangés. RTL : commandes de réordonnancement. E2E : un morceau ajouté apparaît immédiatement dans un sondage ouvert ; un morceau supprimé laisse les résultats intacts.
- **P6.6 — Seed.** Modifications de catalogue et sélections historiques correspondantes.

**Zones concernées.** `djeaz/features/catalog/`, `djeaz/app/(dashboard)/catalog/`, tests d'intégration et E2E.

**Livrables.** Page catalogue complète ; révision opérationnelle ; conservation historique prouvée ; tests ; seed.

**Critères de fin.**

- Toutes les opérations fonctionnent et se reflètent immédiatement dans les sondages ouverts.
- Suites d'intégration et E2E de conservation historique vertes ; `/catalog` vérifié selon `GRAPHICS.md` §7.

**Vigilance.** Une mise à jour du catalogue de référence ne touche jamais les copies existantes. Vérifier le confort de la page avec plusieurs centaines de morceaux sans introduire de pagination non demandée.

---

### P7 — Sécurité, qualité, paramètres et documentation (→ J2)

**Objectif.** Consolider ce qui a été intégré phase par phase : contrat d'erreurs homogène, contrôles de sécurité vérifiés en conditions proches de la production, intégrité et performance des données, finitions UX/accessibilité/performance sur tous les écrans, page `/settings`, documentation d'utilisation et de maintenance.

**Prérequis.** P2 à P6.

**Travaux.**

- **P7.1 — Contrat d'erreurs et diagnostics.** Audit de toutes les actions (union discriminée, codes stables, `fieldErrors` quand utile), mappage HTTP des endpoints métier éventuels, frontières `error` par segment affichant l'identifiant de diagnostic (le digest fourni par Next.js convient) et une action de réessai, journalisation serveur des erreurs inattendues avec cet identifiant et sans mot de passe, jeton, cookie, chaîne de connexion ni contenu de réponse ; pages introuvables cohérentes par espace.
- **P7.2 — Durcissement.** Origines de confiance Better Auth et attributs de cookies vérifiés en HTTPS ; protection d'origine des Server Actions et vérification d'origine de tout Route Handler écrivant avec cookies ; bornes techniques centralisées (taille du corps, nombre d'éléments par requête, longueurs) ; texte libre toujours rendu comme texte ; réponses privées et pages de sondage non indexables ; aucun secret sous `NEXT_PUBLIC_*` ; échec explicite au démarrage si la configuration est invalide ; seuils de limitation de débit revus et purge vérifiée ; durée de session et politique de mot de passe confirmées ; audit des dépendances.
- **P7.3 — Intégrité et performance des données.** Relecture des contraintes et index face aux requêtes réelles (plans d'exécution sur un volume seedé réaliste), ordre des verrous documenté dans le code, couverture transactionnelle des mutations, politique de migrations additives compatibles avec le code encore déployé, procédure documentée pour toute migration destructive (sauvegarde et reprise), taille du pool adaptée au serverless, usage des URL poolée et directe de Neon.
- **P7.4 — Finitions UX, accessibilité et performance.** Passe complète de `GRAPHICS.md` §7 sur chaque écran des deux expériences (clair/sombre, largeurs, zooms, reflow), ordre de focus, libellés, annonces des retours de mutation aux technologies d'assistance, réduction des mouvements, textes longs, états chargement/vide/erreur/succès ; poids des assets (mascotte optimisée, vidéo chargée paresseusement avec image d'attente), dimensions d'images ; mesure de performance mobile sur le sondage et correction des régressions évidentes, sans cible chiffrée arbitraire.
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
- **P8.3 — Neon.** Projet de production (région européenne), chaîne poolée pour `DATABASE_URL`, chaîne directe pour `DATABASE_MIGRATION_URL` ; base de preview distincte alimentée par `db:seed` ; vérification de la rétention et de la restauration ponctuelle offertes par le plan.
- **P8.4 — GitHub.** Environnement `production` contenant les secrets de livraison (jeton et identifiants Vercel, `DATABASE_MIGRATION_URL` de production et variables nécessaires au build), sans approbation manuelle ; règles de branches `main` et `develop` interdisant force-push et suppression sans imposer de PR (`CONVENTIONS.md` §8).
- **P8.5 — `release.yml`.** Déclenchement sur tag `v*` puis validation stricte du format SemVer ; récupération du commit **du tag** avec historique complet ; vérification que ce commit appartient à l'historique de `main` et que la version est supérieure à la dernière livrée ; contrôles complets sur ce commit (format, lint, types, tests, build) ; build de production avec la CLI Vercel depuis la racine du dépôt en respectant le Root Directory ; application des migrations de production avec l'URL directe ; déploiement du **même artefact** en production ; groupe de concurrence commun sans annulation d'une release en cours ; tout échec de contrôle ou de migration bloque le déploiement ; le build ne migre jamais la base.
- **P8.6 — Vérification post-livraison et reprise.** Checklist de fumée manuelle (accueil, inscription ou connexion, création et ouverture d'un événement, sondage sur téléphone, soumission, résultats, clôture) ; consultation des journaux Vercel par identifiant de diagnostic ; runbook : relance maîtrisée du même workflow en cas d'échec sans déplacer le tag, correctif urgent depuis le tag déployé (`CONVENTIONS.md` §8), restauration de base via Neon en rappelant que restaurer le code ne restaure pas la base.
- **P8.7 — Première livraison.** Choix du numéro de version (§5), création par l'utilisateur d'un tag annoté sur un commit validé de `main`, push, suivi du workflow, exécution de la checklist de fumée.

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
| Docker local | P0.4 | Installer Docker (non détecté lors de l'analyse) pour la base PostgreSQL de développement et de tests, ou indiquer une autre PostgreSQL locale dédiée. |
| Règles GitHub | P0.6, P8.4 | Protéger `main` et `develop` contre force-push et suppression, sans PR obligatoire ; créer l'environnement `production` et y déposer les secrets de livraison. |
| Contenu du catalogue de référence | P2.5 | Fournir la liste définitive des genres et des morceaux (titre, artiste) ; une liste provisoire sert d'attente. |
| Politique de mot de passe et seuils de limitation de débit | P2.2, P4.5 | Valider les valeurs par défaut proposées par le développeur. |
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
| Contenu réel du catalogue de référence. | Sans lui, les comptes créés en production recevraient la liste provisoire. | P2.5, P8.7 | Oui avant la première livraison |
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
| Mascotte de 872 Ko et vidéo de 1,5 Mo. | Sondage lent sur téléphone. | Export optimisé demandé, chargement paresseux et image d'attente, repli statique. | P1.5, P7.4 |
| Limitation de débit par IP derrière Vercel. | Blocage de groupes d'invités partageant une IP (salle, Wi-Fi). | Seuils par opération raisonnables, fenêtres courtes, message clair ; valider les seuils avec l'utilisateur. | P4.5, P7.2 |
| Taille du pool PostgreSQL en serverless. | Épuisement des connexions Neon. | Pool borné par instance et URL poolée en production. | P0.4, P7.3 |

### 6.3 Propositions hors périmètre (à ne pas réaliser sans décision)

- Page d'information sur les données collectées et mention dans le sondage.
- Bibliothèque de graphiques (par exemple le composant Chart de shadcn/ui) si les barres HTML/CSS se révèlent insuffisantes.
- Recherche de morceaux dans le sondage pour les grands catalogues.
- Politique de sécurité du contenu (CSP) stricte et en-têtes de sécurité complémentaires.
- Service de suivi des erreurs en production au-delà des journaux Vercel.
- Service d'e-mail pour vérification et réinitialisation de mot de passe.
- Suppression de compte en libre-service et export des résultats.

---

## 7. Critères de préparation à la première livraison

Checklist courte, vérifiable avant de créer le premier tag :

- [ ] Toutes les étapes P0 à P7 sont terminées et leurs critères de fin satisfaits ; la CI est verte sur `main`.
- [ ] Le parcours complet (inscription → événement → ouverture → réponse invité → modification sans double comptage → résultats → clôture) passe en E2E en CI.
- [ ] L'isolation multi-DJ et la conservation historique sont couvertes par des tests d'intégration verts.
- [ ] Le catalogue de référence définitif est intégré et versionné.
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
| Authentification et isolation | Better Auth, inscription/connexion/sessions/déconnexion, protection serveur, initialisation du catalogue, isolation, paramètres | P2.1–P2.8, P7.5 |
| Catalogue | Référence et copie initiale, gestion personnelle, ajout/modification/ordre/suppression, catalogue courant dans les événements, conservation historique | P2.5, P6.1–P6.6 |
| Événements et partage | Dashboard, création/consultation/modification/suppression, statuts et passé/à venir, ouverture/clôture, lien et QR, confirmations et conséquences | P3.1–P3.9 |
| Sondage | Accès public et liens indisponibles, pseudonyme et tranche d'âge, genres et sélection, panier et demandes libres, validation et confirmation, modification, prévention du double comptage, sondage fermé, erreurs récupérables, concurrence et évolution du catalogue | P4.1–P4.10, P6.4 |
| Résultats | Participants et réponses individuelles, classements et popularité, répartitions et tranches d'âge, demandes libres, exactitude des dénominateurs, présentation sans réponses | P5.1–P5.4 |
| Sécurité, qualité, exploitation | Validations/autorisations/limites, secrets/cookies/données personnelles/journaux, limitation de débit, contraintes/transactions/concurrence, tests unitaires/intégration/E2E, performance, diagnostics, documentation | P0.5, P2.2, P4.5, P7.1–P7.6 et tests de chaque phase |
| CI/CD et livraison | Contrôles automatiques, previews, livraison par tag, commit exact, build/migrations/échecs, services et secrets, vérification et reprise | P0.6, P8.1–P8.7 |
