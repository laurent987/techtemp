# Design – Vignettes : Extérieur + statut + carte recto/verso (flip)

**Date :** 2026-06-25
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

Le dashboard (page unique) affiche une vignette par capteur (`SensorCard`) :
en-tête (nom + statut texte « En ligne »), deux blocs 🌡️/💧, « il y a X min ».
Les vignettes pilotent un graphe combiné (`MultiRoomChart`) ; l'extérieur
(Open-Meteo) n'apparaît que comme **courbe overlay toujours affichée**.

On veut : (1) une **vignette « Extérieur »** (sélectionnable comme une pièce),
(2) un **statut en point coloré**, (3) une **carte recto/verso (flip)** dont le
dos porte les valeurs dérivées (ressenti, point de rosée, min/max du jour).

Décisions validées en brainstorming via maquettes. **Frontend uniquement** (les
données existent déjà : `useOutdoorWeather`, aggregation `bucket=day`).
Redéploiement dashboard à la fin.

## Décisions validées

### 1. Vignette « Extérieur »
- **En 1ʳᵉ position** de la grille, avant les pièces.
- Nom **« Extérieur »** (sans émoji 🌤️), **accent gris `#94a3b8`** (couleur de sa
  courbe), **même design** que les pièces.
- **Sélectionnable** comme une pièce, **cochée par défaut**. La **décocher retire
  la courbe extérieure** du graphe (l'overlay suit la sélection, au lieu d'être
  toujours affiché).
- Données du recto : température + humidité **extérieures actuelles** (Open-Meteo,
  modèle ICON-D2, cohérent avec le graphe).

### 2. Statut en point coloré
- Un **point** à gauche du nom : 🟢 en ligne · 🟠 retard · 🔴 hors ligne
  (seuils actuels : ≤10 min, ≤30 min, au-delà).
- **Suppression du texte « En ligne »** dans le coin haut-droite (libère la place
  pour le bouton flip).
- Conséquence assumée : la couleur de la pièce n'est plus portée par ce point ;
  elle reste sur le **contour** (carte sélectionnée) + la courbe du graphe.

### 3. Carte recto/verso (flip)
- **Hauteur fixe** identique pour toutes (calée sur le dos, le plus chargé) →
  **aucun décalage de grille** au flip. Le recto, plus dépouillé, a son contenu
  **centré verticalement**.
- **Largeur ~300 px, hauteur ~185 px** (ratio ≈ 1,6:1, à conserver si
  redimensionnement). Grille responsive : 1 colonne en mobile.
- **Recto** : 🌡️ Température + 💧 Humidité (2 blocs), **bouton ⓘ** en haut-droite
  (déclenche le flip), « il y a X min » en bas à droite.
- **Verso** (après flip) : titre « <pièce> · détails », puis
  - 🥵 **Ressenti** (humidex) + qualificatif (ex. « lourd »), **coloré** selon le
    confort (vert / orange / rouge) ;
  - 💧 **Point de rosée** ;
  - 🌡️ **Aujourd'hui** : min–max température ;
  - 💧 **Aujourd'hui** : min–max humidité ;
  - un **↩** (ou le ⓘ) pour revenir au recto.
- **Animation flip** via `framer-motion` (déjà présent).
- ⚠️ Le clic sur la carte **bascule la sélection** (in/out du graphe) ; le **flip
  doit donc se déclencher uniquement par le ⓘ / ↩** (`stopPropagation`), jamais
  par un clic sur le corps de la carte.

### Hors périmètre (reporté)
- Badge **« Aérer ? »** (comparaison point de rosée intérieur ↔ extérieur) :
  reporté — la règle (rafraîchir vs assécher) mérite son propre cadrage. Le verso
  est conçu pour l'accueillir plus tard.

## Données & calculs nécessaires

- **Ressenti (humidex)** et **point de rosée** : fonctions **pures** à partir de
  (T, HR) → nouveau module testable `dashboard/src/lib/comfort.js`
  (`dewPoint(tempC, rhPct)`, `humidex(tempC, rhPct)`, + un `comfortLabel`/couleur
  pour l'humidex).
- **Min/max du jour** par capteur : via l'endpoint d'agrégation existant
  (`GET /devices/:uid/readings?bucket=day` sur la journée courante → fournit
  `temperature_min/max`, `humidity_min/max`). Pour l'Extérieur : min/max calculés
  sur les points horaires Open-Meteo du jour.
- **Extérieur « maintenant »** : ajouter un helper météo (ex.
  `getCurrentOutdoor()`) utilisant l'endpoint `current` d'Open-Meteo (modèle
  ICON-D2), renvoyant `{ temperature, humidity }`.

## Composants concernés (indicatif)

| Fichier | Changement |
|---|---|
| `dashboard/src/lib/comfort.js` (créer) | `dewPoint`, `humidex`, libellé/couleur de confort. Pur, testé. |
| `dashboard/src/services/weather.service.jsx` | `getCurrentOutdoor()` (temp+hum actuelles, ICON-D2). |
| `dashboard/src/components/SensorCard.jsx` | Point statut (retrait texte) ; bouton ⓘ ; **flip** recto/verso ; hauteur fixe / largeur ~300 ; contenu verso. Si le composant grossit trop → extraire `SensorCardBack`. |
| `dashboard/src/pages/DashboardPage.jsx` | Injecter une **vignette Extérieur en 1ʳᵉ** ; intégrer l'extérieur dans la sélection (id dédié, coché par défaut) ; fournir min/max + données dérivées aux cartes. |
| `dashboard/src/hooks/useChartSelection.jsx` | Gérer l'id « extérieur » comme un élément sélectionnable (coché par défaut, comme les pièces). |
| `dashboard/src/components/charts/MultiRoomChart.jsx` | L'overlay extérieur s'affiche **uniquement si l'Extérieur est sélectionné** (au lieu de toujours). |

## Tests

**Purs (Vitest) :**
- `comfort.js` : `dewPoint(28, 75) ≈ 23,2` ; `humidex(28, 75) ≈ 38` (signatures en `(tempC, rhPct)`) ; libellé/couleur de confort par paliers.
- Sélection : « extérieur » coché par défaut ; le décocher le retire de la liste qui pilote le graphe.

**Composant (Vitest + Testing Library) :**
- `SensorCard` : affiche le point statut (pas de texte « En ligne ») ; un clic sur **ⓘ** montre le verso (ressenti, point de rosée, min/max) **sans** déclencher la sélection ; un clic sur le **corps** bascule la sélection sans flipper.
- `DashboardPage` : la 1ʳᵉ vignette est « Extérieur » ; décocher l'Extérieur retire sa série du graphe (chart mocké).

**Validation visuelle finale** : grille alignée (hauteur fixe, aucun saut au flip), clair + sombre, desktop + mobile.

## Phasage suggéré (pour le plan)
1. `comfort.js` (purs) + `getCurrentOutdoor()`.
2. Vignette **Extérieur** + sélection (overlay piloté par la sélection).
3. **Statut en point** + bouton ⓘ + **flip** recto/verso + contenu du dos + hauteur/largeur fixes.

## Déploiement
Frontend ; redéploiement dashboard via `deploy-robust-pi.sh … --with-dashboard`
**depuis la racine du repo**, groupé à la fin. Voir [[techtemp-deployment]].
