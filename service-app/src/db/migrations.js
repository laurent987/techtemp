/**
 * @file Database Schema Migrations
 * Handles versioned schema changes
 */

/**
 * Get current schema version
 * @param {import('better-sqlite3').Database} db 
 */
function getCurrentVersion(db) {
  try {
    // Create schema_version table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = db.prepare('SELECT MAX(version) as version FROM schema_version').get();
    let version = result.version || 0;

    // If version is 0, check if this is actually a legacy database
    if (version === 0) {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);

      // If we have readings_raw with old schema, this is a legacy DB needing migration
      if (tableNames.includes('readings_raw')) {
        const columns = db.prepare(`PRAGMA table_info(readings_raw)`).all();
        const hasT = columns.some(col => col.name === 't');
        const hasTemperature = columns.some(col => col.name === 'temperature');

        if (hasT && !hasTemperature) {
          console.log('📋 Detected legacy database with t/h columns');
          return 0; // Needs migration from legacy
        } else if (hasTemperature) {
          console.log('📋 Detected new database with temperature/humidity columns');
          return 2; // Already migrated
        }
      }
    }

    return version;
  } catch (error) {
    console.warn('Could not read schema version, assuming 0');
    return 0;
  }
}

/**
 * Set schema version
 * @param {import('better-sqlite3').Database} db 
 * @param {number} version 
 */
function setVersion(db, version) {
  db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(version);
}

/**
 * Determines if the database is a legacy database that needs migration
 * @param {import('better-sqlite3').Database} db 
 * @returns {boolean}
 */
