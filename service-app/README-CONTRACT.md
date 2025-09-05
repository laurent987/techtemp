# TechTemp — Service-App Contract (MVP)

## 1. Purpose & Scope
The service-app is the central Node.js service responsible for:
- Ingesting sensor readings via **MQTT**.  
- Validating and persisting them into a **SQLite** database.  
- Exposing minimal **HTTP APIs** for health and latest readings.  

This document defines the **contracts**:  
- Module tree & function signatures.  
- MQTT topics & payloads.  
- Database schema.  
- REST API endpoints.  

---

## 2. Module Tree & Roles

```
service-app/
  src/
    main.js              # bootstrap (config, DB, MQTT, HTTP)
    config.js            # environment config & validation
    types.js             # JSDoc typedefs (shared contracts)

    db/
      index.js           # DB init + simple repositories

    mqtt/
      client.js          # MQTT wrapper (connect/subscribe/publish)

    ingestion/
      parseTopic.js      # parse & validate MQTT topic → {homeId, deviceId}
      validateReading.js # validate payload (Joi schema)
      ingestMessage.js   # ingestion pipeline (topic+payload → DB)

    http/
      server.js          # Express server + routes
      routes/
        health.js        # /health endpoint
        readings.js      # /api/v1/readings/latest
```

### Example function contracts (JSDoc)

- `loadConfig(): AppConfig` → validates `process.env`.  
- `initDb(dbPath): {db, repo}` → opens SQLite with WAL, foreign_keys.  
- `createMqttClient(opts)` → returns client with subscribe/publish/onMessage.  
- `validateReadingPayload(payload): ReadingPayload` → Joi schema validation.  
- `createIngestor(deps)` → (topic, payloadBuf) → inserts into DB.  
- `createHttpServer(opts)` → start Express with health & readings routes.  

---

## 3. MQTT Contract

### Topics

```
home/<homeId>/sensors/<deviceId>/reading   # periodic readings
home/<homeId>/sensors/<deviceId>/state     # device state (birth/LWT)
home/<homeId>/sensors/<deviceId>/cmd       # commands → device
home/<homeId>/sensors/<deviceId>/ack       # device replies
```

- QoS: 1  
- Retain: only for `state` (last known status).  

### Payload Example (reading)

```json
{
  "msgId": "uuid-1234",
  "ts": "2025-09-04T19:05:00Z",
  "t": 24.8,
  "h": 49.7,
  "battery": 100,
  "fw": "collector-c@1.0.0"
}
```

---

## 4. Database Contract (SQLite)

### Table `devices`
```sql
CREATE TABLE devices (
  device_id    TEXT PRIMARY KEY,
  label        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME,
  offset_t     REAL DEFAULT 0,
  offset_h     REAL DEFAULT 0
);
```

### Table `readings_raw`
```sql
CREATE TABLE readings_raw (
  device_id   TEXT NOT NULL REFERENCES devices(device_id),
  ts          DATETIME NOT NULL,
  t           REAL,
  h           REAL,
  msg_id      TEXT,
  PRIMARY KEY (device_id, ts)
);
CREATE UNIQUE INDEX idx_raw_msg ON readings_raw(msg_id) WHERE msg_id IS NOT NULL;
```

---

## 5. REST API Contract

### `GET /health`
- **200 OK**:  
```json
{ "status": "ok", "uptime_s": 123 }
```

### `GET /api/v1/readings/latest?homeId=...&deviceId=...`
- **200 OK**:  
```json
{
  "data": {
    "home_id": "home-001",
    "device_id": "rpi-01",
    "ts_utc": 1693851234000,
    "values": { "temperature_c": 24.8, "humidity_pct": 49.7 }
  }
}
```
- **400 Bad Request** if missing/invalid query params.  

---

✅ This README defines the **MVP service-app contract**.  
Implementation must follow this contract; tests will enforce schema, DB, and API behavior.  
