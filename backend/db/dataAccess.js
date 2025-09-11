/**
 * @file Data Access Layer - Phase 3
 * SQL operations layer betwfunction createFindDeviceById(db) {
  const stmt = db.prepare(`
    SELECT * FROM devices WHERE uid = ?
  `);

  return function findDeviceById(uid) {
    return stmt.get(uid);
  };
}itory and Database
 * No business logic, only SQL operations
 */

/**
 * Create data access layer bound to database connection
 * @param {import('better-sqlite3').Database} db 
 * @returns {DataAccess}
 */
export function createDataAccess(db) {
  return {
    // Device operations
    insertDevice: createInsertDevice(db),
    findDeviceById: createFindDeviceById(db),
    findDeviceByUid: createFindDeviceByUid(db),
    resolveDeviceId: createResolveDeviceId(db),
    updateDeviceLastSeen: createUpdateDeviceLastSeen(db),

    // Room operations  
    insertRoom: createInsertRoom(db),
    findRoomById: createFindRoomById(db),

    // Reading operations
    insertReading: createInsertReading(db),
    findLatestReadingByDevice: createFindLatestReadingByDevice(db),
    findLatestReadingPerDevice: createFindLatestReadingPerDevice(db),
    findReadingsByRoomAndTimeRange: createFindReadingsByRoomAndTimeRange(db),

    // Device placement operations
    insertDevicePlacement: createInsertDevicePlacement(db),
    findCurrentDevicePlacement: createFindCurrentDevicePlacement(db)
  };
}

/**
 * @typedef {Object} DataAccess
 * @property {Function} insertDevice
 * @property {Function} findDeviceById
 * @property {Function} updateDeviceLastSeen
 * @property {Function} insertRoom
 * @property {Function} findRoomById
 * @property {Function} insertReading
 * @property {Function} findLatestReadingByDevice
 * @property {Function} findLatestReadingPerDevice
 * @property {Function} findReadingsByRoomAndTimeRange
 * @property {Function} findCurrentDevicePlacement
 */

// ====== DEVICE OPERATIONS ======

function createInsertDevice(db) {
  const stmt = db.prepare(`
    INSERT INTO devices (uid, label, model, created_at, last_seen_at, offset_temperature, offset_humidity)
    VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)
  `);

  return function insertDevice(deviceData) {
    return stmt.run(
      deviceData.uid,
      deviceData.label || null,
      deviceData.model || null,
      deviceData.created_at || null,
      deviceData.last_seen_at || null,
      deviceData.offset_temperature || 0,
      deviceData.offset_humidity || 0
    );
  };
}

function createFindDeviceById(db) {
  const stmt = db.prepare(`
    SELECT * FROM devices WHERE uid = ?
  `);

  return function findDeviceById(uid) {
    return stmt.get(uid) || null;
  };
}

function createFindDeviceByUid(db) {
  const stmt = db.prepare(`
    SELECT * FROM devices WHERE uid = ?
  `);

  return function findDeviceByUid(uid) {
    return stmt.get(uid) || null;
  };
}

function createResolveDeviceId(db) {
  const stmt = db.prepare(`
    SELECT id FROM devices WHERE uid = ?
  `);

  return function resolveDeviceId(uid) {
    const result = stmt.get(uid);
    return result ? result.id : null;
  };
}

function createUpdateDeviceLastSeen(db) {
  const stmt = db.prepare(`
    UPDATE devices SET last_seen_at = ? WHERE uid = ?
  `);

  return function updateDeviceLastSeen(uid, timestamp) {
    return stmt.run(timestamp, uid);
  };
}

// ====== ROOM OPERATIONS ======

function createInsertRoom(db) {
  const stmt = db.prepare(`
    INSERT INTO rooms (room_id, name, floor, side)
    VALUES (?, ?, ?, ?)
  `);

  return function insertRoom(roomData) {
    return stmt.run(
      roomData.room_id,
      roomData.name,
      roomData.floor || null,
      roomData.side || null
    );
  };
}

function createFindRoomById(db) {
  const stmt = db.prepare(`
    SELECT * FROM rooms WHERE room_id = ?
  `);

  return function findRoomById(roomId) {
    return stmt.get(roomId) || null;
  };
}

// ====== READING OPERATIONS ======

function createInsertReading(db) {
  const stmt = db.prepare(`
    INSERT INTO readings_raw (device_id, room_id, ts, temperature, humidity, source, msg_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  return function insertReading(readingData) {
    return stmt.run(
      readingData.device_id,
      readingData.room_id || null,
      readingData.ts,
      readingData.temperature || null,
      readingData.humidity || null,
      readingData.source || null,
      readingData.msg_id || null
    );
  };
}

function createFindLatestReadingByDevice(db) {
  const stmt = db.prepare(`
    SELECT r.*, d.uid FROM readings_raw r
    JOIN devices d ON r.device_id = d.id
    WHERE d.uid = ? 
    ORDER BY r.ts DESC 
    LIMIT 1
  `);

  return function findLatestReadingByDevice(uid) {
    return stmt.get(uid) || null;
  };
}

function createFindLatestReadingPerDevice(db) {
  const stmt = db.prepare(`
    SELECT r1.*, d.uid
    FROM readings_raw r1
    INNER JOIN (
      SELECT device_id, MAX(ts) as max_ts
      FROM readings_raw
      GROUP BY device_id
    ) r2 ON r1.device_id = r2.device_id AND r1.ts = r2.max_ts
    INNER JOIN devices d ON r1.device_id = d.id
    ORDER BY r1.device_id
  `);

  return function findLatestReadingPerDevice() {
    return stmt.all();
  };
}

function createFindReadingsByRoomAndTimeRange(db) {
  const stmt = db.prepare(`
    SELECT * FROM readings_raw 
    WHERE room_id = ? AND ts >= ? AND ts <= ?
    ORDER BY ts ASC
  `);

  return function findReadingsByRoomAndTimeRange(roomId, fromTs, toTs) {
    return stmt.all(roomId, fromTs, toTs);
  };
}

// ====== DEVICE PLACEMENT OPERATIONS ======

function createInsertDevicePlacement(db) {
  const stmt = db.prepare(`
    INSERT INTO device_room_placements (device_id, room_id, from_ts, to_ts)
    VALUES (?, ?, ?, ?)
  `);

  return function insertDevicePlacement(placementData) {
    return stmt.run(
      placementData.device_id, // Internal ID, already resolved
      placementData.room_id,
      placementData.from_ts,
      placementData.to_ts || null
    );
  };
}

function createFindCurrentDevicePlacement(db) {
  const stmt = db.prepare(`
    SELECT p.* FROM device_room_placements p
    JOIN devices d ON p.device_id = d.id 
    WHERE d.uid = ? AND p.to_ts IS NULL
    ORDER BY p.from_ts DESC 
    LIMIT 1
  `);

  return function findCurrentDevicePlacement(uid) {
    return stmt.get(uid) || null;
  };
}
