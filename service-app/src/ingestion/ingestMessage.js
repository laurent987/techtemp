/**
 * @file Ingestion pipeline: (topic, payload) → validation → DB write.
 */

import { validateReadingPayload } from './validateReading.js';
import { buildTopicParser } from './parseTopic.js';

/**
 * Build a parameterized ingestor (DB + topic parser).
 * @param {{ repo: import('../../db/index.js').DbRepo, parseTopic: (topic: string) => import('../types.js').ParsedTopic }} deps
 * @returns {(topic: string, payloadBuf: Buffer) => Promise<import('../types.js').IngestionResult>}
 * @pre deps.repo operational; deps.parseTopic consistent with MQTT contract
 * @post on success: 1 row inserted into readings (creates device if needed)
 * @throws {Error} if parse/validation/DB write fails
 * @sideeffects writes to the database
 */
export function createIngestor(deps) {
  throw new Error('NotImplemented');
}
