# Vignette Redesign (Outdoor + Status dot + Flip) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an outdoor vignette (first, selectable, drives the chart overlay), turn the status into a colored dot, and make each card a fixed-size flip card whose back shows humidex, dew point and today's min/max.

**Architecture:** Pure helpers compute humidex/dew point (T,RH). `SensorCard` becomes a presentational flip card (front: temp/hum; back: derived values) driven entirely by props. `DashboardPage` injects an "Extérieur" pseudo-device first, includes it in the existing selection hook, computes the derived/min-max data, and gates the chart's outdoor overlay on the outdoor selection.

**Tech Stack:** React + Chakra UI + framer-motion + Chart.js; Vitest + Testing Library.

## Global Constraints

- **Never use `cd`.** Tests: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- <args>` (use `run_in_background`). Git: `git -C /Users/user/Documents/informatique/techtemp …`.
- Outdoor vignette: **first**, name **"Extérieur"** (no emoji), accent grey `#94a3b8`, selectable, **selected by default**; deselect → outdoor curve removed from chart.
- Status = colored dot left of name: 🟢 online (≤10 min) / 🟠 warn (≤30 min) / 🔴 offline; **no "En ligne" text**.
- Flip card: **fixed height 185px, width 300px** (ratio ~1.6:1), front content centered. Flip triggered ONLY by the ⓘ / ↩ button (`stopPropagation`); a click on the card body toggles selection.
- Back content: 🥵 ressenti (humidex, colored by comfort) + label, 💧 point de rosée, 🌡️ today min–max, 💧 today min–max. (No "Aérer ?" badge — deferred.)
- Outdoor pseudo-id constant: `OUTDOOR_UID = '__exterieur__'`.
- Branch `feature/vignette-redesign`. Frontend only; deploy at the end.
- Spec: `docs/superpowers/specs/2026-06-25-vignette-redesign-outdoor-flip-design.md`.

---

## Phase 1 — Pure comfort helpers

### Task 1: `comfort.js` (dew point, humidex, comfort color)

**Files:**
- Create: `dashboard/src/lib/comfort.js`
- Test: `dashboard/src/lib/comfort.test.js`

**Interfaces:**
- Produces:
  - `dewPoint(tempC, rhPct): number` — Magnus formula.
  - `humidex(tempC, rhPct): number` — Canadian humidex.
  - `comfortColor(humidexValue): string` — hex by comfort band.
  - `comfortLabel(humidexValue): string` — short FR label.

- [ ] **Step 1: Write the failing test** `dashboard/src/lib/comfort.test.js`:

```javascript
import { dewPoint, humidex, comfortColor, comfortLabel } from './comfort';

test('dewPoint(28, 75) ≈ 23.2', () => {
  expect(dewPoint(28, 75)).toBeCloseTo(23.2, 1);
});

test('humidex(28, 75) ≈ 38', () => {
  expect(Math.round(humidex(28, 75))).toBe(38);
});

test('comfortColor/label scale by humidex band', () => {
  expect(comfortColor(25)).toBe('#22c55e');   // confortable -> vert
  expect(comfortColor(35)).toBe('#fb923c');   // inconfort -> orange
  expect(comfortColor(42)).toBe('#f87171');   // pénible -> rouge
  expect(comfortLabel(25)).toBe('confortable');
  expect(comfortLabel(35)).toBe('lourd');
  expect(comfortLabel(42)).toBe('pénible');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- comfort` (background)
Expected: FAIL (`Cannot find module './comfort'`).

- [ ] **Step 3: Create `dashboard/src/lib/comfort.js`**

