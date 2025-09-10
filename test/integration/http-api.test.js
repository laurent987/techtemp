/**
 * End-to-end HTTP API Integration Tests
 * Tests complete pipeline: MQTT → Database → HTTP API
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { initDb, closeDb } from '../../src/db/index.js';
import { createRepository } from '../../src/repositories/index.js';
import { ingestMessage } from '../../src/ingestion/index.js';
import { config } from '../../src/config.js';

describe('HTTP API End-to-End Integration', () => {
  let httpServer;
  let database;
  let repository;
  let serverUrl;

  beforeEach(async () => {
    // Use test database
    const testDbPath = ':memory:';
    database = initDb(testDbPath);
    repository = createRepository(database);

    // Start HTTP server
    httpServer = createHttpServer({
      http: { port: 0 }, // Random available port
      deps: { repo: repository }
    });

    const result = await httpServer.start();
    serverUrl = `http://localhost:${result.port}`;
  });

  afterEach(async () => {
    if (httpServer) {
      await httpServer.stop();
    }
    if (database) {
      await closeDb();
    }
  });

  describe('Complete Pipeline: MQTT → DB → HTTP', () => {
    it('should handle complete data flow from MQTT message to HTTP response', async () => {
      // Step 1: Simulate MQTT message ingestion
      const mqttMessage = {
        topic: 'home/home-001/sensors/sensor-001/reading',
        payload: {
          device_id: 'sensor-001',
          ts: 1757442988279,
          temperature_c: 22.5,
          humidity_pct: 65.0
        }
      };

      // Ingest the message (MQTT → DB)
      await ingestMessage(mqttMessage.topic, mqttMessage.payload, {}, repository);

      // Step 2: Verify data via HTTP API (DB → HTTP)
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            device_id: 'sensor-001',
            room_id: null, // Auto-created devices have null room_id
            ts: expect.any(String),
            temperature: 22.5,
            humidity: 65.0
          })
        ])
      });
    });

    it('should handle multiple devices in complete pipeline', async () => {
      // Step 1: Ingest multiple MQTT messages
      const messages = [
        {
          topic: 'home/home-001/sensors/sensor-001/reading',
          payload: {
            device_id: 'sensor-001',
            ts: 1757442988279,
            temperature_c: 22.5,
            humidity_pct: 65.0
          }
        },
        {
          topic: 'home/home-001/sensors/sensor-002/reading',
          payload: {
            device_id: 'sensor-002',
            ts: 1757442988279,
            temperature_c: 24.0,
            humidity_pct: 58.0
          }
        },
        {
          topic: 'home/home-001/sensors/sensor-003/reading',
          payload: {
            device_id: 'sensor-003',
            ts: 1757442988279,
            temperature_c: 26.5,
            humidity_pct: 72.0
          }
        }
      ];

      // Ingest all messages
      for (const msg of messages) {
        await ingestMessage(msg.topic, msg.payload, {}, repository);
      }

      // Step 2: Verify all devices via HTTP API
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(3);

      // Verify each device is present
      const devices = data.data.map(reading => reading.device_id);
      expect(devices).toContain('sensor-001');
      expect(devices).toContain('sensor-002');
      expect(devices).toContain('sensor-003');
    });

    it('should return latest reading when multiple readings exist for same device', async () => {
      // Step 1: Ingest older reading
      await ingestMessage('home/home-001/sensors/sensor-001/reading', {
        device_id: 'sensor-001',
        ts: 1757442988000, // Earlier timestamp
        temperature_c: 20.0,
        humidity_pct: 60.0
      }, {}, repository);

      // Step 2: Ingest newer reading
      await ingestMessage('home/home-001/sensors/sensor-001/reading', {
        device_id: 'sensor-001',
        ts: 1757442989000, // Later timestamp,
        temperature_c: 23.0,
        humidity_pct: 68.0
      }, {}, repository);

      // Step 3: Verify latest reading via HTTP API
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        device_id: 'sensor-001',
        temperature: 23.0,
        humidity: 68.0
      });
    });

    it('should handle device filtering in complete pipeline', async () => {
      // Step 1: Ingest multiple devices
      await ingestMessage('home/home-001/sensors/sensor-001/reading', {
        device_id: 'sensor-001',
        ts: 1757442988279,
        temperature_c: 22.5,
        humidity_pct: 65.0
      }, {}, repository);

      await ingestMessage('home/home-001/sensors/sensor-002/reading', {
        device_id: 'sensor-002',
        ts: 1757442988279,
        temperature_c: 24.0,
        humidity_pct: 58.0
      }, {}, repository);

      // Step 2: Test device filtering via HTTP API
      const response = await fetch(`${serverUrl}/api/v1/readings/latest?deviceId=sensor-001`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].device_id).toBe('sensor-001');
    });
  });

  describe('Health Endpoint Integration', () => {
    it('should report healthy status when database is connected', async () => {
      const response = await fetch(`${serverUrl}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ status: 'ok' });
    });

    it('should report database connectivity via health endpoint', async () => {
      // First verify health is ok
      let response = await fetch(`${serverUrl}/health`);
      expect(response.status).toBe(200);

      // Insert some data and verify health still works
      await ingestMessage('home/test-home/sensors/test-sensor/reading', {
        device_id: 'test-sensor',
        ts: 1757442988279,
        temperature_c: 20.0,
        humidity_pct: 50.0
      }, {}, repository);

      response = await fetch(`${serverUrl}/health`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API requests when database is empty', async () => {
      // No data ingested - database is empty
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        data: []
      });
    });

    it('should handle invalid MQTT data gracefully', async () => {
      // Step 1: Try to ingest invalid data (should fail gracefully)
      const invalidMessage = {
        topic: 'temperature/bedroom',
        payload: 'invalid-json'
      };

      // This should not crash but handle the error
      await expect(
        ingestMessage('invalid-topic', 'invalid-json', {}, repository)
      ).rejects.toThrow();

      // Step 2: Verify HTTP API still works
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toEqual([]);
    });
  });

  describe('Performance Integration', () => {
    it('should handle API requests efficiently with larger dataset', async () => {
      // Step 1: Ingest multiple readings for performance test
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await ingestMessage(`home/home-001/sensors/sensor-${String(i % 10).padStart(3, '0')}/reading`, {
          device_id: `sensor-${String(i % 10).padStart(3, '0')}`,
          ts: Date.now() + i * 10, // Add offset to ensure uniqueness
          temperature_c: 20 + Math.random() * 10,
          humidity_pct: 50 + Math.random() * 30
        }, {}, repository);
      }

      const ingestionTime = Date.now() - startTime;
      console.log(`Ingestion of 50 readings took: ${ingestionTime}ms`);

      // Step 2: Measure API response time
      const apiStartTime = Date.now();
      const response = await fetch(`${serverUrl}/api/v1/readings/latest`);
      const apiTime = Date.now() - apiStartTime;

      console.log(`API response time: ${apiTime}ms`);

      expect(response.status).toBe(200);
      expect(apiTime).toBeLessThan(100); // API should respond in under 100ms

      const data = await response.json();
      expect(data.data.length).toBe(10); // 10 unique devices
    });
  });
});
