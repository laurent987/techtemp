# Contrat 001 — Service-app (Lot 1 / Étape 1 — MVP)

## 1. MQTT — Contrat de topic & payload

### Topic principal (lecture capt   * Mapper le payload (temperature_c→temperature, humidity_pct* Les valeurs renvoyées sont **post-calibration** si le service applique `offset_temperature/offset_humidity` lors de l'ingestion (sinon brutes au MVP).humidity, ts→ts) et insérer une ligne dans `readings_raw`.urs → serveur)

```
home/{homeId}/sensors/{deviceId}/reading
```

* `homeId` : identifiant du logement (ex: `home-001`).
* `deviceId` : identifiant unique du capteur (ex: `rpi-living-01`).
* **QoS** : 1 (au moins une fois).
* **retain** : false.

### Payload JSON (MVP)

```json
{
  "ts": 1725427200000,
  "temperature_c": 23.7,
  "humidity_pct": 52.5
}
```

* `ts` : horodatage en **epoch ms (UTC)**.
* `temperature_c` : température en °C.
* `humidity_pct` : humidité relative en %.

📌 Tous les champs ci-dessus sont **requis au MVP**.
📌 Tout champ supplémentaire éventuel (ex: `battery`, `fw`, `msgId`) est toléré et sera archivé en **raw\_payload** dans la base.

---

## 2. SQLite — Schéma contractuel (MVP)

**Pragmas de base appliqués au boot :**

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

### Table `rooms`

```sql
CREATE TABLE IF NOT EXISTS rooms (
  room_id   TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  floor     TEXT,        -- ex: rdc, etage1, grenier
  side      TEXT         -- ex: rue, jardin
);
```

### Table `devices`

```sql
CREATE TABLE IF NOT EXISTS devices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  uid          TEXT UNIQUE NOT NULL,   -- identifiant externe stable (API/MQTT)
  device_id    TEXT,                   -- identifiant matériel (RPi) - deprecated
  label        TEXT,                   -- nom convivial
  room_id      INTEGER,                -- référence interne à rooms.id
  model        TEXT,                   -- modèle: rpi-zero-2w
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME,
  offset_temperature REAL DEFAULT 0,   -- correction température °C
  offset_humidity    REAL DEFAULT 0,   -- correction humidité %
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

📌 **Migration importante** : Le champ `uid` devient l'identifiant principal pour l'API publique. Les IDs internes ne sont plus exposés.

### Table `device_room_placements`

```sql
CREATE TABLE IF NOT EXISTS device_room_placements (
  device_id   TEXT NOT NULL REFERENCES devices(device_id),
  room_id     TEXT NOT NULL REFERENCES rooms(room_id),
  from_ts     DATETIME NOT NULL,
  to_ts       DATETIME,                   -- NULL = en cours
  PRIMARY KEY (device_id, from_ts)
);
CREATE INDEX IF NOT EXISTS idx_places_room ON device_room_placements(room_id, from_ts);
CREATE INDEX IF NOT EXISTS idx_places_device ON device_room_placements(device_id, from_ts);
```

### Table `readings_raw`

```sql
CREATE TABLE IF NOT EXISTS readings_raw (
  device_id   TEXT NOT NULL REFERENCES devices(device_id),
  room_id     TEXT,                     -- pièce résolue au moment T
  ts          DATETIME NOT NULL,        -- horodatage UTC
  temperature REAL,                     -- température (°C)
  humidity    REAL,                     -- humidité (%)
  source      TEXT,                     -- ex: "mqtt"
  msg_id      TEXT,                     -- identifiant unique du message
  PRIMARY KEY (device_id, ts)
);
CREATE INDEX IF NOT EXISTS idx_raw_room_ts ON readings_raw(room_id, ts);
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_msg ON readings_raw(msg_id) WHERE msg_id IS NOT NULL;
```

### Vues utilitaires

#### Dernière mesure par room

```sql
CREATE VIEW IF NOT EXISTS v_room_last AS
SELECT r.room_id,
       MAX(r.ts) AS last_ts,
       (SELECT temperature FROM readings_raw rr
         WHERE rr.room_id = r.room_id
         ORDER BY rr.ts DESC LIMIT 1) AS last_temperature,
       (SELECT humidity FROM readings_raw rr
         WHERE rr.room_id = r.room_id
         ORDER BY rr.ts DESC LIMIT 1) AS last_humidity
FROM readings_raw r
GROUP BY r.room_id;
```

---

## 3. Règles d’ingestion

1. À la réception d’un message MQTT valide :

   * Vérifier le **topic** (doit correspondre au pattern).
   * Upsert dans `devices` (`device_id`, metadata).
   * Résoudre `room_id` via `device_room_placements`.
   * Mapper le payload (temperature\_c→t, humidity\_pct→h, ts→ts) et insérer une ligne dans `readings_raw`.

2. En cas d’erreur :

   * **JSON invalide** → rejet + log `warn`.
   * **Champs manquants** → rejet + log `warn`.
   * **Topic inattendu** → rejet + log `warn`.

---

## 4. API HTTP (MVP)

**Base path** : `/api/v1` (sauf `/health` à la racine).
**Auth (MVP LAN)** : aucune (clé API/JWT en Phase 2).
**Content-Type** : `application/json; charset=utf-8`.

### 4.1 Healthcheck

Note : placé à la racine (`/health`) plutôt que sous `/api/v1/health`, car c’est un endpoint **opérationnel** (monitoring, readiness check). Cette convention est répandue (Kubernetes, load balancers) et facilite la supervision. Les endpoints métier, eux, restent sous `/api/v1`.

`GET /health`

* **200 OK**

```json
{ "status": "ok" }
```

* **500 Internal Server Error** (ex. DB inaccessible)

```json
{ "status": "failed" }
```

**Règle** : la route effectue un `SELECT 1` sur SQLite. Si échec → 500.

---

### 4.2 Dernières mesures par device

`GET /api/v1/readings/latest`

**Description** : renvoie la **dernière lecture** connue pour chaque `device_id` (données issues de `readings_raw`, agrégées par device).

**200 OK**

```json
{
  "data": [
    {
      "device_id": "rpi-living-01",
      "room_id": "salon",
      "ts": "2025-09-04T19:05:00Z",
      "temperature": 23.7,
      "humidity": 52.5
    }
  ]
}
```

**Notes de contrat**

* La sélection se base sur la ligne à `ts` maximale par `device_id` dans `readings_raw`.
* Les valeurs renvoyées sont **post-calibration** si le service applique `offset_t/offset_h` lors de l’ingestion (sinon brutes au MVP).
* Ordre de tri recommandé : `device_id` croissant.

**Erreurs communes**

* **500** (erreur interne)

```json
{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }
```

**Évolutions prévues (non-MVP)**

* Filtres : `?homeId=...`, `?roomId=...`.
* Endpoint complémentaire : `GET /api/v1/rooms/:roomId/live`.

---

### 4.3 Format générique des erreurs

Toutes les erreurs suivent le format :

```json
{ "error": { "code": "<CODE>", "message": "<description>" } }
```

**Codes communs** :

* `VALIDATION_ERROR` → payload invalide.
* `UNAUTHORIZED` → clé manquante ou invalide.
* `FORBIDDEN` → rôle insuffisant (phase 2+).
* `NOT_FOUND` → ressource absente.
* `DUPLICATE` → `msgId` déjà traité.
* `INTERNAL_ERROR` → erreur serveur.

---
