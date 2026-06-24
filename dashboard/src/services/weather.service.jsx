/**
 * Open-Meteo client for outdoor temperature/humidity at Leuven.
 *
 * Free public APIs, no key required:
 *   - https://api.open-meteo.com/v1/forecast        : last 92 days + next 16 days
 *   - https://archive-api.open-meteo.com/v1/archive : full history since 1940 (~5 day lag)
 *
 * For ranges that straddle the 5-day mark, we fetch from both and merge.
 *
 * Override the location via VITE_WEATHER_LAT/LON.
 */

const LAT = parseFloat(import.meta.env.VITE_WEATHER_LAT || '50.8798');
const LON = parseFloat(import.meta.env.VITE_WEATHER_LON || '4.7005');
const TZ = import.meta.env.VITE_WEATHER_TZ || 'Europe/Brussels';

const ARCHIVE_LAG_DAYS = 5; // safety: archive lags ~2 days, give it 5 to be safe
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function fetchOpenMeteo(baseUrl, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    hourly: 'temperature_2m,relative_humidity_2m',
    timezone: TZ,
    start_date: fmtDate(startDate),
    end_date: fmtDate(endDate)
  });
  const res = await fetch(`${baseUrl}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} on ${baseUrl}`);
  const json = await res.json();
  const times = json.hourly?.time || [];
  const temps = json.hourly?.temperature_2m || [];
  const hums = json.hourly?.relative_humidity_2m || [];
  return times.map((t, i) => ({
    timestamp: new Date(t).getTime(),
    temperature: temps[i] ?? null,
    humidity: hums[i] ?? null
  }));
}

/**
 * Fetch hourly outdoor weather covering [startDate, endDate].
 * Returns [{ timestamp (ms), temperature, humidity }] sorted oldest → newest,
 * filtered to the requested window. Picks the right Open-Meteo endpoint(s)
 * based on how far back the range goes.
 */
export async function getOutdoorWeather(startDate, endDate) {
  if (!startDate || !endDate) return [];

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setTime(cutoff.getTime() - ARCHIVE_LAG_DAYS * ONE_DAY_MS);
  const cutoffMs = cutoff.getTime();

  const archiveUrl = 'https://archive-api.open-meteo.com/v1/archive';
  const forecastUrl = 'https://api.open-meteo.com/v1/forecast';

  const requests = [];

  if (endMs <= cutoffMs) {
    // Entirely in the past → archive only
    requests.push(fetchOpenMeteo(archiveUrl, startDate, endDate));
  } else if (startMs >= cutoffMs) {
    // Entirely recent → forecast only
    requests.push(fetchOpenMeteo(forecastUrl, startDate, endDate));
  } else {
    // Spans the cutoff → fetch both and merge
    const archiveEnd = new Date(cutoffMs - ONE_DAY_MS);
    const forecastStart = new Date(cutoffMs);
    requests.push(fetchOpenMeteo(archiveUrl, startDate, archiveEnd));
    requests.push(fetchOpenMeteo(forecastUrl, forecastStart, endDate));
  }

  const results = await Promise.all(requests);
  const all = results.flat();

  // Dedup on timestamp (in case archive and forecast overlap a bit) and clip to window.
  const seen = new Set();
  return all
    .filter((p) => {
      if (p.timestamp < startMs || p.timestamp > endMs) return false;
      if (seen.has(p.timestamp)) return false;
      seen.add(p.timestamp);
      return true;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
