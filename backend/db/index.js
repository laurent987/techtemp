/**
 * @file SQLite initialization and access (simple repositories).
 * Enables WAL + foreign_keys and exposes minimal operations.
 */

import Database from 'better-sqlite3';

/**
 * @typedef {import('../types.js').ReadingRow} ReadingRow
 * @typedef {import('../types.js').DeviceRow} DeviceRow
 */

/** @type {Database.Database | null} */
let dbHandle = null;

/**
 * Initialize the database and apply migrations.
 * @param {string} dbPath
 * @returns {Database.Database}
 * @pre dbPath is writable (creates file if absent)
 * @post PRAGMA wal_mode=ON, foreign_keys=ON
 */
export function initDb(dbPath) {
  try {
    // Créer la connexion
    const db = new Database(dbPath);

    // Configurer les pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('cache_size = -16000'); // 16MB cache

    // Appliquer le schéma
    migrateSchema(db);

    // Stocker le handle global
    dbHandle = db;

    return db;
  } catch (error) {
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

/** Gracefully close the database if open. */
export function closeDb() {
  return new Promise((resolve) => {
    if (dbHandle && dbHandle.open) {
      dbHandle.close();
      dbHandle = null;
    }
    resolve();
  });
}

/**
 * Apply database schema migrations according to contract 001.
 * @param {Database.Database} db
 */
function migrateSchema(db) {
  // Migration idempotente - créer seulement si n'existe pas

  // Table rooms
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      uid          TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      floor        TEXT,
      side         TEXT
    )
  `);

  // Table devices - simplified schema (device_id→id, device_uid→uid)
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      uid          TEXT UNIQUE NOT NULL,
      label        TEXT,
      model        TEXT,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME,
      offset_temperature REAL DEFAULT 0,
      offset_humidity    REAL DEFAULT 0
    )
  `);

  // Table device_room_placements - updated references
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_room_placements (
      device_id   INTEGER NOT NULL REFERENCES devices(id),
      room_id     INTEGER NOT NULL REFERENCES rooms(id),
      from_ts     DATETIME NOT NULL,
      to_ts       DATETIME,
      PRIMARY KEY (device_id, from_ts)
    )
  `);

  // Table readings_raw - updated references
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings_raw (
      device_id   INTEGER NOT NULL REFERENCES devices(id),
      room_id     INTEGER,
      ts          DATETIME NOT NULL,
      temperature REAL,
      humidity    REAL,
      source      TEXT,
      msg_id      TEXT,
      PRIMARY KEY (device_id, ts)
    )
  `);

  // Index selon contrat 001
  db.exec(`CREATE INDEX IF NOT EXISTS idx_places_room ON device_room_placements(room_id, from_ts)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_places_device ON device_room_placements(device_id, from_ts)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_raw_room_ts ON readings_raw(room_id, ts)`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_msg ON readings_raw(msg_id) WHERE msg_id IS NOT NULL`);

  // Migration from old schema to new schema (device_id→id, device_uid→uid)
  migrateToSimplifiedSchema(db);

  // Vue utilitaire v_room_last
  db.exec(`
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
    GROUP BY r.room_id
  `);
}

/**
 * Migrate from old schema (device_id TEXT PK, device_uid UNIQUE) 
 * to new simplified schema (id INTEGER PK, uid UNIQUE)
 * @param {Database.Database} db
 */
function migrateToSimplifiedSchema(db) {
  // Check if migration is needed by detecting old schema
  const tableInfo = db.pragma('table_info(devices)');
  const hasOldSchema = tableInfo.some(col => col.name === 'device_id' && col.type === 'TEXT');

  if (!hasOldSchema) {
    return; // Already migrated or new database
  }

  console.log('📦 Migrating from old schema to simplified schema...');

  // Begin transaction for safety
  db.exec('BEGIN TRANSACTION');

  try {
    // 1. Create new devices table with simplified schema
    db.exec(`
      CREATE TABLE devices_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        uid          TEXT UNIQUE NOT NULL,
        label        TEXT,
        model        TEXT,
        created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME,
        offset_temperature REAL DEFAULT 0,
        offset_humidity    REAL DEFAULT 0
      )
    `);

    // 2. Migrate data: device_uid → uid
    db.exec(`
      INSERT INTO devices_new (uid, label, model, created_at, last_seen_at, offset_temperature, offset_humidity)
      SELECT device_uid, label, model, created_at, last_seen_at, offset_temperature, offset_humidity
      FROM devices
    `);

    // 3. Create mapping table for ID translation
    db.exec(`
      CREATE TEMPORARY TABLE id_mapping AS
      SELECT d_old.device_id as old_device_id, d_new.id as new_id
      FROM devices d_old
      JOIN devices_new d_new ON d_old.device_uid = d_new.uid
    `);

    // 4. Create new device_room_placements table
    db.exec(`
      CREATE TABLE device_room_placements_new (
        device_id   INTEGER NOT NULL REFERENCES devices(id),
        room_id     TEXT NOT NULL REFERENCES rooms(room_id),
        from_ts     DATETIME NOT NULL,
        to_ts       DATETIME,
        PRIMARY KEY (device_id, from_ts)
      )
    `);

    // 5. Migrate placements data with ID translation
    db.exec(`
      INSERT INTO device_room_placements_new (device_id, room_id, from_ts, to_ts)
      SELECT m.new_id, p.room_id, p.from_ts, p.to_ts
      FROM device_room_placements p
      JOIN id_mapping m ON p.device_id = m.old_device_id
    `);

    // 6. Create new readings_raw table
    db.exec(`
      CREATE TABLE readings_raw_new (
        device_id   INTEGER NOT NULL REFERENCES devices(id),
        room_id     TEXT,
        ts          DATETIME NOT NULL,
        temperature REAL,
        humidity    REAL,
        source      TEXT,
        msg_id      TEXT,
        PRIMARY KEY (device_id, ts)
      )
    `);

    // 7. Migrate readings data with ID translation
    db.exec(`
      INSERT INTO readings_raw_new (device_id, room_id, ts, temperature, humidity, source, msg_id)
      SELECT m.new_id, r.room_id, r.ts, r.temperature, r.humidity, r.source, r.msg_id
      FROM readings_raw r
      JOIN id_mapping m ON r.device_id = m.old_device_id
    `);

    // 8. Drop old tables
    db.exec('DROP TABLE readings_raw');
    db.exec('DROP TABLE device_room_placements');
    db.exec('DROP TABLE devices');

    // 9. Rename new tables
    db.exec('ALTER TABLE devices_new RENAME TO devices');
    db.exec('ALTER TABLE device_room_placements_new RENAME TO device_room_placements');
    db.exec('ALTER TABLE readings_raw_new RENAME TO readings_raw');

    db.exec('COMMIT');
    console.log('✅ Schema migration completed successfully');

  } catch (error) {
    db.exec('ROLLBACK');
    throw new Error(`Schema migration failed: ${error.message}`);
  }
}
