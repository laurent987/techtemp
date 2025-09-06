/**
 * @file Data Access Layer - Phase 3
 * SQL operations layer between Repository and Database
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
    updateDeviceLastSeen: createUpdateDeviceLastSeen(db),

    // Room operations  
    insertRoom: createInsertRoom(db),
    findRoomById: createFindRoomById(db),

    // Reading operations
    insertReading: createInsertReading(db),
    findLatestReadingByDevice: createFindLatestReadingByDevice(db),
    findReadingsByRoomAndTimeRange: createFindReadingsByRoomAndTimeRange(db)
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
 * @property {Function} findReadingsByRoomAndTimeRange
 */

// ====== DEVICE OPERATIONS ======

function createInsertDevice(db) {
  const stmt = db.prepare(`
    INSERT INTO devices (device_id, device_uid, label, model, created_at, last_seen_at, offset_temperature, offset_humidity)
    VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)
  `);

  return function insertDevice(deviceData) {
    return stmt.run(
      deviceData.device_id,
      deviceData.device_uid,
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
    SELECT * FROM devices WHERE device_id = ?
  `);

  return function findDeviceById(deviceId) {
    return stmt.get(deviceId) || null;
  };
}

function createUpdateDeviceLastSeen(db) {
  const stmt = db.prepare(`
    UPDATE devices SET last_seen_at = ? WHERE device_id = ?
  `);

  return function updateDeviceLastSeen(deviceId, timestamp) {
    return stmt.run(timestamp, deviceId);
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
    SELECT * FROM readings_raw 
    WHERE device_id = ? 
    ORDER BY ts DESC 
    LIMIT 1
  `);

  return function findLatestReadingByDevice(deviceId) {
    return stmt.get(deviceId) || null;
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
