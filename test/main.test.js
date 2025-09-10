// test/main.test.js — Orchestration & Lifecycle tests


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';


describe('Application Orchestration (main.js)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('charge et valide la configuration', async () => {
    // Injecter une config valide via process.env
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = './test.db';
    process.env.MQTT_URL = 'mqtt://localhost';
    process.env.HTTP_PORT = '3000';
    process.env.TOPIC_READING_PATTERN = 'home/+/sensors/+/reading';
    const { loadConfig } = await import('../backend/config.js');
    const config = loadConfig();
    expect(config).toHaveProperty('dbPath');
    expect(config).toHaveProperty('mqttUrl');
    expect(config).toHaveProperty('httpPort');
  });

  it('échoue proprement si la configuration est invalide', async () => {
    // Injecter une config incomplète via process.env
    process.env.NODE_ENV = 'test';
    delete process.env.DB_PATH;
    delete process.env.MQTT_URL;
    delete process.env.HTTP_PORT;
    const { loadConfig } = await import('../backend/config.js');
    expect(() => loadConfig()).toThrow();
  });

  it('démarre tous les modules dans le bon ordre', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = './test.db';
    process.env.MQTT_URL = 'mqtt://localhost';
    process.env.HTTP_PORT = '3000';
    process.env.TOPIC_READING_PATTERN = 'home/+/sensors/+/reading';
    const order = [];
    const httpClose = vi.fn();
    await vi.doMock('../backend/db/index.js', () => ({
      initDb: vi.fn(() => {
        order.push('db');
        return {
          prepare: vi.fn(() => ({ run: vi.fn(), get: vi.fn(), all: vi.fn() })),
          close: vi.fn(),
          pragma: vi.fn()
        };
      })
    }));
    await vi.doMock('../backend/mqtt/client.js', () => ({
      createMqttClient: vi.fn(() => {
        order.push('mqtt');
        return {
          onMessage: vi.fn(() => vi.fn()), // retourne une fonction de désinscription
          subscribe: vi.fn(),
          disconnect: vi.fn()
        };
      })
    }));
    await vi.doMock('../backend/http/server.js', () => ({
      createHttpServer: vi.fn(() => { order.push('http'); return { start: vi.fn().mockResolvedValue({ port: 3000 }), stop: httpClose }; })
    }));
    const { start } = await import('../backend/main.js');
    await start();
    expect(order).toEqual(['db', 'mqtt', 'http']);
  });

  it('gère le shutdown sur SIGTERM/SIGINT', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = './test.db';
    process.env.MQTT_URL = 'mqtt://localhost';
    process.env.HTTP_PORT = '3000';
    process.env.TOPIC_READING_PATTERN = 'home/+/sensors/+/reading';
    const dbClose = vi.fn();
    const mqttDisconnect = vi.fn();
    const httpClose = vi.fn();
    await vi.doMock('../backend/db/index.js', () => ({
      initDb: vi.fn(() => ({ close: dbClose, prepare: vi.fn(() => ({ run: vi.fn(), get: vi.fn(), all: vi.fn() })), pragma: vi.fn() }))
    }));
    await vi.doMock('../backend/mqtt/client.js', () => ({
      createMqttClient: vi.fn(() => ({ disconnect: mqttDisconnect, onMessage: vi.fn(() => vi.fn()), subscribe: vi.fn() }))
    }));
    await vi.doMock('../backend/http/server.js', () => ({
      createHttpServer: vi.fn(() => ({ start: vi.fn().mockResolvedValue({ port: 3000 }), stop: httpClose, close: httpClose }))
    }));
    const { start } = await import('../backend/main.js');
    const app = await start();
    await app.stop();
    expect(dbClose).toHaveBeenCalled();
    expect(mqttDisconnect).toHaveBeenCalled();
    expect(httpClose).toHaveBeenCalled();
  });

  it('nettoie toutes les ressources à l’arrêt', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = './test.db';
    process.env.MQTT_URL = 'mqtt://localhost';
    process.env.HTTP_PORT = '3000';
    process.env.TOPIC_READING_PATTERN = 'home/+/sensors/+/reading';
    const dbClose = vi.fn();
    const mqttDisconnect = vi.fn();
    const httpClose = vi.fn();
    await vi.doMock('../backend/db/index.js', () => ({
      initDb: vi.fn(() => ({ close: dbClose, prepare: vi.fn(() => ({ run: vi.fn(), get: vi.fn(), all: vi.fn() })), pragma: vi.fn() }))
    }));
    await vi.doMock('../backend/mqtt/client.js', () => ({
      createMqttClient: vi.fn(() => ({ disconnect: mqttDisconnect, onMessage: vi.fn(() => vi.fn()), subscribe: vi.fn() }))
    }));
    await vi.doMock('../backend/http/server.js', () => ({
      createHttpServer: vi.fn(() => ({ start: vi.fn().mockResolvedValue({ port: 3000 }), stop: httpClose, close: httpClose }))
    }));
    const { start } = await import('../backend/main.js');
    const app = await start();
    await app.stop();
    expect(dbClose).toHaveBeenCalled();
    expect(mqttDisconnect).toHaveBeenCalled();
    expect(httpClose).toHaveBeenCalled();
  });

  it('gère les erreurs de démarrage et runtime', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = './test.db';
    process.env.MQTT_URL = 'mqtt://localhost';
    process.env.HTTP_PORT = '3000';
    process.env.TOPIC_READING_PATTERN = 'home/+/sensors/+/reading';
    await vi.doMock('../backend/db/index.js', () => ({
      initDb: vi.fn(() => { throw new Error('DB init failed'); })
    }));
    const { start } = await import('../backend/main.js');
    await expect(start()).rejects.toThrow('DB init failed');
    vi.unmock('../backend/db/index.js');
  });
});
