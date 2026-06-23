# `moved_at` Placement Date — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow `PUT /api/v1/devices/:deviceUid` to backdate a room change via an optional `moved_at` timestamp so historical readings stay attributed to the correct room.

**Architecture:** The placement-dating logic lives in `repo.devices.update` (Task 1), which currently hardcodes `new Date()` for both the closing `to_ts` and the new `from_ts`. We thread an optional timestamp through it. The HTTP route (Task 2) reads and validates the `moved_at` field, then passes it into `updateData`. Validation lives in the route, not the repository.

**Tech Stack:** Node.js (ESM), Express, better-sqlite3, Vitest + Supertest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-06-23-moved-at-placement-date-design.md`
- Parameter name (verbatim): `moved_at`
- Timestamps stored as ISO 8601 strings, normalized via `new Date(moved_at).toISOString()`
- Backwards compatible: absent `moved_at` keeps the current `new Date()` behavior
- Run all tests with: `npm test` (vitest run). Single file: `npx vitest run <path>`
- Tests use in-memory DB (`initDb(':memory:')`); `db` and `repo`/`repository` are available in test scope

---

### Task 1: Repository — thread `moved_at` through `update()`

**Files:**
- Modify: `backend/repositories/index.js` (the `update` method, lines ~144-164)
- Test: `test/repositories.test.js` (add cases in the `describe('Device Repository', ...)` block)

**Interfaces:**
- Consumes: existing `dataAccess.findCurrentDevicePlacement(uid)`, `dataAccess.updateDevicePlacement(deviceId, fromTs, { to_ts })`, `dataAccess.insertDevicePlacement({ device_id, room_id, from_ts })`, `dataAccess.resolveDeviceId(uid)`
- Produces: `repo.devices.update(uid, { room_id, label?, moved_at? })` — when `moved_at` (ISO string) is present, both the closed placement's `to_ts` and the new placement's `from_ts` are set to it; when absent, both use `new Date().toISOString()`. No validation at this layer.

- [ ] **Step 1: Write the failing tests**

Add to `test/repositories.test.js` inside the `describe('Device Repository', ...)` block:

```javascript
it('should date placements with moved_at when provided', async () => {
  const roomA = await repository.rooms.create({ uid: 'room-a', name: 'Room A' });
  const roomB = await repository.rooms.create({ uid: 'room-b', name: 'Room B' });
  await repository.devices.create({ uid: 'dev-move', room_id: roomA.id });

  const movedAt = '2026-06-22T10:00:00.000Z';
  await repository.devices.update('dev-move', { room_id: roomB.id, moved_at: movedAt });

  const current = await repository.devices.getCurrentPlacement('dev-move');
  expect(current.room_id).toBe(roomB.id);
  expect(current.from_ts).toBe(movedAt);

  const placements = db.prepare(
    'SELECT room_id, from_ts, to_ts FROM device_room_placements ORDER BY from_ts'
  ).all();
  const closed = placements.find(p => p.room_id === roomA.id);
  expect(closed.to_ts).toBe(movedAt);
});

