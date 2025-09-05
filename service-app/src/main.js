/**
 * @file App bootstrap: loads config, initializes DB, MQTT and HTTP.
 * Orchestrates lifecycle (start/stop) and signal handling.
 */

import { loadConfig } from './config.js';
import { initDb, closeDb } from './db/index.js';
import { createMqttClient } from './mqtt/client.js';
import { createHttpServer } from './http/server.js';

/**
 * Start the application.
 * @returns {Promise<{stop: () => Promise<void>}>}
 * @pre NODE_ENV, DB_PATH, MQTT_URL, HTTP_PORT are valid (see config.js)
 * @post HTTP is listening, MQTT subscribed, DB opened (WAL/foreign_keys enabled)
 * @throws {Error} if any subsystem fails to initialize
 * @sideeffects opens network sockets, DB files, process timers
 */
export async function start() {
  throw new Error('NotImplemented');
}

if (import.meta.main) {
  // Direct execution support: node src/main.js
  start().catch((err) => {
    console.error('[FATAL] Startup failed:', err);
    process.exit(1);
  });
}
