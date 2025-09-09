import { describe, it, expect } from 'vitest';
import { buildTopicParser } from '../../src/ingestion/parseTopic.js';

describe('Parse Topic - MQTT Topic Parsing', () => {
  describe('buildTopicParser', () => {
    it('should create a topic parser with default pattern', () => {
      // Arrange & Act
      const parser = buildTopicParser();

      // Assert
      expect(parser).toBeDefined();
      expect(typeof parser).toBe('function');
    });

    it('should create a topic parser with custom pattern', () => {
      // Arrange
      const customPattern = 'sensors/{deviceId}/data';

      // Act
      const parser = buildTopicParser(customPattern);

      // Assert
      expect(parser).toBeDefined();
      expect(typeof parser).toBe('function');
    });
  });

  describe('Topic Parsing - Valid Topics', () => {
    it('should parse valid topic according to contract', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/house-001/sensors/rpi-salon-01/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'house-001',
        deviceId: 'rpi-salon-01'
      });
    });

    it('should parse topic with alphanumeric IDs', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/home123/sensors/device456/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'home123',
        deviceId: 'device456'
      });
    });

    it('should parse topic with hyphens and underscores', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/my-home_01/sensors/temp_sensor-001/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'my-home_01',
        deviceId: 'temp_sensor-001'
      });
    });

    it('should parse topic with longer valid IDs', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/very-long-home-identifier-123/sensors/very-long-device-identifier-456/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'very-long-home-identifier-123',
        deviceId: 'very-long-device-identifier-456'
      });
    });
  });

  describe('Topic Parsing - Invalid Topics', () => {
    it('should reject empty topic', () => {
      // Arrange
      const parser = buildTopicParser();

      // Act & Assert
      expect(() => parser('')).toThrow(/invalid.*topic.*format/i);
    });

    it('should reject null or undefined topic', () => {
      // Arrange
      const parser = buildTopicParser();

      // Act & Assert
      expect(() => parser(null)).toThrow(/topic.*required/i);
      expect(() => parser(undefined)).toThrow(/topic.*required/i);
    });

    it('should reject topic with wrong structure', () => {
      // Arrange
      const parser = buildTopicParser();
      const invalidTopics = [
        'home/house-001/reading',                    // Missing sensors/deviceId
        'sensors/device-001/reading',                // Missing home/homeId
        'home/house-001/sensors/reading',            // Missing deviceId
        'home/house-001/sensors/device-001',         // Missing reading
        'wrong/house-001/sensors/device-001/reading' // Wrong prefix
      ];

      // Act & Assert
      invalidTopics.forEach(topic => {
        expect(() => parser(topic)).toThrow(/invalid.*topic.*format/i);
      });
    });

    it('should reject topic with invalid characters in homeId', () => {
      // Arrange
      const parser = buildTopicParser();
      const invalidTopics = [
        'home/house@001/sensors/device-001/reading',  // @ not allowed
        'home/house 001/sensors/device-001/reading',  // space not allowed
        'home/house#001/sensors/device-001/reading',  // # not allowed
        'home/house+001/sensors/device-001/reading',  // + not allowed
        'home/house/001/sensors/device-001/reading'   // / not allowed in ID
      ];

      // Act & Assert
      invalidTopics.forEach(topic => {
        expect(() => parser(topic)).toThrow(/invalid.*homeId/i);
      });
    });

    it('should reject topic with invalid characters in deviceId', () => {
      // Arrange
      const parser = buildTopicParser();
      const invalidTopics = [
        'home/house-001/sensors/device@001/reading',  // @ not allowed
        'home/house-001/sensors/device 001/reading',  // space not allowed
        'home/house-001/sensors/device#001/reading',  // # not allowed
        'home/house-001/sensors/device+001/reading',  // + not allowed
        'home/house-001/sensors/device/001/reading'   // / not allowed in ID
      ];

      // Act & Assert
      invalidTopics.forEach(topic => {
        expect(() => parser(topic)).toThrow(/invalid.*deviceId/i);
      });
    });

    it('should reject topic with empty homeId or deviceId', () => {
      // Arrange
      const parser = buildTopicParser();
      const invalidTopics = [
        'home//sensors/device-001/reading',     // Empty homeId
        'home/house-001/sensors//reading',      // Empty deviceId
        'home/ /sensors/device-001/reading',    // Whitespace homeId
        'home/house-001/sensors/ /reading'      // Whitespace deviceId
      ];

      // Act & Assert
      invalidTopics.forEach(topic => {
        expect(() => parser(topic)).toThrow(/empty.*id/i);
      });
    });

    it('should reject topic with IDs that are too long', () => {
      // Arrange
      const parser = buildTopicParser();
      const longId = 'a'.repeat(129); // Assuming max 128 chars
      const invalidTopics = [
        `home/${longId}/sensors/device-001/reading`,     // homeId too long
        `home/house-001/sensors/${longId}/reading`       // deviceId too long
      ];

      // Act & Assert
      invalidTopics.forEach(topic => {
        expect(() => parser(topic)).toThrow(/too.*long/i);
      });
    });
  });

  describe('Topic Parsing - Edge Cases', () => {
    it('should handle minimum valid ID lengths', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/a/sensors/b/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'a',
        deviceId: 'b'
      });
    });

    it('should handle numeric-only IDs', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/123/sensors/456/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: '123',
        deviceId: '456'
      });
    });

    it('should be case-sensitive for IDs', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/House-001/sensors/Device-001/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: 'House-001',
        deviceId: 'Device-001'
      });
    });

    it('should handle IDs with leading/trailing valid characters', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/0house-001z/sensors/0device-001z/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        homeId: '0house-001z',
        deviceId: '0device-001z'
      });
    });
  });

  describe('Custom Topic Patterns', () => {
    it('should work with custom pattern', () => {
      // Arrange
      const customPattern = 'sensors/{deviceId}/data';
      const parser = buildTopicParser(customPattern);
      const topic = 'sensors/temp-sensor-01/data';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        deviceId: 'temp-sensor-01'
      });
    });

    it('should reject invalid custom pattern', () => {
      // Arrange & Act & Assert
      expect(() => buildTopicParser('invalid-pattern')).toThrow(/pattern.*invalid/i);
      expect(() => buildTopicParser('')).toThrow(/pattern.*required/i);
      expect(() => buildTopicParser(null)).toThrow(/pattern.*required/i);
    });

    it('should handle pattern with different placeholder names', () => {
      // Arrange
      const customPattern = 'building/{buildingId}/floor/{floorId}/sensor/{sensorId}/reading';
      const parser = buildTopicParser(customPattern);
      const topic = 'building/tower-a/floor/3/sensor/temp-01/reading';

      // Act
      const result = parser(topic);

      // Assert
      expect(result).toEqual({
        buildingId: 'tower-a',
        floorId: '3',
        sensorId: 'temp-01'
      });
    });
  });

  describe('Performance and Validation', () => {
    it('should be fast for valid topics', () => {
      // Arrange
      const parser = buildTopicParser();
      const topic = 'home/house-001/sensors/device-001/reading';

      // Act
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        parser(topic);
      }
      const end = performance.now();

      // Assert - Should parse 1000 topics in less than 25ms
      expect(end - start).toBeLessThan(25);
    });

    it('should provide meaningful error messages', () => {
      // Arrange
      const parser = buildTopicParser();

      // Act & Assert
      expect(() => parser('invalid/topic')).toThrow(/invalid.*topic.*format.*expected.*home\/\{homeId\}\/sensors\/\{deviceId\}\/reading/i);
    });

    it('should validate input types', () => {
      // Arrange
      const parser = buildTopicParser();

      // Act & Assert
      expect(() => parser(123)).toThrow(/topic.*must.*be.*string/i);
      expect(() => parser({})).toThrow(/topic.*must.*be.*string/i);
      expect(() => parser([])).toThrow(/topic.*must.*be.*string/i);
    });
  });
});
