/**
 * @file devices.js – Device management routes – /api/v1/devices
 */

import { Router } from 'express';

/**
 * @typedef {Object} Device
 * @property {string} device_id
 * @property {string|null} home_id
 * @property {string|null} room_id
 * @property {string|null} label
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
          device_id: device.device_id,
          home_id: device.home_id,
          room_id: device.room_id,
          label: device.label,
          created_at: device.created_at,
          updated_at: device.updated_at
        }))
      });

    } catch (error) {
      console.error('Devices list error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // GET /api/v1/devices/:deviceId - Get specific device
  router.get('/:deviceId', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceId } = req.params;
      const device = await deps.repo.devices.findById(deviceId);

      if (!device) {
        return res.status(404).json({
          error: 'Device not found'
        });
      }

      res.status(200).json({
        data: {
          device_id: device.device_id,
          home_id: device.home_id,
          room_id: device.room_id,
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

  // PUT /api/v1/devices/:deviceId - Update device location and label
  router.put('/:deviceId', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceId } = req.params;
      const { home_id, room_id, label } = req.body;

      // Validation
      if (!home_id || !room_id) {
        return res.status(400).json({
          error: 'home_id and room_id are required'
        });
      }

      if (typeof home_id !== 'string' || typeof room_id !== 'string') {
        return res.status(400).json({
          error: 'home_id and room_id must be strings'
        });
      }

      if (label && typeof label !== 'string') {
        return res.status(400).json({
          error: 'label must be a string'
        });
      }

      // Check if device exists, create if not
      let device = await deps.repo.devices.findById(deviceId);

      if (!device) {
        // Create new device
        device = await deps.repo.devices.create({
          device_id: deviceId,
          device_uid: deviceId, // Use device_id as device_uid for now
          home_id,
          room_id,
          label: label || null
        });
      } else {
        // For existing devices, we need to update via direct DB access
        // This is a temporary solution until we implement proper update
        // TODO: Implement proper update method in repository
        throw new Error('Device update not yet implemented - please delete and recreate');
      }

      res.status(200).json({
        data: {
          device_id: device.device_id,
          home_id: device.home_id,
          room_id: device.room_id,
          label: device.label,
          created_at: device.created_at,
          updated_at: device.updated_at
        }
      });

    } catch (error) {
      console.error('Device update error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  // DELETE /api/v1/devices/:deviceId - Delete device
  router.delete('/:deviceId', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const { deviceId } = req.params;

      const device = await deps.repo.devices.findById(deviceId);
      if (!device) {
        return res.status(404).json({
          error: 'Device not found'
        });
      }

      await deps.repo.devices.delete(deviceId);

      res.status(200).json({
        message: 'Device deleted successfully'
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
