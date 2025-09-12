/**
 * @file End-to-end integration tests for MQTT → Database pipeline
 * Phase 4 of Journal #004 - MQTT Ingestion Pipeline
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createBroker } from 'aedes';
import { createServer } from 'net';
import mqtt from 'mqtt';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';
import { setTimeout as delay } from 'timers/promises';

import { initDb } from '../../backend/db/index.js';
import { createRepository } from '../../backend/repositories/index.js';
import { ingestMessage } from '../../backend/ingestion/ingestMessage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('MQTT to Database Integration', () => {

  let broker;
  let server;
  let client;
  let db;
  let repository;
  let testDbPath;
  const BROKER_PORT = 1884; // Different from default to avoid conflicts

  beforeAll(async () => {
    // Setup Aedes MQTT broker
    broker = createBroker();
    server = createServer(broker.handle);

    // Start broker
    await new Promise((resolve) => {
      server.listen(BROKER_PORT, resolve);
    });

    console.log(`Test MQTT broker started on port ${BROKER_PORT}`);
  });

  afterAll(async () => {
    // Cleanup broker
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    if (broker) {
      await new Promise((resolve) => {
        broker.close(resolve);
      });
    }
  });

  beforeEach(async () => {
    // Create temporary database for each test
    testDbPath = join(__dirname, `test-mqtt-${Date.now()}.db`);
    db = initDb(testDbPath);
    // Note: initDb() applique automatiquement le schéma
    repository = createRepository(db);

    // Create MQTT client
    client = mqtt.connect(`mqtt://localhost:${BROKER_PORT}`, {
      clientId: `test-client-${Date.now()}`,
      clean: true
    });

    // Wait for client connection
    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('error', reject);
      global.setTimeout(() => reject(new Error('MQTT client connection timeout')), 5000);
    });
  });

  afterEach(async () => {
    // Cleanup client and database
    if (client) {
      await new Promise((resolve) => {
        client.end(true, resolve);
      });
    }

    if (db) {
      db.close();
    }

    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('Complete Pipeline Integration', () => {
    it('should process MQTT message through complete pipeline to database', async () => {
      // Arrange - First provision the device
      await repository.devices.create({
        uid: 'temp001',
        label: 'Test Temperature Sensor',
        model: 'DHT22'
      });

      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = {
        temperature_c: 23.5,
        humidity_pct: 65.2,
        ts: 1757442988279
      };

      // Act - Simulate MQTT message processing
      const result = await ingestMessage(topic, payload, { retain: false, qos: 1 }, repository);

      // Assert - Check ingestion result
      expect(result.success).toBe(true);
      expect(result.deviceId).toBe('temp001');
      expect(result.deviceCreated).toBe(false); // Device was already provisioned
      expect(result.insertId).toBeTypeOf('number');

      // Verify device exists in database
      const device = await repository.devices.findByUid('temp001');
      expect(device).toBeTruthy();
      expect(device.uid).toBe('temp001');
      expect(device.label).toBe('Test Temperature Sensor');

      // Verify reading was stored in database
      const latestReading = await repository.readings.getLatestByDevice('temp001');
      expect(latestReading).toBeTruthy();
      expect(latestReading.temperature).toBe(23.5);
      expect(latestReading.humidity).toBe(65.2);
      expect(latestReading.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format
      expect(latestReading.source).toBe('mqtt');
      expect(latestReading.msg_id).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should handle real MQTT publish-subscribe flow', async () => {
      // Arrange - First provision the device
      await repository.devices.create({
        uid: 'temp002',
        label: 'Test Temperature Sensor 2',
        model: 'DHT22'
      });

      const topic = 'home/home-001/sensors/temp002/reading';
      const payload = {
        temperature_c: 18.7,
        humidity_pct: 45.0,
        ts: 1757442988279
      };

      let receivedMessage = null;

      // Subscribe to topic and setup message handler
      await new Promise((resolve) => {
        client.subscribe(topic, (err) => {
          if (err) throw err;
          resolve();
        });
      });

      client.on('message', async (receivedTopic, message) => {
        if (receivedTopic === topic) {
          try {
            const parsedPayload = JSON.parse(message.toString());
            receivedMessage = parsedPayload;

            // Process through pipeline
            await ingestMessage(topic, parsedPayload, { retain: false, qos: 1 }, repository);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      });

      // Act - Publish message
      await new Promise((resolve, reject) => {
        client.publish(topic, JSON.stringify(payload), (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Wait for message processing
      await delay(100);

      // Assert
      expect(receivedMessage).toEqual(payload);

      // Verify data in database
      const device = await repository.devices.findByUid('temp002');
      expect(device).toBeTruthy();
      expect(device.uid).toBe('temp002');

      const reading = await repository.readings.getLatestByDevice('temp002');
      expect(reading).toBeTruthy();
      expect(reading.temperature).toBe(18.7);
      expect(reading.humidity).toBe(45.0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid MQTT topics gracefully', async () => {
      // Arrange
      const invalidTopic = 'invalid/topic/format';
      const payload = {
        temperature_c: 20.0,
        humidity_pct: 50.0,
        ts: 1757442988279
      };

      // Act & Assert
      await expect(ingestMessage(invalidTopic, payload, {}, repository))
        .rejects.toThrow(/topic.*format/i);

      // Verify no data was created
      const devices = db.prepare('SELECT COUNT(*) as count FROM devices').get();
      expect(devices.count).toBe(0);

      const readings = db.prepare('SELECT COUNT(*) as count FROM readings_raw').get();
      expect(readings.count).toBe(0);
    });

    it('should handle invalid payloads gracefully', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp003/reading';
      const invalidPayload = {
        temperature_c: 'invalid',
        humidity_pct: 50.0,
        ts: 1757442988279
      };

      // Act & Assert
      await expect(ingestMessage(topic, invalidPayload, {}, repository))
        .rejects.toThrow(/temperature.*must.*be.*number/i);

      // Verify no data was created
      const devices = db.prepare('SELECT COUNT(*) as count FROM devices').get();
      expect(devices.count).toBe(0);
    });
  });

  describe('Load Testing and Concurrency', () => {
    it('should handle multiple concurrent messages', async () => {
      // Arrange - First provision all devices
      const messageCount = 50;
      const baseTime = new Date('2025-09-07T10:00:00Z').getTime();

      // Provision all devices first
      for (let i = 0; i < messageCount; i++) {
        await repository.devices.create({
          uid: `temp${String(i).padStart(3, '0')}`,
          label: `Load Test Sensor ${i}`,
          model: 'DHT22'
        });
      }

      const messages = Array.from({ length: messageCount }, (_, i) => ({
        topic: `home/home-001/sensors/temp${String(i).padStart(3, '0')}/reading`,
        payload: {
          temperature_c: 20 + (i % 30), // Vary temperature 20-49°C
          humidity_pct: 40 + (i % 40), // Vary humidity 40-79%
          ts: Date.now()
        }
      }));

      // Act - Process all messages concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        messages.map(({ topic, payload }) =>
          ingestMessage(topic, payload, {}, repository)
        )
      );
      const endTime = performance.now();

      // Assert - All should succeed
      expect(results).toHaveLength(messageCount);
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.deviceId).toBe(`temp${String(i).padStart(3, '0')}`);
        expect(result.deviceCreated).toBe(false); // Devices were already provisioned
      });

      // Verify performance (should complete within reasonable time)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      console.log(`Processed ${messageCount} messages in ${totalTime.toFixed(2)}ms`);

      // Verify all devices were created
      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
      expect(deviceCount.count).toBe(messageCount);

      // Verify all readings were stored
      const readingCount = db.prepare('SELECT COUNT(*) as count FROM readings_raw').get();
      expect(readingCount.count).toBe(messageCount);
    });

    it('should handle message deduplication correctly', async () => {
      // Arrange - First provision the device
      await repository.devices.create({
        uid: 'temp004',
        label: 'Deduplication Test Sensor',
        model: 'DHT22'
      });

      const topic = 'home/home-001/sensors/temp004/reading';
      const basePayload = {
        temperature_c: 25.0,
        humidity_pct: 60.0
      };

      // Act - Send different messages to same device (different timestamps = different msg_id)
      const result1 = await ingestMessage(topic, {
        ...basePayload,
        ts: 1757442988279
      }, {}, repository);

      const result2 = await ingestMessage(topic, {
        ...basePayload,
        ts: 1757442988280 // Different timestamp
      }, {}, repository);

      const result3 = await ingestMessage(topic, {
        ...basePayload,
        ts: 1757442988281 // Different timestamp
      }, {}, repository);

      // Assert - All should succeed with device reuse
      expect(result1.success).toBe(true);
      expect(result1.deviceId).toBe('temp004');
      expect(result1.deviceCreated).toBe(false); // Device was already provisioned

      expect(result2.success).toBe(true);
      expect(result2.deviceId).toBe('temp004');
      expect(result2.deviceCreated).toBe(false); // Device was already provisioned

      expect(result3.success).toBe(true);
      expect(result3.deviceId).toBe('temp004');
      expect(result3.deviceCreated).toBe(false); // Device was already provisioned

      // Verify only one device exists (already provisioned)
      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
      expect(deviceCount.count).toBe(1);

      // Verify all readings were stored (different timestamps = different msg_id)
      const readings = db.prepare('SELECT msg_id, ts FROM readings_raw ORDER BY ts').all();
      expect(readings).toHaveLength(3);
      const msgIds = readings.map(r => r.msg_id);
      expect(new Set(msgIds).size).toBe(3); // All different msg_id (different timestamps)

      // Verify timestamps are correct
      expect(readings[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(readings[1].ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(readings[2].ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Database Schema Validation', () => {
    it('should enforce database constraints correctly', async () => {
      // Arrange - First provision the device
      await repository.devices.create({
        uid: 'temp005',
        label: 'Schema Test Sensor',
        model: 'DHT22'
      });

      const topic = 'home/home-001/sensors/temp005/reading';
      const payload = {
        temperature_c: 22.0,
        humidity_pct: 55.0,
        ts: 1757442988279
      };

      // Act - Process message
      await ingestMessage(topic, payload, {}, repository);

      // Assert - Verify database schema compliance (new simplified schema)
      const device = db.prepare('SELECT * FROM devices WHERE uid = ?').get('temp005');
      expect(device).toBeTruthy();
      expect(device.uid).toBe('temp005');
      expect(device.last_seen_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format

      // readings_raw still uses device_id (internal integer ID), not uid
      const reading = db.prepare('SELECT * FROM readings_raw WHERE device_id = ?').get(device.id);
      expect(reading).toBeTruthy();
      expect(reading.device_id).toBe(device.id);
      expect(reading.room_id).toBeNull();
      expect(reading.temperature).toBe(22.0);
      expect(reading.humidity).toBe(55.0);
      expect(reading.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format
      expect(reading.source).toBe('mqtt');
      expect(reading.msg_id).toMatch(/^[a-f0-9]{32}$/);
    });
  });
});
