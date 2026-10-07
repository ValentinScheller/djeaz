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
```

L'objectif est de conserver une architecture légère avec une seule application full-stack et le minimum d'infrastructure à administrer.

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
- les événements ;
- les participants ;
- les genres musicaux ;
- les morceaux ;
- les sélections ;
- les demandes personnalisées ;
- les données nécessaires à l'authentification.

PostgreSQL est particulièrement adapté au projet grâce à la nature relationnelle des données et aux besoins d'agrégation nécessaires pour produire les statistiques.

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

## Public / Private Separation

### Private

```text
/dashboard
/events/*
/settings
```

Ces espaces sont réservés au DJ authentifié.

Les permissions et la propriété des ressources doivent toujours être vérifiées côté serveur.

### Public

```text
/survey/{publicId}
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
```

Ils ne doivent jamais être exposés au navigateur ni versionnés dans le repository.

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
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
      ┌─────────────┐     ┌─────────────┐
      │ Better Auth │     │    Neon     │
      │             │────▶│ PostgreSQL  │
      └─────────────┘     └─────────────┘
```

---

## Technology Responsibilities

| Technology | Responsibility |
|---|---|
| **TypeScript** | Main programming language |
| **Next.js** | Frontend, backend, routing and business logic |
| **Better Auth** | Authentication and sessions |
| **Neon** | PostgreSQL database |
| **Vercel** | Hosting, deployment and runtime |

---

## Architecture Principles

The initial architecture remains intentionally simple:

```text
✓ One Next.js application
✓ One PostgreSQL database
✓ Authentication integrated into the application
✓ Server-side database access
✓ Public guest experience without account
✓ Automated deployment
```

The MVP does not require:

```text
✗ Separate frontend and backend
✗ Microservices
✗ Dedicated authentication server
✗ Self-hosted PostgreSQL server
✗ Complex infrastructure
```

The objective is to prioritize product development while keeping an architecture that can evolve as usage grows.