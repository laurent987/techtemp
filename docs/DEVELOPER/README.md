# 🔧 TechTemp for Developers

> **Build applications with the TechTemp IoT platform** - Complete REST API reference, SDKs, and integration patterns.

![API Architecture](../assets/api-architecture.png)

---

## 🎯 **What You'll Get**

After following this guide (15 minutes), you'll be able to:

✅ **Make your first API call** and retrieve sensor data  
✅ **Understand the data models** and endpoint patterns  
✅ **Integrate TechTemp** into your applications  
✅ **Handle errors gracefully** with proper error codes  
✅ **Use advanced features** like pagination and filtering  

## ⚡ **Quick Start** 

### **Step 1: Verify API Access** (2 minutes)

```bash
# Check API health
curl http://192.168.0.42:3000/health
# Response: {"status":"ok"}

# Get all devices  
curl http://192.168.0.42:3000/api/v1/devices
# Response: {"data": [...]}

# Get latest readings
curl http://192.168.0.42:3000/api/v1/readings/latest
# Response: {"data": [...]}
```

**✅ API Working!** → Continue with integration examples below.

### **Step 2: Your First Integration** (5 minutes)

<details>
<summary><strong>📱 JavaScript/Node.js</strong></summary>

```javascript
// Basic TechTemp client
class TechTempClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getDevices() {
    const response = await fetch(`${this.baseUrl}/api/v1/devices`);
    const result = await response.json();
    return result.data;
  }

  async getDeviceReadings(deviceUid, limit = 10) {
    const url = `${this.baseUrl}/api/v1/devices/${deviceUid}/readings?limit=${limit}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.data;
  }

  async getLatestReadings() {
    const response = await fetch(`${this.baseUrl}/api/v1/readings/latest`);
    const result = await response.json();
    return result.data;
  }
}

// Usage example
const client = new TechTempClient('http://192.168.0.42:3000');

// Get all devices
const devices = await client.getDevices();
console.log('Found devices:', devices);

// Get latest readings for a specific device
const readings = await client.getDeviceReadings('aht20-f49c53', 5);
console.log('Latest readings:', readings);
```

</details>

<details>
<summary><strong>🐍 Python</strong></summary>

```python
import requests
import json
from datetime import datetime

class TechTempClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
    
    def get_devices(self):
        response = requests.get(f'{self.base_url}/api/v1/devices')
        response.raise_for_status()
        return response.json()['data']
    
    def get_device_readings(self, device_uid, limit=10):
        url = f'{self.base_url}/api/v1/devices/{device_uid}/readings'
        params = {'limit': limit}
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()['data']
    
    def get_latest_readings(self):
        response = requests.get(f'{self.base_url}/api/v1/readings/latest')
        response.raise_for_status()
        return response.json()['data']

# Usage example
client = TechTempClient('http://192.168.0.42:3000')

# Get all devices
devices = client.get_devices()
print(f"Found {len(devices)} devices")

for device in devices:
    print(f"Device: {device['label']} in {device['room']['name']}")
    
    # Get latest readings
    readings = client.get_device_readings(device['uid'], 1)
    if readings:
        latest = readings[0]
        print(f"  Temperature: {latest['temperature']}°C")
        print(f"  Humidity: {latest['humidity']}%")
        print(f"  Last updated: {latest['ts']}")
```

</details>

<details>
<summary><strong>🏠 Home Assistant</strong></summary>

```yaml
# configuration.yaml
sensor:
  # Temperature sensors
  - platform: rest
    resource: http://192.168.0.42:3000/api/v1/devices/aht20-f49c53/readings?limit=1
    name: "Living Room Temperature"
    value_template: "{{ value_json.data[0].temperature if value_json.data else 'unavailable' }}"
    unit_of_measurement: "°C"
    device_class: temperature
    scan_interval: 30

  # Humidity sensors  
  - platform: rest
    resource: http://192.168.0.42:3000/api/v1/devices/aht20-f49c53/readings?limit=1
    name: "Living Room Humidity"
    value_template: "{{ value_json.data[0].humidity if value_json.data else 'unavailable' }}"
    unit_of_measurement: "%"
    device_class: humidity
    scan_interval: 30

# Automation example
automation:
  - alias: "High humidity alert"
    trigger:
      - platform: numeric_state
        entity_id: sensor.living_room_humidity
        above: 70
    action:
      - service: notify.mobile_app
        data:
          title: "High Humidity Alert"
          message: "Living room humidity is {{ states('sensor.living_room_humidity') }}%"
