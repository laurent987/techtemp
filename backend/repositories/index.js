/**
 * @file Repository Pattern - Complete Implementation
 * Business logic layer that provides repository interfaces for devices, rooms, and readings.
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
        const createdDevice = { ...device, id: result.lastInsertRowid };

        // If room_id is provided, create placement
        if (deviceData.room_id) {
          await dataAccess.insertDevicePlacement({
            device_id: createdDevice.id,
            room_id: deviceData.room_id,
            from_ts: new Date().toISOString()
          });

          // Add room_id to returned device for consistency
          createdDevice.room_id = deviceData.room_id;
        }

        return createdDevice;
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

        const device = await dataAccess.findDeviceByUid(uid);
        if (!device) {
          return null;
        }

        // Get current placement to include room_id
        const placement = await dataAccess.findCurrentDevicePlacement(uid);

        return {
          ...device,
          room_id: placement ? placement.room_id : null
        };
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
      },
      findAll: async () => {
        const devices = await dataAccess.findAllDevices();

        // For each device, get current room assignment
        const devicesWithRooms = await Promise.all(
          devices.map(async (device) => {
            const placement = await dataAccess.findCurrentDevicePlacement(device.uid);
            return {
              ...device,
              room_id: placement ? placement.room_id : null
            };
          })
        );

        return devicesWithRooms;
      },
      update: async (uid, updateData) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // Check if device exists
        const device = await dataAccess.findDeviceByUid(uid);
        if (!device) {
          throw new Error(`Device with UID ${uid} not found`);
        }

        // Update basic device properties (excluding room_id)
        const deviceUpdateData = {
          label: updateData.label,
          model: updateData.model
        };

        await dataAccess.updateDeviceByUid(uid, deviceUpdateData);

        // Handle room_id changes via placements
        if (updateData.room_id !== undefined) {
          // First, close current placement if exists
          const currentPlacement = await dataAccess.findCurrentDevicePlacement(uid);
          if (currentPlacement) {
            await dataAccess.updateDevicePlacement(currentPlacement.device_id, currentPlacement.from_ts, {
              to_ts: new Date().toISOString()
            });
          }

          // Create new placement if room_id is provided (not null)
          if (updateData.room_id) {
            // Resolve device ID internally in dataAccess
            const deviceId = await dataAccess.resolveDeviceId(uid);
            await dataAccess.insertDevicePlacement({
              device_id: deviceId,
              room_id: updateData.room_id,
              from_ts: new Date().toISOString()
            });
          }
        }

        // Return updated device with room_id
        const updatedDevice = await dataAccess.findDeviceByUid(uid);
        const placement = await dataAccess.findCurrentDevicePlacement(uid);

        return {
          ...updatedDevice,
          room_id: placement ? placement.room_id : null
        };
      },
      delete: async (uid) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // Check if device exists
        const device = await dataAccess.findDeviceByUid(uid);
        if (!device) {
          throw new Error(`Device with UID ${uid} not found`);
        }

        // First, delete all placements for this device
        await dataAccess.deleteDevicePlacements(device.id);

        // Then delete the device itself
        await dataAccess.deleteDeviceByUid(uid);

        return { success: true };
      }
    },
    rooms: {
      create: async (room) => {
        if (!room.uid || !room.name) {
          throw new Error('Room UID and name are required');
        }

        // Check for duplicate UID
        const existing = await dataAccess.findRoomByUid(room.uid);
        if (existing) {
          throw new Error(`Room with UID ${room.uid} already exists`);
        }

        const result = await dataAccess.insertRoom(room);
        return { ...room, id: result.lastInsertRowid };
      },
      findById: async (roomId) => {
        if (!roomId) {
          throw new Error('Room ID is required');
        }

        return await dataAccess.findRoomById(roomId);
      },
      findByUid: async (roomUid) => {
        if (!roomUid) {
          throw new Error('Room UID is required');
        }

        return await dataAccess.findRoomByUid(roomUid);
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
      findByDeviceUid: async (uid, limit = 10) => {
        if (!uid) {
          throw new Error('Device UID is required');
        }

        // Validate limit
        const limitInt = parseInt(limit, 10);
        if (isNaN(limitInt) || limitInt < 1) {
          throw new Error('Limit must be a positive integer');
        }

        const readings = await dataAccess.findReadingsByDeviceUid(uid, limitInt);
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
