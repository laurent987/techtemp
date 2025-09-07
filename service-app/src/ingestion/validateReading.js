/**
 * @file Validate/transform MQTT payloads → normalized reading data
 * Phase 2 of Journal #004 - MQTT Ingestion Pipeline
 */

/**
 * @typedef {Object} RawReading Raw MQTT payload from sensor
 * @property {number} temperature_c Temperature in Celsius
 * @property {number} humidity_pct Humidity percentage
 * @property {string} timestamp ISO timestamp string
 */

/**
 * @typedef {Object} ValidatedReading Normalized reading for database
 * @property {number} temperature Temperature in Celsius
 * @property {number} humidity Humidity percentage (0-100)
 * @property {string} ts ISO timestamp string
 */

/**
 * Validate and transform MQTT sensor payload according to contract
 * @param {RawReading} payload - Raw MQTT payload
 * @returns {ValidatedReading} Validated and normalized reading
 * @throws {Error} if payload is invalid
 * @example
 * const validated = validateReading({
 *   temperature_c: 23.7,
 *   humidity_pct: 52.5,
 *   timestamp: '2025-09-07T10:30:00Z'
 * });
 * // → { temperature: 23.7, humidity: 52.5, ts: '2025-09-07T10:30:00Z' }
 */
export function validateReading(payload) {
  // Step 1: Basic payload validation
  if (payload === null || payload === undefined) {
    throw new Error('Payload is required');
  }

  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload must be an object');
  }

  // Step 2: Validate required fields
  const { temperature_c, humidity_pct, timestamp } = payload;

  if (temperature_c === undefined) {
    throw new Error('temperature_c field is required');
  }

  if (humidity_pct === undefined) {
    throw new Error('humidity_pct field is required');
  }

  if (timestamp === undefined) {
    throw new Error('timestamp field is required');
  }

  // Step 3: Validate field types
  if (typeof temperature_c !== 'number') {
    throw new Error('Temperature must be a number');
  }

  if (typeof humidity_pct !== 'number') {
    throw new Error('Humidity must be a number');
  }

  if (typeof timestamp !== 'string') {
    throw new Error('Timestamp must be a string');
  }

  // Step 4: Validate special number values and ranges
  if (!isFinite(temperature_c) || temperature_c < -40 || temperature_c > 85) {
    throw new Error('Temperature out of valid range (-40°C to 85°C)');
  }

  if (!isFinite(humidity_pct) || humidity_pct < 0 || humidity_pct > 100) {
    throw new Error('Humidity out of valid range (0% to 100%)');
  }

  // Step 5: Validate timestamp format (ISO 8601)
  // Check for basic ISO 8601 format pattern first
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoPattern.test(timestamp)) {
    throw new Error('Timestamp has invalid ISO format');
  }
  
  const timestampDate = new Date(timestamp);
  if (isNaN(timestampDate.getTime())) {
    throw new Error('Timestamp has invalid ISO format');
  }

  // Step 6: Transform and return normalized reading
  return {
    temperature: temperature_c,
    humidity: humidity_pct,
    ts: timestamp
  };
}
