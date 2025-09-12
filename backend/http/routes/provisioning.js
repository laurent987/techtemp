/**
 * @file provisioning.js – Device provisioning routes – /api/v1/provisioning
 * Implements automatic device + room provisioning like the scripts
 */

import { Router } from 'express';

/**
 * @typedef {Object} ProvisionRequest
 * @property {string} uid - Device UID (required)
 * @property {string} label - Device label (required)
 * @property {string} [model] - Device model (default: AHT20)
 * @property {string} [roomName] - Room name for placement (auto-generates room UID)
 */

/**
 * Generate room_uid from room name (same logic as provision script)
 * @param {string} roomName - Human readable room name
 * @returns {string} - Generated room_uid
 */
function generateRoomUid(roomName) {
  return roomName
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dash
    .replace(/-+/g, '-')         // Replace multiple dashes with single
    .replace(/^-|-$/g, '');      // Remove leading/trailing dashes
}

/**
 * Create the provisioning router.
 * @param {{ repo: import('../../../repositories/index.js').Repository }} deps
 * @returns {import('express').Router}
 */
export function provisioningRouter(deps = {}) {
  const router = Router();

  // POST /api/v1/provisioning/device - Provision device with optional room
  router.post('/device', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { uid, label, model = 'AHT20', roomName } = req.body;

      // Validation
      if (!uid || !label) {
        return res.status(400).json({
          error: 'uid and label are required'
        });
      }

      if (typeof uid !== 'string' || typeof label !== 'string') {
        return res.status(400).json({
          error: 'uid and label must be strings'
        });
      }

      if (roomName && typeof roomName !== 'string') {
        return res.status(400).json({
          error: 'roomName must be a string'
        });
      }

      let roomRecord = null;
      let roomUid = null;

      // 1. Create room if specified and doesn't exist
      if (roomName) {
        roomUid = generateRoomUid(roomName);

        roomRecord = await deps.repo.rooms.findByUid(roomUid);
        if (!roomRecord) {
          roomRecord = await deps.repo.rooms.create({
            uid: roomUid,
            name: roomName
          });
        }
      }

      // 2. Create device (or check if exists)
      const existingDevice = await deps.repo.devices.findByUid(uid);
      if (existingDevice) {
        return res.status(409).json({
          error: `Device with UID ${uid} already exists`,
          device: {
            uid: existingDevice.uid,
            label: existingDevice.label,
            model: existingDevice.model
          }
        });
      }

      const device = await deps.repo.devices.create({
        uid,
        label,
        model,
        last_seen_at: new Date().toISOString()
      });

      // 3. Create device placement if room specified
      if (roomRecord) {
        // Direct dataAccess for placement - TODO: Add to Repository
        const dataAccess = deps.repo._dataAccess;
        if (dataAccess) {
          try {
            await dataAccess.insertDevicePlacement({
              device_id: device.id,
              room_id: roomRecord.id,
              from_ts: new Date().toISOString(),
              to_ts: null
            });
          } catch (error) {
            if (!error.message.includes('UNIQUE constraint')) {
              throw error; // Re-throw if not a duplicate
            }
          }
        }
      }

      // Response
      const response = {
        message: 'Device provisioned successfully',
        device: {
          uid: device.uid,
          label: device.label,
          model: device.model,
          id: device.id
        }
      };

      if (roomRecord) {
        response.room = {
          uid: roomRecord.uid,
          name: roomRecord.name,
          id: roomRecord.id
        };
        response.placement = {
          room_uid: roomRecord.uid,
          room_name: roomRecord.name
        };
      }

      res.status(201).json(response);

    } catch (error) {
      console.error('Device provisioning error:', error.message);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // GET /api/v1/provisioning/status/:uid - Check device provisioning status
  router.get('/status/:uid', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { uid } = req.params;

      const device = await deps.repo.devices.findByUid(uid);
      if (!device) {
        return res.status(404).json({
          error: 'Device not found',
          provisioned: false
        });
      }

      // Check for current placement
      const dataAccess = deps.repo._dataAccess;
      let placement = null;
      let room = null;

      if (dataAccess) {
        placement = await dataAccess.findCurrentDevicePlacement(uid);
        if (placement && placement.room_id) {
          room = await deps.repo.rooms.findById(placement.room_id);
        }
      }

      const response = {
        provisioned: true,
        device: {
          uid: device.uid,
          label: device.label,
          model: device.model,
          last_seen_at: device.last_seen_at
        }
      };

      if (room) {
        response.room = {
          uid: room.uid,
          name: room.name
        };
        response.placement = {
          from_ts: placement.from_ts,
          to_ts: placement.to_ts
        };
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('Provisioning status error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  return router;
}

export { provisioningRouter };
