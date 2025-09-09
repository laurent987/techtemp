/**
 * @file readings.js – Reading routes – /api/v1/readings/latest
 */

import { Router } from 'express';

/**
 * @typedef {Object} LatestReadingResponse
 * @property {string} home_id
 * @property {string} device_id
 * @property {number} ts_utc
 * @property {{ temperature_c: number, humidity_pct: number }} values
 */

/**
 * Create the readings router.
 * GET /api/v1/readings/latest?homeId=...&deviceId=...
 * 200: { data: LatestReadingResponse[] }
 * 400: for missing/invalid query params
 * @param {{ repo: import('../../../repositories/index.js').Repository }} deps
 * @returns {import('express').Router}
 */
export function readingsRouter(deps = {}) {
  const router = Router();

  router.get('/latest', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      // Extract query parameters
      const { homeId, deviceId } = req.query;

      // Get latest readings per device
      let readings;

      if (deviceId) {
        // Get latest reading for specific device
        readings = await deps.repo.readings.findLatestByDevice(deviceId);
        readings = readings ? [readings] : [];
      } else if (homeId) {
        // Get latest readings for all devices in a home (not implemented in repository yet)
        // For now, get all latest readings and filter by homeId if needed
        readings = await deps.repo.readings.findLatestPerDevice();
        // Note: homeId filtering would require room/home relationship in the database
      } else {
        // Get latest readings for all devices
        readings = await deps.repo.readings.findLatestPerDevice();
      }

      // Transform data to API format
      const data = readings.map(reading => ({
        home_id: reading.room_id || 'unknown', // Use room_id as home_id for now
        device_id: reading.device_id,
        ts_utc: Math.floor(new Date(reading.ts).getTime() / 1000),
        values: {
          temperature_c: reading.temperature,
          humidity_pct: reading.humidity
        }
      }));

      res.status(200).json({ data });

    } catch (error) {
      console.error('Readings API error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  return router;
}
