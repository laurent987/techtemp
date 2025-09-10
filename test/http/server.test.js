import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';

describe('HTTP Server', () => {
  let server;
  let serverInstance;

  beforeEach(async () => {
    // Configuration for testing
    const config = {
      http: {
        port: 0 // Use random available port for testing
      }
    };

    server = createHttpServer(config);
  });

  afterEach(async () => {
    if (serverInstance) {
      await new Promise((resolve) => {
        serverInstance.close(resolve);
      });
      serverInstance = null;
    }
  });

  describe('Server Creation', () => {
    it('should create an HTTP server instance', () => {
      expect(server).toBeDefined();
      expect(typeof server.start).toBe('function');
      expect(typeof server.stop).toBe('function');
      expect(typeof server.getApp).toBe('function');
    });

    it('should return Express app instance', () => {
      const app = server.getApp();
      expect(app).toBeDefined();
      // Express app should have listen method
      expect(typeof app.listen).toBe('function');
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      const result = await server.start();
      serverInstance = result.server;

      expect(result).toMatchObject({
        success: true,
        port: expect.any(Number),
        server: expect.any(Object)
      });
      expect(result.port).toBeGreaterThan(0);
    });

    it('should stop server successfully', async () => {
      // First start the server
      const startResult = await server.start();
      serverInstance = startResult.server;

      // Then stop it
      const stopResult = await server.stop();
      serverInstance = null; // Clear reference since it's stopped

      expect(stopResult).toMatchObject({
        success: true
      });
    });

    it('should handle stop when server is not running', async () => {
      const result = await server.stop();
      expect(result).toMatchObject({
        success: true
      });
    });
  });

  describe('Configuration', () => {
    it('should use provided port when specified', async () => {
      const customConfig = {
        http: {
          port: 18000 // Use a specific test port
        }
      };

      const customServer = createHttpServer(customConfig);
      const result = await customServer.start();

      expect(result.port).toBe(18000);

      // Clean up
      await new Promise((resolve) => {
        result.server.close(resolve);
      });
    });

    it('should handle missing configuration gracefully', () => {
      expect(() => createHttpServer({})).not.toThrow();
      expect(() => createHttpServer()).not.toThrow();
    });
  });
});
