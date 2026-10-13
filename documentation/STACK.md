# DJEAZ — Technical Stack

## Overview

Le projet repose sur une stack TypeScript moderne et volontairement simple.

```text
Next.js
├── Frontend
├── Backend
└── Business Logic

Better Auth
└── Authentication

Neon
└── PostgreSQL Database

Vercel
└── Hosting & Deployment

Music metadata providers
└── MusicBrainz (recherche runtime), ListenBrainz (import), Cover Art Archive (URL)
```

L'objectif est de conserver une architecture légère avec une seule application full-stack et le minimum d'infrastructure à administrer. Les fournisseurs de métadonnées musicales sont des sources externes consultées côté serveur, pas une infrastructure à administrer.

---

## Next.js

**Role:** Frontend + Backend

Next.js constitue le cœur de l'application.

Il est utilisé pour :

- l'interface utilisateur ;
- le dashboard DJ ;
- le sondage public ;
- le routing ;
- la logique serveur ;
- les opérations métier ;
- les endpoints HTTP nécessaires ;
- les accès à la base de données côté serveur.

Le projet utilise l'**App Router** et TypeScript.

Next.js permet de construire une application React full-stack au sein d'un même projet, avec notamment des composants serveur, des composants client, des fonctions serveur et des Route Handlers.

### Architecture

```text
Next.js
├── Public
│   └── Guest Survey
│
├── Private
│   ├── Dashboard
│   └── Event Management
│
└── Server
    ├── Business Logic
    ├── Authentication
    └── Database Access
```

Aucune API backend indépendante n'est nécessaire pour le MVP.

---

## Vercel

**Role:** Hosting & Deployment

Vercel héberge et exécute l'application Next.js.

La plateforme prend notamment en charge :

- les builds ;
- les déploiements ;
- les environnements de production et de preview ;
- l'exécution de l'application Next.js ;
- HTTPS ;
- les domaines ;
- les variables d'environnement ;
- l'intégration avec Git.

Le déploiement d'une application Next.js sur Vercel est directement pris en charge par la plateforme.

### Deployment Flow

```text
Development
     │
     ▼
    Git
     │
     ▼
 Repository
     │
     ▼
   Vercel
     │
     ▼
Production
```

Le plan **Hobby** peut être utilisé pour le développement et les premières expérimentations, mais il est officiellement limité à un usage personnel et non commercial. Une exploitation commerciale nécessitera donc un plan compatible.

---

## Neon

**Role:** PostgreSQL Database

Neon fournit la base de données PostgreSQL du projet.

Elle stocke notamment :

- les DJs ;
- la bibliothèque musicale globale : morceaux et métadonnées, provenance chez les fournisseurs, genres musicaux globaux ;
- les catalogues personnels : catégories de chaque DJ et associations catalogue ↔ morceau ;
- les événements ;
- les participants ;
- les sélections ;
- les envies des invités, structurées ou libres ;
- les données nécessaires à l'authentification et à la limitation de débit.

La bibliothèque musicale est partagée et sans propriétaire ; les catalogues sont privés. Un morceau n'est stocké qu'une fois, quel que soit le nombre de DJs qui l'ajoutent à leur catalogue.

PostgreSQL est particulièrement adapté au projet grâce à la nature relationnelle des données, à la recherche textuelle sur titres et artistes et aux besoins d'agrégation nécessaires pour produire les statistiques.

### Data Flow

```text
Browser
   │
   ▼
Next.js Server
   │
   ▼
PostgreSQL / Neon
```

La base de données n'est jamais directement accessible depuis le navigateur.

Neon permet également de gérer des environnements de base de données via son système de branches et propose des connexions poolées adaptées aux applications générant de nombreuses connexions.

---

## Better Auth

**Role:** Authentication & Sessions

Better Auth gère l'authentification des DJs directement dans l'application Next.js.

Il prend en charge notamment :

- les utilisateurs ;
- la connexion ;
- les sessions ;
- les comptes ;
- les informations d'authentification.

Better Auth possède une intégration officielle avec Next.js et peut utiliser directement PostgreSQL comme stockage.

### Authentication Model

```text
Application
├── DJ
│   ├── Authentication required
│   ├── Dashboard
│   └── Events
│
└── Guest
    ├── No account required
    └── Public event survey
```

Les données Better Auth sont stockées dans la même base PostgreSQL Neon que les données applicatives.

---

## Music Metadata Providers

**Role:** External music metadata sources

DJEAZ recherche des **métadonnées** musicales (titre, artiste, album, désambiguïsation, identifiants, pochette) pour alimenter sa bibliothèque globale. Il ne s'agit pas d'une intégration de streaming : aucun audio, extrait ou flux n'est récupéré ni lu.

### Local-first Flow