```

</details>

### **Step 3: Understanding the Data** (8 minutes)

**Device Object:**
```json
{
  "uid": "aht20-f49c53",
  "room": {
    "uid": "living-room", 
    "name": "Living Room"
  },
  "label": "Living Room Temperature Sensor",
  "created_at": "2025-09-11 22:13:28",
  "last_seen_at": "2025-09-12T11:13:25.224Z"
}
```

**Reading Object:**
```json
{
  "ts": "2025-09-12T11:13:25.224Z",
  "temperature": 20.02,
  "humidity": 62.45, 
  "source": "mqtt"
}
```

---

## 📚 **Complete API Reference**

### **🏠 Devices API**

#### **List All Devices**
```http
GET /api/v1/devices
```

**Response:**
```json
{
  "data": [
    {
      "uid": "aht20-f49c53",
      "room": {
        "uid": "living-room",
        "name": "Living Room" 
      },
      "label": "Living Room Sensor",
      "created_at": "2025-09-11 22:13:28",
      "last_seen_at": "2025-09-12T11:13:25.224Z"
    }
  ]
}
```

#### **Get Specific Device**
```http
GET /api/v1/devices/{device_uid}
```

**Example:**
```bash
curl http://192.168.0.42:3000/api/v1/devices/aht20-f49c53
```

#### **Provision New Device**
```http
POST /api/v1/devices
Content-Type: application/json
```

**Request Body:**
```json
{
  "device_uid": "sensor-kitchen",
  "room_name": "Kitchen",
  "label": "Kitchen Temperature Sensor"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "device": {
      "uid": "sensor-kitchen",
      "room_id": 2,
      "label": "Kitchen Temperature Sensor",
      "created_at": "2025-09-12T13:30:00.000Z",
      "last_seen_at": null
    },
    "room": {
      "uid": "kitchen",
      "name": "Kitchen"
    }
  },
  "message": "Device provisioned successfully"
}
```

#### **Update Device**
```http
PUT /api/v1/devices/{device_uid}
Content-Type: application/json
```

**Request Body:**
```json
{
  "label": "Updated Sensor Name",
  "room_name": "New Room"
}
```

#### **Delete Device**
```http
DELETE /api/v1/devices/{device_uid}
```

**Response:**
```json
{
  "message": "Device deleted successfully",
  "uid": "sensor-kitchen"
}
```

### **📊 Readings API**

#### **Get Device Readings**
```http
GET /api/v1/devices/{device_uid}/readings?limit={limit}
```

**Parameters:**
- `limit` (optional): Number of readings (1-1000, default: 10)

**Example:**
```bash
curl "http://192.168.0.42:3000/api/v1/devices/aht20-f49c53/readings?limit=5"
```

**Response:**
```json
{
  "data": [
    {
      "ts": "2025-09-12T11:13:25.224Z",
      "temperature": 20.02,
      "humidity": 62.45,
      "source": "mqtt"
    },
    {
      "ts": "2025-09-12T11:08:25.245Z", 
      "temperature": 20.07,
      "humidity": 62.62,
      "source": "mqtt"
    }
  ]
}
```

#### **Get Latest Readings (All Devices)**
```http
GET /api/v1/readings/latest
```

**Response:**
```json
{
  "data": [
    {
      "device_id": "aht20-f49c53",
      "room_id": "living-room",
      "ts": "2025-09-12T11:13:25.224Z",
      "temperature": 20.02,
      "humidity": 62.45
    }
  ]
}
```

### **🔍 Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## 🚨 **Error Handling**

### **HTTP Status Codes**

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid request data |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists | 
| `500` | Internal Server Error | Server error |

### **Error Response Format**
```json
{
  "error": "Device not found"
}
```

### **Common Errors**

**Device Not Found:**
```bash
curl http://192.168.0.42:3000/api/v1/devices/invalid-device
# Response: {"error": "Device not found"}
```

**Validation Error:**
```bash
curl -X POST http://192.168.0.42:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Response: {"error": "device_uid is required and must be a string"}
```

**Duplicate Device:**
```bash
curl -X POST http://192.168.0.42:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "existing-device", "room_name": "Room"}'
# Response: {"error": "Device already exists", "device_uid": "existing-device"}
```

---

## 🛠️ **SDKs & Libraries**

### **Official SDKs**

<details>
<summary><strong>📦 JavaScript/TypeScript SDK</strong></summary>

**Installation:**
```bash
npm install techtemp-client
```

**Usage:**
```typescript
import { TechTempClient } from 'techtemp-client';

