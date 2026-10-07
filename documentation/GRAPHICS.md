# DJEAZ — Direction artistique

> Référence textuelle à conserver dans `documentation/GRAPHICS.md`, en complément de `charte-graphique-djeaz.pdf` et des choix validés. Elle guide les agents sans figer chaque écran.

## 1. Intention et deux expériences

Une application musicale chaleureuse, reconnaissable et soignée jusque dans ses détails. Donner du caractère par la composition, les formes et les interactions ; conserver des parcours simples.

| Espace | Direction |
|---|---|
| **Site vitrine et sondage public** | Très colorés, festifs, joueurs et légèrement décalés. Aplats affirmés, compositions expressives, mascotte et touches musicales. Le sondage conserve des listes faciles à parcourir. |
| **Dashboard DJ** | Sobre, professionnel et confortable pour travailler. Surfaces calmes, hiérarchie claire, couleurs ciblées et animations mesurées. |
| **Socle commun** | Palette, typographie, logo, icônes et composants cohérents ; intensité différente, pas deux marques distinctes. |

Éviter les compositions génériques interchangeables, les décorations gratuites et l'accumulation d'effets. La qualité recherchée repose sur cohérence, lisibilité, fluidité et finitions.

## 2. Palette et thèmes

| Couleur | HEX | Rôle |
|---|---|---|
| Indigo | `#5755C9` | Actions principales, navigation active et grandes zones de marque publiques |
| Abricot | `#FFBD99` | Accents chaleureux, encarts, illustrations et moments de célébration |
| Blanc cassé | `#FAF9F6` | Fond clair, textes sur indigo et respirations |
| Charbon | `#252631` | Textes principaux et fond du thème sombre |

Prévoir **thèmes clair et sombre** pour les deux expériences, avec préférence système initiale et choix utilisateur mémorisé. En sombre, distinguer fond, surfaces et bordures ; conserver les accents festifs côté public.

Centraliser les tokens sémantiques : fond, surface, texte, texte secondaire, action, sélection, bordure, focus et états. Les nuances et couleurs de succès/erreur/avertissement complètent la palette sans devenir de nouvelles couleurs de marque.

Combinaisons de référence : texte blanc cassé sur indigo ; charbon sur abricot ou fond clair. Vérifier chaque état et thème : l'abricot sur fond clair et l'indigo sur charbon ne conviennent pas au texte courant. Adapter les nuances fonctionnelles en sombre. Viser WCAG AA : **4,5:1 pour le texte courant**, **3:1 pour le grand texte au sens WCAG**. Ne jamais communiquer un état par la couleur seule.

## 3. Typographie et identité

**Plus Jakarta Sans** pour toute l'interface : 400 pour les textes, 500 pour les contrôles, 600–700 pour titres et chiffres. Repères : texte courant autour de 16 px, interligne 1,5 ; titres publics plus expressifs et fluides selon l'écran.

Le lettrage gonflé reste propre au logo. Préserver proportions, couleurs et lisibilité ; employer les variantes fournies selon le fond. Réutiliser les assets existants et signaler toute déclinaison manquante plutôt que fabriquer une approximation.

## 4. Formes, relief et éléments graphiques

Arrondis distinctifs mais maîtrisés : repères de 12 px pour les champs, 16–20 px pour les cartes, pilules pour certains boutons et filtres. Utiliser une échelle d'espacement cohérente, basée sur des multiples de 4 px.

Assumer le relief : ombres lisibles et volumes doux, plus présents côté public, atténués dans le dashboard. Réserver la mini-3D aux illustrations ; les contrôles restent immédiatement compréhensibles.

Côté public, exploiter ponctuellement courbes, formes organiques, décalages et motifs musicaux. Garder les textes alignés et les zones de lecture calmes. Icônes en contour, arrondies, homogènes et suffisamment présentes ; accompagner d'un libellé les actions peu évidentes.

## 5. Mascotte et mouvement

Le fantôme abricot au casque indigo est une signature récurrente : accueil, introductions, états vides et confirmations. Préserver son apparence et sa silhouette ; limiter sa présence dans les listes et statistiques.

Créer du plaisir par des réactions claires : morceau sélectionné, panier actualisé, progression et confirmation. Rebond léger, apparition et célébration sont possibles côté public ; préférer des transitions discrètes dans le dashboard.

Repères ajustables : 150–250 ms pour les contrôles, 250–450 ms pour les apparitions. Éviter les animations simultanées envahissantes, les délais artificiels et les sons automatiques. Respecter `prefers-reduced-motion` et conserver tout retour utile sans mouvement. Les animations ne doivent ni déplacer la cible d'un clic ni dégrader la fluidité sur téléphone.

## 6. Responsive : priorité de conception

- **Sondage conçu d'abord pour téléphone** : navigation simple, sélection évidente, commandes tactiles confortables — cible recommandée de 44 px — et aucun usage dépendant du survol.
- Garder panier et validation accessibles sans masquer les morceaux, le focus ou le clavier virtuel ; tenir compte des zones sûres de l'écran.
- Employer des grilles et dimensions fluides. Adapter colonnes, espacements et titres à la largeur utile ; ne pas réduire mécaniquement une maquette ordinateur.
- Dashboard : sidebar ancrée au bord gauche du viewport, indépendante du centrage du contenu et du zoom. Quand l'espace diminue, la compacter puis utiliser un tiroir ouvrant depuis la gauche.
- Éviter chevauchements, contenu coupé et défilement horizontal global. Les tableaux nécessitant deux dimensions peuvent défiler dans leur propre conteneur ; graphiques et titres longs restent exploitables.
- Ne jamais bloquer le zoom. Vérifier redimensionnement et zoom avant de considérer un écran terminé.

## 7. Critères de finition

Vérifier les deux espaces en clair/sombre, notamment aux largeurs 320, 390, 768 et 1440 px, puis au zoom 80 %, 125 %, 150 % et 200 %. Vérifier aussi le reflow équivalent à 320 px — par exemple 400 % depuis un viewport de 1280 px — sans perte de fonctionnalité.

Contrôler textes longs, clavier et focus, sélection, chargement, vide, erreur et succès. Aucun élément décoratif ne doit gêner une action. Chaque nouvel écran doit conserver une signature DJEAZ et une fonction immédiatement lisible.

## Références

Sources de direction : charte PDF et arbitrages du porteur du projet. Références techniques : [contraste WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [reflow WCAG](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [réduction des animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

