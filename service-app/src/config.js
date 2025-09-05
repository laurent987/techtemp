/**
 * @file Reads/validates configuration from environment variables.
 * Public JSDoc to ease a future migration to TypeScript.
 */

import Joi from 'joi';

/**
 * @typedef {Object} AppConfig
 * @property {'development'|'test'|'production'} nodeEnv
 * @property {string} dbPath                 - SQLite file path
 * @property {string} mqttUrl                - Broker URL (e.g., mqtt://localhost:1883)
 * @property {string=} mqttUsername
 * @property {string=} mqttPassword
 * @property {number} httpPort               - HTTP port (e.g., 3000)
 * @property {string} topicReadingPattern    - Glob/regex for sensor topic
 */

/** Validation schema for process.env. */
export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  DB_PATH: Joi.string().required(),
  MQTT_URL: Joi.string().uri({ scheme: ['mqtt', 'mqtts', 'ws', 'wss'] }).required(),
  MQTT_USERNAME: Joi.string().optional(),
  MQTT_PASSWORD: Joi.string().optional(),
  HTTP_PORT: Joi.number().port().required(),
  TOPIC_READING_PATTERN: Joi.string().default('home/+/sensors/+/reading'),
}).unknown(true);

/**
 * Load and validate configuration from process.env.
 * @returns {AppConfig}
 * @throws {Error} if a required variable is missing/invalid
 * @example
 * const cfg = loadConfig();
 */
export function loadConfig() {
  throw new Error('NotImplemented');
}
