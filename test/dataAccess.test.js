/**
 * @file Tests for Data Access Layer - Phase 3
 * Tests SQL operations layer between Repository and Database
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDb, closeDb } from '../backend/db/index.js';
import { createDataAccess } from '../backend/db/dataAccess.js';

describe('Data Access Layer', () => {
  let db;
  let dataAccess;

  beforeEach(() => {
    // Create an in-memory database for each test
    db = initDb(':memory:');
    dataAccess = createDataAccess(db);
  });

  afterEach(async () => {
    if (db && db.open) {
      await closeDb();
    }
  });

  describe('Device Data Access', () => {
    it('should insert a new device', () => {
      // Arrange
      const deviceData = {
        device_id: 'dev001',
        device_uid: 'uid-12345',
        label: 'Temperature Sensor',
        model: 'TempSens v1.0'
      };

      // Act
      const result = dataAccess.insertDevice(deviceData);

      // Assert
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();
    });

    it('should find device by ID', () => {
      // Arrange - insérer d'abord un device
      const deviceData = {
        device_id: 'dev001',
        device_uid: 'uid-12345',
        label: 'Temperature Sensor'
      };
      dataAccess.insertDevice(deviceData);

      // Act
      const found = dataAccess.findDeviceById('dev001');

      // Assert
      expect(found).toBeDefined();
      expect(found.device_id).toBe('dev001');
      expect(found.label).toBe('Temperature Sensor');
    });

    it('should update device last seen timestamp', () => {
      // Arrange
      const deviceData = {
        device_id: 'dev001',
        device_uid: 'uid-12345'
      };
      dataAccess.insertDevice(deviceData);
      const timestamp = new Date().toISOString();

      // Act
      const result = dataAccess.updateDeviceLastSeen('dev001', timestamp);

      // Assert
      expect(result.changes).toBe(1);

      const updated = dataAccess.findDeviceById('dev001');
      expect(updated.last_seen_at).toBe(timestamp);
    });
  });

  describe('Room Data Access', () => {
    it('should insert a new room', () => {
      // Arrange
      const roomData = {
        room_id: 'room001',
        name: 'Living Room',
        floor: 'Ground Floor',
        side: 'North'
      };

      // Act
      const result = dataAccess.insertRoom(roomData);

      // Assert
      expect(result.changes).toBe(1);
    });

    it('should find room by ID', () => {
      // Arrange
      const roomData = {
        room_id: 'room001',
        name: 'Living Room'
      };
      dataAccess.insertRoom(roomData);

      // Act
      const found = dataAccess.findRoomById('room001');

      // Assert
      expect(found).toBeDefined();
      expect(found.room_id).toBe('room001');
      expect(found.name).toBe('Living Room');
    });
  });

  describe('Reading Data Access', () => {
    it('should insert a new reading', () => {
      // Arrange - créer d'abord un device
      dataAccess.insertDevice({
        device_id: 'dev001',
        device_uid: 'uid-12345'
      });

      const readingData = {
        device_id: 'dev001',
        room_id: 'room001',
        ts: new Date().toISOString(),
        temperature: 23.5,
        humidity: 55.0,
        source: 'mqtt'
      };

      // Act
      const result = dataAccess.insertReading(readingData);

      // Assert
      expect(result.changes).toBe(1);
    });

    it('should find latest reading by device', () => {
      // Arrange - setup device et readings
      dataAccess.insertDevice({
        device_id: 'dev001',
        device_uid: 'uid-12345'
      });

      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000); // 1h earlier

      dataAccess.insertReading({
        device_id: 'dev001',
        ts: earlier.toISOString(),
        temperature: 20.0,
        humidity: 50.0
      });

      dataAccess.insertReading({
        device_id: 'dev001',
        ts: now.toISOString(),
        temperature: 25.0,
        humidity: 60.0
      });

      // Act
      const latest = dataAccess.findLatestReadingByDevice('dev001');

      // Assert
      expect(latest).toBeDefined();
      expect(latest.temperature).toBe(25.0);
      expect(latest.humidity).toBe(60.0);
    });

    it('should find readings by room and time range', () => {
      // Arrange
      dataAccess.insertDevice({
        device_id: 'dev001',
        device_uid: 'uid-12345'
      });

      const baseTime = new Date('2025-09-06T10:00:00Z');
      const readings = [
        { device_id: 'dev001', room_id: 'room001', ts: new Date(baseTime.getTime()).toISOString(), temperature: 20.0 },
        { device_id: 'dev001', room_id: 'room001', ts: new Date(baseTime.getTime() + 1800000).toISOString(), temperature: 22.0 },
        { device_id: 'dev001', room_id: 'room002', ts: new Date(baseTime.getTime() + 3600000).toISOString(), temperature: 24.0 }
      ];

      readings.forEach(r => dataAccess.insertReading(r));

      // Act
      const fromTs = baseTime.toISOString();
      const toTs = new Date(baseTime.getTime() + 7200000).toISOString();
      const results = dataAccess.findReadingsByRoomAndTimeRange('room001', fromTs, toTs);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].temperature).toBe(20.0);
      expect(results[1].temperature).toBe(22.0);
    });
  });
});
