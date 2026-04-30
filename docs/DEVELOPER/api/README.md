# 🔌 TechTemp API Documentation

Welcome to the TechTemp IoT Platform API! This API allows you to manage IoT devices, retrieve sensor readings, and organize devices into rooms.

## 🚀 Quick Start

### Base URL
```
http://localhost:3000
```

### Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### First API Call
```bash
# Get all devices
curl http://localhost:3000/api/v1/devices

# Get readings for a specific device
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=5"
```

## 📋 API Overview

| Endpoint | Description | Documentation |
|----------|-------------|---------------|
| `GET /health` | Service health check | [Health](#health-endpoint) |
| `GET /api/v1/devices` | List all devices | [Devices API](DEVICES.md) |
| `POST /api/v1/devices` | Provision new device | [Devices API](DEVICES.md) |
| `GET /api/v1/devices/:uid` | Get device details | [Devices API](DEVICES.md) |
| `GET /api/v1/devices/:uid/readings` | Get device readings | [Readings API](READINGS.md) |
| `PUT /api/v1/devices/:uid` | Update device | [Devices API](DEVICES.md) |
| `DELETE /api/v1/devices/:uid` | Delete device | [Devices API](DEVICES.md) |

## 🏗️ API Design Principles

### RESTful Design
- **Resources**: Devices, Readings, Rooms
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: Standard HTTP codes (200, 201, 400, 404, 500)

### Data Format
- **Request**: JSON with `Content-Type: application/json`
- **Response**: JSON with consistent structure
- **Timestamps**: ISO 8601 format (UTC)
- **IDs**: Public UIDs vs Private internal IDs

### Public vs Private IDs

🔒 **Important**: The API only exposes **UIDs** (public identifiers) and never internal database IDs.

```json
{
  "uid": "aht20-f49c53",           // ✅ Public UID (exposed)
  "room": {
    "uid": "salon",                // ✅ Public UID (exposed)
    "name": "Salon"
  },
  "label": "Temperature Sensor"
  // ❌ Internal IDs (id, room_id) are NEVER exposed
}
```

## 📊 Response Format

### Success Response
```json
{
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

### Paginated Response (Future)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

## 🔐 Authentication

**Current**: No authentication (LAN-only deployment)

**Future**: API Key or JWT-based authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/v1/devices
```

## 📈 Rate Limiting

**Current**: No rate limiting

**Future**: Per-IP rate limiting (see [RATE_LIMITS.md](RATE_LIMITS.md))

## 🚨 Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid request data |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists |
| `500` | Internal Server Error | Server error |

### Error Response Format
```json
{
  "error": "Device not found"
}
```

See [ERRORS.md](ERRORS.md) for complete error reference.

## 📱 Client SDKs & Examples

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/v1/devices');
const { data } = await response.json();
console.log('Devices:', data);
```

### Python
```python
import requests

response = requests.get('http://localhost:3000/api/v1/devices')
devices = response.json()['data']
print(f"Found {len(devices)} devices")
```

### curl
```bash
# Create device
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "aht20-123456",
    "label": "Kitchen Sensor",
    "room_name": "Kitchen"
  }'
```

See [EXAMPLES.md](EXAMPLES.md) for complete examples.

## 🔗 Detailed Documentation

- **[📱 Devices API](DEVICES.md)** - Device management (CRUD operations)
- **[📊 Readings API](READINGS.md)** - Sensor data retrieval
- **[🏠 Rooms API](ROOMS.md)** - Room management (future)
- **[🚨 Error Codes](ERRORS.md)** - Complete error reference
- **[📖 Examples](EXAMPLES.md)** - Real-world usage examples
- **[🔒 Authentication](AUTHENTICATION.md)** - Security and auth (future)

## 🗂️ Data Models

### Device
```json
{
  "uid": "aht20-f49c53",
  "room": {
    "uid": "salon",
    "name": "Salon"
  },
  "label": "Temperature Sensor",
  "created_at": "2025-09-11T10:30:00Z",
  "last_seen_at": "2025-09-11T11:45:00Z"
}
```

### Reading
```json
{
  "ts": "2025-09-11T11:45:00Z",
  "temperature": 22.5,
  "humidity": 65.2,
  "source": "mqtt"
}
```

### Room
```json
{
  "uid": "salon",
  "name": "Salon"
}
```

## 🆕 API Versioning

**Current Version**: `v1`

All endpoints are prefixed with `/api/v1/` to support future API evolution.

## 📞 Support

- **Documentation Issues**: Open an issue on GitHub
- **API Questions**: Check [EXAMPLES.md](EXAMPLES.md) first
- **Bug Reports**: Include request/response details

---

**Quick Links:**
- [🚀 Quick Start Examples](EXAMPLES.md)
- [📱 Device Management](DEVICES.md)
- [📊 Reading Data](READINGS.md)
- [🚨 Error Handling](ERRORS.md)
- [🔄 Migration Guide](MIGRATION.md)
