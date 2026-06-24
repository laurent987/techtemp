# Long-term History + Adaptive Aggregation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hour/day server-side aggregation so the dashboard can show 3/6/12-month history with adaptive granularity (avg + min/max band), selected via a single period dropdown.

**Architecture:** Backend gains an aggregated readings query (`bucket=hour|day`) alongside the existing raw query, exposed through a new `bucket` param on `GET /devices/:uid/readings`. Frontend derives the bucket from the chosen period, fetches accordingly, and renders an average line plus a min/max band (only when one room is selected). Chart logic lives in pure, unit-tested helpers.

**Tech Stack:** Node.js (ESM), Express, better-sqlite3, Vitest; React + Chakra UI + Chart.js.

## Global Constraints

- **Never use `cd`.** Backend tests: `npm --prefix /Users/user/Documents/informatique/techtemp test`. Frontend: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test`. Git: `git -C /Users/user/Documents/informatique/techtemp …`.
- `bucket` ∈ `{raw, hour, day}`; anything else → HTTP 400. `raw` (or absent) keeps the current behavior/shape exactly.
- Aggregated point fields: `ts` (a timestamp inside the bucket), `temperature` (avg), `temperature_min`, `temperature_max`, `humidity` (avg), `humidity_min`, `humidity_max`.
- Aggregated SQL ordering = `ORDER BY ts DESC` (same convention as raw) so the existing client-side reverse yields chronological order.
- Period → bucket: `≤7j → raw`, `30j → hour`, `≥90j → day`.
- Periods (days): 1, 3, 7, 30, 90, 180, 365 — labels `1 jour / 3 jours / 1 semaine / 1 mois / 3 mois / 6 mois / 1 an`.
- Min/max band shown ONLY when `bucket !== 'raw'` AND exactly 1 room selected.
- Branch `feature/long-term-aggregation`. No deploy until the end (grouped).
- Spec: `docs/superpowers/specs/2026-06-24-long-term-aggregation-design.md`.

---

### Task 1: Backend — aggregated readings query (data + repo)

**Files:**
- Modify: `backend/db/dataAccess.js` (add `createFindAggregatedReadingsByDeviceUid` + register it)
- Modify: `backend/repositories/index.js` (add `readings.findAggregatedByDeviceUid`)
- Test: `test/repositories.test.js`

**Interfaces:**
- Produces: `dataAccess.findAggregatedReadingsByDeviceUid(deviceUid, { from, to, bucket, limit })` and `repo.readings.findAggregatedByDeviceUid(uid, { from, to, bucket, limit })` → array of `{ ts, temperature, temperature_min, temperature_max, humidity, humidity_min, humidity_max }`, newest bucket first. `bucket` is `'hour'` or `'day'`.

- [ ] **Step 1: Write the failing test** in `test/repositories.test.js`, inside the `describe('Readings Repository', ...)` block (or at the end of the top-level describe if that block is absent):

```javascript
it('aggregates readings by day (avg/min/max)', async () => {
  await repository.devices.create({ uid: 'agg-dev' });
  const mk = (ts, t, h) => repository.readings.create({
    uid: 'agg-dev', room_id: null, temperature: t, humidity: h, ts,
    source: 'test', msg_id: `m-${ts}`,
  });
  // Day A: temps 20 and 24 (avg 22, min 20, max 24)
  await mk('2026-06-01T08:00:00.000Z', 20, 50);
  await mk('2026-06-01T20:00:00.000Z', 24, 60);
  // Day B: temp 30 (avg 30, min 30, max 30)
  await mk('2026-06-02T09:00:00.000Z', 30, 70);

  const rows = await repository.readings.findAggregatedByDeviceUid('agg-dev', {
    from: '2026-06-01T00:00:00.000Z', to: '2026-06-03T00:00:00.000Z',
    bucket: 'day', limit: 1000,
  });

  expect(rows).toHaveLength(2);
  const byTemp = Object.fromEntries(rows.map(r => [Math.round(r.temperature), r]));
  expect(byTemp[22].temperature_min).toBe(20);
  expect(byTemp[22].temperature_max).toBe(24);
  expect(byTemp[30].temperature_min).toBe(30);
  expect(byTemp[30].temperature_max).toBe(30);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp test -- repositories`
Expected: FAIL (`repository.readings.findAggregatedByDeviceUid is not a function`).

- [ ] **Step 3: Add the dataAccess query** in `backend/db/dataAccess.js`.

Register it in the returned object (next to `findReadingsByDeviceUid: createFindReadingsByDeviceUid(db),`):
```javascript
    findAggregatedReadingsByDeviceUid: createFindAggregatedReadingsByDeviceUid(db),
```
And add the factory (next to `createFindReadingsByDeviceUid`):
```javascript
function createFindAggregatedReadingsByDeviceUid(db) {
  // %Y-%m-%d -> day bucket ; %Y-%m-%dT%H -> hour bucket. Passed as a bound param.
  const stmt = db.prepare(`
    SELECT
      MIN(r.ts)            AS ts,
      AVG(r.temperature)   AS temperature,
      MIN(r.temperature)   AS temperature_min,
      MAX(r.temperature)   AS temperature_max,
      AVG(r.humidity)      AS humidity,
      MIN(r.humidity)      AS humidity_min,
      MAX(r.humidity)      AS humidity_max
    FROM readings_raw r
    JOIN devices d ON r.device_id = d.id
    WHERE d.uid = ?
      AND (? IS NULL OR r.ts >= ?)
      AND (? IS NULL OR r.ts <= ?)
    GROUP BY strftime(?, r.ts)
    ORDER BY ts DESC
    LIMIT ?
  `);

  return function findAggregatedReadingsByDeviceUid(deviceUid, options = {}) {
    const { from = null, to = null, bucket = 'day', limit = 10000 } = options;
    const fmt = bucket === 'hour' ? '%Y-%m-%dT%H' : '%Y-%m-%d';
    return stmt.all(deviceUid, from, from, to, to, fmt, limit);
  };
}
```

- [ ] **Step 4: Add the repository method** in `backend/repositories/index.js`, inside the `readings: { ... }` object (e.g. right after `findByDeviceUid`):
```javascript
      findAggregatedByDeviceUid: async (uid, options = {}) => {
        if (!uid) throw new Error('Device UID is required');
        const { from = null, to = null, bucket = 'day', limit = 10000 } = options;
        if (bucket !== 'hour' && bucket !== 'day') {
          throw new Error("bucket must be 'hour' or 'day'");
        }
        const limitInt = parseInt(limit, 10);
        if (isNaN(limitInt) || limitInt < 1) throw new Error('Limit must be a positive integer');
        if (from && isNaN(Date.parse(from))) throw new Error('Invalid `from` timestamp (expected ISO 8601)');
        if (to && isNaN(Date.parse(to))) throw new Error('Invalid `to` timestamp (expected ISO 8601)');
        if (from && to && new Date(from) >= new Date(to)) throw new Error('`from` must be before `to`');
        return dataAccess.findAggregatedReadingsByDeviceUid(uid, { from, to, bucket, limit: limitInt });
      },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp test -- repositories`
Expected: PASS (the new test + existing repository tests).

- [ ] **Step 6: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add backend/db/dataAccess.js backend/repositories/index.js test/repositories.test.js
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(api): aggregated readings query (hour/day avg+min/max)"
```

---

### Task 2: Backend — `bucket` param on the readings route

**Files:**
- Modify: `backend/http/routes/devices.js` (the `GET /:deviceUid/readings` handler)
- Test: `test/http/devices.test.js`

**Interfaces:**
- Consumes: `repo.readings.findAggregatedByDeviceUid` (Task 1).
- Produces: `GET /api/v1/devices/:uid/readings?bucket=day|hour` returns aggregated points `{ ts, temperature, temperature_min, temperature_max, humidity, humidity_min, humidity_max }`. `bucket=raw`/absent unchanged. Invalid bucket → 400.

- [ ] **Step 1: Write the failing tests** in `test/http/devices.test.js`, inside the `describe('GET /api/v1/devices/:deviceUid/readings', ...)` block:

```javascript
test('aggregates by day when bucket=day', async () => {
  await request(app).post('/api/v1/devices').send({ device_uid: 'agg-sensor', room_name: 'Bedroom' });
  const mk = (ts, t, h) => repo.readings.create({ uid: 'agg-sensor', room_id: null, temperature: t, humidity: h, ts, source: 'test', msg_id: `x-${ts}` });
  await mk('2026-06-01T08:00:00.000Z', 20, 50);
  await mk('2026-06-01T20:00:00.000Z', 24, 60);
  await mk('2026-06-02T09:00:00.000Z', 30, 70);

  const res = await request(app)
    .get('/api/v1/devices/agg-sensor/readings')
    .query({ bucket: 'day', from: '2026-06-01T00:00:00.000Z', to: '2026-06-03T00:00:00.000Z' })
    .expect(200);

  expect(res.body.data).toHaveLength(2);
  const pt = res.body.data.find((d) => Math.round(d.temperature) === 22);
  expect(pt.temperature_min).toBe(20);
  expect(pt.temperature_max).toBe(24);
  expect(pt.humidity_min).toBe(50);
});

test('rejects an invalid bucket', async () => {
  await request(app).post('/api/v1/devices').send({ device_uid: 'bk-sensor', room_name: 'Bedroom' });
  const res = await request(app)
    .get('/api/v1/devices/bk-sensor/readings')
    .query({ bucket: 'week' })
    .expect(400);
  expect(res.body.error).toContain('bucket');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp test -- http/devices`
Expected: FAIL (bucket ignored → raw rows returned, lengths/fields wrong; invalid bucket returns 200).

- [ ] **Step 3: Implement** in `backend/http/routes/devices.js`, in the `GET /:deviceUid/readings` handler.

(a) Read `bucket` from the query — change:
```javascript
      const { limit = 10, from, to } = req.query;
```
to:
```javascript
      const { limit = 10, from, to, bucket = 'raw' } = req.query;
```

(b) After the `from`/`to` validation block (right before the `const readings = await deps.repo.readings.findByDeviceUid(...)` call), add bucket validation + the aggregated branch:
```javascript
      if (!['raw', 'hour', 'day'].includes(bucket)) {
        return res.status(400).json({ error: "bucket must be one of 'raw', 'hour', 'day'" });
      }

      if (bucket !== 'raw') {
        const aggregated = await deps.repo.readings.findAggregatedByDeviceUid(deviceUid, {
          from: from || null,
          to: to || null,
          bucket,
          limit: limitInt,
        });
        const aggData = aggregated.map((r) => ({
          ts: r.ts,
          temperature: r.temperature,
          temperature_min: r.temperature_min,
          temperature_max: r.temperature_max,
          humidity: r.humidity,
          humidity_min: r.humidity_min,
          humidity_max: r.humidity_max,
        }));
        return res.status(200).json({ data: aggData });
      }
```
(The existing raw path below stays unchanged.)

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp test -- http/devices`
Expected: PASS (new tests + existing readings/PUT/POST tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add backend/http/routes/devices.js test/http/devices.test.js
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(api): bucket param on device readings endpoint"
```

---

### Task 3: Frontend — pure chart helpers (`bucketForWindow`, `buildDatasets`)

**Files:**
- Create: `dashboard/src/components/charts/chartData.js`
- Test: `dashboard/src/components/charts/chartData.test.js`

**Interfaces:**
- Produces:
  - `bucketForWindow(days: number): 'raw'|'hour'|'day'` — `≤7 → raw`, `≤31 → hour`, else `day`.
  - `buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom }): Array` — one avg dataset per room; when `bucket !== 'raw'` AND `roomUids.length === 1`, also a min and a max dataset forming a band. Series rows use `timestamp`, `temperature`/`humidity` (avg) and `temperatureMin/Max`, `humidityMin/Max`.

- [ ] **Step 1: Write the failing test** `dashboard/src/components/charts/chartData.test.js`:

```javascript
import { bucketForWindow, buildDatasets } from './chartData';

test('bucketForWindow maps period length to granularity', () => {
  expect(bucketForWindow(1)).toBe('raw');
  expect(bucketForWindow(7)).toBe('raw');
  expect(bucketForWindow(30)).toBe('hour');
  expect(bucketForWindow(90)).toBe('day');
  expect(bucketForWindow(365)).toBe('day');
});

const series = {
  zolder: [{ timestamp: 1, temperature: 22, temperatureMin: 20, temperatureMax: 24, humidity: 50, humidityMin: 45, humidityMax: 55 }],
  bureau: [{ timestamp: 1, temperature: 25, humidity: 60 }],
};
const opts = { seriesByUid: series, metric: 'temperature', colorForRoom: () => '#22d3ee', nameForRoom: (u) => u };

test('one aggregated room -> avg + min + max (band) = 3 datasets', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder'], bucket: 'day' });
  expect(ds).toHaveLength(3);
});

test('two rooms -> averages only (no band) = 2 datasets', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder', 'bureau'], bucket: 'day' });
  expect(ds).toHaveLength(2);
});

test('raw bucket -> no band even with one room', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder'], bucket: 'raw' });
  expect(ds).toHaveLength(1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- chartData`
Expected: FAIL (`Cannot find module './chartData'`).

- [ ] **Step 3: Create** `dashboard/src/components/charts/chartData.js`:

```javascript
export function bucketForWindow(days) {
  if (days <= 7) return 'raw';
  if (days <= 31) return 'hour';
  return 'day';
}

export function buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom }) {
  const showBand = bucket !== 'raw' && roomUids.length === 1;
  const minKey = metric === 'temperature' ? 'temperatureMin' : 'humidityMin';
  const maxKey = metric === 'temperature' ? 'temperatureMax' : 'humidityMax';
  const datasets = [];

  for (const uid of roomUids) {
    const rows = seriesByUid[uid] || [];
    const color = colorForRoom(uid);

    if (showBand) {
      datasets.push({
        label: `${nameForRoom(uid)} max`,
        data: rows.map((r) => ({ x: r.timestamp, y: r[maxKey] })),
        borderColor: 'transparent',
        backgroundColor: `${color}22`,
        pointRadius: 0,
        fill: '+1', // fill toward the next dataset (the matching min)
        tension: 0.3,
      });
      datasets.push({
        label: `${nameForRoom(uid)} min`,
        data: rows.map((r) => ({ x: r.timestamp, y: r[minKey] })),
        borderColor: 'transparent',
        backgroundColor: `${color}22`,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }

    datasets.push({
      label: nameForRoom(uid),
      data: rows.map((r) => ({ x: r.timestamp, y: r[metric] })),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    });
  }
  return datasets;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- chartData`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/components/charts/chartData.js dashboard/src/components/charts/chartData.test.js
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): pure chart helpers (bucketForWindow, buildDatasets)"
```

---

### Task 4: Frontend — wire aggregation into MultiRoomChart (dropdown, bands, fetch)

**Files:**
- Modify: `dashboard/src/services/api.service.jsx` (`getDeviceReadings`: `bucket` param + min/max mapping)
- Modify: `dashboard/src/components/charts/MultiRoomChart.jsx` (Select dropdown, helpers, Filler, bucket fetch)
- Test: `dashboard/src/components/charts/MultiRoomChart.test.jsx` (period dropdown)

**Interfaces:**
- Consumes: `bucketForWindow`, `buildDatasets` (Task 3); `getDeviceReadings(uid, { from, to, bucket })`.

- [ ] **Step 1: Add `bucket` + min/max mapping to `getDeviceReadings`** in `dashboard/src/services/api.service.jsx`.

Change the signature/params:
```javascript
export async function getDeviceReadings(deviceUid, { from, to, limit = 10000, bucket } = {}) {
  const params = new URLSearchParams();
  if (from instanceof Date) params.set('from', from.toISOString());
  else if (typeof from === 'string') params.set('from', from);
  if (to instanceof Date) params.set('to', to.toISOString());
  else if (typeof to === 'string') params.set('to', to);
  params.set('limit', String(limit));
  if (bucket && bucket !== 'raw') params.set('bucket', bucket);
```
And extend the row mapping (keep the existing fields, add the optional min/max):
```javascript
  return rows.map((r) => ({
    timestamp: new Date(r.ts).getTime(),
    ts: r.ts,
    temperature: r.temperature,
    humidity: r.humidity,
    temperatureMin: r.temperature_min,
    temperatureMax: r.temperature_max,
    humidityMin: r.humidity_min,
    humidityMax: r.humidity_max,
    source: r.source || 'mqtt',
  }));
```

- [ ] **Step 2: Write the failing test** for the dropdown in `dashboard/src/components/charts/MultiRoomChart.test.jsx` — add:

```javascript
test('period dropdown offers long ranges including 1 an', () => {
  setup();
  const select = screen.getByLabelText('Période');
  expect(select).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '1 an' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '3 mois' })).toBeInTheDocument();
});
```
(The existing `setup()` renders `MultiRoomChart` with `roomUids={[]}`, so no canvas.)

- [ ] **Step 3: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- MultiRoomChart`
Expected: FAIL (no element labelled `Période`).