function isLegacyDatabase(db) {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);

    // Legacy database has 'readings' table with 't' and 'h' columns
    if (tableNames.includes('readings')) {
      const columns = db.prepare("PRAGMA table_info(readings)").all();
      const hasT = columns.some(col => col.name === 't');
      const hasH = columns.some(col => col.name === 'h');
      return hasT || hasH;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Migration from version 0 to 1: Initial schema
 * @param {import('better-sqlite3').Database} db 
 */
function migrateV0ToV1(db) {
  console.log('📦 Applying migration v0 → v1: Initial schema with explicit column names');

  // Check if this is a legacy database
  if (isLegacyDatabase(db)) {
    console.log('  📋 Legacy database detected - skipping new schema creation');
    setVersion(db, 1);
    return;
  }

  // Table rooms
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id   TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      floor     TEXT,
      side      TEXT
    )
  `);

  // Table devices with explicit offset names
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id         TEXT PRIMARY KEY,
      device_uid        TEXT UNIQUE NOT NULL,
      label             TEXT,
      model             TEXT,
      created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at      DATETIME,
      offset_temperature REAL DEFAULT 0,
      offset_humidity    REAL DEFAULT 0
    )
  `);

  // Table device_room_placements
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_room_placements (
      device_id   TEXT NOT NULL REFERENCES devices(device_id),
      room_id     TEXT NOT NULL REFERENCES rooms(room_id),
      from_ts     DATETIME NOT NULL,
      to_ts       DATETIME,
      PRIMARY KEY (device_id, from_ts)
    )
  `);

  // Table readings_raw with explicit column names
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings_raw (
      device_id   TEXT NOT NULL REFERENCES devices(device_id),
      room_id     TEXT,
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

  // Note: View will be created in migration v2 after potential column migrations

  setVersion(db, 1);
}

/**
 * Migration from version 1 to 2: Rename legacy columns if they exist
 * @param {import('better-sqlite3').Database} db 
 */
function migrateV1ToV2(db) {
  console.log('🔄 Applying migration v1 → v2: Migrate legacy column names');

  // Get all existing tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

  console.log('  📋 Found tables:', tableNames);

  // Handle legacy 'readings' table (from old schema)
  if (tableNames.includes('readings')) {
    console.log('  🔧 Found legacy readings table, checking for t/h columns...');

    const columns = db.prepare(`PRAGMA table_info(readings)`).all();
    const hasT = columns.some(col => col.name === 't');
    const hasH = columns.some(col => col.name === 'h');

    if (hasT || hasH) {
      console.log('  📋 Migrating readings table: t/h → temperature/humidity');

      // First drop the old view that references the old column names
      db.exec(`DROP VIEW IF EXISTS v_room_last`);

      // Create new table with explicit names
      db.exec(`
        CREATE TABLE readings_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_id INTEGER NOT NULL,
          temperature REAL NOT NULL,
          humidity REAL NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (device_id) REFERENCES devices(id)
        )
      `);

      // Copy data with column mapping
      db.exec(`
        INSERT INTO readings_new (id, device_id, temperature, humidity, timestamp)
        SELECT id, device_id, 
               ${hasT ? 't' : 'NULL'} as temperature, 
               ${hasH ? 'h' : 'NULL'} as humidity, 
               timestamp
        FROM readings
      `);

      // Replace old table
      db.exec(`DROP TABLE readings`);
      db.exec(`ALTER TABLE readings_new RENAME TO readings`);

      console.log('  ✅ Legacy readings table migration completed');
    }
  }

  // Handle newer 'readings_raw' table (from new schema)  
  if (tableNames.includes('readings_raw')) {
    const columns = db.prepare(`PRAGMA table_info(readings_raw)`).all();
    const hasT = columns.some(col => col.name === 't');
    const hasH = columns.some(col => col.name === 'h');

    if (hasT || hasH) {
      console.log('  📋 Migrating readings_raw: t/h → temperature/humidity');

      // Create new table with explicit names
      db.exec(`
        CREATE TABLE readings_raw_new (
          device_id   TEXT NOT NULL REFERENCES devices(device_id),
          room_id     TEXT,
          ts          DATETIME NOT NULL,
          temperature REAL,
          humidity    REAL,
          source      TEXT,
          msg_id      TEXT,
          PRIMARY KEY (device_id, ts)
        )
      `);

      // Copy data with column mapping
      db.exec(`
        INSERT INTO readings_raw_new (device_id, room_id, ts, temperature, humidity, source, msg_id)
        SELECT device_id, room_id, ts, 
               ${hasT ? 't' : 'NULL'} as temperature, 
               ${hasH ? 'h' : 'NULL'} as humidity, 
               source, msg_id
        FROM readings_raw
      `);

      // Replace old table
      db.exec(`DROP TABLE readings_raw`);
      db.exec(`ALTER TABLE readings_raw_new RENAME TO readings_raw`);

      // Recreate indexes
      db.exec(`CREATE INDEX idx_raw_room_ts ON readings_raw(room_id, ts)`);
      db.exec(`CREATE UNIQUE INDEX idx_raw_msg ON readings_raw(msg_id) WHERE msg_id IS NOT NULL`);

      console.log('  ✅ readings_raw migration completed');
    }
  }

  // Handle devices table offset columns
  if (tableNames.includes('devices')) {
    const columns = db.prepare(`PRAGMA table_info(devices)`).all();
    const hasOffsetT = columns.some(col => col.name === 'offset_t');
    const hasOffsetH = columns.some(col => col.name === 'offset_h');

    if (hasOffsetT || hasOffsetH) {
      console.log('  📋 Migrating devices: offset_t/offset_h → offset_temperature/offset_humidity');

      // Add new columns if they don't exist
      if (!columns.some(col => col.name === 'offset_temperature')) {
        db.exec(`ALTER TABLE devices ADD COLUMN offset_temperature REAL DEFAULT 0`);
      }
      if (!columns.some(col => col.name === 'offset_humidity')) {
        db.exec(`ALTER TABLE devices ADD COLUMN offset_humidity REAL DEFAULT 0`);
      }

      // Copy data from old columns if they exist
      if (hasOffsetT) {
        db.exec(`UPDATE devices SET offset_temperature = offset_t WHERE offset_t IS NOT NULL`);
      }
      if (hasOffsetH) {
        db.exec(`UPDATE devices SET offset_humidity = offset_h WHERE offset_h IS NOT NULL`);
      }

      console.log('  ✅ devices migration completed');
    }
  }

  // Handle rooms table updates
  if (tableNames.includes('rooms')) {
    const columns = db.prepare(`PRAGMA table_info(rooms)`).all();
    const hasFloor = columns.some(col => col.name === 'floor');
    const hasSide = columns.some(col => col.name === 'side');

    if (!hasFloor || !hasSide) {
      console.log('  📋 Updating rooms table structure...');

      if (!hasFloor) {
        db.exec(`ALTER TABLE rooms ADD COLUMN floor TEXT`);
      }
      if (!hasSide) {
        db.exec(`ALTER TABLE rooms ADD COLUMN side TEXT`);
      }

      console.log('  ✅ rooms table updated');
    }
  }

  // Create/update appropriate view based on available tables
  console.log('  📋 Creating updated view...');
  db.exec(`DROP VIEW IF EXISTS v_room_last`);

  // Check which tables exist after migration
  const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const finalTableNames = finalTables.map(t => t.name);

  if (finalTableNames.includes('readings_raw')) {
    // New schema view
    db.exec(`
      CREATE VIEW v_room_last AS
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
  } else if (finalTableNames.includes('readings')) {
    // Legacy schema view (updated with new column names)
    db.exec(`
      CREATE VIEW v_room_last AS
      SELECT DISTINCT
          r.id as room_id,
          r.name as room_name,
          r.floor,
          rd.device_id,
          d.name as device_name,
          rd.temperature,
          rd.humidity,
          rd.timestamp
      FROM rooms r
      JOIN devices d ON r.id = d.room_id
      JOIN readings rd ON d.id = rd.device_id
      JOIN (
          SELECT device_id, MAX(timestamp) as max_timestamp
          FROM readings
          GROUP BY device_id
      ) latest ON rd.device_id = latest.device_id AND rd.timestamp = latest.max_timestamp
    `);
  };
  console.log('  ✅ View v_room_last updated');

  setVersion(db, 2);
}

/**
 * Run all pending migrations
 * @param {import('better-sqlite3').Database} db 
 */
export function runMigrations(db) {
  const currentVersion = getCurrentVersion(db);
  console.log(`📊 Current schema version: ${currentVersion}`);

  const migrations = [
    { version: 1, migrate: migrateV0ToV1 },
    { version: 2, migrate: migrateV1ToV2 }
  ];

  const transaction = db.transaction(() => {
    for (const { version, migrate } of migrations) {
      if (currentVersion < version) {
        migrate(db);
        console.log(`✅ Migration to version ${version} completed`);
      }
    }
  });

  transaction();

  const finalVersion = getCurrentVersion(db);
  console.log(`🎯 Final schema version: ${finalVersion}`);
}
