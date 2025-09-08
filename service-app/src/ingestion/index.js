/**
 * @file Ingestion module exports
 */

import { buildTopicParser } from './parseTopic.js';
import { validateReading } from './validateReading.js';
import { ingestMessage } from './ingestMessage.js';

// Create default parser with contract topic pattern
const parseTopic = buildTopicParser('sensors/{deviceId}/readings');

export {
  buildTopicParser,
  parseTopic,
  validateReading,
  ingestMessage
};
