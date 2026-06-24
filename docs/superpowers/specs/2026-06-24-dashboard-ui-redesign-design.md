# Design – Refonte UI du dashboard : page unique + thème Slate & Cyan

**Date :** 2026-06-24
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

Le dashboard React (`dashboard/`, React 19 + Chakra UI + Chart.js) a aujourd'hui
deux pages séparées : `LivePage` (cartes capteurs temps réel) et `ChartsPage`
(`HistoricalChart`, ~1000 lignes), reliées par une nav dans le `Header`. Aucun
thème Chakra personnalisé n'est configuré et le mode sombre n'est pas réellement
en place (pas de `ColorModeScript`, pas de bouton de bascule).

Objectif : **polish visuel + responsive** (pas de nouvelle fonction métier),
**fusion des deux pages en une seule**, priorité au thème / mode sombre.
Décisions validées en brainstorming via maquettes (companion visuel).

## Objectifs

1. **Fusionner Live + Graphiques en une page unique** : les vignettes en haut
   servent aussi de **sélecteurs**, le graphe combiné en dessous.
2. **Sélection multiple** : cliquer une vignette l'ajoute/retire du graphe ;
   plusieurs pièces peuvent être comparées simultanément.
3. Thème **Slate & Cyan** cohérent, **clair ET sombre**, mode **auto (système)**
   au 1er chargement + **bouton de bascule** mémorisé.

Hors périmètre : nouvelles fonctions (alertes, export, comparaison avancée…),
refonte du backend, changement de librairie de graphes.

## Palette (Slate & Cyan)

| Rôle | Sombre | Clair |
|---|---|---|
| Fond page | `#0f172a` | `#f1f5f9` |
| Carte / surface | `#1e293b` | `#ffffff` (+ ombre légère) |
| Bordure | `#334155` | `#e2e8f0` |
| Texte principal | `#f1f5f9` | `#0f172a` |
| Texte secondaire | `#94a3b8` | `#64748b` |
| Accent (cyan) | `#22d3ee` | `#0891b2` |
| Segment actif / boutons | `#0891b2` | `#0891b2` |

**Couleurs par pièce** (pour vignette sélectionnée + courbe dans le graphe) :
palette qualitative assignée de façon stable par pièce, p. ex. cyan `#22d3ee`,
indigo `#818cf8`, ambre `#fb923c`, émeraude `#34d399`, rose `#f472b6`… Une pièce
garde sa couleur entre la vignette et la courbe.

## Thème & mode couleur

- `dashboard/src/theme/index.js` (**créer**) : `extendTheme` avec
  `config: { initialColorMode: 'system', useSystemColorMode: false }` (auto au
  1er chargement, choix manuel ensuite persistant), `semanticTokens` pour les
  rôles ci-dessus (clair/sombre), `fonts` système, `styles.global` pour le fond.
- `dashboard/src/index.js` : thème passé à `ChakraProvider` +
  `<ColorModeScript initialColorMode={theme.config.initialColorMode} />`.
- `Header` : bouton de bascule clair/sombre (☀️ / 🌙) via
  `useColorMode()` / `toggleColorMode`, à droite. La **navigation entre pages
  disparaît** (page unique) ; le header ne garde que le titre + le bouton.

## Page unique fusionnée

Structure de haut en bas :

### 1. Grille de vignettes-sélecteurs

- Une vignette par capteur, **cliquable** : clic = ajoute/retire la pièce du
  graphe (toggle).
- **État sélectionné** : contour de la couleur de la pièce + léger halo
  (`box-shadow`). **Pas de coche/badge** dans le coin.
- **État non sélectionné** : carte atténuée (opacité réduite) avec une
  indication « + ajouter ».
- Layout de carte (validé, maquette v6) :
  - en-tête (sans séparateur) : pastille de couleur + nom de pièce à gauche,
    statut à droite (en ligne / retard / hors ligne) ;
  - deux blocs **égaux** séparés par une barre verticale **entre les deux
    uniquement** : 🌡️ / valeur / « Température » et 💧 / valeur / « Humidité »
    (icône en haut, chiffre ~24–28px gras, label petit majuscules) ;
  - largeur ≈ 230–310px ; grille responsive (plusieurs par ligne desktop, une
    colonne mobile).
- Au moins une pièce sélectionnée par défaut (p. ex. toutes, ou la dernière vue)
  pour que le graphe ne soit jamais vide au chargement.

### 2. Contrôles du graphe

- **Sélecteur de mesure** segmenté : `🌡️ Température | 💧 Humidité` — une mesure
  à la fois, affichée pour **toutes** les pièces sélectionnées (évite la
  surcharge de courbes).
- **Période** segmentée : `1j / 3j / 1 sem / 1 mois` (remplace le menu
  déroulant ; segment actif en cyan).
- **Navigation de date** `‹ … ›`.
- Sur mobile : contrôles en pleine largeur, empilés.

### 3. Graphe combiné

- Une **courbe par pièce sélectionnée**, dans la couleur de la pièce, pour la
  mesure choisie.
- **Légende** listant les pièces sélectionnées (couleur + nom + valeur courante).
- Grille discrète, zoom/pan tactile conservé (chartjs-plugin-zoom).
- Moyenne mobile : conservée si une seule pièce est sélectionnée ; masquée en
  comparaison multi-pièces pour rester lisible.

### État applicatif

- La liste des pièces sélectionnées et la mesure courante vivent dans l'état de
  la page (ou le `DataContext`). Le graphe est dérivé de cette sélection.
- L'attribution couleur↔pièce est déterministe (index stable de la pièce).

## Fichiers concernés (indicatif)

| Fichier | Changement |
|---|---|
| `dashboard/src/theme/index.js` | **Créer** le thème (palette, config color mode). |
| `dashboard/src/index.js` | Brancher le thème + `ColorModeScript`. |
| `dashboard/src/App.js` | **Supprimer la route `/charts`** ; une seule page. |
| `dashboard/src/components/Header.js` | Bouton clair/sombre ; retrait de la nav inter-pages. |
| `dashboard/src/pages/` | Page unique fusionnée (vignettes-sélecteurs + graphe). `LivePage`/`ChartsPage` fusionnées ; `ChartsPage` supprimée ou vidée. |
| `dashboard/src/components/` (vignette) | `DeviceCard` : layout v6 + état sélectionné/non sélectionné + `onClick` toggle + couleur de pièce. |
| `dashboard/src/components/charts/*` | Graphe multi-pièces piloté par la sélection ; sélecteur de mesure + période segmentés ; allègement du composant ~1000 lignes en sous-composants (au moins : barre de contrôles, légende/graphe). |

## Risque / prérequis connu

⚠️ **Le build du dashboard React plante en local** (bloqué à 0 % CPU au
démarrage de `react-scripts build` — voir [[techtemp-deployment]]). À diagnostiquer
et résoudre **avant** de pouvoir builder/déployer (vérifier si `npm start` en dev
fonctionne). À traiter en première tâche du plan, ou en prérequis.

## Tests / validation

- `react-scripts` (Jest + React Testing Library disponibles). Tests de rendu /
  comportement à ajouter ou adapter :
  - `DeviceCard` : affiche température/humidité/labels/statut ; `onClick`
    bascule l'état sélectionné.
  - Sélection : cliquer une vignette ajoute/retire sa courbe (la sélection pilote
    bien les séries du graphe) ; sélecteur de mesure bascule température/humidité.
  - Bouton clair/sombre : change `colorMode`.
- Validation visuelle finale dans le vrai navigateur : clair + sombre, desktop +
  mobile, avec 1 et plusieurs pièces sélectionnées.
