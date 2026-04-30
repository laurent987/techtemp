/**
 * @file App bootstrap: loads config, initializes DB, MQTT and HTTP.
 * Orchestrates lifecycle (start/stop) and signal handling.
 */

import { loadConfig } from './config.js';
import { initDb, closeDb } from './db/index.js';
import { createMqttClient } from './mqtt/client.js';
import { createHttpServer } from './http/server.js';
import { isMainModule } from './is-main.js';
import { logger } from './logger.js';
import { healthMonitor } from './health.js';
import { createRepository } from './repositories/index.js';
import { ingestMessage } from './ingestion/index.js';

/**
 * Start the application.
 * @returns {Promise<{stop: () => Promise<void>}>}
 * @pre NODE_ENV, DB_PATH, MQTT_URL, HTTP_PORT are valid (see config.js)
 * @post HTTP is listening, MQTT subscribed, DB opened (WAL/foreign_keys enabled)
 * @throws {Error} if any subsystem fails to initialize
 * @sideeffects opens network sockets, DB files, process timers
 */
export async function start() {
  // 1. Charger la configuration
  const config = loadConfig();
  logger.info('Configuration loaded', { nodeEnv: config.nodeEnv });

  // 2. Initialiser la base de données
  const db = initDb(config.dbPath);
  logger.info('Database initialized', { dbPath: config.dbPath });

  // 3. Créer le repository
  const repo = createRepository(db);
  logger.info('Repository created');

  // 4. Initialiser le client MQTT
  const mqtt = createMqttClient({
    url: config.mqttUrl,
    username: config.mqttUsername,
    password: config.mqttPassword
  });
  logger.info('MQTT client connected', { mqttUrl: config.mqttUrl });

  // 4.1 Configurer l'ingestion MQTT → Base de données
  const unsubscribeIngestion = mqtt.onMessage(async (topic, payload, packet) => {
    try {
      const payloadStr = payload.toString();
      const payloadObj = JSON.parse(payloadStr);

      const result = await ingestMessage(topic, payloadObj, {
        retain: packet.retain,
        qos: packet.qos
      }, repo);

      logger.info('MQTT message ingested', {
        topic,
        deviceId: result.deviceId,
        deviceCreated: result.deviceCreated,
        insertId: result.insertId
      });

      // Incrémenter les métriques
      healthMonitor.incrementMetric('mqttMessages');

    } catch (error) {
      logger.error('MQTT ingestion failed', {
        topic,
        error: error.message,
        payload: payload.toString()
      });
      healthMonitor.incrementMetric('errors');
    }
  });

  // 4.2 S'abonner au pattern de topics configuré
  await mqtt.subscribe(config.topicReadingPattern);
  logger.info('MQTT subscribed to topics', { pattern: config.topicReadingPattern });

  // 5. Démarrer le serveur HTTP
  const httpServer = createHttpServer({
    http: { port: config.httpPort },
    deps: { repo } // ✅ Repository injecté !
  });
  const httpResult = await httpServer.start();
  logger.info('HTTP server listening', {
    httpPort: httpResult.port,
    actualPort: httpResult.port
  });

  // 6. Configurer le monitoring de santé
  healthMonitor.registerService('database', async () => {
    try {
      // Simple check: can we execute a query?
      db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  });

  healthMonitor.registerService('mqtt', async () => {
    return mqtt.client.connected;
  });

  healthMonitor.registerService('http', async () => {
    return httpServer && httpResult && httpResult.success;
  });

  logger.info('All services started successfully', {
    services: ['database', 'repository', 'mqtt', 'http', 'ingestion'],
    uptime: 0
  });

  // 7. Retourner un objet de contrôle (pour tests et shutdown)
  return {
    stop: async () => {
      logger.info('Shutting down services...');
      if (unsubscribeIngestion) unsubscribeIngestion();
      if (httpServer && httpServer.stop) await httpServer.stop();
      if (mqtt && mqtt.disconnect) await mqtt.disconnect();
      if (db && db.close) await db.close();
      logger.info('All services stopped');
    },
    health: () => healthMonitor.checkHealth(),
    metrics: () => healthMonitor.getMetrics()
  };
}

if (isMainModule(import.meta)) {
  // Direct execution support: node src/main.js
  let app;
  start()
    .then((instance) => {
      app = instance;
      // Gestion des signaux pour shutdown propre
      const shutdown = async (signal) => {
        logger.info(`Signal received, shutting down gracefully`, { signal });
        try {
          await app.stop();
          logger.info('Shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { error: err.message, stack: err.stack });
          process.exit(1);
        }
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      logger.error('Startup failed', { error: err.message, stack: err.stack });
      process.exit(1);
    });
}