it('should use current time for placement when moved_at is omitted', async () => {
  const roomA = await repository.rooms.create({ uid: 'room-a2', name: 'Room A2' });
  const roomB = await repository.rooms.create({ uid: 'room-b2', name: 'Room B2' });
  await repository.devices.create({ uid: 'dev-move2', room_id: roomA.id });

  const before = Date.now();
  await repository.devices.update('dev-move2', { room_id: roomB.id });
  const after = Date.now();

  const current = await repository.devices.getCurrentPlacement('dev-move2');
  const fromTs = new Date(current.from_ts).getTime();
  expect(fromTs).toBeGreaterThanOrEqual(before);
  expect(fromTs).toBeLessThanOrEqual(after);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/repositories.test.js -t "moved_at"`
Expected: the `should date placements with moved_at when provided` test FAILS — `current.from_ts` is the current time, not `'2026-06-22T10:00:00.000Z'`. (The omitted-`moved_at` test passes already; it documents the preserved behavior.)

- [ ] **Step 3: Implement the change**

In `backend/repositories/index.js`, inside the `update` method, replace the `if (updateData.room_id !== undefined) { ... }` block (lines ~144-164) with:

```javascript
        // Handle room_id changes via placements
        if (updateData.room_id !== undefined) {
          // Use the provided move date if any, otherwise "now"
          const placementTs = updateData.moved_at || new Date().toISOString();

          // First, close current placement if exists
          const currentPlacement = await dataAccess.findCurrentDevicePlacement(uid);
          if (currentPlacement) {
            await dataAccess.updateDevicePlacement(currentPlacement.device_id, currentPlacement.from_ts, {
              to_ts: placementTs
            });
          }

          // Create new placement if room_id is provided (not null)
          if (updateData.room_id) {
            // Resolve device ID internally in dataAccess
            const deviceId = await dataAccess.resolveDeviceId(uid);
            await dataAccess.insertDevicePlacement({
              device_id: deviceId,
              room_id: updateData.room_id,
              from_ts: placementTs
            });
          }
        }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/repositories.test.js -t "moved_at"`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/repositories/index.js test/repositories.test.js
git commit -m "feat: thread moved_at through device placement update

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Route — read and validate `moved_at` on `PUT /api/v1/devices/:deviceUid`

**Files:**
- Modify: `backend/http/routes/devices.js` (the `PUT /:deviceUid` handler)
- Test: `test/http/devices.test.js` (add cases in the `describe('PUT /api/v1/devices/:deviceUid', ...)` block)

**Interfaces:**
- Consumes: `repo.devices.update(uid, { room_id, label?, moved_at? })` from Task 1; `repo.devices.getCurrentPlacement(uid)` returning `{ device_id, room_id, from_ts, to_ts }` (or null)
- Produces: `PUT` accepts optional `moved_at` in the JSON body. Returns `400` for: malformed ISO 8601, future date, date not strictly after the current placement's `from_ts`, or `moved_at` sent without `room_name`. On success the move is dated to `moved_at`.

- [ ] **Step 1: Write the failing tests**

Add to `test/http/devices.test.js` inside the `describe('PUT /api/v1/devices/:deviceUid', ...)` block:

```javascript
test('should accept a valid moved_at and backdate the placement', async () => {
  await request(app)
    .post('/api/v1/devices')
    .send({ device_uid: 'moved-sensor', room_name: 'Bedroom', label: 'Old label' });

  // Backdate the initial placement so a past moved_at is valid
  db.prepare(
    `UPDATE device_room_placements SET from_ts = ?
       WHERE device_id = (SELECT id FROM devices WHERE uid = ?)`
  ).run(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 'moved-sensor');

  const movedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
  const response = await request(app)
    .put('/api/v1/devices/moved-sensor')
    .send({ room_name: 'Attic', moved_at: movedAt })
    .expect(200);

  expect(response.body.data.room.name).toBe('Attic');

  const current = await repo.devices.getCurrentPlacement('moved-sensor');
  expect(current.from_ts).toBe(movedAt);
});

test('should reject a future moved_at', async () => {
  await request(app)
    .post('/api/v1/devices')
    .send({ device_uid: 'future-sensor', room_name: 'Bedroom' });

  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const response = await request(app)
    .put('/api/v1/devices/future-sensor')
    .send({ room_name: 'Attic', moved_at: future })
    .expect(400);

  expect(response.body.error).toContain('future');
});

test('should reject a moved_at before the current placement start', async () => {
  await request(app)
    .post('/api/v1/devices')
    .send({ device_uid: 'early-sensor', room_name: 'Bedroom' });

  // Current placement was created "now"; a date in the far past precedes it
  const tooEarly = '2000-01-01T00:00:00.000Z';
  const response = await request(app)
    .put('/api/v1/devices/early-sensor')
    .send({ room_name: 'Attic', moved_at: tooEarly })
    .expect(400);

  expect(response.body.error).toContain('after');
});

test('should reject a malformed moved_at', async () => {
  await request(app)
    .post('/api/v1/devices')
    .send({ device_uid: 'bad-date-sensor', room_name: 'Bedroom' });

  const response = await request(app)
    .put('/api/v1/devices/bad-date-sensor')
    .send({ room_name: 'Attic', moved_at: 'not-a-date' })
    .expect(400);

  expect(response.body.error).toContain('ISO 8601');
});

test('should reject moved_at without room_name', async () => {
  await request(app)
    .post('/api/v1/devices')
    .send({ device_uid: 'no-room-sensor', room_name: 'Bedroom' });

  const response = await request(app)
    .put('/api/v1/devices/no-room-sensor')
    .send({ moved_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() })
    .expect(400);

  expect(response.body.error).toContain('room_name');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/http/devices.test.js -t "moved_at|backdate|future|before the current|malformed|without room_name"`
Expected: the new tests FAIL — `moved_at` is currently ignored, so backdating returns the wrong `from_ts` and the validation cases return `200` instead of `400`.

- [ ] **Step 3: Implement the validation and passthrough**

In `backend/http/routes/devices.js`, in the `PUT /:deviceUid` handler:

(a) Change the destructuring line from:

```javascript
      const { room_name, room_uid, label } = req.body;
```

to:

```javascript
      const { room_name, room_uid, label, moved_at } = req.body;
```

(b) Immediately after the device-existence check (right after the `if (!device) { return res.status(404)... }` block), insert the validation:

```javascript
      // Validate optional moved_at (dates the room change)
      let normalizedMovedAt;
      if (moved_at !== undefined) {
        if (!room_name) {
          return res.status(400).json({
            error: 'moved_at requires room_name (it dates a room change)'
          });
        }
        if (typeof moved_at !== 'string' || isNaN(Date.parse(moved_at))) {
          return res.status(400).json({
            error: 'moved_at must be a valid ISO 8601 timestamp'
          });
        }
        const movedDate = new Date(moved_at);
        if (movedDate.getTime() > Date.now()) {
          return res.status(400).json({
            error: 'moved_at cannot be in the future'
          });
        }
        const currentPlacement = await deps.repo.devices.getCurrentPlacement(deviceUid);
        if (currentPlacement &&
            movedDate.getTime() <= new Date(currentPlacement.from_ts).getTime()) {
          return res.status(400).json({
            error: 'moved_at must be after the current placement start'
          });
        }
        normalizedMovedAt = movedDate.toISOString();
      }
```

(c) Where `updateData` is assembled, add the `moved_at` passthrough. Change:

```javascript
      const updateData = {
        room_id: updatedRoomId
      };

      if (label !== undefined) {
        updateData.label = label;
      }
```

to:

```javascript
      const updateData = {
        room_id: updatedRoomId
      };

      if (label !== undefined) {
        updateData.label = label;
      }

      if (normalizedMovedAt) {
        updateData.moved_at = normalizedMovedAt;
      }
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npx vitest run test/http/devices.test.js -t "moved_at|backdate|future|before the current|malformed|without room_name"`
Expected: all new tests PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: all tests PASS (including the existing `should update device room and label` and `should return 404` PUT tests).

- [ ] **Step 6: Commit**

```bash
git add backend/http/routes/devices.js test/http/devices.test.js
git commit -m "feat: accept and validate optional moved_at on device PUT

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Manual verification (after both tasks)

Against the running backend on the Raspberry Pi:

```bash
curl -X PUT http://<IP_DU_RASPBERRY>:3000/api/v1/devices/aht20-f49c53 \
  -H "Content-Type: application/json" \
  -d '{"room_name":"zolder","label":"Capteur du grenier","moved_at":"2026-06-22T10:00:00Z"}'
```

Confirm the response shows room `zolder` and that the new placement's `from_ts` is `2026-06-22T10:00:00.000Z`.

## Self-Review

- **Spec coverage:** `moved_at` param ✓ (Task 2 destructure + passthrough); backdated `to_ts`/`from_ts` ✓ (Task 1); validation rules 1–4 ✓ (Task 2 Step 3b); normalization ✓ (`movedDate.toISOString()`); backwards compat ✓ (Task 1 omitted-`moved_at` test); out-of-scope POST/provisioning untouched ✓.
- **Placeholder scan:** none — all steps contain concrete code and commands.
- **Type consistency:** `moved_at` (ISO string) flows route → `updateData.moved_at` → `placementTs`; `getCurrentPlacement` returns `{ from_ts, room_id, ... }` used consistently in both layers.
