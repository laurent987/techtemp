# Dashboard UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the dashboard from Create React App to Vite (unblocking the frozen toolchain), then redesign it into a single page (Slate & Cyan theme, light/dark, sensor-vignette selectors driving a combined chart).

**Architecture:** Phase 1 swaps the build tool (react-scripts → Vite + Vitest) with no UI behaviour change. Phase 2 adds a Chakra theme + color-mode toggle. Phase 3 merges the Live and Charts pages into one: clickable sensor vignettes toggle rooms into a combined, metric-switchable chart.

**Tech Stack:** React 19, Chakra UI, Chart.js (react-chartjs-2), Vite, Vitest + @testing-library/react.

## Global Constraints

- Dashboard dir (absolute): `/Users/user/Documents/informatique/techtemp/dashboard`
- **Never use `cd`.** Run npm via `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard …`; run git via `git -C /Users/user/Documents/informatique/techtemp …`. (User preference — `cd` triggers permission prompts.)
- Node currently installed: v22+ (react-scripts is being removed precisely because it can't run on it).
- Vite `build.outDir` MUST be `build` so `scripts/admin/deploy-robust-pi.sh` (copies `dashboard/build/` → `web/`) keeps working unchanged.
- Palette — Sombre / Clair: fond `#0f172a`/`#f1f5f9`; surface `#1e293b`/`#ffffff`; bordure `#334155`/`#e2e8f0`; texte `#f1f5f9`/`#0f172a`; texte 2 `#94a3b8`/`#64748b`; accent `#22d3ee`/`#0891b2`.
- Color mode: `initialColorMode: 'system'`, `useSystemColorMode: false`.
- Per-room colors (stable by index): `['#22d3ee','#818cf8','#fb923c','#34d399','#f472b6','#facc15']`.
- All work on branch `feature/dashboard-ui-redesign`.
- Spec: `docs/superpowers/specs/2026-06-24-dashboard-ui-redesign-design.md`.

---

## Phase 1 — Migrate CRA → Vite

### Task 1: Vite scaffolding — dev server runs the existing app

**Files:**
- Modify: `dashboard/package.json` (deps + scripts)
- Create: `dashboard/vite.config.js`
- Create: `dashboard/index.html` (from `public/index.html`)
- Delete: `dashboard/public/index.html`
- Rename: `dashboard/src/*.js` → `.jsx` (10 files, incl. `index.js`→`index.jsx`, `App.js`→`App.jsx`, all under `src/`)

**Interfaces:**
- Produces: working `npm --prefix … run dev` (Vite dev server on port 3000) and the entry at `/src/index.jsx`.

- [ ] **Step 1: Install Vite toolchain, remove react-scripts**

Run:
```bash
npm --prefix /Users/user/Documents/informatique/techtemp/dashboard install -D \
  vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm --prefix /Users/user/Documents/informatique/techtemp/dashboard uninstall react-scripts
```
Expected: installs succeed; `react-scripts` removed from `dependencies`.

- [ ] **Step 2: Replace `scripts` in `dashboard/package.json`**

Set the `"scripts"` block to:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```
Also remove the `"eslintConfig"` and `"browserslist"` keys (CRA-specific; Vite doesn't use them).

- [ ] **Step 3: Create `dashboard/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// outDir 'build' keeps deploy-robust-pi.sh (copies dashboard/build/ -> web/) working.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  build: { outDir: 'build' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
```

- [ ] **Step 4: Rename source files `.js` → `.jsx`**

Run:
```bash
for f in $(find /Users/user/Documents/informatique/techtemp/dashboard/src -name '*.js'); do git -C /Users/user/Documents/informatique/techtemp mv "$f" "${f%.js}.jsx"; done
```
Expected: 10 files renamed (imports are extensionless, so they keep resolving). Verify: `find … -name '*.js'` returns nothing under `src/`.

- [ ] **Step 5: Create `dashboard/index.html` at the project root**

Copy `dashboard/public/index.html` content, then: replace every `%PUBLIC_URL%/` with `/`, remove the `%PUBLIC_URL%` leftovers, and before `</body>` add the module entry. Minimum required shape:
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon-simple.svg?v=1.4" type="image/svg+xml" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <title>TechTemp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
```
(Keep the existing PWA/OG meta tags from the original, with `%PUBLIC_URL%/` → `/`.)

- [ ] **Step 6: Delete the old CRA HTML**

Run: `git -C /Users/user/Documents/informatique/techtemp rm dashboard/public/index.html`

- [ ] **Step 7: Verify the dev server compiles and serves**

Run (background it; it stays running):
```bash
npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run dev
```
Expected: Vite prints `VITE vX ready` and `Local: http://localhost:3000/` within a few seconds (NOT a hang). Then:
```bash
curl -s -m 10 http://localhost:3000/ | grep -q '<div id="root">' && echo "SERVES OK"
```
Expected: `SERVES OK`. Stop the dev server afterward.

- [ ] **Step 8: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "build: migrate dashboard from CRA to Vite (dev server)"
```

---

### Task 2: Convert env vars `REACT_APP_*` → `import.meta.env.VITE_*`

**Files:**
- Modify: `dashboard/src/config/api.endpoints.jsx:11`
- Modify: `dashboard/src/services/weather.service.jsx:13-15`
- Modify: `dashboard/.env.local`, `dashboard/.env.example`

**Interfaces:**
- Consumes: Vite's `import.meta.env` (vars must be prefixed `VITE_`).
- Produces: same runtime config keys, Vite-style.

- [ ] **Step 1: Update `api.endpoints.jsx`**

Replace the `process.env.REACT_APP_API_BASE_URL` reference (line ~11) with:
```javascript
  (import.meta.env.VITE_API_BASE_URL) ||
```
(Remove the `typeof process !== 'undefined' && process.env &&` guard — not needed with Vite.)

- [ ] **Step 2: Update `weather.service.jsx`**

```javascript
const LAT = parseFloat(import.meta.env.VITE_WEATHER_LAT || '50.8798');
const LON = parseFloat(import.meta.env.VITE_WEATHER_LON || '4.7005');
const TZ = import.meta.env.VITE_WEATHER_TZ || 'Europe/Brussels';
```

- [ ] **Step 3: Update env files**

`dashboard/.env.example` — rewrite the documented vars with the `VITE_` prefix:
```
# VITE_API_BASE_URL=http://192.168.0.42:3000/api/v1
# VITE_WEATHER_LAT=50.8798
# VITE_WEATHER_LON=4.7005
# VITE_WEATHER_TZ=Europe/Brussels
```
`dashboard/.env.local` — remove the CRA-only `PORT=3001` line (port is set in `vite.config.js`). Leave empty or add a `VITE_API_BASE_URL` if desired.

- [ ] **Step 4: Verify the app still builds with the new env references**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build`
Expected: build completes, outputs to `dashboard/build/` (no `process is not defined` errors).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "build: use import.meta.env (VITE_) for runtime config"
```

---

### Task 3: Vitest setup + first smoke test (enables TDD)

**Files:**
- Create: `dashboard/src/setupTests.js`
- Create: `dashboard/src/App.test.jsx`

**Interfaces:**
- Produces: `npm … test` runs Vitest with jsdom + jest-dom matchers; the rest of the plan relies on this.

- [ ] **Step 1: Create `dashboard/src/setupTests.js`**

```javascript
import '@testing-library/jest-dom';
```

- [ ] **Step 2: Write the smoke test `dashboard/src/App.test.jsx`**

```jsx
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';

test('App renders without crashing', () => {
  const { container } = render(
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
  expect(container).toBeTruthy();
});
```

- [ ] **Step 3: Run the test to verify the runner works and the test passes**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test`
Expected: Vitest starts (NOT a hang) and reports `1 passed`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "test: set up Vitest + Testing Library"
```

---

### Task 4: Production build → `build/` + cleanup, deploy-compatible

**Files:**
- Delete: `dashboard/public/index 2.html`, `dashboard/public/manifest 2.json`, `dashboard/public/robots 2.txt`, `dashboard/public/icons 2/` (macOS duplicates)
- Verify: `dashboard/build/` output

- [ ] **Step 1: Remove macOS duplicate files in `public/`**

```bash
git -C /Users/user/Documents/informatique/techtemp rm -r --ignore-unmatch \
  "dashboard/public/index 2.html" "dashboard/public/manifest 2.json" \
  "dashboard/public/robots 2.txt" "dashboard/public/icons 2"
```
(If some weren't tracked, also `rm -rf` them from disk.)

- [ ] **Step 2: Build and confirm output location**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build`
Expected: completes in seconds (Vite); creates `dashboard/build/index.html` + `dashboard/build/assets/`.
Verify: `test -f /Users/user/Documents/informatique/techtemp/dashboard/build/index.html && echo "BUILD OK"` → `BUILD OK`.

- [ ] **Step 3: Confirm `build/` is git-ignored (don't commit build artifacts)**

Run: `git -C /Users/user/Documents/informatique/techtemp check-ignore dashboard/build && echo "ignored"`
Expected: `ignored`. If not, add `dashboard/build/` to `dashboard/.gitignore`.

- [ ] **Step 4: Commit (cleanup only)**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "chore: drop macOS duplicate public assets; Vite build outputs build/"
```

---

## Phase 2 — Theme & color mode

### Task 5: Chakra custom theme (Slate & Cyan) + ColorModeScript

**Files:**
- Create: `dashboard/src/theme/index.jsx`
- Modify: `dashboard/src/index.jsx`
- Test: `dashboard/src/theme/theme.test.jsx`

**Interfaces:**
- Produces: `import theme, { ROOM_COLORS } from './theme'` — a Chakra theme with `config.initialColorMode === 'system'`, semantic tokens for surfaces/text/accent, and `ROOM_COLORS` (array of 6 hex strings).

- [ ] **Step 1: Write the failing test `dashboard/src/theme/theme.test.jsx`**

```jsx
import theme, { ROOM_COLORS } from './index';

test('theme uses system color mode, no auto-follow after manual toggle', () => {
  expect(theme.config.initialColorMode).toBe('system');
  expect(theme.config.useSystemColorMode).toBe(false);
});

test('exposes 6 stable room colors', () => {
  expect(ROOM_COLORS).toHaveLength(6);
  expect(ROOM_COLORS[0]).toBe('#22d3ee');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- theme`
Expected: FAIL (`Cannot find module './index'`).

- [ ] **Step 3: Create `dashboard/src/theme/index.jsx`**

```jsx
import { extendTheme } from '@chakra-ui/react';

export const ROOM_COLORS = ['#22d3ee', '#818cf8', '#fb923c', '#34d399', '#f472b6', '#facc15'];

const theme = extendTheme({
  config: { initialColorMode: 'system', useSystemColorMode: false },
  fonts: { heading: 'system-ui, -apple-system, sans-serif', body: 'system-ui, -apple-system, sans-serif' },
  semanticTokens: {
    colors: {
      'app.bg':       { default: '#f1f5f9', _dark: '#0f172a' },
      'app.surface':  { default: '#ffffff', _dark: '#1e293b' },
      'app.border':   { default: '#e2e8f0', _dark: '#334155' },
      'app.text':     { default: '#0f172a', _dark: '#f1f5f9' },
      'app.textMuted':{ default: '#64748b', _dark: '#94a3b8' },
      'app.accent':   { default: '#0891b2', _dark: '#22d3ee' },
    },
  },
  styles: { global: { body: { bg: 'app.bg', color: 'app.text' } } },
});

export default theme;
```

- [ ] **Step 4: Wire the theme + ColorModeScript in `dashboard/src/index.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test`
Expected: theme tests PASS, App smoke test still PASS.

- [ ] **Step 6: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "feat: Slate & Cyan Chakra theme + color mode (system+toggle)"
```

---

### Task 6: Header — light/dark toggle, remove inter-page nav

**Files:**
- Modify: `dashboard/src/components/Header.jsx`
- Modify: `dashboard/src/App.jsx` (single page — see Task 9 for route removal; here just keep `/`)
- Test: `dashboard/src/components/Header.test.jsx`

**Interfaces:**
- Produces: `Header` rendering a color-mode toggle button with `aria-label="Basculer le thème clair/sombre"`.

- [ ] **Step 1: Write the failing test `dashboard/src/components/Header.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import Header from './Header';

function renderHeader() {
  return render(<ChakraProvider theme={theme}><Header /></ChakraProvider>);
}

test('renders a color-mode toggle button', () => {
  renderHeader();
  expect(screen.getByLabelText('Basculer le thème clair/sombre')).toBeInTheDocument();
});

test('toggle button is clickable', async () => {
  renderHeader();
  const btn = screen.getByLabelText('Basculer le thème clair/sombre');
  await userEvent.click(btn); // must not throw
  expect(btn).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- Header`
Expected: FAIL (no such label).

- [ ] **Step 3: Add the toggle to `dashboard/src/components/Header.jsx`**

Inside the header's right-hand area, using Chakra's color-mode hook (keep the existing title/branding; remove the Live/Charts page links):
```jsx
import { useColorMode, IconButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
// ...
function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Basculer le thème clair/sombre"
      icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
    />
  );
}
```
Render `<ColorModeToggle />` in the header bar; delete the inter-page navigation links (single page from now on).

- [ ] **Step 4: Run to verify pass**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- Header`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "feat: header color-mode toggle, drop page nav"
```

---

## Phase 3 — Merged single page

### Task 7: `DeviceCard` redesign (v6 layout) — presentational

**Files:**
- Modify: `dashboard/src/components/` — create `SensorCard.jsx` (new presentational card; the old `DeviceCard` inside `LivePage.jsx` will be replaced in Task 9)
- Test: `dashboard/src/components/SensorCard.test.jsx`

**Interfaces:**
- Produces: `SensorCard({ name, temperature, humidity, status, ageLabel, color, selected, onToggle })` — renders the v6 card; calls `onToggle()` on click; shows selected styling (colored border) when `selected`.

- [ ] **Step 1: Write the failing test `dashboard/src/components/SensorCard.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import SensorCard from './SensorCard';

const base = { name: 'Zolder', temperature: 28.5, humidity: 67, status: 'online', ageLabel: 'il y a 2 min', color: '#22d3ee', selected: true };

function setup(props = {}) {
  const onToggle = vi.fn();
  render(<ChakraProvider theme={theme}><SensorCard {...base} {...props} onToggle={onToggle} /></ChakraProvider>);
  return { onToggle };
}

test('shows room name, temperature, humidity and labels', () => {
  setup();
  expect(screen.getByText('Zolder')).toBeInTheDocument();
  expect(screen.getByText(/28\.5/)).toBeInTheDocument();
  expect(screen.getByText(/67/)).toBeInTheDocument();
  expect(screen.getByText(/Température/i)).toBeInTheDocument();
  expect(screen.getByText(/Humidité/i)).toBeInTheDocument();
});

test('clicking the card calls onToggle', async () => {
  const { onToggle } = setup();
  await userEvent.click(screen.getByText('Zolder'));
  expect(onToggle).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- SensorCard`
Expected: FAIL (`Cannot find module './SensorCard'`).

- [ ] **Step 3: Create `dashboard/src/components/SensorCard.jsx`**

```jsx
import { Box, Flex, Text, Grid, GridItem } from '@chakra-ui/react';

const statusLabel = { online: 'En ligne', warn: 'Retard', offline: 'Hors ligne' };

export default function SensorCard({ name, temperature, humidity, status = 'online', ageLabel, color = '#22d3ee', selected = false, onToggle }) {
  return (
    <Box
      onClick={onToggle}
      cursor="pointer"
      w="310px"
      bg="app.surface"
      borderWidth={selected ? '2px' : '1px'}
      borderColor={selected ? color : 'app.border'}
      boxShadow={selected ? `0 0 0 3px ${color}26` : 'sm'}
      opacity={selected ? 1 : 0.7}
      borderRadius="14px"
      p={4}
      transition="all .15s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="600" fontSize="15px" color="app.text">
          <Box as="span" display="inline-block" w="9px" h="9px" borderRadius="full" bg={color} mr={2} />
          {name}
        </Text>
        <Text fontSize="11px" color="app.accent">{statusLabel[status]}</Text>
      </Flex>
      <Grid templateColumns="1fr 1fr" gap={3}>
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
      {ageLabel && <Text color="app.textMuted" fontSize="11px" mt={3} textAlign="right">{ageLabel}</Text>}
    </Box>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- SensorCard`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "feat: SensorCard (v6 layout, selectable)"
```

---

### Task 8: Selection state hook (rooms + metric)

**Files:**
- Create: `dashboard/src/hooks/useChartSelection.jsx`
- Test: `dashboard/src/hooks/useChartSelection.test.jsx`

**Interfaces:**
- Produces: `useChartSelection(allRoomUids)` → `{ selected: string[], isSelected(uid), toggle(uid), metric: 'temperature'|'humidity', setMetric }`. Defaults: all rooms selected, metric `'temperature'`.

- [ ] **Step 1: Write the failing test `dashboard/src/hooks/useChartSelection.test.jsx`**

```jsx
import { renderHook, act } from '@testing-library/react';
import { useChartSelection } from './useChartSelection';

test('defaults: all rooms selected, metric temperature', () => {
  const { result } = renderHook(() => useChartSelection(['a', 'b']));
  expect(result.current.selected).toEqual(['a', 'b']);
  expect(result.current.metric).toBe('temperature');
});

test('toggle removes then re-adds a room', () => {
  const { result } = renderHook(() => useChartSelection(['a', 'b']));
  act(() => result.current.toggle('a'));
  expect(result.current.isSelected('a')).toBe(false);
  act(() => result.current.toggle('a'));
  expect(result.current.isSelected('a')).toBe(true);
});

test('setMetric switches to humidity', () => {
  const { result } = renderHook(() => useChartSelection(['a']));
  act(() => result.current.setMetric('humidity'));
  expect(result.current.metric).toBe('humidity');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- useChartSelection`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `dashboard/src/hooks/useChartSelection.jsx`**

```jsx
import { useState, useCallback } from 'react';

export function useChartSelection(allRoomUids) {
  const [selected, setSelected] = useState(() => [...allRoomUids]);
  const [metric, setMetric] = useState('temperature');

  const isSelected = useCallback((uid) => selected.includes(uid), [selected]);
  const toggle = useCallback((uid) => {
    setSelected((cur) => (cur.includes(uid) ? cur.filter((u) => u !== uid) : [...cur, uid]));
  }, []);

  return { selected, isSelected, toggle, metric, setMetric };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- useChartSelection`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "feat: useChartSelection hook (rooms + metric)"
```

---

### Task 9: Assemble the merged page + remove `/charts` route

**Files:**
- Create: `dashboard/src/pages/DashboardPage.jsx` (vignette grid + metric/period controls + combined chart)
- Modify: `dashboard/src/App.jsx` (single route → `DashboardPage`; remove `/charts`)
- Modify: `dashboard/src/components/charts/HistoricalChart.jsx` (accept `roomUids: string[]` + `metric` props; render one Chart.js dataset per selected room in its `ROOM_COLORS[idx]`; hide moving averages when more than one room)
- Delete: `dashboard/src/pages/ChartsPage.jsx`, `dashboard/src/pages/LivePage.jsx` (logic folded into `DashboardPage`)
- Test: `dashboard/src/pages/DashboardPage.test.jsx`

**Interfaces:**
- Consumes: `SensorCard`, `useChartSelection`, `ROOM_COLORS`, `useDevices`/`useLatestReadings` (existing `DataContext`), `HistoricalChart`.
- Produces: the single dashboard page.

- [ ] **Step 1: Write the failing test `dashboard/src/pages/DashboardPage.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import DashboardPage from './DashboardPage';

// Mock the data context so the page has two rooms to render.
vi.mock('../contexts/DataContext', () => ({
  useDevices: () => ([
    { uid: 'zolder', room: { name: 'Zolder' }, last_seen_at: new Date().toISOString() },
    { uid: 'bureau', room: { name: 'Bureau' }, last_seen_at: new Date().toISOString() },
  ]),
  useLatestReadings: () => ({
    zolder: { temperature: 28.5, humidity: 67, ts: new Date().toISOString() },
    bureau: { temperature: 25.7, humidity: 70, ts: new Date().toISOString() },
  }),
}));

// Stub the chart so the test doesn't depend on canvas; assert it gets the selection.
vi.mock('../components/charts/HistoricalChart', () => ({
  default: ({ roomUids, metric }) => (
    <div data-testid="chart">{metric}:{roomUids.join(',')}</div>
  ),
}));

function setup() {
  render(<ChakraProvider theme={theme}><DashboardPage /></ChakraProvider>);
}

test('renders a card per room and a metric switch', () => {
  setup();
  expect(screen.getByText('Zolder')).toBeInTheDocument();
  expect(screen.getByText('Bureau')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Température/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Humidité/i })).toBeInTheDocument();
});

test('all rooms selected by default drive the chart', () => {
  setup();
  expect(screen.getByTestId('chart')).toHaveTextContent('temperature:zolder,bureau');
});

test('clicking a card removes it from the chart selection', async () => {
  setup();
  await userEvent.click(screen.getByText('Zolder'));
  expect(screen.getByTestId('chart')).toHaveTextContent('temperature:bureau');
});

test('metric switch updates the chart', async () => {
  setup();
  await userEvent.click(screen.getByRole('button', { name: /Humidité/i }));
  expect(screen.getByTestId('chart')).toHaveTextContent('humidity:');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test -- DashboardPage`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `dashboard/src/pages/DashboardPage.jsx`**

```jsx
import { Box, SimpleGrid, Flex, Button, ButtonGroup } from '@chakra-ui/react';
import { useDevices, useLatestReadings } from '../contexts/DataContext';
import { useChartSelection } from '../hooks/useChartSelection';
import { ROOM_COLORS } from '../theme';
import SensorCard from '../components/SensorCard';
import HistoricalChart from '../components/charts/HistoricalChart';

function statusFor(ts) {
  if (!ts) return 'offline';
  const age = Date.now() - new Date(ts).getTime();
  if (age <= 10 * 60 * 1000) return 'online';
  if (age <= 30 * 60 * 1000) return 'warn';
  return 'offline';
}

export default function DashboardPage() {
  const devices = useDevices();
  const readings = useLatestReadings();
  const roomUids = devices.map((d) => d.uid);
  const colorOf = (uid) => ROOM_COLORS[roomUids.indexOf(uid) % ROOM_COLORS.length];
  const { selected, isSelected, toggle, metric, setMetric } = useChartSelection(roomUids);

  return (
    <Box>
      <SimpleGrid minChildWidth="310px" spacing={4} mb={6}>
        {devices.map((d) => {
          const r = readings[d.uid] || {};
          return (
            <SensorCard
              key={d.uid}
              name={d.room?.name || d.uid}
              temperature={r.temperature}
              humidity={r.humidity}
              status={statusFor(r.ts || d.last_seen_at)}
              color={colorOf(d.uid)}
              selected={isSelected(d.uid)}
              onToggle={() => toggle(d.uid)}
            />
          );
        })}
      </SimpleGrid>

      <Flex justify="flex-start" mb={4}>
        <ButtonGroup isAttached size="sm" variant="outline">
          <Button onClick={() => setMetric('temperature')} colorScheme={metric === 'temperature' ? 'cyan' : 'gray'}>🌡️ Température</Button>
          <Button onClick={() => setMetric('humidity')} colorScheme={metric === 'humidity' ? 'cyan' : 'gray'}>💧 Humidité</Button>
        </ButtonGroup>
      </Flex>

      <HistoricalChart
        roomUids={selected}
        metric={metric}
        colorForRoom={colorOf}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Adapt `HistoricalChart.jsx` to the new props**

Change its signature to accept `{ roomUids, metric, colorForRoom }`. Drive the device/metric selection from these props instead of the internal device dropdown; build one Chart.js dataset per `uid` in `roomUids` using `colorForRoom(uid)` for the line color, plotting `metric`. Keep period/date controls and zoom. Hide the moving-average datasets when `roomUids.length > 1`. (Reuse the existing data-fetching and Chart.js options; this task only changes *what series* are built and *their colors*, plus removes the now-duplicated device dropdown.)

- [ ] **Step 5: Make `App.jsx` a single page**

```jsx
import { Box } from '@chakra-ui/react';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <DataProvider>
      <Box bg="app.bg" minH="100vh">
        <Header />
        <Box as="main" maxW="container.xl" mx="auto" p={{ base: 2, md: 6 }}>
          <DashboardPage />
        </Box>
      </Box>
    </DataProvider>
  );
}
export default App;
```
Then delete `dashboard/src/pages/ChartsPage.jsx` and `dashboard/src/pages/LivePage.jsx`:
```bash
git -C /Users/user/Documents/informatique/techtemp rm dashboard/src/pages/ChartsPage.jsx dashboard/src/pages/LivePage.jsx
```
(If `react-router-dom` is now unused, leave it installed — removing it is out of scope.)

- [ ] **Step 6: Run the full suite**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard test`
Expected: all tests PASS (App, Header, theme, SensorCard, useChartSelection, DashboardPage).

- [ ] **Step 7: Verify it builds**

Run: `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run build`
Expected: build succeeds to `dashboard/build/`.

- [ ] **Step 8: Commit**

```bash
git -C /Users/user/Documents/informatique/techtemp add -A dashboard
git -C /Users/user/Documents/informatique/techtemp commit -m "feat: merged single dashboard page (vignette selectors + combined chart)"
```

---

## Manual verification (after all tasks)

- `npm --prefix /Users/user/Documents/informatique/techtemp/dashboard run dev`, open `http://localhost:3000`:
  - light + dark toggle works and persists across reload;
  - clicking vignettes adds/removes their curve in the combined chart;
  - metric switch toggles Température/Humidité;
  - responsive: cards reflow to one column on a narrow viewport.
- Deploy with the existing script (builds to `build/`, copied to `web/`):
  `./scripts/admin/deploy-robust-pi.sh 192.168.0.42 --with-dashboard` — confirm the new UI loads at `http://techtemp-server.local:3000`.

## Self-Review

- **Spec coverage:** Vite migration (T1–T4) ✓; theme + system/toggle color mode (T5) ✓; header toggle + nav removal (T6) ✓; SensorCard v6 layout (T7) ✓; multi-select + metric state (T8) ✓; merged page, combined chart, per-room colors, `/charts` removal (T9) ✓; deploy compat via `outDir: 'build'` (T1/T4) ✓; public dup cleanup (T4) ✓; env var conversion (T2) ✓.
- **Placeholder scan:** none — config/components/tests given in full; T9 Step 4 (HistoricalChart adaptation) is described against the existing file rather than reproduced because it edits ~1000 lines of existing code, with exact props and behaviour specified.
- **Type consistency:** `useChartSelection` returns `{selected,isSelected,toggle,metric,setMetric}` used as such in DashboardPage; `SensorCard` props match its callers; `HistoricalChart` new props `{roomUids, metric, colorForRoom}` consistent between T9 mock, DashboardPage, and Step 4.
