# DJEAZ — Architecture

> Architecture cible du MVP. Fondée sur `PROJECT.md`, `STACK.md` et les décisions validées avec le porteur du projet, dont le pivot du 12 octobre 2026 vers une bibliothèque musicale globale et des catalogues personnels construits par chaque DJ. Les règles ci-dessous complètent ces sources ; `ROADMAP.md` distingue ce qui est déjà implémenté de ce qui reste à construire.

## 1. Périmètre et socle

DJEAZ est une application multi-DJ de préparation musicale : chaque DJ construit son catalogue personnel à partir d'une **bibliothèque musicale globale** partagée, gère ses événements et leurs résultats ; les invités répondent sans compte. Interface française, inscription libre, authentification par email et mot de passe.

Une seule application **Next.js App Router / React / TypeScript**, hébergée sur **Vercel**, avec **Better Auth**, **PostgreSQL sur Neon**, **Drizzle ORM / Drizzle Kit**, **Zod**, **Tailwind CSS** et **shadcn/ui**. Aucun backend indépendant, microservice ou Redux. Les fournisseurs externes de **métadonnées musicales** (§5) sont appelés uniquement côté serveur, en complément de la bibliothèque locale. Aucun service de streaming : DJEAZ ne récupère, ne stocke et ne lit jamais d'audio, d'extrait ou de flux.

## 2. Organisation et responsabilités

Conserver l'organisation actuelle : **`djeaz/` est la racine de l'application**, `documentation/` contient les documents du projet et la racine du dépôt contient le README général. Aucun dossier `src/` à introduire. Les dossiers métier et de tests ci-dessous sont à ajouter au besoin.