```text
Browser
   │
   ▼
Next.js Server
   │
   ├── Bibliothèque PostgreSQL locale (automatique, max 20)
   │
   └── MusicBrainz, seulement après « Rechercher plus largement » (max 10)
```

Le navigateur n'appelle jamais directement un fournisseur. La bibliothèque locale est interrogée dès 2 caractères. MusicBrainz n'est sollicité qu'après l'action explicite « Rechercher plus largement », et seul le morceau choisi par l'utilisateur est enregistré, après revalidation serveur. ListenBrainz n'intervient pas dans cette recherche : il alimente uniquement l'import initial.

### Providers

| Provider | Statut | Rôle |
|---|---|---|
| **MusicBrainz** | Source canonique | Recherche runtime et identité des recordings (Recording MBID), titres, artistes, releases, ISRC |
| **ListenBrainz** | Import uniquement | Popularité : artistes, recordings d'un artiste, recordings globaux |
| **Cover Art Archive** | Artwork, URL seule | Miniature après sélection ou import ; aucun téléchargement ni cache |
| **TheAudioDB** | Non utilisé | Aucun adaptateur en P2.9 |
| **Last.fm** | Non utilisé | Aucun adaptateur en P2.9 |

Conditions d'utilisation, quotas et droits sur les métadonnées et pochettes sont revalidés avant la mise en production. Spotify, Deezer et les autres services de streaming ne font pas partie de la stack. L'import (`pnpm music:import`) enchaîne ListenBrainz, MusicBrainz et Cover Art Archive hors démarrage, hors migration et hors CI.

---

## Public / Private Separation

### Private

```text
/dashboard
/catalog
/events/*
/settings
```

Ces espaces sont réservés au DJ authentifié.

Les permissions et la propriété des ressources doivent toujours être vérifiées côté serveur.

### Public

```text
/survey/[publicId]
```

Cette partie est accessible sans authentification afin de réduire au maximum les frictions pour les invités.

Le `publicId` doit être suffisamment imprévisible pour éviter qu'un utilisateur puisse simplement deviner l'URL d'un autre événement.

---

## Environment Variables

Les secrets et paramètres dépendant de l'environnement sont stockés dans des variables d'environnement.

Exemples :

```env
DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
# User-Agent non secret, lu au premier appel MusicBrainz / ListenBrainz / Cover Art Archive.
# MUSICBRAINZ_USER_AGENT=DJEAZ/0.1.0 (https://djeaz.com)
```

Ils ne doivent jamais être exposés au navigateur ni versionnés dans le repository.

`MUSICBRAINZ_USER_AGENT` n'est pas un secret et n'est pas exigé par `pnpm build` ni par les tests. Aucun credential MusicBrainz, ListenBrainz ou Cover Art Archive n'est requis.

---

## Architecture Summary

```text
                    Internet
                       │
                       ▼
                  ┌─────────┐
                  │ Vercel  │
                  └────┬────┘
                       │
                       ▼
                 ┌───────────┐
                 │  Next.js  │
                 │           │
                 │ Frontend  │
                 │ Backend   │
                 └─────┬─────┘
                       │
             ┌─────────┼─────────────────────┐
             │         │                     │
             ▼         ▼                     ▼
      ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐
      │ Better Auth │ │    Neon     │ │  Music metadata    │
      │             │▶│ PostgreSQL  │ │  providers         │
      └─────────────┘ └─────────────┘ │ (server-side only, │
                                      │  local-first)      │
                                      └────────────────────┘
```

---

## Technology Responsibilities

| Technology | Responsibility |
|---|---|
| **TypeScript** | Main programming language |
| **Next.js** | Frontend, backend, routing and business logic |
| **Better Auth** | Authentication and sessions |
| **Neon** | PostgreSQL database, including the global music library and personal catalogs |
| **Vercel** | Hosting, deployment and runtime |
| **MusicBrainz** | Recherche runtime et identité canonique des recordings, côté serveur |
| **ListenBrainz** | Popularité de l'import initial uniquement |
| **Cover Art Archive** | URL de pochette, sans téléchargement ni cache |

---

## Architecture Principles

The initial architecture remains intentionally simple:

```text
✓ One Next.js application
✓ One PostgreSQL database
✓ Authentication integrated into the application
✓ Server-side database access
✓ Local-first music library; MusicBrainz only after an explicit wider search
✓ Public guest experience without account
✓ Automated deployment
```

The MVP does not require:

```text
✗ Separate frontend and backend
✗ Microservices
✗ Dedicated authentication server
✗ Self-hosted PostgreSQL server
✗ Streaming integration, audio playback or previews
✗ Complex infrastructure
```

The objective is to prioritize product development while keeping an architecture that can evolve as usage grows.