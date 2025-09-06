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
  HTTP_PORT: Joi.string().pattern(/^\d+$/).required(), // String containing a number
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
  // Valider l'environnement avec le schéma Joi
  const { error, value } = configSchema.validate(process.env);

  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  // Convertir et valider le port
  const httpPort = Number(value.HTTP_PORT);
  if (httpPort < 1 || httpPort > 65535) {
    throw new Error('HTTP_PORT must be a valid port number (1-65535)');
  }

  // Transformer et mapper vers l'objet de configuration
  return {
    nodeEnv: value.NODE_ENV,
    dbPath: value.DB_PATH,
    mqttUrl: value.MQTT_URL,
    mqttUsername: value.MQTT_USERNAME,
    mqttPassword: value.MQTT_PASSWORD,
    httpPort: httpPort,
    topicReadingPattern: value.TOPIC_READING_PATTERN
  };
}
