/**
 * @file Tests for MQTT message ingestion pipeline integration
 * Phase 3 of Journal #004 - MQTT Ingestion Pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ingestMessage } from '../../backend/ingestion/ingestMessage.js';

describe('Ingest Message - MQTT Pipeline Integration', () => {

  let mockRepository;

  beforeEach(() => {
    // Mock repository with all needed methods
    mockRepository = {
      devices: {
        findByUid: vi.fn(),
        create: vi.fn(),
        updateLastSeen: vi.fn(),
        getCurrentPlacement: vi.fn()
      },
      readings: {
        create: vi.fn()
      }
    };
  });

  describe('Complete Pipeline Success', () => {
    it('should ingest valid MQTT message with existing device', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = {
        temperature_c: 23.5,
        humidity_pct: 65.2,
        ts: 1757442988279
      };
      const options = { retain: false, qos: 1 };

      // Mock existing device
      mockRepository.devices.findByUid.mockResolvedValue({
        device_id: 'temp001',
        device_uid: 'SENSOR_001',
        room_id: 'living-room',
        last_seen: '2025-09-07T09:00:00Z'
      });

      // Mock successful reading creation
      mockRepository.readings.create.mockResolvedValue({
        success: true,
        changes: 1,
        lastInsertRowid: 42
      });

      // Mock successful device update
      mockRepository.devices.updateLastSeen.mockResolvedValue({
        device_id: 'temp001',
        last_seen_at: '2025-09-07T10:30:00Z'
      });

      // Mock placement (device in living-room)
      mockRepository.devices.getCurrentPlacement.mockResolvedValue({ room_id: 'living-room' });

      // Act
      const result = await ingestMessage(topic, payload, options, mockRepository);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deviceId).toBe('temp001');
      expect(result.reading).toEqual({
        temperature: 23.5,
        humidity: 65.2,
        ts: expect.any(String) // Now returns ISO string 
      });
      expect(result.insertId).toBe(42);

      // Verify repository calls
      expect(mockRepository.devices.findByUid).toHaveBeenCalledWith('temp001');
      expect(mockRepository.readings.create).toHaveBeenCalledWith({
        device_id: 'temp001',
        room_id: 'living-room',
        temperature: 23.5,
        humidity: 65.2,
        ts: expect.any(String), // Now an ISO string
        source: 'mqtt',
        msg_id: expect.any(String)
      });
      expect(mockRepository.devices.updateLastSeen).toHaveBeenCalledWith('temp001', expect.any(String));
    });

    it('should create device automatically if not exists', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp002/reading';
      const payload = {
        temperature_c: 18.7,
        humidity_pct: 45.0,
        ts: 1757442988279
      };

      // Mock device not found
      mockRepository.devices.findByUid.mockResolvedValue(null);

      // Mock device creation
      mockRepository.devices.create.mockResolvedValue({
        device_id: 'temp002',
        device_uid: 'AUTO_temp002',
        room_id: null,
        last_seen: '2025-09-07T11:15:00Z'
      });

      // Mock reading creation
      mockRepository.readings.create.mockResolvedValue({
        success: true,
        changes: 1,
        lastInsertRowid: 43
      });

      // Act
      const result = await ingestMessage(topic, payload, {}, mockRepository);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deviceCreated).toBe(true);
      expect(result.deviceId).toBe('temp002');

      // Verify device was created with auto-generated data
      expect(mockRepository.devices.create).toHaveBeenCalledWith({
        device_id: 'temp002',
        device_uid: 'temp002',
        last_seen: expect.any(String), // Now an ISO string
        label: 'Auto-discovered sensor',
        model: 'unknown'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid topic format', async () => {
      // Arrange
      const topic = 'invalid/topic/format';
      const payload = { temperature_c: 20.0, humidity_pct: 50.0, ts: 1757442988279 };

      // Act & Assert
      await expect(ingestMessage(topic, payload, {}, mockRepository))
        .rejects.toThrow(/invalid.*topic.*format/i);

      // Verify no repository calls were made
      expect(mockRepository.devices.findByUid).not.toHaveBeenCalled();
      expect(mockRepository.readings.create).not.toHaveBeenCalled();
    });

    it('should handle invalid payload data', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = { temperature_c: 'invalid', humidity_pct: 50.0, ts: 1757442988279 };

      // Act & Assert
      await expect(ingestMessage(topic, payload, {}, mockRepository))
        .rejects.toThrow(/temperature.*must.*be.*number/i);

      // Verify no repository calls were made
      expect(mockRepository.devices.findByUid).not.toHaveBeenCalled();
      expect(mockRepository.readings.create).not.toHaveBeenCalled();
    });

    it('should handle device creation failure', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp003/reading';
      const payload = { temperature_c: 25.0, humidity_pct: 60.0, ts: 1757442988279 };

      // Mock device not found
      mockRepository.devices.findByUid.mockResolvedValue(null);

      // Mock device creation failure
      mockRepository.devices.create.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(ingestMessage(topic, payload, {}, mockRepository))
        .rejects.toThrow('Database connection failed');

      // Verify reading creation was not attempted
      expect(mockRepository.readings.create).not.toHaveBeenCalled();
    });

    it('should handle reading creation failure', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = { temperature_c: 30.0, humidity_pct: 70.0, ts: 1757442988279 };

      // Mock existing device
      mockRepository.devices.findByUid.mockResolvedValue({
        device_id: 'temp001',
        room_id: 'kitchen'
      });

      // Mock reading creation failure
      mockRepository.readings.create.mockRejectedValue(new Error('Reading validation failed'));

      // Act & Assert
      await expect(ingestMessage(topic, payload, {}, mockRepository))
        .rejects.toThrow('Reading validation failed');
    });
  });

  describe('Deduplication', () => {
    it('should generate consistent msg_id for deduplication', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = { temperature_c: 22.0, humidity_pct: 55.0, ts: 1757442988279 };

      mockRepository.devices.findByUid.mockResolvedValue({
        device_id: 'temp001',
        room_id: 'bedroom'
      });
      mockRepository.readings.create.mockResolvedValue({ success: true, changes: 1, lastInsertRowid: 44 });
      mockRepository.devices.updateLastSeen.mockResolvedValue({});

      // Mock placement (no current placement)
      mockRepository.devices.getCurrentPlacement.mockResolvedValue(null);
      // Act
      const result1 = await ingestMessage(topic, payload, {}, mockRepository);

      // Reset mocks and call again with same data
      mockRepository.readings.create.mockClear();
      const result2 = await ingestMessage(topic, payload, {}, mockRepository);

      // Assert - Same msg_id should be generated for identical messages
      const call1 = mockRepository.readings.create.mock.calls[0][0];
      const call2 = mockRepository.readings.create.mock.calls[0][0];

      expect(call1.msg_id).toBe(call2.msg_id);
      expect(call1.msg_id).toMatch(/^[a-f0-9]{32}$/); // 32-char hex hash
    });
  });

  describe('Edge Cases', () => {
    it('should reject payload with missing required humidity_pct field', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = {
        temperature_c: 21.0,
        ts: 1757442988279
        // humidity_pct missing - should be required per spec
      };

      // Act & Assert
      await expect(ingestMessage(topic, payload, {}, mockRepository))
        .rejects.toThrow(/humidity_pct.*required/i);

      // Verify no repository calls were made
      expect(mockRepository.devices.findByUid).not.toHaveBeenCalled();
      expect(mockRepository.readings.create).not.toHaveBeenCalled();
    });

    it('should handle MQTT retain flag correctly', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = { temperature_c: 24.0, humidity_pct: 58.0, ts: 1757442988279 };
      const options = { retain: true, qos: 2 };

      mockRepository.devices.findByUid.mockResolvedValue({ device_id: 'temp001', room_id: 'office' });
      mockRepository.readings.create.mockResolvedValue({ success: true, changes: 1, lastInsertRowid: 46 });
      mockRepository.devices.updateLastSeen.mockResolvedValue({});

      // Mock placement (no current placement)
      mockRepository.devices.getCurrentPlacement.mockResolvedValue(null);
      // Act
      const result = await ingestMessage(topic, payload, options, mockRepository);

      // Assert
      expect(result.success).toBe(true);
      expect(result.retained).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should process messages efficiently', async () => {
      // Arrange
      const topic = 'home/home-001/sensors/temp001/reading';
      const payload = { temperature_c: 26.0, humidity_pct: 62.0, ts: 1757442988279 };

      mockRepository.devices.findByUid.mockResolvedValue({ device_id: 'temp001', room_id: 'garage' });
      mockRepository.readings.create.mockResolvedValue({ success: true, changes: 1, lastInsertRowid: 47 });
      mockRepository.devices.updateLastSeen.mockResolvedValue({});

      // Mock placement (no current placement)
      mockRepository.devices.getCurrentPlacement.mockResolvedValue(null);
      // Act
      const start = performance.now();
      await ingestMessage(topic, payload, {}, mockRepository);
      const end = performance.now();

      // Assert - Should complete within reasonable time
      expect(end - start).toBeLessThan(10); // 10ms should be plenty for mocked calls
    });
  });
});