const client = new TechTempClient({
  baseUrl: 'http://192.168.0.42:3000',
  timeout: 5000
});

// TypeScript types included
const devices: Device[] = await client.getDevices();
const readings: Reading[] = await client.getDeviceReadings('aht20-f49c53');
```

</details>

<details>
<summary><strong>🐍 Python SDK</strong></summary>

**Installation:**
```bash
pip install techtemp-python
```

**Usage:**
```python
from techtemp import TechTempClient

client = TechTempClient('http://192.168.0.42:3000')

devices = client.get_devices()
readings = client.get_device_readings('aht20-f49c53', limit=10)
```

</details>

### **Community Libraries**

- **🏠 Home Assistant Integration:** Built-in REST platform
- **📊 Grafana Dashboard:** Import from [community templates](https://grafana.com/grafana/dashboards/techtemp)
- **🔔 Discord/Slack Bots:** [Example implementations](../examples/bots/)

---

## 🔧 **Advanced Usage**

### **Real-time Updates with Server-Sent Events**

```javascript
// Listen for real-time updates (future feature)
const eventSource = new EventSource('http://192.168.0.42:3000/api/v1/events');

eventSource.onmessage = function(event) {
  const reading = JSON.parse(event.data);
  console.log('New reading:', reading);
  updateDashboard(reading);
};
```

### **Batch Operations**

```javascript
// Provision multiple devices at once
async function provisionDevices(devices) {
  const promises = devices.map(device => 
    fetch('http://192.168.0.42:3000/api/v1/devices', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(device)
    })
  );
  
  const results = await Promise.all(promises);
  return results.map(r => r.json());
}
```

### **Data Export**

```python
import csv
from datetime import datetime, timedelta

def export_readings_csv(client, device_uid, days=7):
    # Get readings from last N days
    readings = client.get_device_readings(device_uid, limit=1000)
    
    # Filter by date range
    cutoff = datetime.now() - timedelta(days=days)
    recent_readings = [
        r for r in readings 
        if datetime.fromisoformat(r['ts'].replace('Z', '+00:00')) > cutoff
    ]
    
    # Export to CSV
    with open(f'{device_uid}_readings.csv', 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=['ts', 'temperature', 'humidity'])
        writer.writeheader()
        writer.writerows(recent_readings)
```

### **Monitoring & Alerts**

```python
def check_device_health(client):
    devices = client.get_devices()
    alerts = []
    
    for device in devices:
        last_seen = datetime.fromisoformat(device['last_seen_at'].replace('Z', '+00:00'))
        if (datetime.now(timezone.utc) - last_seen).seconds > 300:  # 5 minutes
            alerts.append(f"Device {device['label']} is offline")
        
        readings = client.get_device_readings(device['uid'], 1)
        if readings:
            temp = readings[0]['temperature']
            humidity = readings[0]['humidity']
            
            if temp > 30 or temp < 10:
                alerts.append(f"Temperature alert in {device['room']['name']}: {temp}°C")
            
            if humidity > 70 or humidity < 30:
                alerts.append(f"Humidity alert in {device['room']['name']}: {humidity}%")
    
    return alerts
```

---

## 🧪 **Testing Your Integration**

### **Unit Testing**

```javascript
// Jest example
describe('TechTemp Integration', () => {
  const client = new TechTempClient(process.env.TECHTEMP_URL);
  
  test('should fetch devices', async () => {
    const devices = await client.getDevices();
    expect(Array.isArray(devices)).toBe(true);
    
    if (devices.length > 0) {
      expect(devices[0]).toHaveProperty('uid');
      expect(devices[0]).toHaveProperty('room');
      expect(devices[0]).toHaveProperty('label');
    }
  });
  
  test('should handle device not found', async () => {
    await expect(
      client.getDeviceReadings('non-existent-device')
    ).rejects.toThrow('Device not found');
  });
});
```

### **Integration Testing**

```python
import pytest
import requests

