# DJEAZ — Project

## Overview

Application web destinée aux DJs événementiels permettant de recueillir les préférences musicales des invités avant un événement.

L'objectif est de donner au DJ une vision claire des goûts de son futur public afin de l'aider à préparer son set, sans chercher à générer automatiquement une playlist ni à remplacer ses choix artistiques.

Le produit repose sur deux interfaces principales :

- un **dashboard privé** pour le DJ ;
- un **sondage public** destiné aux invités.

Il s'appuie sur une **bibliothèque musicale globale** DJEAZ, partagée par tous les DJs et les invités, dans laquelle chaque DJ construit son **catalogue personnel** : les catégories qu'il choisit et les morceaux qu'il décide de proposer. DJEAZ ne lit, ne diffuse et ne stocke aucun audio.

---

## Concept

Pour chaque prestation, le DJ crée un événement depuis son dashboard.

Exemples :

- Anniversaire 50 ans Guillaume
- Mariage Laura & Thomas
- Soirée d'entreprise
- Gala étudiant

Chaque événement possède ensuite :

- un nom et une date ;
- un lien public unique ;
- un QR code ;
- son propre sondage musical ;
- les réponses des invités ;
- des statistiques musicales ;
- un statut permettant de distinguer les événements à venir et passés.

Le dashboard devient ainsi l'espace central permettant au DJ de retrouver et suivre l'ensemble de ses prestations.

---

## User Flow

### DJ

1. Le DJ crée son compte : son catalogue personnel est vide.
2. Il prépare son catalogue : il crée ses catégories, recherche des morceaux dans la bibliothèque DJEAZ et les range dans ses catégories.
3. Il crée un événement.
4. L'application génère un lien public et un QR code.
5. Le DJ transmet le sondage aux organisateurs ou aux invités.
6. Les invités répondent avant l'événement.
7. Le DJ consulte les réponses et les tendances.
8. Il utilise ces informations pour préparer son set.

Le catalogue est préparé une fois et évolue librement ; tous les événements du DJ utilisent son catalogue courant.

### Invité

L'invité n'a pas besoin de créer de compte.

Après avoir ouvert le lien ou scanné le QR code :

1. il renseigne son nom ou pseudonyme et sa tranche d'âge ;
2. il parcourt les catégories préparées par le DJ ;
3. il sélectionne les titres qu'il aimerait entendre, regroupés dans sa sélection ;
4. avec **« Soumettre une envie »**, il peut rechercher un morceau absent du catalogue dans la bibliothèque musicale DJEAZ ;
5. si le morceau reste introuvable, il peut décrire son envie en texte libre ;
6. il valide sa réponse.

---

## Music Library & Personal Catalog

### Bibliothèque musicale globale

DJEAZ entretient une bibliothèque musicale commune : des morceaux identifiés (titre, artiste, et lorsque disponibles album, pochette, durée, genres musicaux) partagés par tous les DJs et tous les invités. Elle n'appartient à aucun DJ.

Elle est constituée initialement à partir des morceaux populaires des grands genres musicaux, puis s'enrichit avec l'usage : lorsqu'un morceau manque, DJEAZ interroge des sources de métadonnées musicales externes et n'enregistre que le morceau explicitement choisi par l'utilisateur.

### Catalogue personnel du DJ

Chaque DJ construit son catalogue from scratch : aucune catégorie ni aucun morceau n'est imposé à l'inscription.

Il crée ses **catégories**, qui reflètent son organisation personnelle et ne sont pas forcément des genres musicaux, par exemple :

```text
Mon catalogue
├── Cocktail
├── Funk / Disco
├── Classiques mariage
├── Rock
├── Rap FR
└── Fin de soirée
```

Il y ajoute les morceaux de la bibliothèque qu'il souhaite proposer, les déplace, les réordonne et les retire selon ses besoins. Un morceau figure au plus une fois dans le catalogue, dans une seule catégorie.

Dans le sondage, l'invité parcourt uniquement ce catalogue : le DJ reste maître des morceaux mis en avant. « Soumettre une envie » reste le canal pour tout le reste, avec une recherche assistée dans la bibliothèque et un texte libre en dernier recours.

---

## Event Dashboard

Pour chaque événement, le DJ dispose d'une vue dédiée contenant notamment :

- les informations de l'événement ;
- le lien public et le QR code ;
- le nombre de réponses ;
- la liste des participants ;
- les sélections de chaque invité ;
- les envies des invités, morceaux identifiés ou textes libres ;
- les statistiques globales.

### Statistiques principales

L'application doit notamment permettre d'identifier :

- les morceaux les plus demandés ;
- le nombre de votes par morceau ;
- les catégories du catalogue les plus populaires ;
- la répartition générale des préférences ;
- les envies des invités, listées à part et sans peser sur les votes du catalogue ;
- les tendances communes entre participants ;
- la répartitions des tranches d'âge des invités.

L'objectif est de transformer les réponses individuelles en informations directement exploitables par le DJ.

---

## Users

### DJ

Utilisateur authentifié disposant d'un espace privé pour gérer son catalogue personnel, ses événements, ses sondages et leurs résultats.

### Invité

Utilisateur public accédant uniquement au sondage d'un événement via son lien unique ou son QR code.

Aucun compte n'est nécessaire pour participer.

---

## Product Principles

### Simple pour l'invité

Le sondage doit être rapide, intuitif et utilisable facilement depuis un smartphone.

### Utile pour le DJ

Les résultats doivent mettre en avant les tendances importantes plutôt qu'une simple liste brute de réponses.

### Faible friction

Aucune inscription ne doit être nécessaire côté invité.

### Liberté artistique

L'application constitue une aide à la préparation et non un générateur automatique de playlist.

Le DJ conserve la maîtrise complète de son set, de l'ordre des morceaux et de son adaptation au public pendant l'événement. Il décide seul des morceaux proposés dans son catalogue ; DJEAZ ne le remplit jamais à sa place.

### Métadonnées, pas de musique

DJEAZ manipule des informations sur les morceaux, jamais la musique elle-même : aucune lecture audio, aucun extrait, aucune intégration à un service de streaming.

---

## Core Features

### DJ

- Authentification
- Dashboard
- Construction du catalogue personnel : catégories, recherche de morceaux, ajout, déplacement, retrait
- Création et gestion d'événements
- Événements passés et futurs
- Génération d'un lien public
- Génération d'un QR code
- Consultation des participants
- Consultation des réponses individuelles
- Analyse globale des réponses
- Consultation des envies des invités, structurées ou libres

### Invité

- Accès public au sondage
- Identification simple
- Navigation par catégories du catalogue du DJ
- Sélection de morceaux
- Consultation de sa sélection
- Envie supplémentaire : recherche dans la bibliothèque musicale, ou texte libre
- Validation du sondage

---

## Product Vision

Le produit doit devenir un **outil de préparation musicale pour DJ événementiel**.

Sa valeur principale ne réside pas uniquement dans le sondage, mais dans sa capacité à répondre simplement à une question :

> **À quoi ressemble musicalement le public de ma prochaine soirée ?**

L'application centralise cette information et la transforme en données utiles pour aider le DJ à préparer une prestation mieux adaptée à son public.