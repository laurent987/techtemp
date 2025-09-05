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
 * Initialize the database and prepare statements.
 * @param {string} dbPath
 * @returns {{ db: Database.Database, repo: DbRepo }}
 * @pre dbPath is writable (creates file if absent)
 * @post PRAGMA wal_mode=ON, foreign_keys=ON
 */
export function initDb(dbPath) {
  throw new Error('NotImplemented');
}

/** Gracefully close the database if open. */
export function closeDb() {
  throw new Error('NotImplemented');
}

/**
 * Repository contract.
 * @typedef {Object} DbRepo
 * @property {(row: DeviceRow) => void} upsertDevice
 * @property {(row: ReadingRow) => void} insertReading
 * @property {(homeId: string, deviceId: string) => ReadingRow | null} getLatestReading
 * @property {() => Promise<void>} migrateIfNeeded
 */

/**
 * Create a repository bound to the DB connection.
 * @param {Database.Database} db
 * @returns {DbRepo}
 */
export function createRepo(db) {
  throw new Error('NotImplemented');
}