- [ ] **Step 4: Update `MultiRoomChart.jsx`.**

(a) Imports — add `Select`, the `Filler` plugin, and the helpers; register `Filler`:
```javascript
import { Box, Flex, ButtonGroup, Button, HStack, IconButton, Text, Spinner, Select, useColorModeValue } from '@chakra-ui/react';
// ...
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import { getDeviceReadings } from '../../services/api.service';
import { bucketForWindow, buildDatasets } from './chartData';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale, Filler);
```

(b) Replace the `PERIODS` constant:
```javascript
const PERIODS = [
  { d: 1, label: '1 jour' },
  { d: 3, label: '3 jours' },
  { d: 7, label: '1 semaine' },
  { d: 30, label: '1 mois' },
  { d: 90, label: '3 mois' },
  { d: 180, label: '6 mois' },
  { d: 365, label: '1 an' },
];
```

(c) Default `windowSize` stays `3`. Derive the bucket and use it in the fetch:
```javascript
  const bucket = bucketForWindow(windowSize);
```
In the `useEffect`, pass `bucket` to the fetch and re-run when it changes:
```javascript
      roomUids.map((uid) =>
        getDeviceReadings(uid, { from: period.start, to: period.end, bucket })
          .then((rows) => [uid, rows])
          .catch(() => [uid, []])
```
and change the dependency array to `[key, fromTs, toTs, bucket]`.

