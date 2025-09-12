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
 * Apply database schema according to contract 001.
 * Clean schema creation without migration logic.
 * @param {Database.Database} db
 */
function migrateSchema(db) {
  // Create tables if they don't exist

  // Table rooms - id + uid architecture
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      uid          TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      floor        TEXT,
      side         TEXT
    )
  `);

  // Table devices - id + uid architecture
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

  // Table device_room_placements - numeric foreign keys
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_room_placements (
      device_id   INTEGER NOT NULL REFERENCES devices(id),
      room_id     INTEGER NOT NULL REFERENCES rooms(id),
      from_ts     DATETIME NOT NULL,
      to_ts       DATETIME,
      PRIMARY KEY (device_id, from_ts)
    )
  `);

  // Table readings_raw - numeric foreign keys
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

  // Indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_places_room ON device_room_placements(room_id, from_ts)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_places_device ON device_room_placements(device_id, from_ts)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_raw_room_ts ON readings_raw(room_id, ts)`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_msg ON readings_raw(msg_id) WHERE msg_id IS NOT NULL`);

  // Utility view for latest readings by room
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
