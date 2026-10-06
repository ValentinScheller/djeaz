# DJEAZ — Architecture

> Architecture cible du MVP, avant implémentation. Fondée sur `PROJECT.md`, `STACK.md` et les décisions validées avec le porteur du projet. Les règles ci-dessous complètent ces sources.

## 1. Périmètre et socle

DJEAZ est une application multi-DJ de préparation musicale : chaque DJ gère son catalogue, ses événements et leurs résultats ; les invités répondent sans compte. Interface française, inscription libre, authentification par email et mot de passe.

Une seule application **Next.js App Router / React / TypeScript**, hébergée sur **Vercel**, avec **Better Auth**, **PostgreSQL sur Neon**, **Drizzle ORM / Drizzle Kit**, **Zod**, **Tailwind CSS** et **shadcn/ui**. Aucun backend indépendant, microservice, Redux ou service musical externe au MVP.

## 2. Organisation et responsabilités

Conserver l'organisation actuelle : **`djeaz/` est la racine de l'application**, `documentation/` contient les documents du projet et la racine du dépôt contient le README général. Aucun dossier `src/` à introduire. Les dossiers métier et de tests ci-dessous sont à ajouter au besoin.

| Emplacement | Responsabilité |
|---|---|
| `djeaz/app/` | Routes, layouts, pages et adaptation HTTP ; logique métier déléguée aux features |
| `djeaz/features/{auth,events,catalog,surveys,analytics}/` | Composants spécifiques, validations, requêtes et opérations du domaine |
| `djeaz/components/` | Composants partagés ; primitives shadcn/ui dans `ui/` |
| `djeaz/db/` | Client PostgreSQL et schémas Drizzle, dont le schéma Better Auth |
| `djeaz/lib/` | Configuration, utilitaires transversaux et contrats d'erreur |
| `djeaz/public/` | Assets statiques publics, sans secret ni donnée privée |
| `djeaz/drizzle/` | Migrations SQL et métadonnées versionnées |
| `djeaz/tests/{integration,e2e}/` | Tests transversaux ; tests unitaires près du code concerné |
| `documentation/` | `PROJECT.md`, `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` ; future charte graphique |
| `.github/workflows/` | Workflows GitHub Actions à la racine du dépôt |

Les configurations Next.js, TypeScript, ESLint, pnpm, Drizzle et tests restent dans `djeaz/`, avec son `package.json` et son lockfile. Les fichiers d'instructions existants `djeaz/AGENTS.md` et `djeaz/CLAUDE.md` restent à cet emplacement.

Dans chaque feature : `components/`, `schemas.ts`, `queries.server.ts`, `service.server.ts`, `actions.ts`, uniquement selon les besoins ; aucune couche repository systématique.

Les Server Components lisent les données directement via les modules serveur. Les Server Actions adaptent les mutations de l'interface et appellent les opérations métier. Les Route Handlers servent les véritables endpoints HTTP, notamment Better Auth sous `/api/auth/[...all]`. Toute entrée serveur applique validation et autorisation.

Les Client Components couvrent les interactions et reçoivent les seules données nécessaires. DB, authentification et métier serveur importent `server-only`.

## 3. Routes et accès

| Routes | Accès et contenu |
|---|---|
| `/`, `/sign-up`, `/sign-in` | Présentation, inscription et connexion |
| `/dashboard` | Événements à venir/passés du DJ connecté |
| `/events/new`, `/events/[eventId]` | Création, gestion, partage et résultats |
| `/catalog`, `/settings` | Catalogue personnel et paramètres du DJ |
| `/survey/[publicId]` | Sondage public et réponse de l'invité courant |

Chaque lecture et mutation privée vérifie la session Better Auth et la propriété côté serveur ; une protection de layout seule ne suffit pas. Le propriétaire est issu de la session, jamais d'un champ envoyé par le navigateur.

Le `publicId`, distinct de l'ID interne, contient 32 octets aléatoires encodés en base64url et possède une contrainte d'unicité. Le lien ouvre uniquement le sondage. Le QR code est généré à la demande, sans stockage.

## 4. Modèle de données

