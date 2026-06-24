/**
 * Minimal data layer for the dashboard.
 *
 * Talks to the TechTemp REST API directly through services/api.service.
 * No multi-source, no cache layer — fetches stay simple so the chart code
 * can focus on visualization.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getDevices as fetchDevices,
  getRooms as fetchRooms,
  getRoomReadings,
  getDeviceReadings,
  getLatestReadings as fetchLatestReadings
} from '../services/api.service';
import { getOutdoorWeather, getCurrentOutdoor } from '../services/weather.service';

const DataContext = createContext(null);

export function DataProvider({ children, refreshIntervalMs = 60_000 }) {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadDevices = useCallback(async () => {
    try {
      setError(null);
      const [d, r] = await Promise.all([fetchDevices(), fetchRooms()]);
      setDevices(d);
      setRooms(r);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadDevices();
    if (!refreshIntervalMs) return undefined;
    const id = setInterval(reloadDevices, refreshIntervalMs);
    return () => clearInterval(id);
  }, [reloadDevices, refreshIntervalMs]);

  const value = useMemo(
    () => ({
      devices,
      rooms,
      loading,
      error,
      refreshData: reloadDevices
    }),
    [devices, rooms, loading, error, reloadDevices]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}

export function useDevices() {
  const { devices, loading, error, refreshData } = useData();
  return { devices, loading, error, refreshData };
}

export function useRooms() {
  const { rooms, loading, error } = useData();
  return { rooms, loading, error };
}

/**
 * useLatestReadings(refreshIntervalMs = 30_000)
 * Polls /api/v1/readings/latest periodically.
 * Returns { readings, loading, error, lastFetchedAt }.
 */
export function useLatestReadings(refreshIntervalMs = 30_000) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchLatestReadings()
        .then((rows) => {
          if (cancelled) return;
          setReadings(rows);
          setLastFetchedAt(new Date());
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    if (!refreshIntervalMs) return () => { cancelled = true; };
    const id = setInterval(load, refreshIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshIntervalMs]);

  return { readings, loading, error, lastFetchedAt };
}

/**
 * useHistoricalData(roomUid, startDate, endDate)
 * Returns { data, loading, error } where `data` is an array of
 * { timestamp (ms), ts (ISO), temperature, humidity, source } sorted oldest first.
 */
export function useHistoricalData(roomUid, startDate, endDate) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use timestamps so the effect re-runs only when the actual instant changes,
  // not on every parent re-render that hands us a fresh Date instance.
  const fromTs = startDate ? startDate.getTime() : null;
  const toTs = endDate ? endDate.getTime() : null;

  useEffect(() => {
    if (!roomUid || !fromTs || !toTs) {
      setData([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRoomReadings(roomUid, { from: new Date(fromTs), to: new Date(toTs) })
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomUid, fromTs, toTs]);

  return { data, loading, error };
}

/**
 * useOutdoorWeather(startDate, endDate)
 * Returns { data, loading, error } where `data` is an array of
 * { timestamp (ms), temperature, humidity } from Open-Meteo.
 */
export function useOutdoorWeather(startDate, endDate, enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fromTs = startDate ? startDate.getTime() : null;
  const toTs = endDate ? endDate.getTime() : null;

  useEffect(() => {
    if (!enabled || !fromTs || !toTs) {
      setData([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getOutdoorWeather(new Date(fromTs), new Date(toTs))
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, fromTs, toTs]);

  return { data, loading, error };
}

/** Current outdoor conditions, refreshed periodically. */
export function useCurrentOutdoor(refreshMs = 300000) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => getCurrentOutdoor().then((d) => { if (!cancelled) setData(d); }).catch(() => {});
    load();
    const id = setInterval(load, refreshMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [refreshMs]);
  return { data };
}

/** Today's min/max for a device (via the daily aggregation bucket). */
export function useTodayStats(deviceUid, refreshMs = 300000) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!deviceUid) return undefined;
    let cancelled = false;
    const load = () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      getDeviceReadings(deviceUid, { from: start, to: new Date(), bucket: 'day' })
        .then((rows) => {
          if (cancelled) return;
          const r = rows[0];
          setStats(r ? { tempMin: r.temperatureMin, tempMax: r.temperatureMax, humMin: r.humidityMin, humMax: r.humidityMax } : null);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [deviceUid, refreshMs]);
  return stats;
}
