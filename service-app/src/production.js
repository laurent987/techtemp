#!/usr/bin/env node

/**
 * @file Production-ready startup script with health monitoring.
 * Example: NODE_ENV=production DB_PATH=./prod.db MQTT_URL=mqtt://broker:1883 HTTP_PORT=3000 node production.js
 */

import { start } from './main.js';
import { logger } from './logger.js';

async function startProduction() {
  try {
    const app = await start();

    // Health check endpoint simulation (could be exposed via HTTP)
    setInterval(async () => {
      const health = await app.health();
      logger.info('Health check', health);

      if (health.status === 'unhealthy') {
        logger.error('Service is unhealthy, consider restarting');
      }
    }, 60000); // Every minute

    // Metrics logging
    setInterval(() => {
      const metrics = app.metrics();
      logger.info('Service metrics', metrics);
    }, 300000); // Every 5 minutes

    logger.info('Production service started with monitoring');

  } catch (error) {
    logger.error('Failed to start production service', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startProduction();
