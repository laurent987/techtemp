/**
 * @file Tests for MQTT payload validation and transformation
 * Phase 2 of Journal #004 - MQTT Ingestion Pipeline
 */

import { describe, it, expect } from 'vitest';
import { validateReading } from '../../src/ingestion/validateReading.js';

describe('Validate Reading - MQTT Payload Validation', () => {

  describe('Valid Payloads', () => {
    it('should validate and transform standard sensor reading', () => {
      // Arrange
      const payload = {
        temperature_c: 23.7,
        humidity_pct: 52.5,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result).toEqual({
        temperature: 23.7,
        humidity: 52.5,
        ts: '2025-09-07T10:30:00Z'
      });
    });

    it('should handle minimum valid temperature', () => {
      // Arrange
      const payload = {
        temperature_c: -40.0,
        humidity_pct: 0.0,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result.temperature).toBe(-40.0);
      expect(result.humidity).toBe(0.0);
    });

    it('should handle maximum valid temperature', () => {
      // Arrange
      const payload = {
        temperature_c: 85.0,
        humidity_pct: 100.0,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result.temperature).toBe(85.0);
      expect(result.humidity).toBe(100.0);
    });

    it('should handle integer values', () => {
      // Arrange
      const payload = {
        temperature_c: 25,
        humidity_pct: 60,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result.temperature).toBe(25);
      expect(result.humidity).toBe(60);
    });

    it('should handle valid ISO timestamp variations', () => {
      // Arrange
      const timestamps = [
        '2025-09-07T10:30:00Z',
        '2025-09-07T10:30:00.000Z',
        '2025-09-07T10:30:00+01:00',
        '2025-09-07T10:30:00.123+02:00'
      ];

      // Act & Assert
      timestamps.forEach(timestamp => {
        const payload = {
          temperature_c: 20.0,
          humidity_pct: 50.0,
          timestamp
        };

        const result = validateReading(payload);
        expect(result.ts).toBe(timestamp);
      });
    });
  });

  describe('Invalid Payloads - Structure', () => {
    it('should reject null or undefined payload', () => {
      // Arrange & Act & Assert
      expect(() => validateReading(null)).toThrow(/payload.*required/i);
      expect(() => validateReading(undefined)).toThrow(/payload.*required/i);
    });

    it('should reject non-object payload', () => {
      // Arrange & Act & Assert
      expect(() => validateReading('string')).toThrow(/payload.*must.*be.*object/i);
      expect(() => validateReading(123)).toThrow(/payload.*must.*be.*object/i);
      expect(() => validateReading([])).toThrow(/payload.*must.*be.*object/i);
    });

    it('should reject missing required fields', () => {
      // Arrange
      const incompletePayloads = [
        { humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' }, // Missing temperature_c
        { temperature_c: 20.0, timestamp: '2025-09-07T10:30:00Z' }, // Missing humidity_pct
        { temperature_c: 20.0, humidity_pct: 50.0 }, // Missing timestamp
        {} // Missing all
      ];

      // Act & Assert
      incompletePayloads.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/required/i);
      });
    });
  });

  describe('Invalid Payloads - Temperature', () => {
    it('should reject invalid temperature types', () => {
      // Arrange
      const invalidTemps = [
        { temperature_c: 'hot', humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' },
        { temperature_c: null, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' },
        { temperature_c: {}, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' }
      ];

      // Act & Assert
      invalidTemps.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/temperature.*must.*be.*number/i);
      });
    });

    it('should reject temperature out of range', () => {
      // Arrange
      const outOfRangeTemps = [
        { temperature_c: -50.0, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' }, // Too cold
        { temperature_c: 100.0, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' }, // Too hot
        { temperature_c: NaN, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' }, // NaN
        { temperature_c: Infinity, humidity_pct: 50.0, timestamp: '2025-09-07T10:30:00Z' } // Infinity
      ];

      // Act & Assert
      outOfRangeTemps.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/temperature.*range/i);
      });
    });
  });

  describe('Invalid Payloads - Humidity', () => {
    it('should reject invalid humidity types', () => {
      // Arrange
      const invalidHumidity = [
        { temperature_c: 20.0, humidity_pct: 'dry', timestamp: '2025-09-07T10:30:00Z' },
        { temperature_c: 20.0, humidity_pct: null, timestamp: '2025-09-07T10:30:00Z' },
        { temperature_c: 20.0, humidity_pct: [], timestamp: '2025-09-07T10:30:00Z' }
      ];

      // Act & Assert
      invalidHumidity.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/humidity.*must.*be.*number/i);
      });
    });

    it('should reject humidity out of range', () => {
      // Arrange
      const outOfRangeHumidity = [
        { temperature_c: 20.0, humidity_pct: -5.0, timestamp: '2025-09-07T10:30:00Z' }, // Too low
        { temperature_c: 20.0, humidity_pct: 150.0, timestamp: '2025-09-07T10:30:00Z' }, // Too high
        { temperature_c: 20.0, humidity_pct: NaN, timestamp: '2025-09-07T10:30:00Z' }, // NaN
        { temperature_c: 20.0, humidity_pct: Infinity, timestamp: '2025-09-07T10:30:00Z' } // Infinity
      ];

      // Act & Assert
      outOfRangeHumidity.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/humidity.*range/i);
      });
    });
  });

  describe('Invalid Payloads - Timestamp', () => {
    it('should reject invalid timestamp types', () => {
      // Arrange
      const invalidTimestamps = [
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: 1694077800 }, // Number
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: null }, // Null
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: {} }, // Object
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: new Date() } // Date object
      ];

      // Act & Assert
      invalidTimestamps.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/timestamp.*must.*be.*string/i);
      });
    });

    it('should reject invalid timestamp formats', () => {
      // Arrange
      const invalidFormats = [
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: 'not-a-date' },
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: '2025-13-32T25:61:61Z' }, // Invalid date
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: '2025/09/07 10:30:00' }, // Wrong format
        { temperature_c: 20.0, humidity_pct: 50.0, timestamp: '' } // Empty string
      ];

      // Act & Assert
      invalidFormats.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/timestamp.*invalid.*iso/i);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should ignore unknown fields', () => {
      // Arrange
      const payload = {
        temperature_c: 23.7,
        humidity_pct: 52.5,
        timestamp: '2025-09-07T10:30:00Z',
        unknown_field: 'should be ignored',
        device_status: 'online'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result).toEqual({
        temperature: 23.7,
        humidity: 52.5,
        ts: '2025-09-07T10:30:00Z'
      });
      expect(result).not.toHaveProperty('unknown_field');
      expect(result).not.toHaveProperty('device_status');
    });

    it('should handle decimal precision correctly', () => {
      // Arrange
      const payload = {
        temperature_c: 23.123456789,
        humidity_pct: 52.987654321,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result.temperature).toBeCloseTo(23.123456789, 6);
      expect(result.humidity).toBeCloseTo(52.987654321, 6);
    });
  });

  describe('Performance', () => {
    it('should validate quickly for valid payloads', () => {
      // Arrange
      const payload = {
        temperature_c: 23.7,
        humidity_pct: 52.5,
        timestamp: '2025-09-07T10:30:00Z'
      };

      // Act
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        validateReading(payload);
      }
      const end = performance.now();

      // Assert
      const timePerValidation = (end - start) / 1000;
      expect(timePerValidation).toBeLessThan(1); // Should be less than 1ms per validation
    });
  });

  describe('Error Messages', () => {
    it('should provide meaningful error messages', () => {
      // Arrange
      const payload = {
        temperature_c: 'invalid',
        humidity_pct: 150.0,
        timestamp: 'not-a-date'
      };

      // Act & Assert
      expect(() => validateReading(payload)).toThrow(/temperature.*must.*be.*number/i);
    });
  });
});
