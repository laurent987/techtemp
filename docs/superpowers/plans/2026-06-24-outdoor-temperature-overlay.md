# Outdoor Temperature/Humidity Overlay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an always-on outdoor line (Open-Meteo) to the combined chart that follows the metric toggle, aligned to the chart's current bucket granularity.

**Architecture:** Reuse the existing `useOutdoorWeather` hook + `weather.service`. A pure helper downsamples the hourly outdoor data to the active bucket; `buildDatasets` gains an optional `outdoorRows` param that appends one dashed "Extérieur" series. `MultiRoomChart` wires the hook in.

**Tech Stack:** React + Chakra UI + Chart.js; Vitest.

## Global Constraints

- **Never use `cd`.** Frontend tests: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- <args>`. Git: `git -C /Users/user/Documents/informatique/techtemp …`. Prefer `run_in_background` over `> file` redirection.
- Outdoor line: **always shown** (no toggle); **follows the metric** (`temperature` / `humidity`).
- Style: dashed grey `#94a3b8`, `borderDash: [5, 4]`, `pointRadius: 0`, no min/max band, label `Extérieur`.
- Granularity: downsample outdoor to the chart bucket — `day` → average per day; `raw`/`hour` → unchanged.
- Frontend only; the weather service/hook already exist. Branch `feature/outdoor-overlay`.
- Spec: `docs/superpowers/specs/2026-06-24-outdoor-temperature-overlay-design.md`.

---

### Task 1: Pure helpers — `downsampleOutdoor` + `buildDatasets(outdoorRows)`

**Files:**
- Modify: `dashboard/src/components/charts/chartData.js`
- Test: `dashboard/src/components/charts/chartData.test.js`

**Interfaces:**
- Consumes: existing `buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom })`.
- Produces:
  - `downsampleOutdoor(rows, bucket)` — `rows: [{timestamp, temperature, humidity}]`; for `bucket === 'day'` returns one averaged point per UTC day (`{ timestamp, temperature, humidity }`, chronological); otherwise returns `rows` unchanged.
  - `buildDatasets(opts)` gains optional `opts.outdoorRows` (default `[]`). When non-empty, appends one dataset `{ label: 'Extérieur', dashed grey, value = opts.metric }` after the room datasets.

- [ ] **Step 1: Write the failing tests** — append to `dashboard/src/components/charts/chartData.test.js`:

```javascript
import { downsampleOutdoor } from './chartData';

test('downsampleOutdoor averages per day when bucket=day', () => {
  const rows = [
    { timestamp: Date.parse('2026-06-01T08:00:00Z'), temperature: 10, humidity: 80 },
    { timestamp: Date.parse('2026-06-01T20:00:00Z'), temperature: 20, humidity: 60 },
    { timestamp: Date.parse('2026-06-02T09:00:00Z'), temperature: 15, humidity: 50 },
  ];
  const out = downsampleOutdoor(rows, 'day');
  expect(out).toHaveLength(2);
  expect(out[0].temperature).toBe(15); // (10+20)/2
  expect(out[0].humidity).toBe(70);
});

test('downsampleOutdoor leaves rows unchanged for raw/hour', () => {
  const rows = [{ timestamp: 1, temperature: 10, humidity: 80 }];
  expect(downsampleOutdoor(rows, 'raw')).toBe(rows);
  expect(downsampleOutdoor(rows, 'hour')).toBe(rows);
});

test('buildDatasets appends an "Extérieur" series when outdoorRows given', () => {
  const ds = buildDatasets({
    roomUids: ['zolder'],
    seriesByUid: { zolder: [{ timestamp: 1, temperature: 22, temperatureMin: 20, temperatureMax: 24 }] },
    metric: 'temperature', bucket: 'day',
    colorForRoom: () => '#22d3ee', nameForRoom: (u) => u,
    outdoorRows: [{ timestamp: 1, temperature: 12, humidity: 70 }],
  });
  // 3 (avg+min+max band for the single room) + 1 outdoor = 4
  expect(ds).toHaveLength(4);
  expect(ds.some((d) => d.label === 'Extérieur')).toBe(true);
});

test('buildDatasets without outdoorRows is unchanged (1 raw room -> 1 dataset)', () => {
  const ds = buildDatasets({
    roomUids: ['zolder'],
    seriesByUid: { zolder: [{ timestamp: 1, temperature: 22 }] },
    metric: 'temperature', bucket: 'raw',
    colorForRoom: () => '#22d3ee', nameForRoom: (u) => u,
  });
  expect(ds).toHaveLength(1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- chartData` (use `run_in_background`)
Expected: FAIL (`downsampleOutdoor` is not exported; the "Extérieur" test sees 3 datasets, not 4).

- [ ] **Step 3: Implement in `dashboard/src/components/charts/chartData.js`.**