| Emplacement | Responsabilité |
|---|---|
| `djeaz/app/` | Routes, layouts, pages et adaptation HTTP ; logique métier déléguée aux features |
| `djeaz/features/{auth,events,catalog,music,surveys,analytics}/` | Composants spécifiques, validations, requêtes et opérations du domaine ; `music` porte la bibliothèque globale, la recherche locale et les adaptateurs de fournisseurs, `catalog` le catalogue personnel |
| `djeaz/components/` | Composants partagés ; primitives shadcn/ui dans `ui/` |
| `djeaz/db/` | Client PostgreSQL et schémas Drizzle, dont le schéma Better Auth |
| `djeaz/lib/` | Configuration, utilitaires transversaux et contrats d'erreur |
| `djeaz/public/` | Assets statiques publics, sans secret ni donnée privée |
| `djeaz/drizzle/` | Migrations SQL et métadonnées versionnées |
| `djeaz/scripts/` | Outils lancés volontairement hors du runtime applicatif : seed synthétique, import contrôlé de la bibliothèque musicale |
| `djeaz/tests/{integration,e2e}/` | Tests transversaux ; tests unitaires près du code concerné |
| `documentation/` | `PROJECT.md`, `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `ROADMAP.md`, `GRAPHICS.md`, `AGENTS.md` et `charte-graphique-djeaz.pdf` |
| `.github/workflows/` | Workflows GitHub Actions à la racine du dépôt |

Les configurations Next.js, TypeScript, ESLint, pnpm, Drizzle et tests restent dans `djeaz/`, avec son `package.json` et son lockfile. Les instructions aux agents restent dans `documentation/AGENTS.md`. `djeaz/AGENTS.md` et `djeaz/CLAUDE.md` existent mais sont générés par Next.js (`next dev`) : ils rappellent de consulter la documentation Next.js locale et n'ont aucun rôle architectural.

Dans chaque feature : `components/`, `schemas.ts`, `queries.server.ts`, `service.server.ts`, `actions.ts`, uniquement selon les besoins ; aucune couche repository systématique.

Les Server Components lisent les données directement via les modules serveur. Les Server Actions adaptent les mutations de l'interface et appellent les opérations métier. Les Route Handlers servent les véritables endpoints HTTP, notamment Better Auth sous `/api/auth/[...all]`. Toute entrée serveur applique validation et autorisation.

Les Client Components couvrent les interactions et reçoivent les seules données nécessaires. DB, authentification et métier serveur importent `server-only`.

## 3. Routes et accès

| Routes | Accès et contenu |
|---|---|
| `/`, `/sign-up`, `/sign-in` | Présentation, inscription et connexion |
| `/dashboard` | Événements à venir/passés du DJ connecté |
| `/events/new`, `/events/[eventId]` | Création, gestion, partage et résultats |
| `/catalog`, `/settings` | Catalogue personnel (catégories, recherche et ajout de morceaux) et paramètres du DJ |
| `/survey/[publicId]` | Sondage public et réponse de l'invité courant |

Chaque lecture et mutation privée vérifie la session Better Auth et la propriété côté serveur ; une protection de layout seule ne suffit pas. Le propriétaire est issu de la session, jamais d'un champ envoyé par le navigateur.

Le `publicId`, distinct de l'ID interne, contient 32 octets aléatoires encodés en base64url et possède une contrainte d'unicité. Le lien ouvre uniquement le sondage. Le QR code est généré à la demande, sans stockage.

La recherche musicale est servie côté serveur par `features/music`, pour le DJ connecté comme pour le sondage public, avec limitation de débit pour ce dernier ; le navigateur n'appelle jamais un fournisseur externe.

## 4. Modèle de données

Deux ensembles distincts : la **bibliothèque musicale globale** (`music_*`), partagée et sans propriétaire, et le **catalogue personnel** de chaque DJ (`catalogs`, `catalog_*`), qui référence des morceaux globaux sans dupliquer leurs métadonnées.

| Entité | Champs et relations essentiels |
|---|---|
| Tables Better Auth | Utilisateur (`name` : nom / prénom privé ; `artistName` : nom d'artiste public), compte, session et vérification ; schéma compatible avec la version retenue |
| `music_tracks` | Morceau global : `id` UUID DJEAZ, `title`, `artist`, puis facultatifs `albumTitle`, `artworkUrl`, `artworkProvider`, `isrc`, `durationMs` ; dates techniques |
| `music_track_sources` | Provenance : `musicTrackId`, `provider`, `externalId`, identifiant de release et horodatage si utiles ; unicité `(provider, externalId)` |
| `music_genres` | Genre musical global : nom |
| `music_track_genres` | Relation N:N morceau global ↔ genre musical |
| `catalogs` | Un catalogue par DJ : `ownerId` unique, `revision` |
| `catalog_categories` | Catégorie personnelle : `catalogId`, `name`, `displayOrder` |
| `catalog_tracks` | Association : `catalogId`, `categoryId`, `musicTrackId`, `displayOrder` ; unicité `(catalogId, musicTrackId)` ; clé étrangère composite `(categoryId, catalogId)` → `catalog_categories(id, catalogId)` |
| `events` | Propriétaire, nom, date, `publicId` unique, statut `draft/open/closed` |
| `responses` | Événement, pseudonyme, tranche d'âge, empreinte du secret, version, dates de soumission/modification |
| `response_selections` | Réponse, référence nullable vers `catalog_tracks`, `musicTrackId` durable, clé historique de la catégorie, copies du titre, de l'artiste et du libellé de catégorie |
| `free_requests` | Envie d'invité : réponse, `musicTrackId` nullable, `text` nullable, copies titre/artiste si structurée, ordre d'ajout ; exactement l'un des deux contenus renseigné |

`name` identifie le titulaire du compte. `artistName` est l'identité artistique publique du DJ : texte obligatoire, 1 à 80 caractères, non unique.

Un morceau global est valide avec un titre et un artiste ; album, pochette, ISRC, durée et provenance externe restent facultatifs. Son identifiant DJEAZ ne dépend d'aucun fournisseur : les identifiants externes vivent dans `music_track_sources`, et un couple `(provider, externalId)` ne désigne qu'un seul morceau. Artistes et albums n'ont pas de tables dédiées au MVP ; la normalisation porte sur l'identité et les métadonnées cohérentes des morceaux.

Une catégorie de catalogue est l'organisation personnelle du DJ (« Cocktail », « Ouverture de bal », « Rap FR »), pas un genre musical ; un genre musical est une métadonnée globale, et un morceau peut en porter plusieurs. Un `musicTrackId` apparaît au plus une fois par catalogue et appartient donc à une seule catégorie : `catalog_tracks` porte `catalogId` pour exprimer cette unicité en base. La cohérence catégorie/catalogue est vérifiée en transaction **et** garantie par PostgreSQL : une clé étrangère composite `catalog_tracks(category_id, catalog_id)` → `catalog_categories(id, catalog_id)`, appuyée sur une contrainte unique `(id, catalog_id)` de `catalog_categories`, interdit à une association de référencer le catalogue A et une catégorie du catalogue B, même en cas de bug applicatif.

IDs métier en UUID ; références utilisateur conformes au schéma Better Auth. Dates techniques en `timestamptz`/UTC ; date d'événement en `date`, sans heure. La distinction `upcoming/past` est calculée en `Europe/Paris` : aujourd'hui reste à venir, sans modifier le statut du sondage.

Contraintes : clés étrangères, dont la clé composite catégorie/catalogue ci-dessus, champs obligatoires, statuts et tranches d'âge contrôlés, unicité `(eventId, secretHash)`, `(responseId, musicTrackId)`, `(catalogId, musicTrackId)` et `(provider, externalId)`, contrainte `CHECK` sur le contenu d'une envie. Aucune suppression de morceau global n'est prévue au MVP : `musicTrackId` est une clé durable. Indexer les clés étrangères et les filtres usuels, notamment propriétaire/date, événement/réponses et la recherche titre/artiste. Catégories, associations et sélections sont validées contre le propriétaire de la session ou de l'événement.

## 5. Bibliothèque musicale globale et fournisseurs

La bibliothèque contient des morceaux normalisés et leurs métadonnées, partagés par tous les DJs et invités ; elle n'appartient à aucun DJ. Un catalogue personnel est un ensemble d'associations vers ces morceaux : 500 DJs ajoutant « September — Earth, Wind & Fire » créent 500 associations vers une seule ligne `music_tracks`. La bibliothèque grandit avec l'usage réel ; aucun taux de résolution locale n'est fixé comme objectif, il pourra devenir une métrique observée.

### Recherche local-first

Toute recherche de morceau, par un DJ ou un invité, suit le même ordre : interroger la bibliothèque DJEAZ ; retourner les résultats locaux pertinents ; en l'absence de résultat satisfaisant, interroger un ou plusieurs fournisseurs externes et afficher leurs candidats ; attendre la sélection explicite de l'utilisateur ; alors seulement normaliser et dédupliquer le morceau choisi, l'enregistrer ou le rattacher dans `music_tracks`, tracer sa provenance dans `music_track_sources`, puis poursuivre l'action (ajout au catalogue, envie). Le critère « résultat satisfaisant » n'est pas un score : aucun seuil de similarité ne déclenche un fournisseur automatiquement ; le déclenchement du repli relève de l'UX et reste à préciser, la piste privilégiée étant une action explicite de l'utilisateur qui ne trouve pas le bon morceau dans les résultats locaux (« Rechercher plus largement »). Les candidats non choisis ne sont jamais enregistrés : « queen boh » peut retourner plusieurs versions, aucune n'entre dans la bibliothèque avant qu'une soit choisie. Cette sélection fait grandir la bibliothèque : davantage de recherches se résolvent localement et moins d'appels externes sont nécessaires.

### Identité et déduplication

Priorités de rapprochement : identifiant externe déjà connu chez le même fournisseur ; MusicBrainz Recording ID ; ISRC comme signal fort ; combinaison normalisée titre/artiste/durée comme signal secondaire. Une similarité textuelle ne fusionne jamais seule deux versions ambiguës : originale, radio edit, remix, remaster et live peuvent être des enregistrements distincts. L'enregistrement est un upsert idempotent protégé par l'unicité `(provider, externalId)` : deux utilisateurs choisissant simultanément le même résultat obtiennent le même morceau global. L'algorithme précis de rapprochement n'est pas figé.

### Import initial contrôlé

La bibliothèque initiale est construite par un **outil d'import dédié**, exécuté volontairement : ni `db:seed`, ni migration, ni Server Action, ni tâche au démarrage, ni étape de CI, ni cron, ni requête web. Cible indicative : 10 à 15 grands genres musicaux × environ 500 à 1 000 candidats populaires par genre, puis déduplication, soit environ 5 000 à 15 000 morceaux uniques ; ce volume n'est pas une contrainte métier. L'outil peut durer des heures ou des jours ; il est idempotent, reprenable, tolérant aux erreurs partielles, respectueux des quotas, trace la provenance et n'écrase pas aveuglément de bonnes métadonnées existantes. Liste des genres, critères de popularité et fournisseurs effectivement utilisés restent à valider.

### Fournisseurs

| Fournisseur | Statut | Usage envisagé |
|---|---|---|
| MusicBrainz | Source principale envisagée | Identité des recordings, titre, artiste, releases/albums, ISRC, identifiants stables |
| ListenBrainz | Source envisagée | Popularité et classements ; sélection des candidats de l'import initial |
| TheAudioDB | Enrichissement potentiel | Métadonnées complémentaires, artwork, recherche complémentaire ; dépend des conditions et du plan retenus à l'implémentation |
| Last.fm | À réévaluer, aucune dépendance | Licence et réutilisation commerciale à clarifier avant toute intégration durable |
| Spotify, Deezer, streaming | Hors architecture | Aucune intégration, aucun compte connecté, aucune lecture ni extrait audio |

Aucun fournisseur n'est tenu pour garanti, gratuit ou définitif ; conditions d'utilisation et quotas sont revalidés avant la production. Une abstraction d'adaptateurs isole chaque fournisseur ; DJEAZ reste utilisable sur sa bibliothèque locale si un fournisseur est indisponible. Rechercher des métadonnées musicales n'est pas s'intégrer à un service de streaming : seule la première activité est dans le périmètre.

### Artwork

Les pochettes sont facultatives : le modèle stocke une URL et sa source, l'existence d'un morceau n'en dépend jamais, et un placeholder DJEAZ remplace toute image manquante ou devenue indisponible. Les pochettes externes ne sont pas des assets DJEAZ : affichage, mise en cache, hotlink ou stockage éventuel respectent les conditions de la source retenue ; aucune copie massive d'images n'est présupposée.

### Appels externes et sécurité

Les fournisseurs sont appelés uniquement côté serveur, jamais depuis le navigateur avec un secret. Une requête externe reçoit les seuls termes nécessaires à la recherche — jamais pseudonyme, session, cookie, événement ou donnée privée —, est validée et bornée, possède un timeout, respecte les limites de débit du fournisseur et échoue proprement sans rendre DJEAZ inutilisable. Les recherches publiques des invités ont leur propre limitation de débit. Réponses brutes et credentials des fournisseurs n'apparaissent ni dans l'interface ni dans les journaux ; les credentials éventuels sont server-only, et leurs variables d'environnement ne sont définies qu'avec l'adaptateur qui les exige.

## 6. Catalogue personnel et conservation des choix

À la création du compte, une opération idempotente crée le catalogue du DJ : `revision = 0`, aucune catégorie, aucun morceau. Une reprise au premier accès privé le crée s'il manque. Aucun catalogue de référence n'est copié, aucune catégorie ni aucun morceau n'est imposé, et un catalogue vide n'est jamais rempli automatiquement ; l'interface invite à « Créer ma première catégorie ». DJEAZ pourra suggérer des noms de catégories sans rien créer.

Le DJ crée, renomme, réordonne et supprime ses catégories ; il recherche des morceaux (§5), les ajoute dans une catégorie, les déplace, les réordonne et les retire. Déplacer un morceau change son classement sans créer de copie. Supprimer une catégorie supprime ses associations après confirmation ; aucune opération du catalogue ne modifie ni ne supprime un morceau global. Chaque mutation s'exécute en transaction sous verrou du catalogue et incrémente `revision`. Tous les événements du DJ utilisent **son catalogue courant**, sans copie ni personnalisation par événement.

Chaque sélection d'invité enregistre côté serveur, au moment du choix, le `musicTrackId`, la clé de la catégorie, le titre, l'artiste et le libellé de catégorie. Ces clés et copies restent indépendantes du catalogue et des métadonnées globales : la référence vers `catalog_tracks` passe à `NULL` lorsque le morceau est retiré ; renommer, déplacer ou supprimer une catégorie, ou faire évoluer les métadonnées globales, ne modifie pas les réponses enregistrées. Les anciens choix restent lisibles et comptabilisables.

Lors d'une modification de réponse, les choix historiques conservés gardent leur copie ; un morceau retiré du catalogue reste visible, marqué comme retiré, peut être retiré de la réponse mais ne peut plus y être ajouté via le catalogue. Une révision de catalogue obsolète entraîne un rafraîchissement et une nouvelle validation, sans perte silencieuse de la sélection.

## 7. Événement et réponse invité

Transitions autorisées : **`draft → open → closed`**. Le DJ ouvre et ferme manuellement ; aucune réouverture au MVP. En brouillon, le sondage est indisponible ; fermé, il affiche une confirmation de clôture et refuse toute écriture. La suppression, après confirmation, est définitive et cascade vers réponses, sélections et demandes ; elle ne touche ni au catalogue ni à la bibliothèque.

L'invité fournit un pseudonyme et une tranche d'âge : `<18`, `18–25`, `26–35`, `36–45`, `46–55`, `56–65`, `66+`. Aucun email. Aucune limite métier au nombre de morceaux ni de demandes ; les tailles de textes et de requêtes restent bornées techniquement.

Deux parcours composent une réponse. La **sélection principale** parcourt uniquement le catalogue du DJ : ses catégories, puis les morceaux qu'il y a placés, vers le panier de l'invité ; le DJ reste maître des propositions mises en avant. « **Soumettre une envie** » accueille ce qui n'y figure pas : recherche local-first dans la bibliothèque DJEAZ, repli vers les fournisseurs externes, sélection explicite du bon morceau — enregistré alors dans la bibliothèque s'il n'y était pas — qui devient une envie structurée portant son `musicTrackId` ; un repli en texte libre reste toujours disponible pour un mashup privé, un remix introuvable, une version locale, un titre obscur ou un morceau non identifié. Une envie, structurée ou libre, n'est jamais ajoutée au catalogue du DJ : elle reste une demande de l'invité.

Avant la première soumission, le serveur émet un secret aléatoire de 32 octets dans un cookie persistant propre à l'événement, `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, valable 180 jours. Seule son empreinte SHA-256 est enregistrée en base. Ce secret permet de relire et modifier uniquement cette réponse tant que le sondage est ouvert. Sa perte, son expiration ou un autre navigateur créent une nouvelle participation ; aucune identité forte n'est promise.

