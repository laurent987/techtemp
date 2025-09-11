# 📱 Devices API

The Devices API allows you to manage IoT devices in the TechTemp platform. This includes device provisioning, configuration updates, and device information retrieval.

## 📋 Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/devices` | `GET` | List all devices |
| `/api/v1/devices` | `POST` | Provision new device |
| `/api/v1/devices/:uid` | `GET` | Get device by UID |
| `/api/v1/devices/:uid` | `PUT` | Update device |
| `/api/v1/devices/:uid` | `DELETE` | Delete device |
| `/api/v1/devices/:uid/readings` | `GET` | Get device readings |

## 🔍 List All Devices

Retrieve a list of all registered devices.

### Request
```http
GET /api/v1/devices
```

### Response
```json
{
  "data": [
    {
      "uid": "aht20-f49c53",
      "room": {
        "uid": "salon",
        "name": "Salon"
      },
      "label": "Capteur Température/Humidité AHT20",
      "created_at": "2025-09-11 11:46:04",
      "last_seen_at": "2025-09-11T11:48:14.173Z"
    },
    {
      "uid": "aht20-abc123",
      "room": {
        "uid": "cuisine",
        "name": "Cuisine"
      },
      "label": "Kitchen Sensor",
      "created_at": "2025-09-11 10:20:15",
      "last_seen_at": "2025-09-11T11:45:32.891Z"
    }
  ]
}
```

### Example
```bash
curl http://localhost:3000/api/v1/devices
```

## ➕ Provision New Device

Create and register a new device. Automatically creates room if it doesn't exist.

### Request
```http
POST /api/v1/devices
Content-Type: application/json
```

```json
{
  "device_uid": "aht20-f49c53",
  "label": "Kitchen Temperature Sensor",
  "room_name": "Kitchen",
  "room_uid": "kitchen"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_uid` | string | ✅ | Unique device identifier |
| `label` | string | ❌ | Human-readable device name |
| `room_name` | string | ✅ | Room name (creates room if needed) |
| `room_uid` | string | ❌ | Room UID (auto-generated if not provided) |

### Response
**Status: 201 Created**
```json
{
  "data": {
    "device": {
      "uid": "aht20-f49c53",
      "room_id": 1,
      "label": "Kitchen Temperature Sensor",
      "last_seen_at": "2025-09-11T12:00:00.000Z"
    },
    "room": {
      "uid": "kitchen",
      "name": "Kitchen"
    }
  },
  "message": "Device provisioned successfully"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "aht20-abc123",
    "label": "Kitchen Sensor",
    "room_name": "Kitchen"
  }'
```

### Error Responses

**400 Bad Request** - Missing required fields:
```json
{
  "error": "device_uid is required and must be a string"
}
```

**409 Conflict** - Device already exists:
```json
{
  "error": "Device already exists",
  "device_uid": "aht20-f49c53"
}
```

## 🔍 Get Device by UID

Retrieve detailed information about a specific device.

### Request
```http
GET /api/v1/devices/:uid
```

### Response
```json
{
  "data": {
    "uid": "aht20-f49c53",
    "room_id": 1,
    "room": {
      "uid": "salon",
      "name": "Salon"
    },
    "label": "Capteur Température/Humidité AHT20",
    "created_at": "2025-09-11 11:46:04"
  }
}
```

### Example
```bash
curl http://localhost:3000/api/v1/devices/aht20-f49c53
```

### Error Responses

**404 Not Found**:
```json
{
  "error": "Device not found"
}
```

## ✏️ Update Device

Update device configuration, including room assignment.

### Request
```http
PUT /api/v1/devices/:uid
Content-Type: application/json
```

```json
{
  "label": "Updated Device Label",
  "room_name": "Living Room",
  "room_uid": "living-room"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | ❌ | New device label |
| `room_name` | string | ❌ | New room name (creates room if needed) |
| `room_uid` | string | ❌ | Room UID (auto-generated if not provided) |

### Response
**Status: 200 OK**
```json
{
  "data": {
    "device": {
      "uid": "aht20-f49c53",
      "room_id": 2,
      "label": "Updated Device Label",
      "created_at": "2025-09-11 11:46:04",
      "last_seen_at": "2025-09-11T11:48:14.173Z"
    },
    "room": {
      "uid": "living-room",
      "name": "Living Room"
    }
  },
  "message": "Device updated successfully"
}
```

### Example
```bash
curl -X PUT http://localhost:3000/api/v1/devices/aht20-f49c53 \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Main Living Room Sensor",
    "room_name": "Living Room"
  }'
