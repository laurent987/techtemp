/**
 * @file Device API Tests
 * Testing the device management and provisioning endpoints
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { initDb, closeDb } from '../../backend/db/index.js';
import { createRepository } from '../../backend/repositories/index.js';
import { createHttpServer } from '../../backend/http/server.js';

describe('Device API', () => {
  let db;
  let repo;
  let httpServer;
  let app;

  beforeEach(async () => {
    // Setup test database and server
    db = initDb(':memory:');
    repo = createRepository(db);
    httpServer = createHttpServer({
      httpPort: 0, // Use random port for testing
      deps: { repo }
    });

    await httpServer.start();
    app = httpServer.getApp(); // Get the Express app using the getApp method
  });

  afterEach(async () => {
    await httpServer.stop();
    closeDb();
  });

  describe('POST /api/v1/devices', () => {
    test('should create a new device with auto room creation', async () => {
      const deviceData = {
        device_uid: 'test-sensor-001',
        room_name: 'Living Room',
        label: 'Temperature sensor'
      };

      const response = await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(201);

      expect(response.body).toMatchObject({
        data: {
          device: {
            uid: 'test-sensor-001',
            label: 'Temperature sensor',
            room_id: expect.any(Number)
          },
          room: {
            uid: 'living-room',
            name: 'Living Room'
          }
        },
        message: 'Device provisioned successfully'
      });
    });

    test('should create device with custom room_uid', async () => {
      const deviceData = {
        device_uid: 'test-sensor-002',
        room_name: 'Main Bedroom',
        room_uid: 'master-bedroom',
        label: 'Humidity sensor'
      };

      const response = await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(201);

      expect(response.body.data.room.uid).toBe('master-bedroom');
    });

    test('should reject duplicate device creation', async () => {
      const deviceData = {
        device_uid: 'duplicate-sensor',
        room_name: 'Kitchen'
      };

      // Create device first time
      await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(201);

      // Try to create same device again
      const response = await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(409);

      expect(response.body.error).toBe('Device already exists');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/devices')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('device_uid is required');
    });
  });

  describe('GET /api/v1/devices/:deviceUid', () => {
    test('should return device with room information', async () => {
      // Create a device first
      await request(app)
        .post('/api/v1/devices')
        .send({
          device_uid: 'get-test-sensor',
          room_name: 'Office',
          label: 'Office sensor'
        });

      const response = await request(app)
        .get('/api/v1/devices/get-test-sensor')
        .expect(200);

      expect(response.body.data).toMatchObject({
        uid: 'get-test-sensor',
        label: 'Office sensor',
        room: {
          uid: 'office',
          name: 'Office'
        }
      });
    });

    test('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .get('/api/v1/devices/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Device not found');
    });
  });

  describe('PUT /api/v1/devices/:deviceUid', () => {
    test('should update device room and label', async () => {
      // Create a device first
      await request(app)
        .post('/api/v1/devices')
        .send({
          device_uid: 'update-test-sensor',
          room_name: 'Bedroom',
          label: 'Old label'
        });

      // Update the device
      const response = await request(app)
        .put('/api/v1/devices/update-test-sensor')
        .send({
          room_name: 'Bathroom',
          label: 'New label'
        })
        .expect(200);

      expect(response.body.data.device.label).toBe('New label');
      expect(response.body.data.room.name).toBe('Bathroom');
      expect(response.body.data.room.uid).toBe('bathroom');
    });

    test('should return 404 for non-existent device update', async () => {
      const response = await request(app)
        .put('/api/v1/devices/non-existent')
        .send({ label: 'New label' })
        .expect(404);

      expect(response.body.error).toBe('Device not found');
    });

    test('should accept a valid moved_at and backdate the placement', async () => {
      await request(app)
        .post('/api/v1/devices')
        .send({ device_uid: 'moved-sensor', room_name: 'Bedroom', label: 'Old label' });

      // Backdate the initial placement so a past moved_at is valid
      db.prepare(
        `UPDATE device_room_placements SET from_ts = ?
           WHERE device_id = (SELECT id FROM devices WHERE uid = ?)`
      ).run(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 'moved-sensor');

      const movedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
      const response = await request(app)
        .put('/api/v1/devices/moved-sensor')
        .send({ room_name: 'Attic', moved_at: movedAt })
        .expect(200);

      expect(response.body.data.room.name).toBe('Attic');

      const current = await repo.devices.getCurrentPlacement('moved-sensor');
      expect(current.from_ts).toBe(movedAt);
    });

    test('should reject a future moved_at', async () => {
      await request(app)
        .post('/api/v1/devices')
        .send({ device_uid: 'future-sensor', room_name: 'Bedroom' });

      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const response = await request(app)
        .put('/api/v1/devices/future-sensor')
        .send({ room_name: 'Attic', moved_at: future })
        .expect(400);

      expect(response.body.error).toContain('future');
    });

    test('should reject a moved_at before the current placement start', async () => {
      await request(app)
        .post('/api/v1/devices')
        .send({ device_uid: 'early-sensor', room_name: 'Bedroom' });

      // Current placement was created "now"; a date in the far past precedes it
      const tooEarly = '2000-01-01T00:00:00.000Z';
      const response = await request(app)
        .put('/api/v1/devices/early-sensor')
        .send({ room_name: 'Attic', moved_at: tooEarly })
        .expect(400);

      expect(response.body.error).toContain('after');
    });

    test('should reject a malformed moved_at', async () => {
      await request(app)
        .post('/api/v1/devices')
        .send({ device_uid: 'bad-date-sensor', room_name: 'Bedroom' });

      const response = await request(app)
        .put('/api/v1/devices/bad-date-sensor')
        .send({ room_name: 'Attic', moved_at: 'not-a-date' })
        .expect(400);

      expect(response.body.error).toContain('ISO 8601');
    });

    test('should reject moved_at without room_name', async () => {
      await request(app)
        .post('/api/v1/devices')
        .send({ device_uid: 'no-room-sensor', room_name: 'Bedroom' });

      const response = await request(app)
        .put('/api/v1/devices/no-room-sensor')
        .send({ moved_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() })
        .expect(400);

      expect(response.body.error).toContain('room_name');
    });
  });

  describe('DELETE /api/v1/devices/:deviceUid', () => {
    test('should delete existing device', async () => {
      // Create a device first
      await request(app)
        .post('/api/v1/devices')
        .send({
          device_uid: 'delete-test-sensor',
          room_name: 'Garage'
        });

      // Delete the device
      const response = await request(app)
        .delete('/api/v1/devices/delete-test-sensor')
        .expect(200);

      expect(response.body.message).toBe('Device deleted successfully');

      // Verify it's deleted
      await request(app)
        .get('/api/v1/devices/delete-test-sensor')
        .expect(404);
    });

    test('should return 404 for non-existent device deletion', async () => {
      const response = await request(app)
        .delete('/api/v1/devices/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Device not found');
    });
  });

  describe('GET /api/v1/devices', () => {
    test('should list all devices', async () => {
      // Create multiple devices
      await request(app)
        .post('/api/v1/devices')
        .send({
          device_uid: 'list-sensor-1',
          room_name: 'Kitchen'
        });

      await request(app)
        .post('/api/v1/devices')
        .send({
          device_uid: 'list-sensor-2',
          room_name: 'Living Room'
        });

      const response = await request(app)
        .get('/api/v1/devices')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('uid');
      expect(response.body.data[1]).toHaveProperty('uid');
    });
  });
});