La première soumission et ses répétitions utilisent la même clé de participation. Une transaction enregistre la réponse complète : chaque morceau sélectionné doit appartenir au catalogue courant du propriétaire de l'événement et chaque envie structurée référencer un morceau global existant ; une nouvelle soumission remplace les choix et demandes, sans ajouter de participant. Une version de réponse détecte les modifications concurrentes. Fermeture, suppression et soumission coordonnent leurs accès par verrou sur l'événement ; les mutations du catalogue et les soumissions verrouillent le catalogue pour vérifier sa révision. Ordre constant : événement, catalogue, réponse.

## 8. Résultats et état de l'interface

Les statistiques sont calculées en SQL depuis les réponses validées, sans table de compteurs ni tâche planifiée :

- participants = nombre de réponses ; votes d'un morceau = réponses distinctes par `musicTrackId` historique ;
- popularité d'une catégorie du catalogue = participants distincts ayant choisi au moins un de ses morceaux, sur la clé historique de catégorie ; un participant compte une fois par catégorie ;
- part des préférences = sélections de la catégorie / total des sélections ; âge = réponses par tranche ;
- tendances communes = morceaux et catégories partagés, sans recommandation automatique ;
- envies listées séparément, structurées (regroupables par `musicTrackId`) et libres ; une envie ne compte jamais comme un vote pour un morceau du catalogue.