```

### Error Responses

**404 Not Found**:
```json
{
  "error": "Device not found"
}
```

**400 Bad Request**:
```json
{
  "error": "label must be a string if provided"
}
```

## 🗑️ Delete Device

Remove a device from the system.

### Request
```http
DELETE /api/v1/devices/:uid
```

### Response
**Status: 200 OK**
```json
{
  "message": "Device deleted successfully",
  "uid": "aht20-f49c53"
}
```

### Example
```bash
curl -X DELETE http://localhost:3000/api/v1/devices/aht20-f49c53
```

### Error Responses

**404 Not Found**:
```json
{
  "error": "Device not found"
}
```

## 📊 Get Device Readings

Retrieve sensor readings for a specific device.

### Request
```http
GET /api/v1/devices/:uid/readings?limit=10
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of readings to return (max 1000) |

### Response
```json
{
  "data": [
    {
      "ts": "2025-09-11T11:51:44.072Z",
      "temperature": 20.87,
      "humidity": 60.91,
      "source": "mqtt"
    },
    {
      "ts": "2025-09-11T11:51:14.052Z",
      "temperature": 20.87,
      "humidity": 59.14,
      "source": "mqtt"
    }
  ]
}
```

### Example
```bash
# Get latest 5 readings
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=5"

# Get default number of readings (10)
curl http://localhost:3000/api/v1/devices/aht20-f49c53/readings
```

### Error Responses

**404 Not Found**:
```json
{
  "error": "Device not found"
}
```

**400 Bad Request** - Invalid limit:
```json
{
  "error": "Limit must be between 1 and 1000"
}
```

## 🔄 Device Lifecycle

### 1. Provisioning
- Create device with `POST /api/v1/devices`
- Device is registered but not active
- Room is created automatically if needed

### 2. First Data
- Device sends first MQTT message
- `last_seen_at` is updated
- Device becomes "active"

### 3. Regular Operation
- Device sends data every 30 seconds (configurable)
- `last_seen_at` updated with each message
- Readings stored and available via API

### 4. Updates
- Use `PUT /api/v1/devices/:uid` to change configuration
- Can move device to different room
- Label changes reflected immediately

### 5. Removal
- `DELETE /api/v1/devices/:uid` removes device
- Historical readings are preserved
- MQTT messages from device will be rejected

## 🏗️ Room Auto-Creation

When provisioning or updating a device with a `room_name`:

1. **Room UID Generation**: If no `room_uid` provided, it's auto-generated:
   ```
   "Living Room" → "living-room"
   "Salle de Bain" → "salle-de-bain"
   ```

2. **Room Creation**: If room doesn't exist, it's created automatically

3. **Room Assignment**: Device is assigned to the room

### Room UID Rules
- Lowercase transformation
- Spaces become hyphens
- Special characters removed
- Accents normalized

## 🎯 Device UID Best Practices

### Recommended Format
```
{sensor-type}-{unique-identifier}
```

### Examples
```
aht20-f49c53          # AHT20 sensor with MAC suffix
bme280-living01       # BME280 in living room, device #1
ds18b20-outdoor       # DS18B20 outdoor sensor
dht22-bedroom         # DHT22 in bedroom
```

### UID Requirements
- **Unique**: Must be unique across all devices
- **Permanent**: Should not change during device lifetime
- **Alphanumeric**: Letters, numbers, hyphens only
- **Descriptive**: Include sensor type for clarity

## 🔗 Related APIs

- **[📊 Readings API](READINGS.md)** - Retrieve sensor data
- **[🏠 Rooms API](ROOMS.md)** - Manage rooms (future)

## 💡 Examples

See [EXAMPLES.md](EXAMPLES.md) for complete integration examples including:
- Device provisioning workflows
- Bulk device management
- Room organization patterns
- Error handling strategies