```javascript
const A = 17.625;
const B = 243.04;

function esHpa(tempC) {
  return 6.112 * Math.exp((A * tempC) / (B + tempC));
}

export function dewPoint(tempC, rhPct) {
  const gamma = Math.log(rhPct / 100) + (A * tempC) / (B + tempC);
  return (B * gamma) / (A - gamma);
}

export function humidex(tempC, rhPct) {
  // vapor pressure (hPa) from temperature + relative humidity
  const e = (rhPct / 100) * esHpa(tempC);
  const h = tempC + 0.5555 * (e - 10);
  return h < tempC ? tempC : h; // dry air: no negative bonus
}

export function comfortColor(humidexValue) {
  if (humidexValue < 30) return '#22c55e'; // confortable
  if (humidexValue < 40) return '#fb923c'; // lourd
  return '#f87171';                         // pénible
}

export function comfortLabel(humidexValue) {
  if (humidexValue < 30) return 'confortable';
  if (humidexValue < 40) return 'lourd';
  return 'pénible';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- comfort` (background)
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/lib/comfort.js dashboard/src/lib/comfort.test.js
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): comfort helpers (dewPoint, humidex, comfort color/label)"
```

---

## Phase 2 — Flip card (presentational)

### Task 2: `SensorCard` — status dot, flip, back face (props-driven)

**Files:**
- Modify: `dashboard/src/components/SensorCard.jsx`
- Test: `dashboard/src/components/SensorCard.test.jsx`

**Interfaces:**
- Produces: `SensorCard` props add `humidex` (number), `humidexColor` (string), `humidexLabel` (string), `dewPoint` (number), `todayTemp` ({min,max}|null), `todayHum` ({min,max}|null). Existing props kept: `name, temperature, humidity, status, ageLabel, color, selected, onToggle`. Card is fixed 300×185, flips on the ⓘ button (aria-label `Voir les détails`) / ↩ (aria-label `Retour`); body click still calls `onToggle`. Status shown as a colored dot (`aria-label` = `En ligne`/`Retard`/`Hors ligne`); no status text.

- [ ] **Step 1: Write the failing test** `dashboard/src/components/SensorCard.test.jsx` (replace the file's contents):

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import SensorCard from './SensorCard';

const base = {
  name: 'Bureau', temperature: 28.0, humidity: 75, status: 'online',
  ageLabel: 'il y a 2 min', color: '#22d3ee', selected: true,
  humidex: 38, humidexColor: '#fb923c', humidexLabel: 'lourd', dewPoint: 23.2,
  todayTemp: { min: 24, max: 29 }, todayHum: { min: 60, max: 78 },
};

function setup(props = {}) {
  const onToggle = vi.fn();
  render(<ChakraProvider theme={theme}><SensorCard {...base} {...props} onToggle={onToggle} /></ChakraProvider>);
  return { onToggle };
}

test('front shows temp/humidity and a status dot (no "En ligne" text)', () => {
  setup();
  expect(screen.getByText(/28\.0/)).toBeInTheDocument();
  expect(screen.getByText(/75/)).toBeInTheDocument();
  expect(screen.getByLabelText('En ligne')).toBeInTheDocument();   // status dot
  expect(screen.queryByText('En ligne')).not.toBeInTheDocument();  // no text label
});

test('clicking the body toggles selection (does not flip)', async () => {
  const { onToggle } = setup();
  await userEvent.click(screen.getByText('Bureau'));
  expect(onToggle).toHaveBeenCalledTimes(1);
});

test('the ⓘ button flips to the back WITHOUT toggling selection', async () => {
  const { onToggle } = setup();
  const info = screen.getByLabelText('Voir les détails');
  await userEvent.click(info);
  expect(onToggle).not.toHaveBeenCalled();
  // back content present + back face revealed
  expect(screen.getByText(/Point de rosée/i)).toBeInTheDocument();
  expect(screen.getByText(/23\.2/)).toBeInTheDocument();
  expect(screen.getByText(/lourd/i)).toBeInTheDocument();
  expect(screen.getByTestId('card-back')).toHaveAttribute('aria-hidden', 'false');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- SensorCard` (background)
Expected: FAIL (no ⓘ button / status dot label / back content).

- [ ] **Step 3: Rewrite `dashboard/src/components/SensorCard.jsx`**

