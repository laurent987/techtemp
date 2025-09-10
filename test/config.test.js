import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig, configSchema } from '../backend/config.js';

describe('Configuration Loading', () => {
  let originalEnv;

  beforeEach(() => {
    // Save the original environment
    originalEnv = { ...process.env };

    // Reset des variables d'environnement pour des tests propres
    delete process.env.NODE_ENV;
    delete process.env.DB_PATH;
    delete process.env.MQTT_URL;
    delete process.env.HTTP_PORT;
    delete process.env.MQTT_USERNAME;
    delete process.env.MQTT_PASSWORD;
    delete process.env.TOPIC_READING_PATTERN;
  });

  afterEach(() => {
    // Restaurer l'environnement original
    process.env = originalEnv;
  });

  describe('Valid configuration', () => {
    it('should load configuration with all required variables', () => {
      // Arrange - Configuration valide complète
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '3000';

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toEqual({
        nodeEnv: 'development',
        dbPath: './test.db',
        mqttUrl: 'mqtt://localhost:1883',
        httpPort: 3000,
        topicReadingPattern: 'home/+/sensors/+/reading' // valeur par défaut
      });
    });

    it('should load configuration with optional MQTT credentials', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      process.env.DB_PATH = '/app/data/prod.db';
      process.env.MQTT_URL = 'mqtts://broker.hivemq.com:8883';
      process.env.HTTP_PORT = '8080';
      process.env.MQTT_USERNAME = 'user123';
      process.env.MQTT_PASSWORD = 'secret456';

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toEqual({
        nodeEnv: 'production',
        dbPath: '/app/data/prod.db',
        mqttUrl: 'mqtts://broker.hivemq.com:8883',
        httpPort: 8080,
        mqttUsername: 'user123',
        mqttPassword: 'secret456',
        topicReadingPattern: 'home/+/sensors/+/reading'
      });
    });

    it('should use custom topic pattern when provided', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_PATH = ':memory:';
      process.env.MQTT_URL = 'mqtt://test.mosquitto.org:1883';
      process.env.HTTP_PORT = '3001';
      process.env.TOPIC_READING_PATTERN = 'sensors/+/data';

      // Act
      const config = loadConfig();

      // Assert
      expect(config.topicReadingPattern).toBe('sensors/+/data');
    });

    it('should convert string port to number', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.DB_PATH = ':memory:';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '9999'; // String

      // Act
      const config = loadConfig();

      // Assert
      expect(config.httpPort).toBe(9999); // Number
      expect(typeof config.httpPort).toBe('number');
    });
  });

  describe('Invalid configuration', () => {
    it('should throw error when NODE_ENV is missing', () => {
      // Arrange - NODE_ENV manquant
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '3000';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/NODE_ENV.*required/i);
    });

    it('should throw error when DB_PATH is missing', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '3000';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/DB_PATH.*required/i);
    });

    it('should throw error when MQTT_URL is missing', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.HTTP_PORT = '3000';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/MQTT_URL.*required/i);
    });

    it('should throw error when HTTP_PORT is missing', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/HTTP_PORT.*required/i);
    });

    it('should throw error for invalid NODE_ENV values', () => {
      // Arrange
      process.env.NODE_ENV = 'invalid';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '3000';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/NODE_ENV.*must be one of/i);
    });

    it('should throw error for invalid MQTT_URL format', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'invalid-url';
      process.env.HTTP_PORT = '3000';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/MQTT_URL.*must be a valid uri/i);
    });

    it('should throw error for invalid HTTP_PORT', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = 'not-a-number';

      // Act & Assert
      expect(() => loadConfig()).toThrow(/HTTP_PORT.*fails to match.*pattern/i);
    });

    it('should throw error for out-of-range HTTP_PORT', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.DB_PATH = './test.db';
      process.env.MQTT_URL = 'mqtt://localhost:1883';
      process.env.HTTP_PORT = '99999'; // Trop grand

      // Act & Assert
      expect(() => loadConfig()).toThrow(/HTTP_PORT.*must be.*valid port/i);
    });
  });

  describe('Configuration schema', () => {
    it('should export Joi schema for external validation', () => {
      // Assert
      expect(configSchema).toBeDefined();
      expect(typeof configSchema.validate).toBe('function');
    });

    it('should validate correct environment object with schema', () => {
      // Arrange
      const validEnv = {
        NODE_ENV: 'development',
        DB_PATH: './test.db',
        MQTT_URL: 'mqtt://localhost:1883',
        HTTP_PORT: '3000'
      };

      // Act
      const { error, value } = configSchema.validate(validEnv);

      // Assert
      expect(error).toBeUndefined();
      expect(value.NODE_ENV).toBe('development');
    });

    it('should reject invalid environment object with schema', () => {
      // Arrange
      const invalidEnv = {
        NODE_ENV: 'invalid-env',
        DB_PATH: './test.db'
        // MQTT_URL et HTTP_PORT manquants
      };

      // Act
      const { error } = configSchema.validate(invalidEnv);

      // Assert
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(1); // Au moins une erreur
    });
  });
});
