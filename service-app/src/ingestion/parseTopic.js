/**
 * @file Parse/validate MQTT topic → { homeId, deviceId } according to contract.
 */

import { pathToRegexp } from 'path-to-regexp';

/**
 * Build a topic parser from an express-like pattern,
 * e.g., "home/:homeId/sensors/:deviceId/reading".
 * @param {string} pattern
 * @returns {(topic: string) => import('../types.js').ParsedTopic}
 * @throws {Error} if the topic doesn't match or fields are invalid
 */
export function buildTopicParser(pattern) {
  throw new Error('NotImplemented');
}
