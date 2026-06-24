# Design – Refonte UI du dashboard (thème Slate & Cyan, clair/sombre)

**Date :** 2026-06-24
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

Le dashboard React (`dashboard/`, React 19 + Chakra UI + Chart.js) a deux pages :
`LivePage` (cartes capteurs temps réel) et `ChartsPage` (`HistoricalChart`,
~1000 lignes). Aucun thème Chakra personnalisé n'est configuré et le mode sombre
n'est pas réellement en place (pas de `ColorModeScript`, pas de bouton de
bascule). L'objectif est un **polish visuel + responsive** (pas de nouvelle
fonctionnalité métier), priorité à la **page Graphiques** et au **thème / mode
sombre**.

Décisions validées en brainstorming via maquettes (companion visuel).

## Objectifs

1. Thème visuel cohérent **Slate & Cyan**, en **clair ET sombre**, mode **auto
   (suit le système)** au premier chargement + **bouton de bascule** mémorisé.
2. Cartes capteurs (LivePage) redessinées.
3. Page Graphiques redessinée : contrôles plus clairs/tactiles, résumé compact,
   graphe dans la palette.

Hors périmètre : nouvelles fonctions (alertes, export, comparaison…), refonte du
backend, changement de librairie de graphes.

## Palette (Slate & Cyan)

| Rôle | Sombre | Clair |
|---|---|---|
| Fond page | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) |
| Carte / surface | `#1e293b` (slate-800) | `#ffffff` (+ ombre légère) |
| Bordure | `#334155` (slate-700) | `#e2e8f0` (slate-200) |
| Texte principal | `#f1f5f9` | `#0f172a` |
| Texte secondaire | `#94a3b8` (slate-400) | `#64748b` (slate-500) |
| Accent / courbe temp | `#22d3ee` (cyan-400) | `#0891b2` (cyan-600) |
| Accent humidité | `#818cf8` (indigo-400) | `#6366f1` (indigo-500) |
| Statut en ligne | `#22d3ee` | `#0891b2` |

Le cyan est assombri en mode clair pour rester lisible sur fond blanc.

## Thème & mode couleur

- Créer un thème Chakra via `extendTheme` dans `dashboard/src/theme/index.js` :
  - `config: { initialColorMode: 'system', useSystemColorMode: false }`
    (= auto au 1er chargement, puis le choix manuel persiste).
  - `colors`, `semanticTokens` pour les rôles ci-dessus (clair/sombre), `fonts`
    (système : `-apple-system, system-ui, sans-serif`), `styles.global` pour le
    fond de page.
- `dashboard/src/index.js` : passer le thème à `ChakraProvider` et ajouter
  `<ColorModeScript initialColorMode={theme.config.initialColorMode} />` (anti
  flash, persistance).
- `Header` : ajouter un bouton de bascule clair/sombre (icône ☀️ / 🌙) utilisant
  `useColorMode()` / `toggleColorMode`, placé à droite de la navigation.

## Carte capteur (LivePage / `DeviceCard`)

Layout validé (maquette v6) :

- **En-tête** (ligne propre, sans séparateur) : nom de la pièce à gauche, statut
  à droite (pastille colorée + « En ligne / Retard / Hors ligne »).
- **Données** : deux blocs **de taille égale, sur la même ligne**, séparés par
  une barre verticale **entre les deux blocs uniquement** :
  - bloc gauche : 🌡️ (icône) / valeur (ex. `28.5°`) / label « Température »
  - bloc droite : 💧 / valeur (ex. `67%`) / label « Humidité »
  - icône en haut, chiffre au centre (≈28px, gras), label en petit dessous
    (≈11px, majuscules, gris).
- **Mini-courbe** (sparkline) sous les données, dans l'accent cyan.
- **Horodatage** discret en bas à droite (« il y a 2 min »).
- **Largeur de carte ≈ 310px** ; grille responsive (`flex-wrap` /
  `SimpleGrid minChildWidth≈310px`) : plusieurs cartes par ligne sur desktop, une
  colonne sur mobile.
- Les seuils de couleur existants (statut en ligne/retard/hors ligne, code
  couleur température chaud/froid) sont conservés et adaptés aux deux modes.

## Page Graphiques (`ChartsPage` / `HistoricalChart`)

Layout validé (maquettes charts-page + résumé Option 1) :

- **Barre de contrôles** regroupée, responsive :
  - sélecteur de capteur (📍 + nom),
  - **période en boutons segmentés** : `1j / 3j / 1 sem / 1 mois` (segment actif
    en cyan) — remplace le menu déroulant actuel,
  - navigation de date `‹ … ›`.
  - Sur mobile : les contrôles passent en pleine largeur, empilés.
- **Résumé compact (Option 1)** : deux pastilles arrondies au-dessus du graphe,
  calées à gauche — `🌡️ min · moy · max` et `💧 min · moy · max` (largeur auto,
  pas de bandeau pleine largeur), avec une légende « min · moy · max ».
- **Graphe** dans la palette : température cyan, humidité indigo, moyenne mobile
  en pointillés gris, grille discrète, légende. Zoom/pan tactile conservé.
- Le composant `HistoricalChart` étant volumineux (~1000 lignes), extraire au
  passage les sous-unités qui servent ce redesign (au minimum : la barre de
  contrôles et le bandeau de résumé en composants dédiés). Pas de refonte de la
  logique de données au-delà de ce qui sert le polish.

## Fichiers concernés (indicatif)

| Fichier | Changement |
|---|---|
| `dashboard/src/theme/index.js` | **Créer** le thème (`extendTheme`, palette, config color mode). |
| `dashboard/src/index.js` | Brancher le thème + `ColorModeScript`. |
| `dashboard/src/components/Header.js` | Bouton de bascule clair/sombre. |
| `dashboard/src/pages/LivePage.js` | Refonte `DeviceCard` (layout v6) + grille responsive. |
| `dashboard/src/components/charts/*` | Barre de contrôles segmentée, pastilles résumé, palette ; extraction de sous-composants. |

## Risque / prérequis connu

⚠️ **Le build du dashboard React plante en local** (bloqué à 0 % CPU au
démarrage de `react-scripts build` — voir [[techtemp-deployment]]). Ce blocage
doit être diagnostiqué et résolu **avant** de pouvoir builder/déployer la refonte
(le développement avec `npm start` peut éventuellement fonctionner, à vérifier).
À traiter en première tâche du plan d'implémentation, ou en prérequis.

## Tests / validation

- Le dashboard utilise `react-scripts` (Jest + React Testing Library
  disponibles). Ajouter/adapter des tests de rendu pour `DeviceCard` (présence
  température/humidité/labels, statut) et le bouton de bascule (changement de
  `colorMode`).
- Validation visuelle finale dans le vrai navigateur, en clair et sombre, sur
  une largeur desktop et mobile.
