# 📖 API Examples

This guide provides practical examples for common TechTemp API usage patterns. All examples use real API responses and include error handling.

## 🚀 Quick Start Examples

### 1. Check API Health
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### 2. List All Devices
```bash
curl http://localhost:3000/api/v1/devices | jq
```

**Response:**
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
    }
  ]
}
```

### 3. Get Latest Readings
```bash
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=3" | jq
```

**Response:**
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

## 🏗️ Device Management Examples

### Provision New Device
```bash
# Create device with automatic room creation
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "aht20-kitchen01",
    "label": "Kitchen Temperature Sensor",
    "room_name": "Kitchen"
  }' | jq
```

**Response:**
```json
{
  "data": {
    "device": {
      "uid": "aht20-kitchen01",
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

### Update Device Location
```bash
# Move device to different room
curl -X PUT http://localhost:3000/api/v1/devices/aht20-kitchen01 \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Living Room Main Sensor",
    "room_name": "Living Room"
  }' | jq
```

### Get Device Details
```bash
curl http://localhost:3000/api/v1/devices/aht20-kitchen01 | jq
```

**Response:**
```json
{
  "data": {
    "uid": "aht20-kitchen01",
    "room_id": 2,
    "room": {
      "uid": "living-room",
      "name": "Living Room"
    },
    "label": "Living Room Main Sensor",
    "created_at": "2025-09-11 12:00:00"
  }
}
```

## 📊 Data Retrieval Patterns

### Real-time Monitoring Script
```bash
#!/bin/bash
# monitor-device.sh - Monitor device in real-time

DEVICE_UID="aht20-f49c53"
INTERVAL=5

echo "Monitoring device: $DEVICE_UID"
echo "Timestamp                    | Temp | Humidity"
echo "--------------------------------------------"

while true; do
  # Get latest reading
  DATA=$(curl -s "http://localhost:3000/api/v1/devices/$DEVICE_UID/readings?limit=1")
  
  # Check if API is responding
  if [ $? -eq 0 ]; then
    # Extract values using jq
    TIMESTAMP=$(echo "$DATA" | jq -r '.data[0].ts // "N/A"')
    TEMP=$(echo "$DATA" | jq -r '.data[0].temperature // "N/A"')
    HUMIDITY=$(echo "$DATA" | jq -r '.data[0].humidity // "N/A"')
    
    # Format timestamp for display
    if [ "$TIMESTAMP" != "N/A" ]; then
      DISPLAY_TIME=$(date -d "$TIMESTAMP" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$TIMESTAMP")
    else
      DISPLAY_TIME="N/A"
    fi
    
    printf "%-28s | %4s°C | %5s%%\n" "$DISPLAY_TIME" "$TEMP" "$HUMIDITY"
  else
    echo "API Error - retrying..."
  fi
  
  sleep $INTERVAL
done
```

### Data Export to CSV
```bash
#!/bin/bash
# export-readings.sh - Export device readings to CSV

DEVICE_UID="aht20-f49c53"
LIMIT=1000
OUTPUT_FILE="readings_${DEVICE_UID}_$(date +%Y%m%d_%H%M%S).csv"

echo "Exporting readings for $DEVICE_UID..."

# Get readings and convert to CSV
curl -s "http://localhost:3000/api/v1/devices/$DEVICE_UID/readings?limit=$LIMIT" | \
  jq -r '["timestamp","temperature","humidity","source"], (.data[] | [.ts, .temperature, .humidity, .source]) | @csv' > "$OUTPUT_FILE"

echo "Exported $(( $(wc -l < "$OUTPUT_FILE") - 1 )) readings to $OUTPUT_FILE"
```

## 🌐 JavaScript/Node.js Examples

### Complete TechTemp Client Class
```javascript
// techtemp-client.js
class TechTempClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`API Error ${response.status}: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Device management
  async getDevices() {
    const response = await this.request('/api/v1/devices');
    return response.data;
  }

  async getDevice(uid) {
    const response = await this.request(`/api/v1/devices/${uid}`);
    return response.data;
  }

  async provisionDevice(deviceData) {
    const response = await this.request('/api/v1/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    return response.data;
  }

  async updateDevice(uid, updateData) {
    const response = await this.request(`/api/v1/devices/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  async deleteDevice(uid) {
    return this.request(`/api/v1/devices/${uid}`, {
      method: 'DELETE',
    });
  }

  // Readings
  async getDeviceReadings(uid, limit = 10) {
    const response = await this.request(`/api/v1/devices/${uid}/readings?limit=${limit}`);
    return response.data;
  }

  async getLatestReading(uid) {
    const readings = await this.getDeviceReadings(uid, 1);
    return readings[0] || null;
  }

  // Utility methods
  async waitForDevice(uid, timeoutMs = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const device = await this.getDevice(uid);
        if (device.last_seen_at) {
          return device;
        }
      } catch (error) {
        if (!error.message.includes('404')) {
          throw error;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Device ${uid} did not come online within ${timeoutMs}ms`);
  }

  async getDeviceStatistics(uid, limit = 100) {
    const readings = await this.getDeviceReadings(uid, limit);
    
    if (readings.length === 0) {
      return null;
    }

    const temperatures = readings.map(r => r.temperature).filter(t => t !== null);
    const humidities = readings.map(r => r.humidity).filter(h => h !== null);

    return {
      readingCount: readings.length,
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length,
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((sum, h) => sum + h, 0) / humidities.length,
      },
      timeRange: {
        oldest: readings[readings.length - 1]?.ts,
        newest: readings[0]?.ts,
      },
    };
  }
}

// Usage examples
async function examples() {
  const client = new TechTempClient();

  try {
    // Check API health
    const health = await client.getHealth();
    console.log('API Status:', health.status);

    // List all devices
    const devices = await client.getDevices();
    console.log(`Found ${devices.length} devices`);

    // Provision new device
    const newDevice = await client.provisionDevice({
      device_uid: 'aht20-demo01',
      label: 'Demo Sensor',
      room_name: 'Demo Room',
    });
    console.log('Provisioned device:', newDevice);

    // Wait for device to come online
    console.log('Waiting for device to send data...');
    await client.waitForDevice('aht20-demo01');

    // Get latest reading
    const latest = await client.getLatestReading('aht20-demo01');
    console.log(`Latest: ${latest.temperature}°C, ${latest.humidity}% RH`);

    // Get statistics
    const stats = await client.getDeviceStatistics('aht20-demo01');
    console.log('Temperature range:', `${stats.temperature.min}°C - ${stats.temperature.max}°C`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Export for use in other modules
module.exports = TechTempClient;
```

### Real-time Dashboard Example
```javascript
// dashboard.js - Simple real-time dashboard
const TechTempClient = require('./techtemp-client');

class Dashboard {
  constructor() {
    this.client = new TechTempClient();
    this.devices = new Map();
    this.updateInterval = 5000; // 5 seconds
  }

  async start() {
    console.log('🌡️ TechTemp Dashboard Starting...');
    
    // Load devices
    await this.loadDevices();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log(`📊 Monitoring ${this.devices.size} devices`);
  }

  async loadDevices() {
    try {
      const devices = await this.client.getDevices();
      
      for (const device of devices) {
        this.devices.set(device.uid, {
          ...device,
          lastReading: null,
          status: 'unknown',
        });
      }
    } catch (error) {
      console.error('Failed to load devices:', error.message);
    }
  }

  startMonitoring() {
    setInterval(async () => {
      await this.updateAllDevices();
      this.displayDashboard();
    }, this.updateInterval);
  }

  async updateAllDevices() {
    for (const [uid, device] of this.devices) {
      try {
        const latest = await this.client.getLatestReading(uid);
        
        if (latest) {
          const readingAge = Date.now() - new Date(latest.ts).getTime();
          device.lastReading = latest;
          device.status = readingAge < 60000 ? 'online' : 'stale'; // 1 minute threshold
        } else {
          device.status = 'no-data';
        }
      } catch (error) {
        device.status = 'error';
        device.error = error.message;
      }
    }
  }

  displayDashboard() {
    console.clear();
    console.log('🌡️ TechTemp Real-time Dashboard');
    console.log('═'.repeat(80));
    console.log();

    for (const [uid, device] of this.devices) {
      const statusIcon = {
        online: '🟢',
        stale: '🟡',
        'no-data': '🔴',
        error: '❌',
        unknown: '⚪',
      }[device.status];

      const room = device.room ? device.room.name : 'No Room';
      const label = device.label || 'Unnamed Device';
      
      console.log(`${statusIcon} ${uid}`);
      console.log(`   📍 ${room} - ${label}`);
      
      if (device.lastReading) {
        const { temperature, humidity, ts } = device.lastReading;
        const time = new Date(ts).toLocaleTimeString();
        console.log(`   🌡️  ${temperature}°C   💧 ${humidity}% RH   ⏰ ${time}`);
      } else {
        console.log(`   📡 No recent data`);
      }
      
      if (device.error) {
        console.log(`   ❗ ${device.error}`);
      }
      
      console.log();
    }

    console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
  }
}

// Start dashboard
const dashboard = new Dashboard();
dashboard.start().catch(console.error);
```

## 🐍 Python Examples

### Complete Python Client
```python
# techtemp_client.py
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class TechTempClient:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make HTTP request to API."""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', 'Unknown error')
            except:
                error_msg = response.text or f"HTTP {response.status_code}"
            
            raise Exception(f"API Error {response.status_code}: {error_msg}")
        
        return response.json()

    # Health check
    def get_health(self) -> Dict:
        """Check API health."""
        return self._request('GET', '/health')

    # Device management
    def get_devices(self) -> List[Dict]:
        """Get all devices."""
        response = self._request('GET', '/api/v1/devices')
        return response['data']

    def get_device(self, uid: str) -> Dict:
        """Get device by UID."""
        response = self._request('GET', f'/api/v1/devices/{uid}')
        return response['data']

    def provision_device(self, device_data: Dict) -> Dict:
        """Provision new device."""
        response = self._request('POST', '/api/v1/devices', json=device_data)
        return response['data']

    def update_device(self, uid: str, update_data: Dict) -> Dict:
        """Update device."""
        response = self._request('PUT', f'/api/v1/devices/{uid}', json=update_data)
        return response['data']

    def delete_device(self, uid: str) -> Dict:
        """Delete device."""
        return self._request('DELETE', f'/api/v1/devices/{uid}')

    # Readings
    def get_device_readings(self, uid: str, limit: int = 10) -> List[Dict]:
        """Get readings for device."""
        response = self._request('GET', f'/api/v1/devices/{uid}/readings', 
                                params={'limit': limit})
        return response['data']

    def get_latest_reading(self, uid: str) -> Optional[Dict]:
        """Get latest reading for device."""
        readings = self.get_device_readings(uid, limit=1)
        return readings[0] if readings else None

    def wait_for_device(self, uid: str, timeout_seconds: int = 30) -> Dict:
        """Wait for device to come online."""
        start_time = time.time()
        
        while time.time() - start_time < timeout_seconds:
            try:
                device = self.get_device(uid)
                if device.get('last_seen_at'):
                    return device
            except Exception as e:
                if "404" not in str(e):
                    raise
            
            time.sleep(1)
        
        raise Exception(f"Device {uid} did not come online within {timeout_seconds}s")

    def get_device_statistics(self, uid: str, limit: int = 100) -> Optional[Dict]:
        """Calculate device statistics."""
        readings = self.get_device_readings(uid, limit)
        
        if not readings:
            return None

        temperatures = [r['temperature'] for r in readings if r['temperature'] is not None]
        humidities = [r['humidity'] for r in readings if r['humidity'] is not None]

        return {
            'reading_count': len(readings),
            'temperature': {
                'min': min(temperatures) if temperatures else None,
                'max': max(temperatures) if temperatures else None,
                'avg': sum(temperatures) / len(temperatures) if temperatures else None,
            },
            'humidity': {
                'min': min(humidities) if humidities else None,
                'max': max(humidities) if humidities else None,
                'avg': sum(humidities) / len(humidities) if humidities else None,
            },
            'time_range': {
                'oldest': readings[-1]['ts'] if readings else None,
                'newest': readings[0]['ts'] if readings else None,
            },
        }

# Usage examples
def main():
    client = TechTempClient()

    try:
        # Check API health
        health = client.get_health()
        print(f"API Status: {health['status']}")

        # List devices
        devices = client.get_devices()
        print(f"Found {len(devices)} devices")

        for device in devices:
            uid = device['uid']
            room = device.get('room', {}).get('name', 'No Room')
            label = device.get('label', 'Unnamed')
            
            print(f"\n📱 {uid}")
            print(f"   📍 {room} - {label}")
            
            # Get latest reading
            latest = client.get_latest_reading(uid)
            if latest:
                temp = latest['temperature']
                humidity = latest['humidity']
                timestamp = latest['ts']
                print(f"   🌡️  {temp}°C   💧 {humidity}% RH")
                print(f"   ⏰ {timestamp}")
            else:
                print("   📡 No recent data")

            # Get statistics
            stats = client.get_device_statistics(uid, limit=50)
            if stats and stats['temperature']['avg']:
                temp_avg = stats['temperature']['avg']
                humidity_avg = stats['humidity']['avg']
                print(f"   📊 Avg: {temp_avg:.1f}°C, {humidity_avg:.1f}% RH")

    except Exception as error:
        print(f"Error: {error}")

if __name__ == "__main__":
    main()
```

### Data Analysis Example
```python
# analysis.py - Temperature trend analysis
import pandas as pd
import matplotlib.pyplot as plt
from techtemp_client import TechTempClient

def analyze_device_trends(device_uid: str, days: int = 7):
    """Analyze temperature trends for a device."""
    client = TechTempClient()
    
    # Estimate readings needed (30s intervals)
    estimated_readings = days * 24 * 60 * 2  # 2 readings per minute
    limit = min(estimated_readings, 1000)
    
    # Get readings
    readings = client.get_device_readings(device_uid, limit)
    
    if not readings:
        print(f"No data for device {device_uid}")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(readings)
    df['ts'] = pd.to_datetime(df['ts'])
    df.set_index('ts', inplace=True)
    
    # Basic statistics
    print(f"📊 Analysis for {device_uid}")
    print(f"📅 Data period: {df.index.min()} to {df.index.max()}")
    print(f"📈 Readings: {len(df)}")
    print(f"🌡️  Temperature: {df['temperature'].min():.1f}°C - {df['temperature'].max():.1f}°C (avg: {df['temperature'].mean():.1f}°C)")
    print(f"💧 Humidity: {df['humidity'].min():.1f}% - {df['humidity'].max():.1f}% (avg: {df['humidity'].mean():.1f}%)")
    
    # Hourly averages
    hourly = df.resample('H').mean()
    
    # Plot trends
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
    
    # Temperature plot
    ax1.plot(hourly.index, hourly['temperature'], color='red', linewidth=2)
    ax1.set_title(f'Temperature Trend - {device_uid}')
    ax1.set_ylabel('Temperature (°C)')
    ax1.grid(True, alpha=0.3)
    
    # Humidity plot
    ax2.plot(hourly.index, hourly['humidity'], color='blue', linewidth=2)
    ax2.set_title(f'Humidity Trend - {device_uid}')
    ax2.set_ylabel('Humidity (%)')
    ax2.set_xlabel('Time')
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f'trends_{device_uid}.png', dpi=150, bbox_inches='tight')
    print(f"📈 Chart saved as trends_{device_uid}.png")
    
    return df

# Usage
if __name__ == "__main__":
    analyze_device_trends("aht20-f49c53", days=1)
```

## 🚨 Error Handling Examples

### Robust Error Handling in JavaScript
```javascript
async function robustDeviceQuery(uid) {
  const client = new TechTempClient();
  
  try {
    // Try to get device info
    const device = await client.getDevice(uid);
    console.log(`✅ Device found: ${device.label}`);
    
    // Try to get readings
    const readings = await client.getDeviceReadings(uid, 5);
    
    if (readings.length === 0) {
      console.log(`⚠️ No readings available for ${uid}`);
      return { device, readings: [], status: 'no-data' };
    }
    
    const latest = readings[0];
    const dataAge = Date.now() - new Date(latest.ts).getTime();
    
    if (dataAge > 300000) { // 5 minutes
      console.log(`⚠️ Data is stale (${Math.round(dataAge/60000)} minutes old)`);
      return { device, readings, status: 'stale' };
    }
    
    console.log(`✅ Fresh data: ${latest.temperature}°C, ${latest.humidity}% RH`);
    return { device, readings, status: 'online' };
    
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`❌ Device ${uid} not found`);
      return { error: 'not-found', status: 'error' };
    } else if (error.message.includes('500')) {
      console.log(`🔥 Server error: ${error.message}`);
      return { error: 'server-error', status: 'error' };
    } else {
      console.log(`🌐 Network error: ${error.message}`);
      return { error: 'network-error', status: 'error' };
    }
  }
}

// Usage with error handling
robustDeviceQuery('aht20-f49c53').then(result => {
  console.log('Query result:', result);
});
```

### Retry Logic Example
```javascript
async function apiWithRetry(apiCall, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const client = new TechTempClient();

apiWithRetry(() => client.getDevices())
  .then(devices => console.log(`Got ${devices.length} devices`))
  .catch(error => console.error('Final error:', error.message));
```

## 🔗 Integration Examples

### Home Assistant Integration
```yaml
# configuration.yaml - Home Assistant sensors
sensor:
  - platform: rest
    name: "Living Room Temperature"
    resource: "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1"
    value_template: "{{ value_json.data[0].temperature }}"
    unit_of_measurement: "°C"
    scan_interval: 30

  - platform: rest
    name: "Living Room Humidity" 
    resource: "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1"
    value_template: "{{ value_json.data[0].humidity }}"
    unit_of_measurement: "%"
    scan_interval: 30
```

### Grafana Data Source
```javascript
// grafana-datasource.js - Custom Grafana data source
class TechTempDataSource {
  constructor(instanceSettings) {
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
  }

  async query(options) {
    const promises = options.targets.map(target => {
      if (target.hide) return Promise.resolve({ data: [] });
      
      return this.queryDevice(target, options.range);
    });

    const results = await Promise.all(promises);
    return { data: results.flat() };
  }

  async queryDevice(target, range) {
    const { deviceUid, metric } = target;
    
    // Calculate readings needed based on time range
    const duration = range.to.diff(range.from);
    const estimatedReadings = Math.ceil(duration.asMinutes() / 0.5); // 30s intervals
    const limit = Math.min(estimatedReadings, 1000);
    
    const response = await fetch(
      `${this.url}/api/v1/devices/${deviceUid}/readings?limit=${limit}`
    );
    
    const { data } = await response.json();
    
    return {
      target: `${deviceUid}-${metric}`,
      datapoints: data.map(reading => [
        reading[metric],
        new Date(reading.ts).getTime()
      ])
    };
  }

  async testDatasource() {
    try {
      const response = await fetch(`${this.url}/health`);
      const health = await response.json();
      
      if (health.status === 'ok') {
        return { status: 'success', message: 'TechTemp API is reachable' };
      } else {
        return { status: 'error', message: 'TechTemp API unhealthy' };
      }
    } catch (error) {
      return { status: 'error', message: `Cannot connect to TechTemp API: ${error.message}` };
    }
  }
}
```

These examples provide a comprehensive foundation for integrating with the TechTemp API. For more specific use cases, see the individual API documentation pages.