(d) Build datasets via the helper:
```javascript
  const data = {
    datasets: buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom }),
  };
```
(Remove the previous inline `datasets: roomUids.map(...)`.)

(e) Hide band (min/max) series from the legend — in `options.plugins.legend`:
```javascript
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          filter: (item) => !/ (min|max)$/.test(item.text || ''),
        },
      },
    },
```

(f) Replace the period `ButtonGroup` (the second one, with `PERIODS.map`) with a `Select`:
```javascript
          <Select
            aria-label="Période"
            size="xs"
            width="auto"
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
          >
            {PERIODS.map((p) => (
              <option key={p.d} value={p.d}>{p.label}</option>
            ))}
          </Select>
```
(Keep the metric toggle `ButtonGroup` to its left, and the date-nav `HStack` on the right.)

(g) Remove the forced x-axis `time.unit` so Chart.js auto-picks ticks across ranges — change the x scale to:
```javascript
      x: {
        type: 'time',
        adapters: { date: { locale: fr } },
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
```

- [ ] **Step 5: Run the chart tests**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- MultiRoomChart`
Expected: PASS (dropdown test + existing metric-toggle tests).

- [ ] **Step 6: Run the full frontend suite + build**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test`
Expected: all PASS.
Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build`
Expected: build succeeds to `dashboard/build/`.

- [ ] **Step 7: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/services/api.service.jsx dashboard/src/components/charts/MultiRoomChart.jsx dashboard/src/components/charts/MultiRoomChart.test.jsx
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): period dropdown + adaptive bucket + min/max band"
```

