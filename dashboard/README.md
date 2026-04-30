# TechTemp Dashboard

Reference web dashboard for the TechTemp IoT platform — historical temperature & humidity charts, multi-room comparison.

> This dashboard is **optional**. The TechTemp backend already serves a minimal HTML example out of `web-example/` at the same URL — use this richer one if you want polished charts and date filters; otherwise the API at `/api/v1/` is enough to build your own UI or integrate with Home Assistant / Grafana / etc.

## Architecture

```
[ Sensor Pi(s) ] ──MQTT──▶ [ Pi central :3000 ] ──HTTP──▶ [ Dashboard ]
                            (techtemp backend)            (this app)
```

The dashboard runs on your local machine (or any host) and talks to the backend via the REST API. It does **not** run on the Pi.

## Prerequisites

- Node.js 18+
- A running TechTemp backend (default expected at `http://192.168.0.42:3000`)

## Quick start

```bash
cd dashboard
npm install
npm start
```

Opens `http://localhost:3000`. The dashboard auto-fetches devices and rooms from the backend, then lets you pick a date range to plot history.

## Pointing at a different backend

The default backend URL is `http://192.168.0.42:3000/api/v1`. Override at start time:

```bash
REACT_APP_API_BASE_URL=http://my-pi.local:3000/api/v1 npm start
```

Or set it in a `.env.local` file at the dashboard root:

```
REACT_APP_API_BASE_URL=http://192.168.1.42:3000/api/v1
```

## Production build

```bash
npm run build
```

Outputs static files in `build/`. Serve them with any static host (nginx, Caddy, GitHub Pages, …) or — easiest path — let the deploy script ship them onto the Pi:

```bash
./scripts/admin/deploy-robust-pi.sh --with-dashboard
```

The deploy script builds the dashboard, copies it into `web/`, then rsyncs everything to the Pi. The backend serves whatever is in `web/` (the dashboard) and falls back to `web-example/` if `web/` is empty.

## CORS

The backend ships with permissive CORS (`Access-Control-Allow-Origin: *`) so this dashboard works from any host out of the box. If you expose the API beyond a trusted LAN, tighten the policy in `backend/http/server.js`.

## What's used

- **React 19** + **Chakra UI** for the layout
- **Chart.js** + **react-chartjs-2** for time-series plots, with `chartjs-plugin-zoom`
- **react-datepicker** for date range selection
- **react-router-dom** for navigation

## API endpoints consumed

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/devices` | List sensors + their current room |
| `GET /api/v1/rooms` | List all rooms |
| `GET /api/v1/devices/:uid/readings?from=&to=&limit=` | Fetch historical readings for a device in a window |

See `docs/DEVELOPER/api/` for the full API reference.
