/**
 * @file readings.js – Reading routes – /api/v1/readings/latest
 */

import { Router } from 'express';

/**
 * @typedef {Object} LatestReadingResponse
 * @property {string} device_id
 * @property {string|null} room_id
 * @property {string} ts - ISO timestamp
 * @property {number} temperature
 * @property {number} humidity
 */

/**
 * Create the readings router.
 * GET /api/v1/readings/latest?roomId=...&deviceId=...
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
      const { roomId, deviceId } = req.query;

      // Get latest readings per device
      let readings;

      if (deviceId) {
        // Get latest reading for specific device
        readings = await deps.repo.readings.findLatestByDevice(deviceId);
        readings = readings ? [readings] : [];
      } else if (roomId) {
        // Get latest readings for all devices in a room (not implemented in repository yet)
        // For now, get all latest readings and filter by roomId if needed
        readings = await deps.repo.readings.findLatestPerDevice();
        readings = readings.filter(reading => reading.room_id === roomId);
      } else {
        // Get latest readings for all devices
        readings = await deps.repo.readings.findLatestPerDevice();
      }

      // Transform data to contract 001 format
      const data = readings.map(reading => ({
        device_id: reading.device_id,
        room_id: reading.room_id,
        ts: reading.ts, // Keep ISO string format as per contract
        temperature: reading.temperature,
        humidity: reading.humidity
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
