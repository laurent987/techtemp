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
 * 200: { data: LatestReadingResponse | null }
 * 400: for missing/invalid query params
 * @param {{ repo: import('../../db/index.js').DbRepo }} deps
 * @returns {import('express').Router}
 */
export function readingsRouter(deps) {
  throw new Error('NotImplemented');
}
