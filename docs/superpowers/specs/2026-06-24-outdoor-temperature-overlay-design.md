# Design – Courbe température/humidité extérieure sur le graphe

**Date :** 2026-06-24
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

L'ancien graphe (`HistoricalChart`, supprimé lors de la refonte) affichait un
overlay météo extérieure via Open-Meteo. Le nouveau `MultiRoomChart` ne l'a pas
repris. On le remet. Le branchement existe déjà :

- `src/services/weather.service.jsx` : `getOutdoorWeather(start, end)` → Open-Meteo
  (Leuven par défaut, configurable via `VITE_WEATHER_LAT/LON/TZ`), renvoie
  `[{ timestamp, temperature, humidity }]` horaire, trié chronologiquement.
- `src/contexts/DataContext.jsx` : `useOutdoorWeather(startDate, endDate, enabled=true)`
  → `{ data, loading, error }`.

Périmètre : **frontend uniquement**. Redéploiement dashboard à la fin.

## Décisions (validées)

- La courbe extérieure est **toujours affichée** (pas de bouton).
- Elle **suit le sélecteur de mesure** : température extérieure quand 🌡️ est
  actif, humidité extérieure quand 💧.

## Design

1. **Données** : `MultiRoomChart` appelle `useOutdoorWeather(period.start,
   period.end, true)`. En cas d'erreur (Open-Meteo injoignable), `data` reste
   `[]` → la courbe n'apparaît pas, le reste du graphe fonctionne normalement
   (échec silencieux).

2. **Granularité alignée sur l'intérieur** : l'extérieur est horaire. Pour rester
   cohérent et léger, on l'agrège sur le **même bucket** que l'intérieur :
   - bucket `raw` ou `hour` → on garde les points horaires tels quels ;
   - bucket `day` (3/6/12 mois) → on **moyenne par jour** (sinon ~8760 points sur
     un an).
   Helper pur `downsampleOutdoor(rows, bucket)` dans `chartData.js`, testé.

3. **Courbe distincte** : ajoutée par `buildDatasets` via un paramètre optionnel
   `outdoorRows`. Style : ligne **pointillée**, gris neutre `#94a3b8`
   (`borderDash: [5, 4]`), `pointRadius: 0`, **pas de bande min/max**, libellé
   **« Extérieur »**. Valeur = mesure courante (`temperature` ou `humidity`).
   Visible dans la légende (ce n'est pas une série `min`/`max`).

4. **Pas de toggle** : la courbe est systématiquement construite dès que des
   données extérieures sont disponibles.

## Fichiers concernés

| Fichier | Changement |
|---|---|
| `dashboard/src/components/charts/chartData.js` | Ajouter `downsampleOutdoor(rows, bucket)` ; `buildDatasets` accepte `outdoorRows` et ajoute la série « Extérieur ». |
| `dashboard/src/components/charts/MultiRoomChart.jsx` | Appeler `useOutdoorWeather`, downsampler selon le bucket, passer `outdoorRows` à `buildDatasets`. |

## Tests (Vitest, helpers purs)

- `downsampleOutdoor` : bucket `day` → moyenne par jour (n points/jour → 1) ;
  bucket `raw`/`hour` → inchangé.
- `buildDatasets` avec `outdoorRows` → ajoute exactement une série « Extérieur »
  (pointillée), en plus des séries pièces ; sans `outdoorRows` → comportement
  actuel inchangé.
- La série extérieure utilise la mesure courante (température vs humidité).

## Hors périmètre

- Bouton d'affichage on/off (décidé : toujours visible).
- Changement de la source météo ou de la localisation (déjà configurable par env).
