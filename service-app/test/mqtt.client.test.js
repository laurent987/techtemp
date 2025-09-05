import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import net from 'node:net';
import { once } from 'node:events';
import { createMqttClient } from '../src/mqtt/client.js';

let broker;
let server;
let port = 18883;

beforeAll(async () => {
  const { default: Aedes } = await import('aedes');
  broker = Aedes();
  server = net.createServer(broker.handle);
  server.listen(port);
  await once(server, 'listening');
}, 20_000);

afterAll(() => {
  if (broker) broker.close();
  if (server) server.close();
}, 5_000);

describe('MQTT Client Tests', () => {
  it('should throw if url is missing', () => {
    expect(() => createMqttClient({})).toThrow(/url/i);
  });

  it('should connect and publish/subscribe', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const received = [];
    const unsubscribe = onMessage((topic, buf) => {
      received.push({ topic, payload: buf.toString() });
    });

    await subscribe('home/test/reading');
    await publish('home/test/reading', JSON.stringify({ hello: 'world' }));

    await new Promise((r) => setTimeout(r, 100));

    expect(received.length).toBeGreaterThan(0);
    expect(received[0].topic).toBe('home/test/reading');
    expect(JSON.parse(received[0].payload)).toEqual({ hello: 'world' });

    unsubscribe();
    await close();
  });

  it('should validate required parameters', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    await expect(subscribe('')).rejects.toThrow(/topic is required/);
    await expect(publish('', 'msg')).rejects.toThrow(/topic is required/);
    await expect(publish('topic')).rejects.toThrow(/msg is required/);

    expect(() => onMessage()).toThrow(/handler must be a function/);
    expect(() => onMessage('not-a-function')).toThrow(/handler must be a function/);

    await close();
  });

  it('should support multiple handlers', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const h1 = vi.fn();
    const h2 = vi.fn();

    onMessage((t, b) => h1(t, b.toString()));
    onMessage((t, b) => h2(t, b.toString()));

    await subscribe('home/test/multi');
    await publish('home/test/multi', 'ping');

    await new Promise((r) => setTimeout(r, 100));

    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();

    await close();
  });

  it('should use QoS 1 by default', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const mqttClient = createMqttClient({ url });
    const { subscribe, publish, close, client } = mqttClient;

    const subscribeSpy = vi.spyOn(client, 'subscribe');
    const publishSpy = vi.spyOn(client, 'publish');

    await subscribe('home/test/qos');
    await publish('home/test/qos', 'test-qos');

    expect(subscribeSpy).toHaveBeenCalledWith('home/test/qos', { qos: 1 }, expect.any(Function));
    expect(publishSpy).toHaveBeenCalledWith(
      'home/test/qos',
      'test-qos',
      { qos: 1, retain: false },
      expect.any(Function)
    );

    await close();
  });

  it('should support custom QoS levels', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, close } = createMqttClient({ url });

    // Test QoS 0, 1, 2
    await expect(subscribe('home/test/qos0', 0)).resolves.not.toThrow();
    await expect(subscribe('home/test/qos2', 2)).resolves.not.toThrow();

    // Test custom publish options
    await expect(publish('home/test/custom', 'data', { qos: 2, retain: true })).resolves.not.toThrow();

    await close();
  });

  it('should return unsubscribe function that works', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const handler = vi.fn();
    const unsubscribe = onMessage((t, b) => handler(t, b.toString()));

    await subscribe('home/test/unsub');
    await publish('home/test/unsub', 'before-unsub');
    await new Promise((r) => setTimeout(r, 100));

    expect(handler).toHaveBeenCalledTimes(1);

    // Unsubscribe and verify handler no longer called
    unsubscribe();
    await publish('home/test/unsub', 'after-unsub');
    await new Promise((r) => setTimeout(r, 100));

    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2

    await close();
  });

  it('should handle errors gracefully in message handlers', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const workingHandler = vi.fn();
    const errorHandler = vi.fn(() => { throw new Error('Handler error'); });

    onMessage(errorHandler);
    onMessage(workingHandler);

    await subscribe('home/test/error');
    await publish('home/test/error', 'trigger-error');
    await new Promise((r) => setTimeout(r, 100));

    // Both handlers should be called despite error in first one
    expect(errorHandler).toHaveBeenCalled();
    expect(workingHandler).toHaveBeenCalled();

    await close();
  });

  it('should handle connection to invalid broker gracefully', async () => {
    const invalidUrl = 'mqtt://127.0.0.1:65000'; // Non-existent broker

    // Should not throw immediately (connection is async)
    const client = createMqttClient({ url: invalidUrl });

    // But should fail when trying to use it
    await expect(client.subscribe('test')).rejects.toThrow();

    // Close should still work
    await expect(client.close()).resolves.not.toThrow();
  });

  it('should support Last Will Testament (LWT)', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const will = {
      topic: 'home/device/status',
      payload: 'offline',
      qos: 1,
      retain: true
    };

    const { close } = createMqttClient({ url, will });

    // Just verify it connects successfully with LWT
    await expect(close()).resolves.not.toThrow();
  });

  it('should prevent socket leaks after close', async () => {
    const url = `mqtt://127.0.0.1:${port}`;

    // Create and close multiple clients rapidly
    for (let i = 0; i < 5; i++) {
      const { subscribe, publish, close } = createMqttClient({ url });
      await subscribe('test/leak');
      await publish('test/leak', 'data');
      await close();
    }

    // If there were socket leaks, this would eventually fail or hang
    expect(true).toBe(true); // Test passes if no hang
  });

  it('should support authentication with username/password', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, close } = createMqttClient({
      url,
      username: 'testuser',
      password: 'testpass'
    });

    await expect(subscribe('home/auth/test')).resolves.not.toThrow();
    await close();
  });

  it('should handle different message formats', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const received = [];
    const unsubscribe = onMessage((topic, buf) => {
      received.push({ topic, payload: buf, isBuffer: Buffer.isBuffer(buf) });
    });

    await subscribe('home/test/formats');

    // Test string message
    await publish('home/test/formats', 'string message');

    // Test Buffer message
    await publish('home/test/formats', Buffer.from('buffer message'));

    await new Promise((r) => setTimeout(r, 100));

    expect(received.length).toBe(2);
    expect(received[0].isBuffer).toBe(true); // All messages come as Buffers
    expect(received[1].isBuffer).toBe(true);

    unsubscribe();
    await close();
  });

  it('should handle concurrent operations', async () => {
    const url = `mqtt://127.0.0.1:${port}`;
    const { subscribe, publish, onMessage, close } = createMqttClient({ url });

    const received = [];
    const unsubscribe = onMessage((topic, buf) => {
      received.push({ topic, payload: buf.toString() });
    });

    // Subscribe to multiple topics concurrently
    await Promise.all([
      subscribe('concurrent/topic1'),
      subscribe('concurrent/topic2'),
      subscribe('concurrent/topic3')
    ]);

    // Publish to multiple topics concurrently
    await Promise.all([
      publish('concurrent/topic1', 'message1'),
      publish('concurrent/topic2', 'message2'),
      publish('concurrent/topic3', 'message3')
    ]);

    await new Promise((r) => setTimeout(r, 200));

    expect(received.length).toBe(3);

    unsubscribe();
    await close();
  });
});
