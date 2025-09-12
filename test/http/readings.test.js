import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readingsRouter } from '../../backend/http/routes/readings.js';
import { initDb } from '../../backend/db/index.js';
import { createRepository } from '../../backend/repositories/index.js';
import express from 'express';
import { createHttpServer } from '../../backend/http/server.js';

describe('Readings API', () => {
  let app;
  let repo;
  let db;
  let server;
  let serverInstance;

  beforeEach(async () => {
    // Create in-memory database for testing
    db = initDb(':memory:');
    repo = createRepository(db);

    // Create sample data
    await repo.rooms.create({ uid: 'living-room', name: 'Living Room' });
    await repo.rooms.create({ uid: 'bedroom', name: 'Bedroom' });

    await repo.devices.create({
      uid: 'temp-001',
      label: 'Living Room Sensor'
    });
    await repo.devices.create({
      uid: 'temp-002',
      label: 'Bedroom Sensor'
    });

    // Create Express app with readings route
    app = express();
    app.use(express.json());
    app.use('/api/v1/readings', readingsRouter({ repo }));
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

  describe('Readings Router Creation', () => {
    it('should create readings router with dependencies', () => {
      const router = readingsRouter({ repo });
      expect(router).toBeDefined();
      expect(typeof router).toBe('function'); // Express router is a function
    });

    it('should handle missing repository', () => {
      expect(() => readingsRouter({})).not.toThrow();
      expect(() => readingsRouter()).not.toThrow();
    });
  });

  describe('GET /api/v1/readings/latest', () => {
    it('should return empty data when no readings exist', async () => {
      const request = await import('supertest');
      const response = await request.default(app)
        .get('/api/v1/readings/latest')
        .expect(200);

      expect(response.body).toEqual({ data: [] });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return latest readings when data exists', async () => {
      // Create sample readings
      const now = new Date();
      await repo.readings.create({
        uid: 'temp-001',
        room_id: 'living-room',
        ts: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
        temperature: 22.5,
        humidity: 45.0,
        source: 'mqtt'
      });
      await repo.readings.create({
        uid: 'temp-001',
        room_id: 'living-room',
        ts: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago (older)
        temperature: 22.0,
        humidity: 44.0,
        source: 'mqtt'
      });
      await repo.readings.create({
        uid: 'temp-002',
        room_id: 'bedroom',
        ts: new Date(now.getTime() - 3 * 60 * 1000).toISOString(), // 3 min ago
        temperature: 20.1,
        humidity: 50.2,
        source: 'mqtt'
      });

      const request = await import('supertest');
      const response = await request.default(app)
        .get('/api/v1/readings/latest')
        .expect(200);

      expect(response.body.data).toHaveLength(2); // Latest for each device

      // Find readings by device
      const temp001Reading = response.body.data.find(r => r.device_id === 'temp-001');
      const temp002Reading = response.body.data.find(r => r.device_id === 'temp-002');

      // Check temp-001 (should be the latest, not the older one)
      expect(temp001Reading).toEqual({
        room_id: 'living-room',
        device_id: 'temp-001', // API returns device_id (UID value) for backward compatibility
        ts: expect.any(String),
        temperature: 22.5,
        humidity: 45.0
      });

      // Check temp-002
      expect(temp002Reading).toEqual({
        room_id: 'bedroom',
        device_id: 'temp-002', // API returns device_id (UID value) for backward compatibility
        ts: expect.any(String),
        temperature: 20.1,
        humidity: 50.2
      });
    });

    it('should filter by deviceId when provided', async () => {
      // Create readings for both devices
      const now = new Date();
      await repo.readings.create({
        uid: 'temp-001',
        room_id: 'living-room',
        ts: now.toISOString(),
        temperature: 22.5,
        humidity: 45.0,
        source: 'mqtt'
      });
      await repo.readings.create({
        uid: 'temp-002',
        room_id: 'bedroom',
        ts: now.toISOString(),
        temperature: 20.1,
        humidity: 50.2,
        source: 'mqtt'
      });

      const request = await import('supertest');
      const response = await request.default(app)
        .get('/api/v1/readings/latest?deviceId=temp-001')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].device_id).toBe('temp-001');
      expect(response.body.data[0].temperature).toBe(22.5);
    });

    it('should return error when repository is not configured', async () => {
      const appNoRepo = express();
      appNoRepo.use(express.json());
      appNoRepo.use('/api/v1/readings', readingsRouter({}));

      const request = await import('supertest');
      const response = await request.default(appNoRepo)
        .get('/api/v1/readings/latest')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Repository not configured'
      });
    });
  });

  describe('Integration with HTTP Server', () => {
    it('should work with createHttpServer', async () => {
      // Create sample reading
      await repo.readings.create({
        uid: 'temp-001',
        room_id: 'living-room',
        ts: new Date().toISOString(),
        temperature: 23.0,
        humidity: 46.0,
        source: 'mqtt'
      });

      // Create HTTP server with readings route
      const config = {
        http: { port: 0 },
        deps: { repo }
      };

      server = createHttpServer(config);
      const result = await server.start();
      serverInstance = result.server;

      // Test the readings endpoint
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${result.port}/api/v1/readings/latest`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].device_id).toBe('temp-001');
      expect(data.data[0].temperature).toBe(23.0);
    });
  });
});
