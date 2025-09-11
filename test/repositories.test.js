/**
 * @file Tests for Repository Pattern - Phase 4
 * Tests business logic layer using Data Access Layer
 * Full TDD approach: Write tests first, then implement
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDb, closeDb } from '../backend/db/index.js';
import { createRepository } from '../backend/repositories/index.js';

describe('Repository Pattern - Business Logic Layer', () => {
  let db;
  let repository;

  beforeEach(() => {
    // Create an in-memory database for each test
    db = initDb(':memory:');
    repository = createRepository(db);
  });

  afterEach(async () => {
    if (db && db.open) {
      await closeDb();
    }
  });

  describe('Device Repository', () => {
    it('should create a new device with business validation', async () => {
      // Arrange
      const device = {
        uid: 'uid-12345',
        label: 'Temperature Sensor',
        model: 'TempSens v1.0'
      };

      // Act
      const result = await repository.devices.create(device);

      // Assert
      expect(result).toBeDefined();
      expect(result.uid).toBe('uid-12345');
      expect(result.label).toBe('Temperature Sensor');
    });

    it('should reject device creation without required fields', async () => {
      // Arrange
      const invalidDevice = {
        label: 'Temperature Sensor'
        // Missing uid
      };

      // Act & Assert
      await expect(repository.devices.create(invalidDevice))
        .rejects.toThrow('Device UID is required');
    });

    it('should reject duplicate device creation', async () => {
      // Arrange
      const device = {
        uid: 'uid-12345'
      };
      await repository.devices.create(device);

      // Act & Assert
      await expect(repository.devices.create(device))
        .rejects.toThrow('Device with UID uid-12345 already exists');
    });

    it('should find device by ID with validation', async () => {
      // Arrange
      const device = {
        uid: 'uid-12345',
        label: 'Temperature Sensor'
      };
      await repository.devices.create(device);

      // Act
      const found = await repository.devices.findById('uid-12345');

      // Assert
      expect(found).toBeDefined();
      expect(found.uid).toBe('uid-12345');
      expect(found.label).toBe('Temperature Sensor');
    });

    it('should reject findById without device ID', async () => {
      // Act & Assert
      await expect(repository.devices.findById(null))
        .rejects.toThrow('Device UID is required');
    });

    it('should update device last seen with business logic', async () => {
      // Arrange
      const device = {
        uid: 'uid-12345'
      };
      await repository.devices.create(device);
      const customTs = '2025-09-06T12:00:00Z';

      // Act
      const result = await repository.devices.updateLastSeen('uid-12345', customTs);

      // Assert
      expect(result.last_seen_at).toBe(customTs);
    });

    it('should default to current timestamp when updating last seen', async () => {
      // Arrange
      const device = {
        uid: 'uid-12345'
      };
      await repository.devices.create(device);
      const before = new Date().toISOString();

      // Act
      const result = await repository.devices.updateLastSeen('uid-12345');
      const after = new Date().toISOString();

      // Assert
      expect(result.last_seen_at).toBeDefined();
      expect(result.last_seen_at >= before).toBe(true);
      expect(result.last_seen_at <= after).toBe(true);
    });

    it('should reject update last seen for non-existent device', async () => {
      // Act & Assert
      await expect(repository.devices.updateLastSeen('non-existent'))
        .rejects.toThrow('Device with UID non-existent not found');
    });
  });

  describe('Room Repository', () => {
    it('should create a new room with validation', async () => {
      // Arrange
      const room = {
        room_id: 'room001',
        name: 'Living Room',
        floor: 'Ground Floor',
        side: 'North'
      };

      // Act
      const result = await repository.rooms.create(room);

      // Assert
      expect(result).toBeDefined();
      expect(result.room_id).toBe('room001');
      expect(result.name).toBe('Living Room');
    });

    it('should reject room creation without required fields', async () => {
      // Arrange
      const invalidRoom = {
        floor: 'Ground Floor'
        // Missing room_id and name
      };

      // Act & Assert
      await expect(repository.rooms.create(invalidRoom))
        .rejects.toThrow('Room ID and name are required');
    });

    it('should reject duplicate room creation', async () => {
      // Arrange
      const room = {
        room_id: 'room001',
        name: 'Living Room'
      };
      await repository.rooms.create(room);

      // Act & Assert
      await expect(repository.rooms.create(room))
        .rejects.toThrow('Room with ID room001 already exists');
    });

    it('should find room by ID with validation', async () => {
      // Arrange
      const room = {
        room_id: 'room001',
        name: 'Living Room'
      };
      await repository.rooms.create(room);

      // Act
      const found = await repository.rooms.findById('room001');

      // Assert
      expect(found).toBeDefined();
      expect(found.room_id).toBe('room001');
      expect(found.name).toBe('Living Room');
    });

    it('should reject findById without room ID', async () => {
      // Act & Assert
      await expect(repository.rooms.findById(null))
        .rejects.toThrow('Room ID is required');
    });
  });

  describe('Readings Repository', () => {
    beforeEach(async () => {
      // Setup device for readings tests
      await repository.devices.create({
        uid: 'uid-12345'
      });
    });

    it('should create a new reading with business validation', async () => {
      // Arrange
      const reading = {
        uid: 'uid-12345',
        room_id: 'room001',
        ts: new Date().toISOString(),
        temperature: 23.5,
        humidity: 55.0,
        source: 'mqtt'
      };

      // Act
      const result = await repository.readings.create(reading);

      // Assert
      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);
    });

    it('should reject reading without required fields', async () => {
      // Arrange
      const invalidReading = {
        temperature: 23.5
        // Missing device_id and ts
      };

      // Act & Assert
      await expect(repository.readings.create(invalidReading))
        .rejects.toThrow('Device UID and timestamp are required');
    });

    it('should reject reading for non-existent device', async () => {
      // Arrange
      const reading = {
        uid: 'non-existent',
        ts: new Date().toISOString(),
        temperature: 23.5
      };

      // Act & Assert
      await expect(repository.readings.create(reading))
        .rejects.toThrow('Device with UID non-existent not found');
    });

    it('should validate temperature range', async () => {
      // Arrange
      const invalidReading = {
        uid: 'uid-12345',
        ts: new Date().toISOString(),
        temperature: 150  // Invalid temperature
      };

      // Act & Assert
      await expect(repository.readings.create(invalidReading))
        .rejects.toThrow('Temperature must be between -50°C and 100°C');
    });

    it('should validate humidity range', async () => {
      // Arrange
      const invalidReading = {
        uid: 'uid-12345',
        ts: new Date().toISOString(),
        humidity: 150  // Invalid humidity
      };

      // Act & Assert
      await expect(repository.readings.create(invalidReading))
        .rejects.toThrow('Humidity must be between 0% and 100%');
    });

    it('should get latest reading for device', async () => {
      // Arrange - create multiple readings
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

      await repository.readings.create({
        uid: 'uid-12345',
        ts: earlier.toISOString(),
        temperature: 20.0
      });

      await repository.readings.create({
        uid: 'uid-12345',
        ts: now.toISOString(),
        temperature: 25.0
      });

      // Act
      const latest = await repository.readings.getLatestByDevice('uid-12345');

      // Assert
      expect(latest).toBeDefined();
      expect(latest.temperature).toBe(25.0);
    });

    it('should find readings by room and time range with validation', async () => {
      // Arrange
      const baseTime = new Date('2025-09-06T10:00:00Z');

      await repository.readings.create({
        uid: 'uid-12345',
        room_id: 'room001',
        ts: baseTime.toISOString(),
        temperature: 20.0
      });

      await repository.readings.create({
        uid: 'uid-12345',
        room_id: 'room001',
        ts: new Date(baseTime.getTime() + 1800000).toISOString(),
        temperature: 22.0
      });

      // Act
      const fromTs = baseTime.toISOString();
      const toTs = new Date(baseTime.getTime() + 3600000).toISOString();
      const results = await repository.readings.findByRoomAndTimeRange('room001', fromTs, toTs);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].temperature).toBe(20.0);
      expect(results[1].temperature).toBe(22.0);
    });

    it('should reject invalid time range', async () => {
      // Arrange
      const fromTs = '2025-09-06T12:00:00Z';
      const toTs = '2025-09-06T10:00:00Z'; // Earlier than fromTs

      // Act & Assert
      await expect(repository.readings.findByRoomAndTimeRange('room001', fromTs, toTs))
        .rejects.toThrow('From timestamp must be before to timestamp');
    });

    it('should reject readings query without required parameters', async () => {
      // Act & Assert
      await expect(repository.readings.findByRoomAndTimeRange(null, null, null))
        .rejects.toThrow('Room ID, from timestamp, and to timestamp are required');
    });
  });

  describe('Repository Structure', () => {
    it('should have the correct repository structure', () => {
      // Assert
      expect(repository).toBeDefined();
      expect(repository.devices).toBeDefined();
      expect(repository.rooms).toBeDefined();
      expect(repository.readings).toBeDefined();
    });

    it('should provide all device repository methods', () => {
      // Assert
      expect(typeof repository.devices.create).toBe('function');
      expect(typeof repository.devices.findById).toBe('function');
      expect(typeof repository.devices.updateLastSeen).toBe('function');
    });

    it('should provide all room repository methods', () => {
      // Assert
      expect(typeof repository.rooms.create).toBe('function');
      expect(typeof repository.rooms.findById).toBe('function');
    });

    it('should provide all readings repository methods', () => {
      // Assert
      expect(typeof repository.readings.create).toBe('function');
      expect(typeof repository.readings.getLatestByDevice).toBe('function');
      expect(typeof repository.readings.findByRoomAndTimeRange).toBe('function');
    });
  });
});
