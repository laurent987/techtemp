import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healthRouter } from '../../src/http/routes/health.js';
import { initDb } from '../../src/db/index.js';
import { createRepository } from '../../src/repositories/index.js';
import express from 'express';
import { createHttpServer } from '../../src/http/server.js';

describe('Health Route', () => {
  let app;
  let repo;
  let db;
  let server;
  let serverInstance;

  beforeEach(async () => {
    // Create in-memory database for testing
    db = initDb(':memory:');
    repo = createRepository(db);

    // Create Express app with health route
    app = express();
    app.use(express.json());
    app.use('/health', healthRouter({ repo }));
  });

  afterEach(async () => {
    if (db) {
      db.close();
    }
    if (serverInstance) {
      await new Promise((resolve) => {
        serverInstance.close(resolve);
      });
      serverInstance = null;
    }
  });

  describe('Health Router Creation', () => {
    it('should create health router with dependencies', () => {
      const router = healthRouter({ repo });
      expect(router).toBeDefined();
      expect(typeof router).toBe('function'); // Express router is a function
    });

    it('should handle missing dependencies gracefully', () => {
      expect(() => healthRouter({})).not.toThrow();
      expect(() => healthRouter()).not.toThrow();
    });
  });

  describe('GET /health', () => {
    it('should return status ok when database is accessible', async () => {
      // Make a request to /health
      const request = await import('supertest');
      const response = await request.default(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok'
      });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return status failed when database is not accessible', async () => {
      // Close the database to simulate failure
      db.close();

      const request = await import('supertest');
      const response = await request.default(app)
        .get('/health')
        .expect(500);

      expect(response.body).toEqual({
        status: 'failed'
      });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle database errors gracefully', async () => {
      // Create a router with invalid repo (null)
      const invalidApp = express();
      invalidApp.use(express.json());
      invalidApp.use('/health', healthRouter({ repo: null }));

      const request = await import('supertest');
      const response = await request.default(invalidApp)
        .get('/health')
        .expect(200); // Should return 200 when no repo is provided

      expect(response.body).toEqual({
        status: 'ok'
      });
    });
  });

  describe('Integration with HTTP Server', () => {
    it('should work with createHttpServer', async () => {
      // Create HTTP server with health route
      const config = {
        http: { port: 0 },
        deps: { repo }
      };

      server = createHttpServer(config);
      const result = await server.start();
      serverInstance = result.server;

      // Test the health endpoint
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${result.port}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });
});
