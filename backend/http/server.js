/**
 * @file Express server creation + routes wiring.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.js';
import { readingsRouter } from './routes/readings.js';
import { devicesRouter } from './routes/devices.js';
import { roomsRouter } from './routes/rooms.js';

/**
 * Create and start an HTTP server.
 * @param {{ http?: { port?: number }, deps?: RouteDeps }} config
 * @returns {{ start: () => Promise<{ success: boolean, port: number, server: object }>, stop: () => Promise<{ success: boolean }>, getApp: () => import('express').Express }}
 * @typedef {Object} RouteDeps
 * @property {import('../../db/index.js').DbRepo} repo
 */
export function createHttpServer(config = {}) {
  const app = express();
  let server = null;

  // Middleware
  app.use(express.json());

  // Permissive CORS — lets a separately hosted dashboard talk to the API.
  // Tighten the origin via config if exposing the API beyond a trusted LAN.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Static web UI: serve `web/` first (deploy artifact, may hold a built dashboard),
  // then fall back to the buildless reference example in `web-example/`.
  // Express's static middleware silently skips missing directories, so the
  // fallback works even when `web/` is empty or absent.
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const webDir = path.resolve(__dirname, '../../web');
    const exampleDir = path.resolve(__dirname, '../../web-example');
    app.use(express.static(webDir));
    app.use(express.static(exampleDir));
  } catch (err) {
    // Non-fatal: if no web dirs are present, the API still works
    // eslint-disable-next-line no-console
    console.warn('Static web directory mounting skipped:', err?.message || err);
  }

  // Routes setup
  app.use('/health', healthRouter(config.deps || {}));
  app.use('/api/v1/readings', readingsRouter(config.deps || {}));
  app.use('/api/v1/devices', devicesRouter(config.deps || {}));
  app.use('/api/v1/rooms', roomsRouter(config.deps || {}));

  return {
    /**
     * Start the HTTP server
     * @returns {Promise<{ success: boolean, port: number, server: object }>}
     */
    async start() {
      return new Promise((resolve, reject) => {
        const port = config.http?.port || 0; // 0 = random available port

        server = app.listen(port, (err) => {
          if (err) {
            reject(err);
            return;
          }

          const actualPort = server.address().port;
          resolve({
            success: true,
            port: actualPort,
            server: server
          });
        });
      });
    },

    /**
     * Stop the HTTP server
     * @returns {Promise<{ success: boolean }>}
     */
    async stop() {
      if (!server) {
        return { success: true };
      }

      return new Promise((resolve) => {
        server.close(() => {
          server = null;
          resolve({ success: true });
        });
      });
    },

    /**
     * Get the Express app instance
     * @returns {import('express').Express}
     */
    getApp() {
      return app;
    }
  };
}
