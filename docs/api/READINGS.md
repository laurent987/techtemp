# 📊 Readings API

The Readings API provides access to sensor data collected from IoT devices. This includes temperature, humidity, and other environmental measurements.

## 📋 Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/devices/:uid/readings` | `GET` | Get readings for specific device |

> **Note**: More reading endpoints will be added in future versions (room-based queries, time ranges, aggregations).

## 📊 Get Device Readings

Retrieve sensor readings for a specific device, ordered by timestamp (newest first).

### Request
```http
GET /api/v1/devices/:uid/readings?limit=10
```

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 10 | 1000 | Number of readings to return |

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
    },
    {
      "ts": "2025-09-11T11:50:44.171Z",
      "temperature": 20.9,
      "humidity": 60.19,
      "source": "mqtt"
    }
  ]
}
```

### Data Fields

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `ts` | string | ISO 8601 | Timestamp when reading was taken (UTC) |
| `temperature` | number | °C | Temperature in Celsius |
| `humidity` | number | % | Relative humidity percentage |
| `source` | string | - | Data source (`mqtt`, `http`, `manual`) |

### Examples

#### Get Latest 5 Readings
```bash
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=5"
```

#### Get Default Readings (10)
```bash
curl http://localhost:3000/api/v1/devices/aht20-f49c53/readings
```

#### Get Many Readings for Analysis
```bash
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=100"
```

## 🚨 Error Responses

### Device Not Found
**Status: 404 Not Found**
```json
{
  "error": "Device not found"
}
```

### Invalid Limit
**Status: 400 Bad Request**
```json
{
  "error": "Limit must be between 1 and 1000"
}
```

### Internal Server Error
**Status: 500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

## 📈 Data Quality and Validation

### Temperature Range
- **Sensor Range**: -40°C to +85°C (AHT20 spec)
- **Typical Indoor**: 15°C to 30°C
- **Accuracy**: ±0.3°C

### Humidity Range
- **Sensor Range**: 0% to 100% RH
- **Typical Indoor**: 30% to 70% RH
- **Accuracy**: ±2% RH

### Data Validation
All readings are validated before storage:
- Temperature must be between -50°C and 100°C
- Humidity must be between 0% and 100%
- Timestamp must be valid ISO 8601
- Invalid readings are rejected and logged

## ⏰ Data Frequency and Timing

### Collection Frequency
- **Default**: Every 30 seconds
- **Configurable**: 10 seconds to 1 hour
- **MQTT QoS**: 1 (at least once delivery)

### Timestamp Precision
- **Precision**: Millisecond (ISO 8601)
- **Timezone**: Always UTC
- **Format**: `2025-09-11T11:51:44.072Z`

### Data Ordering
- **Default Order**: Newest first (descending timestamp)
- **Consistent**: Order guaranteed for same device
- **Unique**: No duplicate timestamps per device

## 🔄 Real-time Data Flow

```
IoT Device → MQTT → TechTemp Service → Database → API
     ↑                                              ↓
   30s interval                                API Clients
```

### Data Latency
- **MQTT to Database**: < 1 second
- **Database to API**: < 100ms
- **Total Latency**: < 2 seconds from sensor to API

## 📊 Use Cases and Patterns

### Real-time Monitoring
```bash
# Poll for latest reading every 5 seconds
while true; do
  curl -s "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1" | jq '.data[0]'
  sleep 5
done
```

### Historical Analysis
```bash
# Get last 24 hours of data (assuming 30s intervals = ~2880 readings)
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1000"
```

### Data Export
```bash
# Export to CSV format
curl -s "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1000" | \
  jq -r '.data[] | [.ts, .temperature, .humidity] | @csv' > readings.csv
```

### Alerting
```javascript
const response = await fetch('http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1');
const { data } = await response.json();
const latest = data[0];

if (latest.temperature > 25) {
  console.log('🌡️ High temperature alert:', latest.temperature);
}