def test_api_health():
    response = requests.get('http://192.168.0.42:3000/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'

def test_devices_endpoint():
    response = requests.get('http://192.168.0.42:3000/api/v1/devices')
    assert response.status_code == 200
    
    data = response.json()
    assert 'data' in data
    assert isinstance(data['data'], list)

def test_device_provision_and_cleanup():
    # Test device creation
    device_data = {
        "device_uid": "test-device-123",
        "room_name": "Test Room",
        "label": "Test Sensor"
    }
    
    response = requests.post(
        'http://192.168.0.42:3000/api/v1/devices',
        json=device_data
    )
    assert response.status_code == 201
    
    # Cleanup
    requests.delete('http://192.168.0.42:3000/api/v1/devices/test-device-123')
```

---

## 📈 **Performance & Best Practices**

### **Rate Limiting**
- **Current**: No rate limiting implemented
- **Recommendation**: Max 100 requests/minute per IP
- **Bulk operations**: Use sparingly

### **Caching**
```javascript
// Simple in-memory cache
class CachedTechTempClient {
  constructor(baseUrl, cacheTtl = 30000) {
    this.client = new TechTempClient(baseUrl);
    this.cache = new Map();
    this.cacheTtl = cacheTtl;
  }
  
  async getDevices() {
    const cacheKey = 'devices';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }
    
    const data = await this.client.getDevices();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

### **Error Handling**
```javascript
async function robustApiCall(apiFunction, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Usage
const devices = await robustApiCall(() => client.getDevices());
```

---

## 🔗 **Integration Examples**

### **📊 Grafana Dashboard**

```json
{
  "dashboard": {
    "title": "TechTemp Environmental Monitoring",
    "panels": [
      {
        "title": "Temperature by Room",
        "type": "stat",
        "targets": [
          {
            "url": "http://192.168.0.42:3000/api/v1/readings/latest",
            "format": "json"
          }
        ]
      }
    ]
  }
}
```

### **🔔 Discord Bot**

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { TechTempClient } = require('./techtemp-client');

const discord = new Client({ intents: [GatewayIntentBits.Guilds] });
const techtemp = new TechTempClient('http://192.168.0.42:3000');

discord.on('messageCreate', async (message) => {
  if (message.content === '!temp') {
    const readings = await techtemp.getLatestReadings();
    const response = readings.map(r => 
      `${r.device_id}: ${r.temperature}°C (${r.humidity}%)`
    ).join('\n');
    
    message.reply(`Current readings:\n\`\`\`${response}\`\`\``);
  }
});
```

### **📱 React Dashboard Component**

```jsx
import React, { useState, useEffect } from 'react';

function TechTempDashboard() {
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState({});
  
  useEffect(() => {
    async function fetchData() {
      const devicesData = await fetch('/api/v1/devices').then(r => r.json());
      setDevices(devicesData.data);
      
      const readingsData = await fetch('/api/v1/readings/latest').then(r => r.json());
      const readingsMap = readingsData.data.reduce((acc, reading) => {
        acc[reading.device_id] = reading;
        return acc;
      }, {});
      setReadings(readingsMap);
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="techtemp-dashboard">
      {devices.map(device => {
        const reading = readings[device.uid];
        return (
          <div key={device.uid} className="device-card">
            <h3>{device.label}</h3>
            <p>Room: {device.room.name}</p>
            {reading && (
              <div className="readings">
                <span>🌡️ {reading.temperature}°C</span>
                <span>💧 {reading.humidity}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 📚 **Additional Resources**

### **Documentation**
- **🏗️ [Architecture Guide](../CONTRIBUTOR/architecture.md)** - System design deep-dive
- **🔌 [Device API](../api/DEVICES.md)** - Legacy detailed API docs
- **📊 [Database Schema](../CONTRIBUTOR/database.md)** - Data model reference

### **Examples Repository**
- **📱 [Mobile Apps](../examples/mobile/)** - React Native, Flutter examples
- **🤖 [Automation Scripts](../examples/automation/)** - Python monitoring scripts
- **🏠 [Home Assistant](../examples/home-assistant/)** - Complete HA configuration
- **📊 [Dashboards](../examples/dashboards/)** - Grafana, custom web dashboards

### **Community**
- **💬 [Discussions](https://github.com/laurent987/techtemp/discussions)** - Ask questions, share projects
- **🐛 [Issues](https://github.com/laurent987/techtemp/issues)** - Bug reports, feature requests
- **📖 [Wiki](https://github.com/laurent987/techtemp/wiki)** - Community-maintained guides

---

**🚀 Ready to build?** Your TechTemp integration is ready to go! Check out the [examples repository](../examples/) for more inspiration and community projects.

**Questions?** Join our [GitHub Discussions](https://github.com/laurent987/techtemp/discussions) or check the [FAQ](faq.md).