(a) Add the helper (e.g. below `bucketForWindow`):
```javascript
export function downsampleOutdoor(rows, bucket) {
  if (bucket !== 'day' || !rows || rows.length === 0) return rows;
  const byDay = new Map();
  for (const r of rows) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(r);
  }
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return [...byDay.values()]
    .map((group) => ({
      timestamp: Math.min(...group.map((g) => g.timestamp)),
      temperature: avg(group.map((g) => g.temperature)),
      humidity: avg(group.map((g) => g.humidity)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
```

(b) Change the `buildDatasets` signature to accept `outdoorRows` and append the series before `return datasets;`:
```javascript
export function buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom, outdoorRows = [] }) {
```
…and immediately before `return datasets;`:
```javascript
  if (outdoorRows && outdoorRows.length > 0) {
    datasets.push({
      label: 'Extérieur',
      data: outdoorRows.map((r) => ({ x: r.timestamp, y: r[metric] })),
      borderColor: '#94a3b8',
      backgroundColor: '#94a3b8',
      borderWidth: 2,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false,
      tension: 0.3,
    });
  }
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- chartData` (background)
Expected: PASS (the original 4 + new 4 = 8 chartData tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/components/charts/chartData.js dashboard/src/components/charts/chartData.test.js
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): outdoor series helper + downsampleOutdoor"
```

---

### Task 2: Wire the outdoor hook into MultiRoomChart

**Files:**
- Modify: `dashboard/src/components/charts/MultiRoomChart.jsx`
- Modify: `dashboard/src/components/charts/MultiRoomChart.test.jsx` (mock the weather hook so tests stay offline/deterministic)

**Interfaces:**
- Consumes: `useOutdoorWeather(startDate, endDate, enabled)` from `../../contexts/DataContext` → `{ data, loading, error }`; `downsampleOutdoor`, `buildDatasets` (Task 1).

- [ ] **Step 1: Mock the weather hook in the test file** so the existing offline tests don't hit the network. At the top of `dashboard/src/components/charts/MultiRoomChart.test.jsx` (after the imports), add:

```javascript
vi.mock('../../contexts/DataContext', () => ({
  useOutdoorWeather: () => ({ data: [], loading: false, error: null }),
}));
```

- [ ] **Step 2: Run the existing chart tests to confirm they still pass with the mock**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- MultiRoomChart` (background)
Expected: PASS (the mock is inert until the component imports the hook — added next; this step confirms the mock doesn't break current tests).

- [ ] **Step 3: Wire the hook into `dashboard/src/components/charts/MultiRoomChart.jsx`.**

(a) Add imports:
```javascript
import { useOutdoorWeather } from '../../contexts/DataContext';
import { bucketForWindow, buildDatasets, downsampleOutdoor } from './chartData';
```
(merge the `chartData` import with the existing one — don't duplicate it.)

(b) After `const bucket = bucketForWindow(windowSize);`, fetch + downsample outdoor:
```javascript
  const { data: outdoorRaw } = useOutdoorWeather(period.start, period.end, true);
  const outdoorRows = downsampleOutdoor(outdoorRaw, bucket);
```

(c) Pass it to `buildDatasets`:
```javascript
  const data = {
    datasets: buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom, outdoorRows }),
  };
```

- [ ] **Step 4: Run the chart tests**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- MultiRoomChart` (background)
Expected: PASS (offline, thanks to the mock).

- [ ] **Step 5: Run the full frontend suite + build**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test` (background) → all PASS.
Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build` (background) → build succeeds to `dashboard/build/`.

- [ ] **Step 6: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/components/charts/MultiRoomChart.jsx dashboard/src/components/charts/MultiRoomChart.test.jsx
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): always-on outdoor line on the chart (follows metric)"
```

---

## Manual verification (after both tasks)

- `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run dev`, open `http://localhost:3000`:
  - a dashed grey "Extérieur" line appears on the chart alongside the rooms;
  - switching 🌡️/💧 switches the outdoor line to outdoor temperature / humidity;
  - on 1 an (day bucket) the outdoor line is daily-averaged (not 8760 points).
- (Outdoor data comes from Open-Meteo over the network; if offline it simply doesn't appear.)

## Self-Review

- **Spec coverage:** always-on, no toggle (T2 wires it unconditionally) ✓; follows metric (`r[metric]` in the outdoor dataset) ✓; dashed grey style/label (T1) ✓; bucket-aligned downsampling, day→avg (T1 `downsampleOutdoor`) ✓; silent failure (hook returns `[]` on error → no series) ✓; pure-function tests ✓; reuses existing hook/service ✓.
- **Placeholder scan:** none — full code given.
- **Type consistency:** `downsampleOutdoor(rows, bucket)` and `buildDatasets({…, outdoorRows})` signatures match between T1 definition, T1 tests, and T2 usage. Outdoor rows shape `{timestamp, temperature, humidity}` matches `weather.service` output and the `r[metric]` access.
