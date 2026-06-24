/**
 * API endpoints for the TechTemp backend (Node.js).
 *
 * Override at build time with:
 *   VITE_API_BASE_URL=http://my-pi.local:3000/api/v1 npm run dev
 */

const DEFAULT_BASE_URL = 'http://192.168.0.42:3000/api/v1';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;

export const API_ENDPOINTS = {
  DEVICES: `${API_BASE_URL}/devices`,
  ROOMS: `${API_BASE_URL}/rooms`,
  READINGS_LATEST: `${API_BASE_URL}/readings/latest`,
  deviceReadings: (uid) => `${API_BASE_URL}/devices/${encodeURIComponent(uid)}/readings`
};
