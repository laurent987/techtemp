/**
 * Thin client for the TechTemp REST API.
 * Returns plain JS objects shaped for the dashboard, hiding the wire format.
 */

import { API_ENDPOINTS } from '../config/api.endpoints';

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} on ${url}: ${text || res.statusText}`);
  }
  return res.json();
}

/** GET /api/v1/devices → [{id, uid, name, label, room_id, room_name, last_seen_at}] */
export async function getDevices() {
  const json = await getJSON(API_ENDPOINTS.DEVICES);
  return (json.data || []).map((d) => ({
    id: d.uid,
    uid: d.uid,
    name: d.label || d.uid,
    label: d.label,
    room_id: d.room?.uid || null,
    room_name: d.room?.name || null,
    last_seen_at: d.last_seen_at || null,
    created_at: d.created_at || null
  }));
}

/** GET /api/v1/readings/latest → [{device_id, room_id, ts, temperature, humidity}] */
export async function getLatestReadings() {
  const json = await getJSON(API_ENDPOINTS.READINGS_LATEST);
  return (json.data || []).map((r) => ({
    deviceUid: r.device_id,
    roomUid: r.room_id,
    ts: r.ts,
    timestamp: new Date(r.ts).getTime(),
    temperature: r.temperature,
    humidity: r.humidity
  }));
}

/** GET /api/v1/rooms → [{id, uid, name, floor, side}] */
export async function getRooms() {
  const json = await getJSON(API_ENDPOINTS.ROOMS);
  return (json.data || []).map((r) => ({
    id: r.uid,
    uid: r.uid,
    name: r.name,
    floor: r.floor,
    side: r.side
  }));
}

/**
 * GET /api/v1/devices/:uid/readings?from=&to=&limit=
 * Returns readings shaped like { timestamp (ms), temperature, humidity, source }
 * sorted oldest → newest (handy for charts).
 */
export async function getDeviceReadings(deviceUid, { from, to, limit = 10000, bucket } = {}) {
  const params = new URLSearchParams();
  if (from instanceof Date) params.set('from', from.toISOString());
  else if (typeof from === 'string') params.set('from', from);
  if (to instanceof Date) params.set('to', to.toISOString());
  else if (typeof to === 'string') params.set('to', to);
  params.set('limit', String(limit));
  if (bucket && bucket !== 'raw') params.set('bucket', bucket);

  const url = `${API_ENDPOINTS.deviceReadings(deviceUid)}?${params.toString()}`;
  const json = await getJSON(url);

  // The API returns readings newest-first; reverse for chart consumption.
  const rows = [...(json.data || [])].reverse();
  return rows.map((r) => ({
    timestamp: new Date(r.ts).getTime(),
    ts: r.ts,
    temperature: r.temperature,
    humidity: r.humidity,
    temperatureMin: r.temperature_min,
    temperatureMax: r.temperature_max,
    humidityMin: r.humidity_min,
    humidityMax: r.humidity_max,
    source: r.source || 'mqtt'
  }));
}

/**
 * Fetch readings for every device that currently sits in a given room
 * over the [from, to] window, then merge them in chronological order.
 * For the MVP a room typically has 1 active device, so the merge is trivial.
 */
export async function getRoomReadings(roomUid, range) {
  const devices = await getDevices();
  const roomDevices = devices.filter((d) => d.room_id === roomUid);
  if (roomDevices.length === 0) return [];

  const all = await Promise.all(
    roomDevices.map((d) => getDeviceReadings(d.uid, range))
  );
  return all.flat().sort((a, b) => a.timestamp - b.timestamp);
}