```jsx
import { useState } from 'react';
import { Box, Flex, Text, Grid, GridItem, IconButton } from '@chakra-ui/react';
import { InfoOutlineIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const statusLabel = { online: 'En ligne', warn: 'Retard', offline: 'Hors ligne' };
const statusColor = { online: '#22c55e', warn: '#f59e0b', offline: '#ef4444' };

function Face({ children, hidden, testid, back = false }) {
  return (
    <Box
      data-testid={testid}
      aria-hidden={hidden ? 'true' : 'false'}
      position="absolute"
      inset="0"
      p={4}
      bg="app.surface"
      borderRadius="14px"
      sx={{ backfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : 'none' }}
      display="flex"
      flexDirection="column"
    >
      {children}
    </Box>
  );
}

export default function SensorCard({
  name, temperature, humidity, status = 'online', ageLabel,
  color = '#22d3ee', selected = false, onToggle,
  humidex, humidexColor = '#22c55e', humidexLabel = '', dewPoint,
  todayTemp = null, todayHum = null,
}) {
  const [flipped, setFlipped] = useState(false);
  const stop = (e) => e.stopPropagation();

  return (
    <Box
      onClick={onToggle}
      cursor="pointer"
      position="relative"
      w="300px"
      h="185px"
      sx={{ perspective: '1200px' }}
      borderRadius="14px"
      borderWidth={selected ? '2px' : '1px'}
      borderColor={selected ? color : 'app.border'}
      boxShadow={selected ? `0 0 0 3px ${color}26` : 'sm'}
      transition="border-color .15s, box-shadow .15s"
    >
      <motion.div
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* FRONT */}
        <Face hidden={flipped} testid="card-front">
          <Flex justify="space-between" align="flex-start">
            <Text fontWeight="600" fontSize="15px" color="app.text">
              <Box as="span" aria-label={statusLabel[status]} display="inline-block" w="9px" h="9px"
                   borderRadius="full" bg={statusColor[status]} mr={2} />
              {name}
            </Text>
            <IconButton aria-label="Voir les détails" icon={<InfoOutlineIcon />} size="xs"
                        variant="ghost" color="app.textMuted" onClick={(e) => { stop(e); setFlipped(true); }} />
          </Flex>
          <Grid templateColumns="1fr 1fr" gap={3} my="auto">
            <GridItem textAlign="center">
              <Text fontSize="22px" lineHeight="1">🌡️</Text>
              <Text color="app.text" fontSize="28px" fontWeight="700" mt={1} lineHeight="1">{temperature?.toFixed(1)}°</Text>
              <Text color="app.textMuted" fontSize="11px" textTransform="uppercase" letterSpacing=".04em" mt={1}>Température</Text>
            </GridItem>
            <GridItem textAlign="center" borderLeftWidth="1px" borderColor="app.border">
              <Text fontSize="22px" lineHeight="1">💧</Text>
              <Text color="app.text" fontSize="28px" fontWeight="700" mt={1} lineHeight="1">{Math.round(humidity)}%</Text>
              <Text color="app.textMuted" fontSize="11px" textTransform="uppercase" letterSpacing=".04em" mt={1}>Humidité</Text>
            </GridItem>
          </Grid>
          {ageLabel && <Text color="app.textMuted" fontSize="11px" textAlign="right">{ageLabel}</Text>}
        </Face>

        {/* BACK */}
        <Face hidden={!flipped} testid="card-back" back>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="600" fontSize="14px" color="app.text">{name} · détails</Text>
            <IconButton aria-label="Retour" icon={<ArrowBackIcon />} size="xs" variant="ghost"
                        color="app.textMuted" onClick={(e) => { stop(e); setFlipped(false); }} />
          </Flex>
          <Row label="🥵 Ressenti" value={humidex != null ? `${Math.round(humidex)}° · ${humidexLabel}` : '—'} color={humidexColor} />
          <Row label="💧 Point de rosée" value={dewPoint != null ? `${dewPoint.toFixed(1)}°` : '—'} />
          <Row label="🌡️ Aujourd'hui" value={todayTemp ? `${Math.round(todayTemp.min)}–${Math.round(todayTemp.max)}°` : '—'} />
          <Row label="💧 Aujourd'hui" value={todayHum ? `${Math.round(todayHum.min)}–${Math.round(todayHum.max)}%` : '—'} last />
        </Face>
      </motion.div>
    </Box>
  );
}

function Row({ label, value, color, last }) {
  return (
    <Flex justify="space-between" fontSize="12.5px" py="4px"
          borderBottomWidth={last ? 0 : '1px'} borderColor="app.border">
      <Text color="app.textMuted">{label}</Text>
      <Text color={color || 'app.text'} fontWeight={color ? '600' : '400'}>{value}</Text>
    </Flex>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- SensorCard` (background)
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/components/SensorCard.jsx dashboard/src/components/SensorCard.test.jsx
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): flip SensorCard (status dot, ⓘ, back face)"
```

---

## Phase 3 — Data plumbing: outdoor "now" + today's min/max

### Task 3: weather `getCurrentOutdoor()` + hooks `useCurrentOutdoor`, `useTodayStats`

**Files:**
- Modify: `dashboard/src/services/weather.service.jsx` (add `getCurrentOutdoor`)
- Modify: `dashboard/src/contexts/DataContext.jsx` (add `useCurrentOutdoor`, `useTodayStats`)

**Interfaces:**
- Produces:
  - `getCurrentOutdoor(): Promise<{ temperature, humidity }>` — Open-Meteo `current`, model ICON-D2.
  - `useCurrentOutdoor(refreshMs=300000): { data: {temperature,humidity}|null }`.
  - `useTodayStats(deviceUid): { tempMin, tempMax, humMin, humMax } | null` — today's daily bucket for a device.

- [ ] **Step 1: Add `getCurrentOutdoor` to `weather.service.jsx`** (after the existing `getOutdoorWeather`):

```javascript
export async function getCurrentOutdoor() {
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    current: 'temperature_2m,relative_humidity_2m',
    models: 'icon_d2',
    timezone: TZ,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo current ${res.status}`);
  const json = await res.json();
  const c = json.current || {};
  return { temperature: c.temperature_2m, humidity: c.relative_humidity_2m };
}
```

- [ ] **Step 2: Add the hooks to `DataContext.jsx`** (near `useOutdoorWeather`; import `getCurrentOutdoor`, `getDeviceReadings` from the api service — check existing imports and extend them):

```javascript
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

export function useTodayStats(deviceUid, refreshMs = 300000) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!deviceUid) return undefined;
    let cancelled = false;
    const load = () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
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
```
(If `getDeviceReadings` isn't already imported in DataContext, add it to the existing `import { … } from '../services/api.service'` line.)

- [ ] **Step 3: Verify the app still builds (no test for network hooks)**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build` (background)
Expected: build succeeds. (These hooks are thin network wrappers, verified live after deploy; mirror the existing untested `useOutdoorWeather`.)

- [ ] **Step 4: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src/services/weather.service.jsx dashboard/src/contexts/DataContext.jsx
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): getCurrentOutdoor + useCurrentOutdoor/useTodayStats hooks"
```

---

### Task 4: `DashboardPage` — outdoor vignette first, selection, derived data, overlay gating

**Files:**
- Modify: `dashboard/src/pages/DashboardPage.jsx`
- Modify: `dashboard/src/components/charts/MultiRoomChart.jsx` (overlay follows `showOutdoor`)
- Test: `dashboard/src/pages/DashboardPage.test.jsx`

**Interfaces:**
- Consumes: `SensorCard` (Task 2), `comfort.js` (Task 1), `useCurrentOutdoor`/`useTodayStats` (Task 3), `useChartSelection` (unchanged — already generic over ids), `OUTDOOR_UID`.
- Produces: `MultiRoomChart` gains `showOutdoor` (bool) — only fetches/draws the outdoor overlay when true.

- [ ] **Step 1: Write the failing test** — update `dashboard/src/pages/DashboardPage.test.jsx`. Add mocks for the new hooks and an assertion that the first card is "Extérieur" and that the outdoor selection gates the chart. Replace the existing mock block + add cases:

```jsx
vi.mock('../contexts/DataContext', () => ({
  useDevices: () => ({
    devices: [
      { uid: 'zolder', room: { name: 'Zolder' }, last_seen_at: new Date().toISOString() },
      { uid: 'bureau', room: { name: 'Bureau' }, last_seen_at: new Date().toISOString() },
    ],
    loading: false, error: null,
  }),
  useLatestReadings: () => ({
    readings: [
      { deviceUid: 'zolder', temperature: 28.5, humidity: 67, ts: new Date().toISOString() },
      { deviceUid: 'bureau', temperature: 25.7, humidity: 70, ts: new Date().toISOString() },
    ],
    loading: false, error: null,
  }),
  useCurrentOutdoor: () => ({ data: { temperature: 32, humidity: 38 } }),
  useTodayStats: () => ({ tempMin: 24, tempMax: 29, humMin: 60, humMax: 78 }),
}));

vi.mock('../components/charts/MultiRoomChart', () => ({
  default: ({ roomUids, showOutdoor }) => (
    <div data-testid="chart">{showOutdoor ? 'OUT|' : ''}{roomUids.join(',')}</div>
  ),
}));

// ... keep the theme/ChakraProvider setup ...

test('the first vignette is the outdoor "Extérieur" card', () => {
  setup();
  const names = screen.getAllByText(/Extérieur|Zolder|Bureau/).map((n) => n.textContent);
  expect(names[0]).toMatch(/Extérieur/);
});

test('outdoor is selected by default -> chart shows the outdoor overlay', () => {
  setup();
  expect(screen.getByTestId('chart')).toHaveTextContent('OUT|');
});

test('deselecting the outdoor card removes the overlay', async () => {
  setup();
  await userEvent.click(screen.getByText('Extérieur'));
  expect(screen.getByTestId('chart')).not.toHaveTextContent('OUT|');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- DashboardPage` (background)
Expected: FAIL (no Extérieur card; chart mock has no showOutdoor).

- [ ] **Step 3: Update `DashboardPage.jsx`.**

(a) Add imports + constant at top:
```jsx
import { useCurrentOutdoor, useTodayStats } from '../contexts/DataContext';
import { dewPoint, humidex, comfortColor, comfortLabel } from '../lib/comfort';

export const OUTDOOR_UID = '__exterieur__';
const OUTDOOR_COLOR = '#94a3b8';
```

(b) Build the combined id list (outdoor first) and selection from it. Replace `const roomUids = …` and the `useChartSelection(roomUids)` call:
```jsx
  const roomUids = useMemo(() => (devices || []).map((d) => d.uid), [devices]);
  const allUids = useMemo(() => [OUTDOOR_UID, ...roomUids], [roomUids]);
  const { selected, isSelected, toggle, metric, setMetric } = useChartSelection(allUids);
  const { data: outdoor } = useCurrentOutdoor();
```

(c) A small presentational wrapper that fetches per-card today stats and computes derived values, so each card gets its props. Add this component in the file (above `DashboardPage` or below it):
```jsx
function RoomVignette({ uid, name, temperature, humidity, status, ageLabel, color, selected, onToggle }) {
  const stats = useTodayStats(uid);
  const hasReading = temperature != null && humidity != null;
  const hx = hasReading ? humidex(temperature, humidity) : null;
  return (
    <SensorCard
      name={name} temperature={temperature} humidity={humidity} status={status}
      ageLabel={ageLabel} color={color} selected={selected} onToggle={onToggle}
      humidex={hx}
      humidexColor={hx != null ? comfortColor(hx) : undefined}
      humidexLabel={hx != null ? comfortLabel(hx) : ''}
      dewPoint={hasReading ? dewPoint(temperature, humidity) : null}
      todayTemp={stats ? { min: stats.tempMin, max: stats.tempMax } : null}
      todayHum={stats ? { min: stats.humMin, max: stats.humMax } : null}
    />
  );
}
```

(d) In the render, output the outdoor card first, then the rooms. Replace the `<Flex wrap…>` block:
```jsx
      <Flex wrap="wrap" gap={3} mb={6}>
        <RoomVignette
          uid={OUTDOOR_UID}
          name="Extérieur"
          temperature={outdoor?.temperature}
          humidity={outdoor?.humidity}
          status="online"
          ageLabel={null}
          color={OUTDOOR_COLOR}
          selected={isSelected(OUTDOOR_UID)}
          onToggle={() => toggle(OUTDOOR_UID)}
        />
        {(devices || []).map((d) => {
          const r = readingByUid.get(d.uid) || {};
          return (
            <RoomVignette
              key={d.uid}
              uid={d.uid}
              name={nameForRoom(d.uid)}
              temperature={r.temperature}
              humidity={r.humidity}
              status={statusFor(r.ts || d.last_seen_at)}
              ageLabel={ageLabel(r.ts || d.last_seen_at)}
              color={colorForRoom(d.uid)}
              selected={isSelected(d.uid)}
              onToggle={() => toggle(d.uid)}
            />
          );
        })}
      </Flex>
```
Note: `useTodayStats(OUTDOOR_UID)` will fetch readings for a non-existent device and get nothing → `todayTemp/Hum` stay `null` → the outdoor card shows `—` for today's min/max (acceptable; outdoor history isn't in our DB). The chart's outdoor series is unaffected.

(e) Pass the chart only the **room** selection + the outdoor flag:
```jsx
      <MultiRoomChart
        roomUids={selected.filter((u) => u !== OUTDOOR_UID)}
        showOutdoor={isSelected(OUTDOOR_UID)}
        metric={metric}
        onMetricChange={setMetric}
        colorForRoom={colorForRoom}
        nameForRoom={nameForRoom}
      />
```

- [ ] **Step 4: Gate the overlay in `MultiRoomChart.jsx`.**

(a) Add `showOutdoor = true` to the props destructure.
(b) Wrap the outdoor hook usage so it only contributes when enabled — change:
```jsx
  const { data: outdoorRaw } = useOutdoorWeather(period.start, period.end, true);
  const outdoorRows = downsampleOutdoor(outdoorRaw, bucket);
```
to:
```jsx
  const { data: outdoorRaw } = useOutdoorWeather(period.start, period.end, showOutdoor);
  const outdoorRows = showOutdoor ? downsampleOutdoor(outdoorRaw, bucket) : [];
```
(`useOutdoorWeather`'s third arg `enabled` already short-circuits the fetch when false.)

- [ ] **Step 5: Run the DashboardPage + MultiRoomChart tests**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- "DashboardPage|MultiRoomChart"` (background)
Expected: PASS. (If a prior MultiRoomChart test asserted the outdoor line is always built, update it to pass `showOutdoor`.)

- [ ] **Step 6: Full suite + build**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test` (background) → all PASS.
Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build` (background) → succeeds.

- [ ] **Step 7: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add dashboard/src
git -C /Users/user/Documents/informatique/techtemp commit -m "feat(ui): outdoor vignette first + selection-driven overlay + card derived data"
```

---

## Manual verification (after all tasks)

- `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run dev`, open `http://localhost:3000` (hard-refresh):
  - "Extérieur" is the **first** vignette, grey accent, with current outdoor temp/humidity; deselecting it removes the dashed curve from the chart.
  - Status is a **colored dot** (no "En ligne" text).
  - Clicking **ⓘ** flips the card to show ressenti (colored) + point de rosée + today min/max; clicking ↩ flips back; clicking the body still toggles the chart selection.
  - The grid stays aligned (fixed height) — flipping a card doesn't move its neighbours.
  - Light + dark, desktop + mobile.

## Self-Review

- **Spec coverage:** outdoor vignette first/grey/selectable/default-on + overlay follows selection (T4) ✓; status dot, no text (T2) ✓; flip card fixed 300×185, flip via ⓘ only, body=select (T2) ✓; back = humidex(colored)+label, dew point, today min/max (T2 layout + T4 data) ✓; comfort/dew-point pure helpers (T1) ✓; outdoor "now" + today min/max data (T3) ✓; "Aérer ?" deferred (not built) ✓.
- **Placeholder scan:** none — full code given; Task 3 hooks intentionally untested (thin network wrappers, like the existing `useOutdoorWeather`) with build verification.
- **Type consistency:** `SensorCard` props (`humidex, humidexColor, humidexLabel, dewPoint, todayTemp{min,max}, todayHum{min,max}`) match what `RoomVignette` passes (T4) and what `comfort.js`/`useTodayStats` produce. `OUTDOOR_UID` consistent across DashboardPage + selection + chart gating. `showOutdoor` consistent between DashboardPage (T4) and MultiRoomChart (T4 Step 4) and the test mock.