Les genres musicaux globaux ne sont pas mêlés aux catégories du DJ dans ces statistiques. Les regroupements utilisent les clés historiques ; le libellé affiché est la copie la plus récemment enregistrée pour cette clé. Les dénominateurs sont explicités et un ensemble vide vaut zéro.

Panier en état React local ; réponses soumises en base. Aucun cache partagé des sessions/réponses/résultats privés ; rafraîchir les vues après mutation. Aucun temps réel.

## 9. Exécution et exploitation

Runtime **Node.js**, Drizzle avec `node-postgres` (`pg`), connexion Neon poolée et pool borné par instance ; les opérations métier utilisent des transactions interactives. Better Auth utilise l'adaptateur Drizzle sur la même base.

Développement, tests, previews et production ont des bases et secrets séparés. PostgreSQL local via Docker convient au développement et à la CI ; les previews utilisent des données synthétiques. Configuration serveur centralisée et validée : `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Aucun secret sous `NEXT_PUBLIC_*`.

`db:seed` reste synthétique, petit, idempotent et sans accès réseau ; il ne charge jamais la bibliothèque réelle, alimentée uniquement par l'outil d'import de §5. Tests et CI n'accèdent jamais au réseau public : adaptateurs de fournisseurs factices et morceaux synthétiques.

### CI/CD par tag

GitHub héberge le dépôt : `develop` sert au développement ; `main` contient le code intégré, prêt à être livré. Les merges et pushes directs sont autorisés, sans PR obligatoire. La production correspond au **dernier tag déployé avec succès**, et peut donc différer de la tête de `main`.

| Workflow cible | Déclenchement | Traitement |
|---|---|---|
| `.github/workflows/ci.yml` | Push sur `develop` ou `main` | Installation avec lockfile figé, format, lint, types, tests et build ; aucun déploiement de production |
| `.github/workflows/release.yml` | Publication d'un nouveau tag `vX.Y.Z` sur GitHub (`push.tags: ['v*']`, puis validation du format) | Vérification du tag et de son appartenance à l'historique de `main`, contrôles sur son commit exact, build de production, migrations, déploiement Vercel |

Le workflow de release extrait le **commit du tag**, jamais la tête courante de `main`. Il construit l'artefact avant de migrer, puis déploie ce même artefact après réussite des migrations. Les releases sont sérialisées dans un groupe de concurrence commun, sans annulation d'une opération en cours. Un contrôle ou une migration en échec bloque le déploiement ; le build ne migre jamais la base. Les migrations restent compatibles avec le code encore déployé.

Vercel : configurer **Root Directory = `djeaz`** et désactiver les déploiements Git automatiques de `main`. Des previews de `develop` peuvent rester actives. Les commandes pnpm s'exécutent dans `djeaz/` ; les commandes Vercel CLI depuis la racine du dépôt, en respectant le Root Directory configuré. Les secrets de livraison sont réservés à l'environnement GitHub `production`, sans validation manuelle obligatoire.

Les écritures publiques, les recherches publiques et l'authentification disposent d'une limitation de débit persistante en PostgreSQL, par empreinte temporaire d'adresse IP et opération, avec expiration et purge opportuniste ; un compteur mémoire seul est insuffisant. Entrées Zod, texte libre rendu sans HTML, origines contrôlées, réponses privées non indexables et journaux sans secrets, réponses personnelles ni réponses brutes de fournisseurs. Une erreur inattendue reçoit un identifiant de diagnostic.

## Références

Sources produit : `PROJECT.md`, `STACK.md`, arborescence fournie et arbitrages validés. Références techniques : [sécurité Next.js](https://nextjs.org/docs/app/guides/data-security), [Drizzle/PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [adaptateur Better Auth](https://better-auth.com/docs/adapters/drizzle), [API MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API), [ListenBrainz](https://listenbrainz.readthedocs.io/), [déclencheurs GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Vercel avec GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel), [Root Directory Vercel](https://vercel.com/docs/builds/configure-a-build). Ce document prescrit une architecture cible ; `ROADMAP.md` précise l'état réellement implémenté, dont l'ancien modèle de catalogue (`catalogs.seedVersion`, `genres`, `tracks`) appliqué avant le pivot et migré en P2.5.