| Entité | Champs et relations essentiels |
|---|---|
| Tables Better Auth | Utilisateur, compte, session et vérification ; schéma compatible avec la version retenue |
| `catalogs` | Un catalogue par utilisateur : `ownerId` unique, `seedVersion`, `revision` |
| `genres` | Catalogue, nom, ordre d'affichage |
| `tracks` | Genre, titre, artiste, ordre d'affichage ; un genre par morceau au MVP |
| `events` | Propriétaire, nom, date, `publicId` unique, statut `draft/open/closed` |
| `responses` | Événement, pseudonyme, tranche d'âge, empreinte du secret, version, dates de soumission/modification |
| `response_selections` | Réponse, référence nullable au morceau courant, clés historiques du morceau/genre et copie de leurs libellés |
| `free_requests` | Réponse, texte libre, ordre |

IDs métier en UUID ; références utilisateur conformes au schéma Better Auth. Dates techniques en `timestamptz`/UTC ; date d'événement en `date`, sans heure. La distinction `upcoming/past` est calculée en `Europe/Paris` : aujourd'hui reste à venir, sans modifier le statut du sondage.

Contraintes : clés étrangères, champs obligatoires, statuts et tranches d'âge contrôlés, unicité `(eventId, secretHash)` et `(responseId, trackKey)`. Indexer les clés étrangères et les filtres usuels, notamment propriétaire/date et événement/réponses. Les relations de catalogue et les sélections sont validées contre le propriétaire de l'événement.

## 5. Catalogue et conservation des choix

À la création du compte, une opération transactionnelle et idempotente copie le catalogue de référence versionné dans le dépôt, avec de nouveaux IDs. Le marqueur d'initialisation permet une reprise après échec et empêche de remplir à nouveau un catalogue volontairement vidé. Les mises à jour de référence ne modifient pas les copies existantes.

Le DJ ajoute, modifie, réordonne et supprime ses genres/morceaux ; supprimer un genre supprime ses morceaux après confirmation. Tous ses événements utilisent **son catalogue courant**, sans copie ni personnalisation par événement.

Chaque sélection enregistre côté serveur le titre, l'artiste, le genre et leurs clés au moment du choix. Les clés historiques restent indépendantes du catalogue ; la référence courante passe à `NULL` lors d'une suppression. Les anciens choix restent lisibles et comptabilisables.

Lors d'une modification de réponse, les choix historiques conservés gardent leur copie ; ils peuvent être retirés, mais un morceau supprimé ne peut plus être ajouté. Une révision de catalogue obsolète entraîne un rafraîchissement et une nouvelle validation, sans perte silencieuse de la sélection.

## 6. Événement et réponse invité

Transitions autorisées : **`draft → open → closed`**. Le DJ ouvre et ferme manuellement ; aucune réouverture au MVP. En brouillon, le sondage est indisponible ; fermé, il affiche une confirmation de clôture et refuse toute écriture. La suppression, après confirmation, est définitive et cascade vers réponses, sélections et demandes ; elle ne touche pas au catalogue.

L'invité fournit un pseudonyme et une tranche d'âge : `<18`, `18–25`, `26–35`, `36–45`, `46–55`, `56–65`, `66+`. Aucun email. Aucune limite métier au nombre de morceaux ni de demandes ; les tailles de textes et de requêtes restent bornées techniquement.

Avant la première soumission, le serveur émet un secret aléatoire de 32 octets dans un cookie persistant propre à l'événement, `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, valable 180 jours. Seule son empreinte SHA-256 est enregistrée en base. Ce secret permet de relire et modifier uniquement cette réponse tant que le sondage est ouvert. Sa perte, son expiration ou un autre navigateur créent une nouvelle participation ; aucune identité forte n'est promise.

La première soumission et ses répétitions utilisent la même clé de participation. Une transaction enregistre la réponse complète ; une nouvelle soumission remplace les choix et demandes, sans ajouter de participant. Une version de réponse détecte les modifications concurrentes. Fermeture, suppression et soumission coordonnent leurs accès par verrou sur l'événement ; les mutations du catalogue et les soumissions verrouillent le catalogue pour vérifier sa révision. Ordre constant : événement, catalogue, réponse.

