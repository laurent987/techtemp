# Design – Paramètre `moved_at` optionnel pour dater un déplacement d'appareil

**Date :** 2026-06-23
**Statut :** Approuvé (design), prêt pour le plan d'implémentation

## Contexte

Le déplacement d'un capteur d'une pièce à une autre se fait via
`PUT /api/v1/devices/:deviceUid` avec un `room_name`. La méthode
`repo.devices.update` (`backend/repositories/index.js`) gère l'historique
correctement : elle clôture le placement courant (`to_ts`) et ouvre un nouveau
placement (`from_ts`) dans `device_room_placements`. Chaque mesure
(`readings_raw`) fige son `room_id` au moment de l'ingestion, donc l'historique
par pièce est préservé.

**Problème :** les deux timestamps sont codés en dur à `new Date().toISOString()`
(l'instant de l'appel API). Si l'appareil a été physiquement déplacé plus tôt,
les mesures prises dans la nouvelle pièce entre le déplacement réel et l'appel
API sont attribuées à l'ancienne pièce.

## Objectif

Permettre de préciser la date réelle du déplacement lors de l'appel `PUT`, afin
que la coupure d'historique tombe au bon moment.

## Comportement

Le corps JSON de `PUT /api/v1/devices/:deviceUid` accepte un champ optionnel
`moved_at` (timestamp ISO 8601).

- Quand `moved_at` est fourni **avec** un changement de pièce (`room_name`) :
  - le placement courant est clôturé avec `to_ts = moved_at`
  - le nouveau placement est ouvert avec `from_ts = moved_at`
  - les deux valeurs sont identiques → pas de trou ni de chevauchement
- Quand `moved_at` est absent : comportement actuel (`new Date()`) conservé.
  **Rétrocompatible.**

La valeur est normalisée via `new Date(moved_at).toISOString()` avant stockage.

## Validation (route → `400 Bad Request` sinon)

1. `moved_at` doit être une chaîne ISO 8601 valide (`!isNaN(Date.parse(...))`)
2. ne doit pas être dans le futur
3. doit être postérieur au `from_ts` du placement courant (on ne peut pas
   déménager avant d'être arrivé)
4. `moved_at` n'a de sens qu'avec `room_name` ; fourni seul → `400`

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `backend/repositories/index.js` | Dans `update()` : `const placementTs = updateData.moved_at \|\| new Date().toISOString()`, utilisé pour le `to_ts` de clôture et le `from_ts` du nouveau placement. `moved_at` n'est pas une colonne de `devices` et ne fuite pas dans `deviceUpdateData`. |
| `backend/http/routes/devices.js` | Dans le handler `PUT` : lecture de `moved_at`, validation (4 règles ci-dessus), passage dans `updateData`. |

## Tests (TDD – écrits avant l'implémentation)

**`test/repositories.test.js`**
- `update` avec `moved_at` → `to_ts` du placement clôturé et `from_ts` du nouveau
  placement valent `moved_at`
- `update` sans `moved_at` → timestamps ≈ maintenant (comportement inchangé)

**`test/http/devices.test.js`**
- succès `200` avec un `moved_at` valide ; placement daté correctement
- `400` si `moved_at` dans le futur
- `400` si `moved_at` antérieur au `from_ts` du placement courant
- `400` si `moved_at` mal formé
- `400` si `moved_at` fourni sans `room_name`
- rétrocompat : `PUT` sans `moved_at` fonctionne comme avant

## Hors périmètre

- `POST` / provisioning initial (inchangé)
- La base locale `iot.db` (la base de production est sur le Raspberry Pi)

## Exemple d'utilisation après implémentation

```bash
curl -X PUT http://<IP_DU_RASPBERRY>:3000/api/v1/devices/aht20-f49c53 \
  -H "Content-Type: application/json" \
  -d '{"room_name":"zolder","label":"Capteur du grenier","moved_at":"2026-06-22T10:00:00Z"}'
```
