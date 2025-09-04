# Contrat 001 — Service-app (Lot 1 / Étape 1 — MVP)

## 1. MQTT — Contrat de topic & payload

### Topic principal (lecture capteurs → serveur)

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
  device_id    TEXT PRIMARY KEY,   -- identifiant matériel (RPi)
  device_uid   TEXT UNIQUE NOT NULL, -- identifiant externe stable (MQTT)
  label        TEXT,               -- nom convivial
  model        TEXT,               -- modèle: rpi-zero-2w
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME,
  offset_t     REAL DEFAULT 0,     -- correction température °C
  offset_h     REAL DEFAULT 0      -- correction humidité %
);
```

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
  t           REAL,                     -- température (°C)
  h           REAL,                     -- humidité (%)
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
       (SELECT t FROM readings_raw rr
         WHERE rr.room_id = r.room_id
         ORDER BY rr.ts DESC LIMIT 1) AS last_t,
       (SELECT h FROM readings_raw rr
         WHERE rr.room_id = r.room_id
         ORDER BY rr.ts DESC LIMIT 1) AS last_h
FROM readings_raw r
GROUP BY r.room_id;
```

---

## 3. Règles d’ingestion

1. À la réception d’un message MQTT valide :

   * Vérifier le **topic** (doit correspondre au pattern).
   * Upsert dans `devices` (`device_id`, metadata).
   * Résoudre `room_id` via `device_room_placements`.
   * Insérer une ligne dans `readings_raw` avec `raw_payload` intact.

2. En cas d’erreur :

   * **JSON invalide** → rejet + log `warn`.
   * **Champs manquants** → rejet + log `warn`.
   * **Topic inattendu** → rejet + log `warn`.

---

✅ Ce contrat définit les règles minimales pour le MVP :

* Structure des **topics MQTT** + payload.
* Schéma **SQLite** (tables `rooms`, `devices`, `device_room_placements`, `readings_raw`) pour stocker les mesures brutes et leur contexte.