---

## Manual verification (after all tasks)

- Backend tests: `npm --prefix /Users/user/Documents/informatique/techtemp test` (the 4 MQTT integration tests fail only for lack of a broker — environmental, ignore).
- `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run dev`, open `http://localhost:3000`:
  - the period dropdown offers 1 jour … 1 an;
  - selecting 3/6/12 mois loads quickly (daily points) with a spinner during fetch;
  - with ONE room selected on a long period, a faint min/max band appears around the average; with two+ rooms, only averages.

## Self-Review

- **Spec coverage:** backend `bucket=raw|hour|day` + validation (T2) ✓; aggregation avg/min/max SQL (T1) ✓; adaptive period→bucket (T3 `bucketForWindow`, wired T4) ✓; period dropdown 1j→1an (T4) ✓; avg + min/max band, band only when 1 room & not raw (T3 `buildDatasets`, T4 render) ✓; raw backward-compat (T2 keeps raw path; T1/T2 don't touch it) ✓; tests backend + frontend ✓.
- **Placeholder scan:** none — full code in every step.
- **Type consistency:** aggregated row fields (`temperature_min` etc.) consistent across SQL (T1) → route mapping (T2) → api.service mapping to `temperatureMin` (T4) → `buildDatasets` keys (T3). `bucketForWindow`/`buildDatasets` signatures match between T3 definition and T4 usage. `bucket` values `raw|hour|day` consistent throughout.