## 7. Résultats et état de l'interface

Les statistiques sont calculées en SQL depuis les réponses validées, sans table de compteurs ni tâche planifiée :

- participants = nombre de réponses ; votes d'un morceau = réponses distinctes par clé historique ;
- popularité d'un genre = participants distincts l'ayant choisi ; un participant compte une fois par genre ;
- part des préférences = sélections du genre / total des sélections ; âge = réponses par tranche ;
- tendances communes = morceaux et genres partagés, sans recommandation automatique ; demandes libres listées séparément.

Les regroupements utilisent les clés historiques ; le libellé affiché est la copie la plus récemment enregistrée pour cette clé. Les dénominateurs sont explicités et un ensemble vide vaut zéro.

Panier en état React local ; réponses soumises en base. Aucun cache partagé des sessions/réponses/résultats privés ; rafraîchir les vues après mutation. Aucun temps réel.

## 8. Exécution et exploitation

Runtime **Node.js**, Drizzle avec `node-postgres` (`pg`), connexion Neon poolée et pool borné par instance ; les opérations métier utilisent des transactions interactives. Better Auth utilise l'adaptateur Drizzle sur la même base.

Développement, tests, previews et production ont des bases et secrets séparés. PostgreSQL local via Docker convient au développement et à la CI ; les previews utilisent des données synthétiques. Configuration serveur centralisée et validée : `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Aucun secret sous `NEXT_PUBLIC_*`.

### CI/CD par tag

GitHub héberge le dépôt : `develop` sert au développement ; `main` contient le code intégré, prêt à être livré. Les merges et pushes directs sont autorisés, sans PR obligatoire. La production correspond au **dernier tag déployé avec succès**, et peut donc différer de la tête de `main`.

| Workflow cible | Déclenchement | Traitement |
|---|---|---|
| `.github/workflows/ci.yml` | Push sur `develop` ou `main` | Installation avec lockfile figé, format, lint, types, tests et build ; aucun déploiement de production |
| `.github/workflows/release.yml` | Publication d'un nouveau tag `vX.Y.Z` sur GitHub (`push.tags: ['v*']`, puis validation du format) | Vérification du tag et de son appartenance à l'historique de `main`, contrôles sur son commit exact, build de production, migrations, déploiement Vercel |

Le workflow de release extrait le **commit du tag**, jamais la tête courante de `main`. Il construit l'artefact avant de migrer, puis déploie ce même artefact après réussite des migrations. Les releases sont sérialisées dans un groupe de concurrence commun, sans annulation d'une opération en cours. Un contrôle ou une migration en échec bloque le déploiement ; le build ne migre jamais la base. Les migrations restent compatibles avec le code encore déployé.

Vercel : configurer **Root Directory = `djeaz`** et désactiver les déploiements Git automatiques de `main`. Des previews de `develop` peuvent rester actives. Les commandes pnpm s'exécutent dans `djeaz/` ; les commandes Vercel CLI depuis la racine du dépôt, en respectant le Root Directory configuré. Les secrets de livraison sont réservés à l'environnement GitHub `production`, sans validation manuelle obligatoire.

Les écritures publiques et l'authentification disposent d'une limitation de débit persistante en PostgreSQL, par empreinte temporaire d'adresse IP et opération, avec expiration et purge opportuniste ; un compteur mémoire seul est insuffisant. Entrées Zod, texte libre rendu sans HTML, origines contrôlées, réponses privées non indexables et journaux sans secrets ni réponses personnelles. Une erreur inattendue reçoit un identifiant de diagnostic.

## Références

Sources produit : `PROJECT.md`, `STACK.md`, arborescence fournie et arbitrages validés. Références techniques : [sécurité Next.js](https://nextjs.org/docs/app/guides/data-security), [Drizzle/PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [adaptateur Better Auth](https://better-auth.com/docs/adapters/drizzle), [déclencheurs GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Vercel avec GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel), [Root Directory Vercel](https://vercel.com/docs/builds/configure-a-build). Ce document prescrit une architecture cible ; les workflows et dossiers proposés restent à implémenter.