if (latest.humidity > 80) {
  console.log('💧 High humidity alert:', latest.humidity);
}
```

## 🎯 JavaScript SDK Example

```javascript
class TechTempReadingsAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async getDeviceReadings(deviceUid, limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/devices/${deviceUid}/readings?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const { data } = await response.json();
    return data;
  }

  async getLatestReading(deviceUid) {
    const readings = await this.getDeviceReadings(deviceUid, 1);
    return readings[0] || null;
  }

  async getReadingsInTimeRange(deviceUid, minutes = 60) {
    // Estimate number of readings based on 30s intervals
    const estimatedReadings = Math.ceil((minutes * 60) / 30);
    const limit = Math.min(estimatedReadings, 1000);
    
    const readings = await this.getDeviceReadings(deviceUid, limit);
    
    // Filter by actual time range
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return readings.filter(reading => new Date(reading.ts) >= cutoffTime);
  }
}

// Usage
const api = new TechTempReadingsAPI();

// Get latest reading
const latest = await api.getLatestReading('aht20-f49c53');
console.log(`Current: ${latest.temperature}°C, ${latest.humidity}% RH`);

// Get last hour of data
const hourlyData = await api.getReadingsInTimeRange('aht20-f49c53', 60);
console.log(`Readings in last hour: ${hourlyData.length}`);
```

## 🐍 Python SDK Example

```python
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class TechTempReadingsAPI:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url

    def get_device_readings(self, device_uid: str, limit: int = 10) -> List[Dict]:
        """Get readings for a specific device."""
        response = requests.get(
            f"{self.base_url}/api/v1/devices/{device_uid}/readings",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_latest_reading(self, device_uid: str) -> Optional[Dict]:
        """Get the most recent reading for a device."""
        readings = self.get_device_readings(device_uid, limit=1)
        return readings[0] if readings else None

    def get_temperature_stats(self, device_uid: str, limit: int = 100) -> Dict:
        """Calculate temperature statistics."""
        readings = self.get_device_readings(device_uid, limit)
        temperatures = [r["temperature"] for r in readings]
        
        return {
            "min": min(temperatures),
            "max": max(temperatures),
            "avg": sum(temperatures) / len(temperatures),
            "count": len(temperatures)
        }

# Usage
api = TechTempReadingsAPI()

# Get latest reading
latest = api.get_latest_reading("aht20-f49c53")
print(f"Current: {latest['temperature']}°C, {latest['humidity']}% RH")

# Calculate stats
stats = api.get_temperature_stats("aht20-f49c53", limit=100)
print(f"Temperature: {stats['min']:.1f}°C - {stats['max']:.1f}°C (avg: {stats['avg']:.1f}°C)")
```

## 🔮 Future Enhancements

### Planned Endpoints (v2)

#### Time-based Queries
```http
GET /api/v1/devices/:uid/readings?from=2025-09-11T00:00:00Z&to=2025-09-11T23:59:59Z
```

#### Room-based Queries
```http
GET /api/v1/rooms/:room_uid/readings?limit=50
```

#### Aggregated Data
```http
GET /api/v1/devices/:uid/readings/aggregated?interval=1h&period=24h
```

#### Real-time Streaming
```http
GET /api/v1/devices/:uid/readings/stream
```

### Enhanced Filtering
- Date range filtering
- Min/max value filtering
- Data quality filtering
- Sensor-specific filtering

### Aggregation Support
- Hourly/daily averages
- Min/max values
- Statistical summaries
- Trend analysis

## 🔗 Related APIs

- **[📱 Devices API](DEVICES.md)** - Manage devices that generate readings
- **[🏠 Rooms API](ROOMS.md)** - Organize devices by location (future)

## 💡 Best Practices

### Performance
- Use `limit` parameter to avoid large responses
- Cache frequently accessed data
- Consider pagination for large datasets

### Error Handling
- Always check for device existence before querying readings
- Handle network timeouts gracefully
- Implement retry logic for transient errors

### Data Processing
- Convert timestamps to local timezone in client
- Validate readings before processing
- Consider data smoothing for noisy sensors

See [EXAMPLES.md](EXAMPLES.md) for complete integration examples.
