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
        ts: 1757442988279 // Expected Unix timestamp
      };

      // Act
      const result = validateReading(payload);

      // Assert - Just check that it returns correct fields, not exact timestamp
      expect(result.temperature).toBe(23.7);
      expect(result.humidity).toBe(52.5);
      expect(result.ts).toBe(new Date(1757442988279).toISOString());
    });

    it('should handle minimum valid temperature', () => {
      // Arrange
      const payload = {
        temperature_c: -40.0,
        humidity_pct: 0.0,
        ts: 1725452200000 // 2025-09-04T17:30:00.000Z
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
        ts: 1725452200000 // 2025-09-04T17:30:00.000Z
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
        ts: 1725452200000 // 2025-09-04T17:30:00.000Z
      };

      // Act
      const result = validateReading(payload);

      // Assert
      expect(result.temperature).toBe(25);
      expect(result.humidity).toBe(60);
    });

    it('should handle valid Unix timestamp variations', () => {
      // Arrange
      const timestamps = [
        1725452200000, // 2025-09-04T17:30:00.000Z
        1725452260000, // 2025-09-04T17:31:00.000Z  
        1725452320000, // 2025-09-04T17:32:00.000Z
        1725452380000  // 2025-09-04T17:33:00.000Z
      ];

      // Act & Assert
      timestamps.forEach(timestamp => {
        const payload = {
          temperature_c: 20.0,
          humidity_pct: 50.0,
          ts: timestamp
        };

        const result = validateReading(payload);
        expect(result.ts).toBe(new Date(timestamp).toISOString());
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
        { humidity_pct: 50.0, ts: 1725452200000 }, // Missing temperature_c
        { temperature_c: 20.0, ts: 1725452200000 }, // Missing humidity_pct
        { temperature_c: 20.0, humidity_pct: 50.0 }, // Missing ts
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
        { temperature_c: 'hot', humidity_pct: 50.0, ts: 1725452200000 },
        { temperature_c: null, humidity_pct: 50.0, ts: 1725452200000 },
        { temperature_c: {}, humidity_pct: 50.0, ts: 1725452200000 }
      ];

      // Act & Assert
      invalidTemps.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/temperature.*must.*be.*number/i);
      });
    });

    it('should reject temperature out of range', () => {
      // Arrange
      const outOfRangeTemps = [
        { temperature_c: -50.0, humidity_pct: 50.0, ts: 1725452200000 }, // Too cold
        { temperature_c: 100.0, humidity_pct: 50.0, ts: 1725452200000 }, // Too hot
        { temperature_c: NaN, humidity_pct: 50.0, ts: 1725452200000 }, // NaN
        { temperature_c: Infinity, humidity_pct: 50.0, ts: 1725452200000 } // Infinity
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
        { temperature_c: 20.0, humidity_pct: 'dry', ts: 1725452200000 },
        { temperature_c: 20.0, humidity_pct: null, ts: 1725452200000 },
        { temperature_c: 20.0, humidity_pct: [], ts: 1725452200000 }
      ];

      // Act & Assert
      invalidHumidity.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/humidity.*must.*be.*number/i);
      });
    });

    it('should reject humidity out of range', () => {
      // Arrange
      const outOfRangeHumidity = [
        { temperature_c: 20.0, humidity_pct: -5.0, ts: 1725452200000 }, // Too low
        { temperature_c: 20.0, humidity_pct: 150.0, ts: 1725452200000 }, // Too high
        { temperature_c: 20.0, humidity_pct: NaN, ts: 1725452200000 }, // NaN
        { temperature_c: 20.0, humidity_pct: Infinity, ts: 1725452200000 } // Infinity
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
        { temperature_c: 20.0, humidity_pct: 50.0, ts: '1757442988279' }, // String 
        { temperature_c: 20.0, humidity_pct: 50.0, ts: null }, // Null
        { temperature_c: 20.0, humidity_pct: 50.0, ts: {} }, // Object
        { temperature_c: 20.0, humidity_pct: 50.0, ts: new Date() } // Date object
      ];

      // Act & Assert
      invalidTimestamps.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/timestamp.*must.*be.*number/i);
      });
    });

    it('should reject invalid timestamp values', () => {
      // Arrange
      const invalidValues = [
        { temperature_c: 20.0, humidity_pct: 50.0, ts: -1 }, // Negative timestamp
        { temperature_c: 20.0, humidity_pct: 50.0, ts: NaN }, // NaN
        { temperature_c: 20.0, humidity_pct: 50.0, ts: Infinity }, // Infinity  
        { temperature_c: 20.0, humidity_pct: 50.0, ts: Date.now() + 172800000 } // Too far in future (2 days)
      ];

      // Act & Assert
      invalidValues.forEach(payload => {
        expect(() => validateReading(payload)).toThrow(/timestamp.*range/i);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should ignore unknown fields', () => {
      // Arrange
      const payload = {
        temperature_c: 23.7,
        humidity_pct: 52.5,
        ts: 1757442988279, // Use same timestamp
        unknown_field: 'should be ignored',
        device_status: 'online'
      };

      // Act
      const result = validateReading(payload);

      // Assert - Check structure and fields, not exact timestamp value
      expect(result.temperature).toBe(23.7);
      expect(result.humidity).toBe(52.5);
      expect(result.ts).toBe(new Date(1757442988279).toISOString());
      expect(result).not.toHaveProperty('unknown_field');
      expect(result).not.toHaveProperty('device_status');
    });

    it('should handle decimal precision correctly', () => {
      // Arrange
      const payload = {
        temperature_c: 23.123456789,
        humidity_pct: 52.987654321,
        ts: 1725452200000 // 2025-09-04T17:30:00.000Z
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
        ts: 1725452200000 // 2025-09-04T17:30:00.000Z
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
        ts: 1725452200000
      };

      // Act & Assert
      expect(() => validateReading(payload)).toThrow(/temperature.*must.*be.*number/i);
    });
  });
});
