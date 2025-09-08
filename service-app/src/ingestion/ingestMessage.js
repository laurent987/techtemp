/**
 * @file MQTT message ingestion pipeline orchestration
 * Phase 3 of Journal #004 - MQTT Ingestion Pipeline
 */

import { buildTopicParser } from './parseTopic.js';
import { validateReading } from './validateReading.js';
import crypto from 'crypto';

// Create a parser for the standard MQTT topic pattern used in tests
const parseTopic = buildTopicParser('sensors/{deviceId}/readings');

/**
 * @typedef {Object} IngestResult
 * @property {boolean} success - Whether ingestion succeeded
 * @property {string} deviceId - ID of the device that sent the message
 * @property {Object} reading - Normalized reading data
 * @property {number} insertId - Database row ID of inserted reading
 * @property {boolean} [deviceCreated] - Whether device was auto-created
 * @property {boolean} [retained] - Whether message was retained
 */

/**
 * Ingest complete MQTT message through the full pipeline
 * @param {string} topic - MQTT topic (e.g. 'sensors/temp001/readings')
 * @param {Object} payload - Raw MQTT payload object
 * @param {Object} options - MQTT message options (retain, qos, etc.)
 * @param {Object} repository - Repository instance for database operations
 * @returns {Promise<IngestResult>} Result of ingestion with metadata
 * @throws {Error} if any pipeline step fails
 * @example
 * const result = await ingestMessage(
 *   'sensors/temp001/readings',
 *   { temperature_c: 23.5, humidity_pct: 65.2, timestamp: '2025-09-07T10:30:00Z' },
 *   { retain: false, qos: 1 },
 *   repository
 * );
 * // → { success: true, deviceId: 'temp001', reading: {...}, insertId: 42 }
 */
export async function ingestMessage(topic, payload, options = {}, repository) {
  // Step 1: Parse MQTT topic to extract device information
  const parsedTopic = parseTopic(topic);

  // Step 2: Validate and transform payload
  const validatedReading = validateReading(payload);

  // Step 3: Check if device exists or create it
  let device = await repository.devices.findById(parsedTopic.deviceId);
  let deviceCreated = false;

  if (!device) {
    // Auto-create device if it doesn't exist
    device = await repository.devices.create({
      device_id: parsedTopic.deviceId,
      device_uid: `AUTO_${parsedTopic.deviceId}`,
      room_id: null,
      last_seen: validatedReading.ts,
      label: 'Auto-discovered sensor',
      model: 'unknown'
    });
    deviceCreated = true;
  }

  // Step 4: Generate message ID for deduplication
  const msgId = generateMessageId(parsedTopic.deviceId, validatedReading);

  // Step 5: Prepare reading data for database
  const readingData = {
    device_id: parsedTopic.deviceId,
    room_id: device.room_id,
    temperature: validatedReading.temperature,
    humidity: validatedReading.humidity,
    ts: validatedReading.ts,
    source: 'mqtt',
    msg_id: msgId
  };

  // Step 6: Insert reading into database
  const insertResult = await repository.readings.create(readingData);

  // Step 7: Update device last seen timestamp
  await repository.devices.updateLastSeen(parsedTopic.deviceId, validatedReading.ts);

  // Step 8: Return comprehensive result
  const result = {
    success: true,
    deviceId: parsedTopic.deviceId,
    reading: {
      temperature: validatedReading.temperature,
      humidity: validatedReading.humidity,
      ts: validatedReading.ts
    },
    insertId: insertResult.lastInsertRowid
  };

  if (deviceCreated) {
    result.deviceCreated = true;
  } else {
    result.deviceCreated = false;
  }

  if (options.retain) {
    result.retained = true;
  }

  return result;
}

/**
 * Generate consistent message ID for deduplication
 * @param {string} deviceId - Device identifier
 * @param {Object} reading - Normalized reading data
 * @returns {string} 32-character hex hash for message deduplication
 */
function generateMessageId(deviceId, reading) {
  const payload = JSON.stringify({ deviceId, ...reading });
  return crypto.createHash('md5').update(payload).digest('hex');
}
