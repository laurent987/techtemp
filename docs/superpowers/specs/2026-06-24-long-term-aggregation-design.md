# Design – Historique long terme + agrégation adaptative

**Date :** 2026-06-24
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

Le dashboard (page unique, `MultiRoomChart`) affiche l'historique par pièce sur
des périodes courtes (1j/3j/1 sem/1 mois) en récupérant les mesures **brutes**
via `GET /api/v1/devices/:uid/readings` (`getDeviceReadings`). Les capteurs
publient toutes les 5 min → ~105 000 points/an/capteur. Impossible d'afficher 12
mois en brut : l'API plafonne à 10 000 points/requête et le rendu de ~100 000
points est ingérable.

Objectif : permettre des périodes longues (3 / 6 / 12 mois) en **agrégeant côté
backend**, avec une granularité **adaptative** selon la durée affichée.

Touche **backend** (endpoint + agrégation SQL) **et** dashboard. Déploiement
groupé avec le reste à la fin (pas de déploiement intermédiaire).

## Objectifs

1. Backend : agrégation par heure / par jour sur l'endpoint des mesures.
2. Frontend : granularité adaptative + nouvelles périodes longues.
3. UI : choix de période via un **dropdown unique**.
4. Affichage : courbe de **moyenne** + **bande min/max** (1 pièce).

Hors périmètre : pré-calcul/matérialisation (continuous aggregates), export,
changement de librairie de graphes, rétention/purge des données.

## 1. Backend — agrégation

Étendre `GET /api/v1/devices/:deviceUid/readings` avec un paramètre **`bucket`** :

- `bucket=raw` (défaut) → comportement actuel inchangé (mesures brutes).
- `bucket=hour` → 1 point par heure.
- `bucket=day` → 1 point par jour.

**Validation :** `bucket` ∈ `{raw, hour, day}` sinon `400`. `from`/`to`/`limit`
inchangés (la borne 10 000 reste ; en agrégé on est très en dessous : 1 an/jour
= ~365, 1 mois/heure = ~720).

**Agrégation (SQLite, `readings_raw`)** : grouper par tranche de temps et
calculer moyenne + min + max pour température ET humidité.
- jour : `GROUP BY date(ts)`
- heure : `GROUP BY strftime('%Y-%m-%dT%H', ts)`

**Forme d'un point agrégé** (réponse JSON, en plus de `ts` = début du bucket) :
`temperature` (avg), `temperature_min`, `temperature_max`, `humidity` (avg),
`humidity_min`, `humidity_max`. En `raw`, la réponse garde sa forme actuelle
(pas de champs min/max).

Couche concernée : la route `backend/http/routes/devices.js` (lecture du param +
validation) délègue à une nouvelle requête d'agrégation dans la couche d'accès
données (`backend/db/dataAccess.js` / `backend/repositories`), à côté de la
récupération brute existante. La requête brute actuelle n'est pas modifiée.

## 2. Frontend — granularité adaptative

`MultiRoomChart` dérive le `bucket` de la période choisie (en jours) :

| Période | `windowSize` (j) | bucket |
|---|---|---|
| 1 jour / 3 jours / 1 semaine | 1 / 3 / 7 | raw |
| 1 mois | 30 | hour |
| 3 mois / 6 mois / 1 an | 90 / 180 / 365 | day |

`getDeviceReadings(uid, { from, to, bucket })` transmet le param ; le mapping de
réponse expose les champs min/max quand ils sont présents.

## 3. UI — dropdown de période

Remplacer les boutons segmentés de période par **un seul `Select`** :
`1 jour / 3 jours / 1 semaine / 1 mois / 3 mois / 6 mois / 1 an`.
Le toggle 🌡️ Température / 💧 Humidité reste à gauche, dans l'en-tête du graphe ;
la navigation de date `‹ … ›` reste à droite.

## 4. Affichage moyenne + bande min/max

- Courbe = **moyenne** du bucket, dans la couleur de la pièce.
- **Bande min→max** = zone ombrée faible opacité (même couleur), via deux séries
  Chart.js (min et max) avec remplissage entre les deux.
- **Règle multi-pièces (lisibilité)** : la bande min/max ne s'affiche **que si
  exactement 1 pièce est sélectionnée**. Dès 2 pièces, on n'affiche que les
  moyennes. En `raw` (périodes courtes), pas de bande (aucun agrégat).

## 5. Tests

**Backend** (`test/http/devices.test.js` + couche données) :
- `bucket=day` → points agrégés, 1 par jour sur la plage, avec
  `temperature`/`_min`/`_max` cohérents (moyenne entre min et max).
- `bucket=hour` → 1 point par heure.
- `bucket=raw` / absent → réponse brute inchangée (rétrocompat).
- `bucket` invalide → `400`.

**Frontend** (Vitest) :
- mapping période → bucket (table ci-dessus).
- le `Select` change la période/bucket.
- la bande min/max n'est rendue qu'avec 1 pièce sélectionnée (sur une période
  agrégée).

## Déploiement (rappel)

Backend (rebuild Docker via rsync `backend/` + `docker compose up -d --build`)
**et** dashboard, **en une seule fois à la fin** avec le reste du travail en
cours. Voir [[techtemp-deployment]].
