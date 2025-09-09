/**
 * @file Repository Pattern - Phase 4 (Stub)
 * Business logic layer that uses Data Access Layer
 * This is a minimal stub to avoid import errors during TDD
 */

/**
 * @file Repository Pattern - Phase 4 (Stub)
 * Business logic layer that uses Data Access Layer
 * This is a minimal stub to avoid import errors during TDD
 */

import { createDataAccess } from '../db/dataAccess.js';

/**
 * Create repository instance bound to database connection
 * @param {import('better-sqlite3').Database} db 
 * @returns {Repository}
 */
export function createRepository(db) {
  const dataAccess = createDataAccess(db);

  return {
    devices: {
      create: async (deviceData) => {
        if (!deviceData || !deviceData.device_id || !deviceData.device_uid) {
          throw new Error('Device ID and UID are required');
        }

        // Check for duplicate
        const existing = await dataAccess.findDeviceById(deviceData.device_id);
        if (existing) {
          throw new Error(`Device with ID ${deviceData.device_id} already exists`);
        }

        // Create device with business logic
        const device = {
          device_id: deviceData.device_id,
          device_uid: deviceData.device_uid,
          room_id: deviceData.room_id || null,
          last_seen: deviceData.last_seen || new Date().toISOString(),
          label: deviceData.label,
          model: deviceData.model
        };

        await dataAccess.insertDevice(device);
        return device;
      },
      findById: async (deviceId) => {
        if (!deviceId) {
          throw new Error('Device ID is required');
        }

        return await dataAccess.findDeviceById(deviceId);
      },
      updateLastSeen: async (deviceId, timestamp) => {
        if (!deviceId) {
          throw new Error('Device ID is required');
        }

        // Check if device exists
        const device = await dataAccess.findDeviceById(deviceId);
        if (!device) {
          throw new Error(`Device with ID ${deviceId} not found`);
        }

        // Use provided timestamp or current time
        const lastSeen = timestamp || new Date().toISOString();

        await dataAccess.updateDeviceLastSeen(deviceId, lastSeen);

        // Return updated device
        return {
          ...device,
          last_seen_at: lastSeen
        };
      }
    },
    rooms: {
      create: async (room) => {
        if (!room.room_id || !room.name) {
          throw new Error('Room ID and name are required');
        }

        // Check for duplicate
        const existing = await dataAccess.findRoomById(room.room_id);
        if (existing) {
          throw new Error(`Room with ID ${room.room_id} already exists`);
        }

        await dataAccess.insertRoom(room);
        return room;
      },
      findById: async (roomId) => {
        if (!roomId) {
          throw new Error('Room ID is required');
        }

        return await dataAccess.findRoomById(roomId);
      }
    },
    readings: {
      create: async (reading) => {
        if (!reading.device_id || !reading.ts) {
          throw new Error('Device ID and timestamp are required');
        }

        // Validate device exists
        const device = await dataAccess.findDeviceById(reading.device_id);
        if (!device) {
          throw new Error(`Device with ID ${reading.device_id} not found`);
        }

        // Use explicit column names directly
        const { temperature, humidity } = reading;

        // Validate temperature range (-50 to 100)
        if (temperature !== undefined && (temperature < -50 || temperature > 100)) {
          throw new Error('Temperature must be between -50°C and 100°C');
        }

        // Validate humidity range (0 to 100)
        if (humidity !== undefined && (humidity < 0 || humidity > 100)) {
          throw new Error('Humidity must be between 0% and 100%');
        }

        // Clean reading data for database
        const dbReading = {
          device_id: reading.device_id,
          room_id: reading.room_id,
          ts: reading.ts,
          temperature: temperature,
          humidity: humidity,
          source: reading.source,
          msg_id: reading.msg_id
        };

        const result = await dataAccess.insertReading(dbReading);
        return {
          success: true,
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid
        };
      },
      getLatestByDevice: async (deviceId) => {
        if (!deviceId) {
          throw new Error('Device ID is required');
        }

        const reading = await dataAccess.findLatestReadingByDevice(deviceId);
        return reading;
      },
      findLatestPerDevice: async () => {
        // Get the latest reading for each device
        const readings = await dataAccess.findLatestReadingPerDevice();
        return readings;
      },
      findByRoomAndTimeRange: async (roomId, fromTs, toTs) => {
        if (!roomId || !fromTs || !toTs) {
          throw new Error('Room ID, from timestamp, and to timestamp are required');
        }
        if (new Date(fromTs) >= new Date(toTs)) {
          throw new Error('From timestamp must be before to timestamp');
        }

        const readings = await dataAccess.findReadingsByRoomAndTimeRange(roomId, fromTs, toTs);
        return readings;
      }
    }
  };
}
