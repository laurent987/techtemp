/**
 * @file Shared internal contracts via JSDoc typedefs.
 */

/** @typedef {{ homeId: string, deviceId: string }} ParsedTopic */

/**
 * @typedef {Object} ReadingPayload
 * @property {number} ts             - Epoch ms (UTC)
 * @property {number} temperature_c
 * @property {number} humidity_pct
 * @property {Record<string, any>=} extra
 */

/**
 * @typedef {Object} ReadingRow
 * @property {string} device_id
 * @property {string} home_id
 * @property {number} ts_utc
 * @property {number} temperature_c
 * @property {number} humidity_pct
 * @property {string} raw_payload
 */

/** @typedef {{ id: string, home_id: string, name?: string }} DeviceRow */

/** @typedef {{ inserted: number, deviceId: string, ts_utc: number }} IngestionResult */
