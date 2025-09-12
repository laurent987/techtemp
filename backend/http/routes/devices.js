/**
 * @file devices.js – Device management routes – /api/v1/devices
 */

import { Router } from 'express';

/**
 * Generate a room UID from a room name by:
 * - Converting to lowercase
 * - Replacing spaces and special chars with hyphens
 * - Removing consecutive hyphens
 * - Trimming start/end hyphens
 */
function generateRoomUid(roomName) {
  return roomName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')             // Remove consecutive hyphens
    .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
}

/**
 * @typedef {Object} Device
 * @property {number} id
 * @property {string} uid
 * @property {number|null} room_id
 * @property {string|null} label
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Room
 * @property {number} id
 * @property {string} uid
 * @property {string} name
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * Create the devices router.
 * @param {{ repo: import('../../../repositories/index.js').Repository }} deps
 * @returns {import('express').Router}
 */
export function devicesRouter(deps = {}) {
  const router = Router();

  // GET /api/v1/devices - List all devices
  router.get('/', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const devices = await deps.repo.devices.findAll();

      res.status(200).json({
        data: devices.map(device => ({
          uid: device.uid,
          room_id: device.room_id,
          label: device.label,
          created_at: device.created_at,
          last_seen_at: device.last_seen_at
        }))
      });

    } catch (error) {
      console.error('Devices list error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // GET /api/v1/devices/:deviceUid - Get specific device by UID
  router.get('/:deviceUid', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceUid } = req.params;
      const device = await deps.repo.devices.findByUid(deviceUid);

      if (!device) {
        return res.status(404).json({
          error: 'Device not found'
        });
      }

      // Also get room info if assigned
      let room = null;
      if (device.room_id) {
        room = await deps.repo.rooms.findById(device.room_id);
      }

      res.status(200).json({
        data: {
          uid: device.uid,
          room_id: device.room_id,
          room: room ? {
            uid: room.uid,
            name: room.name
          } : null,
          label: device.label,
          created_at: device.created_at,
          updated_at: device.updated_at
        }
      });

    } catch (error) {
      console.error('Device get error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // POST /api/v1/devices - Create/provision a new device with room auto-creation
  router.post('/', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { device_uid, room_name, room_uid, label } = req.body;

      // Validation
      if (!device_uid || typeof device_uid !== 'string') {
        return res.status(400).json({
          error: 'device_uid is required and must be a string'
        });
      }

      if (!room_name || typeof room_name !== 'string') {
        return res.status(400).json({
          error: 'room_name is required and must be a string'
        });
      }

      if (room_uid && typeof room_uid !== 'string') {
        return res.status(400).json({
          error: 'room_uid must be a string if provided'
        });
      }

      if (label && typeof label !== 'string') {
        return res.status(400).json({
          error: 'label must be a string if provided'
        });
      }

      // Check if device already exists
      const existingDevice = await deps.repo.devices.findByUid(device_uid);
      if (existingDevice) {
        return res.status(409).json({
          error: 'Device already exists',
          device_uid: device_uid
        });
      }

      // Generate room UID if not provided
      const finalRoomUid = room_uid || generateRoomUid(room_name);

      // Find or create room
      let room = await deps.repo.rooms.findByUid(finalRoomUid);

      if (!room) {
        console.log(`Creating new room: ${room_name} (${finalRoomUid})`);
        room = await deps.repo.rooms.create({
          uid: finalRoomUid,
          name: room_name
        });
      } else {
        console.log(`Using existing room: ${room.name} (${room.uid})`);
      }

      // Create device with room assignment
      console.log(`Creating device: ${device_uid} in room ${room.uid}`);
      const device = await deps.repo.devices.create({
        uid: device_uid,
        room_id: room.id,
        label: label || null
      });

      res.status(201).json({
        data: {
          device: {
            uid: device.uid,
            room_id: device.room_id,
            label: device.label,
            created_at: device.created_at,
            last_seen_at: device.last_seen_at
          },
          room: {
            uid: room.uid,
            name: room.name,
            created_at: room.created_at,
            updated_at: room.updated_at
          }
        },
        message: 'Device provisioned successfully'
      });

    } catch (error) {
      console.error('Device provision error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // PUT /api/v1/devices/:deviceUid - Update device location and label
  router.put('/:deviceUid', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceUid } = req.params;
      const { room_name, room_uid, label } = req.body;

      // Check if device exists
      const device = await deps.repo.devices.findByUid(deviceUid);
      if (!device) {
        return res.status(404).json({
          error: 'Device not found'
        });
      }

      let updatedRoomId = device.room_id;

      // Handle room change if provided
      if (room_name) {
        if (typeof room_name !== 'string') {
          return res.status(400).json({
            error: 'room_name must be a string'
          });
        }

        if (room_uid && typeof room_uid !== 'string') {
          return res.status(400).json({
            error: 'room_uid must be a string if provided'
          });
        }

        // Generate room UID if not provided
        const finalRoomUid = room_uid || generateRoomUid(room_name);

        // Find or create room
        let room = await deps.repo.rooms.findByUid(finalRoomUid);

        if (!room) {
          console.log(`Creating new room: ${room_name} (${finalRoomUid})`);
          room = await deps.repo.rooms.create({
            uid: finalRoomUid,
            name: room_name
          });
        }

        updatedRoomId = room.id;
      }

      // Validate label if provided
      if (label && typeof label !== 'string') {
        return res.status(400).json({
          error: 'label must be a string if provided'
        });
      }

      // Update device
      const updateData = {
        room_id: updatedRoomId
      };

      if (label !== undefined) {
        updateData.label = label;
      }

      await deps.repo.devices.update(deviceUid, updateData);

      // Get updated device with room info
      const updatedDevice = await deps.repo.devices.findByUid(deviceUid);
      let room = null;
      if (updatedDevice.room_id) {
        room = await deps.repo.rooms.findById(updatedDevice.room_id);
      }

      res.status(200).json({
        data: {
          device: {
            uid: updatedDevice.uid,
            room_id: updatedDevice.room_id,
            label: updatedDevice.label,
            created_at: updatedDevice.created_at,
            last_seen_at: updatedDevice.last_seen_at
          },
          room: room ? {
            uid: room.uid,
            name: room.name
          } : null
        },
        message: 'Device updated successfully'
      });

    } catch (error) {
      console.error('Device update error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // DELETE /api/v1/devices/:deviceUid - Delete device by UID
  router.delete('/:deviceUid', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceUid } = req.params;

      const device = await deps.repo.devices.findByUid(deviceUid);
      if (!device) {
        return res.status(404).json({
          error: 'Device not found'
        });
      }

      await deps.repo.devices.delete(deviceUid);

      res.status(200).json({
        message: 'Device deleted successfully',
        uid: deviceUid
      });

    } catch (error) {
      console.error('Device delete error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  return router;
}
