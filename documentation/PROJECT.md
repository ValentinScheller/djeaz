# Project

## Overview

Application web destinée aux DJs événementiels permettant de recueillir les préférences musicales des invités avant un événement.

L'objectif est de donner au DJ une vision claire des goûts de son futur public afin de l'aider à préparer son set, sans chercher à générer automatiquement une playlist ni à remplacer ses choix artistiques.

Le produit repose sur deux interfaces principales :

- un **dashboard privé** pour le DJ ;
- un **sondage public** destiné aux invités.

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

1. Le DJ se connecte à son espace.
2. Il crée un événement.
3. L'application génère un lien public et un QR code.
4. Le DJ transmet le sondage aux organisateurs ou aux invités.
5. Les invités répondent avant l'événement.
6. Le DJ consulte les réponses et les tendances.
7. Il utilise ces informations pour préparer son set.

### Invité

L'invité n'a pas besoin de créer de compte.

Après avoir ouvert le lien ou scanné le QR code :

1. il renseigne son nom ou pseudonyme ;
2. il parcourt le catalogue musical ;
3. il explore les morceaux classés par genres ;
4. il sélectionne les titres qu'il aimerait entendre ;
5. les morceaux sont regroupés dans sa sélection ;
6. il peut ajouter une demande libre avec **« Soumettre une envie »** ;
7. il valide sa réponse.

---

## Music Catalog

Le catalogue est organisé par genres musicaux, par exemple :

- Pop
- Rock
- Funk
- Disco
- Rap
- R&B
- Électro
- House
- Variété française
- Années 80
- Années 90
- Années 2000

Chaque genre contient une sélection de morceaux prédéfinie afin d'éviter à l'invité de devoir rechercher lui-même chaque titre.

La demande libre permet néanmoins de proposer un morceau absent du catalogue.

---

## Event Dashboard

Pour chaque événement, le DJ dispose d'une vue dédiée contenant notamment :

- les informations de l'événement ;
- le lien public et le QR code ;
- le nombre de réponses ;
- la liste des participants ;
- les sélections de chaque invité ;
- les demandes personnalisées ;
- les statistiques globales.

### Statistiques principales

L'application doit notamment permettre d'identifier :

- les morceaux les plus demandés ;
- le nombre de votes par morceau ;
- les genres les plus populaires ;
- la répartition générale des préférences ;
- les demandes personnalisées ;
- les tendances communes entre participants ;
- la répartitions des tranches d'âge des invités.

L'objectif est de transformer les réponses individuelles en informations directement exploitables par le DJ.

---

## Users

### DJ

Utilisateur authentifié disposant d'un espace privé pour gérer ses événements, ses sondages et leurs résultats.

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

Le DJ conserve la maîtrise complète de son set, de l'ordre des morceaux et de son adaptation au public pendant l'événement.

---

## Core Features

### DJ

- Authentification
- Dashboard
- Création et gestion d'événements
- Événements passés et futurs
- Génération d'un lien public
- Génération d'un QR code
- Consultation des participants
- Consultation des réponses individuelles
- Analyse globale des réponses
- Consultation des demandes libres

### Invité

- Accès public au sondage
- Identification simple
- Navigation par genres musicaux
- Sélection de morceaux
- Consultation de sa sélection
- Ajout d'une demande personnalisée
- Validation du sondage

---

## Product Vision

Le produit doit devenir un **outil de préparation musicale pour DJ événementiel**.

Sa valeur principale ne réside pas uniquement dans le sondage, mais dans sa capacité à répondre simplement à une question :

> **À quoi ressemble musicalement le public de ma prochaine soirée ?**

L'application centralise cette information et la transforme en données utiles pour aider le DJ à préparer une prestation mieux adaptée à son public.