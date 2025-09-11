/**
 * @file Repository Pattern - Complete Implementation
 * Business logic layer that provides repository interfaces for devices, rooms, and readings.
 * Uses the Data Access Layer to interact with the database and applies business rules.
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
        if (!deviceData || !deviceData.uid) {
          throw new Error('Device UID is required');
        }

        // Check for duplicate by UID
        const existing = await dataAccess.findDeviceByUid(deviceData.uid);
        if (existing) {
          throw new Error(`Device with UID ${deviceData.uid} already exists`);
        }

        // Create device with business logic
        const device = {
          uid: deviceData.uid,
          label: deviceData.label,
          model: deviceData.model,
          last_seen_at: deviceData.last_seen || new Date().toISOString()
        };

        const result = await dataAccess.insertDevice(device);
        return { ...device, id: result.lastInsertRowid };
      },
      findById: async (uid) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        return await dataAccess.findDeviceById(uid);
      },
      findByUid: async (uid) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        return await dataAccess.findDeviceByUid(uid);
      },
      updateLastSeen: async (uid, timestamp) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // Check if device exists
        const device = await dataAccess.findDeviceByUid(uid);
        if (!device) {
          throw new Error(`Device with UID ${uid} not found`);
        }

        // Use provided timestamp or current time
        const lastSeen = timestamp || new Date().toISOString();

        await dataAccess.updateDeviceLastSeen(uid, lastSeen);

        // Return updated device
        return {
          ...device,
          last_seen_at: lastSeen
        };
      },
      getCurrentPlacement: async (uid) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // Use data access layer for consistency
        return await dataAccess.findCurrentDevicePlacement(uid);
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
        if (!reading.uid || !reading.ts) {
          throw new Error('Device UID and timestamp are required');
        }

        // Validate device exists and get internal ID
        const device = await dataAccess.findDeviceByUid(reading.uid);
        if (!device) {
          throw new Error(`Device with UID ${reading.uid} not found. Device must be provisioned first.`);
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

        // Clean reading data for database - use internal device ID
        const dbReading = {
          device_id: device.id,  // Use internal id from resolved device
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
      getLatestByDevice: async (uid) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // dataAccess now handles UID resolution internally
        const reading = await dataAccess.findLatestReadingByDevice(uid);
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
