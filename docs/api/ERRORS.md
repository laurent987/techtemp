# 🚨 Error Handling & Codes

This document provides comprehensive information about TechTemp API errors, status codes, and error handling best practices.

## 📋 HTTP Status Codes

The TechTemp API uses standard HTTP status codes to indicate the success or failure of requests.

### Success Codes

| Code | Name | Usage |
|------|------|-------|
| `200` | OK | Successful GET, PUT, DELETE requests |
| `201` | Created | Successful POST requests (resource created) |

### Client Error Codes

| Code | Name | When It Occurs |
|------|------|----------------|
| `400` | Bad Request | Invalid request data, missing required fields |
| `404` | Not Found | Requested resource doesn't exist |
| `409` | Conflict | Resource already exists (duplicate creation) |

### Server Error Codes

| Code | Name | When It Occurs |
|------|------|----------------|
| `500` | Internal Server Error | Server-side error, database issues |

## 🏗️ Error Response Format

All error responses follow a consistent JSON format:

```json
{
  "error": "Human-readable error message"
}
```

### Examples

**400 Bad Request:**
```json
{
  "error": "device_uid is required and must be a string"
}
```

**404 Not Found:**
```json
{
  "error": "Device not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## 📱 Device API Errors

### POST /api/v1/devices (Device Provisioning)

#### 400 Bad Request Errors

**Missing device_uid:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"label": "Test Device"}'
```
```json
{
  "error": "device_uid is required and must be a string"
}
```

**Missing room_name:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "test-123"}'
```
```json
{
  "error": "room_name is required and must be a string"
}
```

**Invalid data types:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": 123, "room_name": "Kitchen"}'
```
```json
{
  "error": "device_uid is required and must be a string"
}
```

#### 409 Conflict Errors

**Device already exists:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "aht20-f49c53",
    "room_name": "Kitchen"
  }'
```
```json
{
  "error": "Device already exists",
  "device_uid": "aht20-f49c53"
}
```

### GET /api/v1/devices/:uid

#### 404 Not Found Errors

**Device doesn't exist:**
```bash
curl http://localhost:3000/api/v1/devices/nonexistent-device
```
```json
{
  "error": "Device not found"
}
```

### PUT /api/v1/devices/:uid (Device Update)

#### 400 Bad Request Errors

**Invalid label type:**
```bash
curl -X PUT http://localhost:3000/api/v1/devices/aht20-f49c53 \
  -H "Content-Type: application/json" \
  -d '{"label": 123}'
```
```json
{
  "error": "label must be a string if provided"
}
```

**Invalid room_name type:**
```bash
curl -X PUT http://localhost:3000/api/v1/devices/aht20-f49c53 \
  -H "Content-Type: application/json" \
  -d '{"room_name": null}'
```
```json
{
  "error": "room_name must be a string"
}
```

#### 404 Not Found Errors

**Device doesn't exist:**
```bash
curl -X PUT http://localhost:3000/api/v1/devices/nonexistent \
  -H "Content-Type: application/json" \
  -d '{"label": "New Label"}'
```
```json
{
  "error": "Device not found"
}
```

### DELETE /api/v1/devices/:uid

#### 404 Not Found Errors

**Device doesn't exist:**
```bash
curl -X DELETE http://localhost:3000/api/v1/devices/nonexistent
```
```json
{
  "error": "Device not found"
}
```

## 📊 Readings API Errors

### GET /api/v1/devices/:uid/readings

#### 400 Bad Request Errors

**Invalid limit parameter:**
```bash
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=2000"
```
```json
{
  "error": "Limit must be between 1 and 1000"
}
```

**Invalid limit type:**
```bash
curl "http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=abc"
```
```json
{
  "error": "Limit must be between 1 and 1000"
}
```

#### 404 Not Found Errors

**Device doesn't exist:**
```bash
curl "http://localhost:3000/api/v1/devices/nonexistent/readings"
```
```json
{
  "error": "Device not found"
}
```

## 🏥 Health API Errors

### GET /health

#### 500 Internal Server Error

**Database connection failed:**
```bash
curl http://localhost:3000/health
```
```json
{
  "status": "failed"
}
```

## 🛠️ Repository Configuration Errors

### 500 Internal Server Error

**Repository not configured:**
```json
{
  "error": "Repository not configured"
}
```

This occurs when the API routes cannot access the database repository, usually indicating a server configuration problem.

## 📡 Network and Transport Errors

These errors occur at the HTTP transport level, not in the API response:

### Connection Errors

**Service unavailable (no response):**
```bash
curl: (7) Failed to connect to localhost port 3000: Connection refused
```

**Timeout:**
```bash
curl: (28) Operation timed out after 30000 milliseconds
```

### Invalid Content-Type

**Missing Content-Type header for POST/PUT:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -d '{"device_uid": "test"}'
```
Returns HTML error page instead of JSON.

**Solution:** Always include `Content-Type: application/json` header:
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "test", "room_name": "Test Room"}'
```

## 🔧 Error Handling Best Practices

### 1. Always Check Status Codes

**JavaScript:**
```javascript
async function safeApiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${errorData.error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
```

**Python:**
```python
import requests

def safe_api_call(url, **kwargs):
    try:
        response = requests.request(**kwargs, url=url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        try:
            error_data = response.json()
            error_msg = error_data.get('error', 'Unknown error')
        except:
            error_msg = response.text or str(e)
        raise Exception(f"HTTP {response.status_code}: {error_msg}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")
```

### 2. Implement Retry Logic

**With Exponential Backoff:**
```javascript
async function retryApiCall(apiCall, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      // Don't retry client errors (4xx)
      if (error.message.includes('400') || error.message.includes('404') || error.message.includes('409')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Validate Data Before Sending

**Device Provisioning Validation:**
```javascript
function validateDeviceData(deviceData) {
  const errors = [];
  
  if (!deviceData.device_uid || typeof deviceData.device_uid !== 'string') {
    errors.push('device_uid is required and must be a string');
  }
  
  if (!deviceData.room_name || typeof deviceData.room_name !== 'string') {
    errors.push('room_name is required and must be a string');
  }
  
  if (deviceData.label && typeof deviceData.label !== 'string') {
    errors.push('label must be a string if provided');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

// Usage
try {
  validateDeviceData({
    device_uid: 'aht20-test',
    room_name: 'Test Room',
    label: 'Test Device'
  });
  
  // Proceed with API call
} catch (error) {
  console.error('Validation error:', error.message);
}
```

### 4. Handle Specific Error Cases

**Device Management Example:**
```javascript
async function updateDeviceWithFallback(uid, updateData) {
  try {
    return await client.updateDevice(uid, updateData);
  } catch (error) {
    if (error.message.includes('Device not found')) {
      console.log(`Device ${uid} not found, provisioning new device...`);
      
      // Fallback: provision new device
      return await client.provisionDevice({
        device_uid: uid,
        ...updateData
      });
    } else if (error.message.includes('must be a string')) {
      console.error('Invalid data format:', error.message);
      throw new Error('Please check your data types');
    } else {
      throw error; // Re-throw unexpected errors
    }
  }
}
```

### 5. Log Errors Properly

**Structured Error Logging:**
```javascript
function logApiError(operation, error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    error: error.message,
    context,
    stack: error.stack
  };
  
  console.error('API Error:', JSON.stringify(logEntry, null, 2));
  
  // Send to monitoring service in production
  // monitoring.reportError(logEntry);
}

// Usage
try {
  await client.getDevice('invalid-uid');
} catch (error) {
  logApiError('getDevice', error, { deviceUid: 'invalid-uid' });
}
```

## 🔄 Graceful Degradation

When API calls fail, implement graceful degradation:

```javascript
class RobustTechTempClient {
  constructor(baseUrl) {
    this.client = new TechTempClient(baseUrl);
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  async getDeviceWithFallback(uid) {
    try {
      const device = await this.client.getDevice(uid);
      this.cache.set(`device:${uid}`, { data: device, timestamp: Date.now() });
      return device;
    } catch (error) {
      // Try cache fallback
      const cached = this.cache.get(`device:${uid}`);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.warn(`Using cached data for device ${uid} due to API error`);
        return cached.data;
      }
      
      throw error;
    }
  }

  async getReadingsWithFallback(uid, limit = 10) {
    try {
      return await this.client.getDeviceReadings(uid, limit);
    } catch (error) {
      if (error.message.includes('Device not found')) {
        return []; // Return empty array instead of failing
      }
      
      throw error;
    }
  }
}
```

## 📞 Debugging and Support

### Debug Information to Collect

When reporting errors, include:

1. **Request Details:**
   - HTTP method and URL
   - Request headers
   - Request body (if applicable)

2. **Response Details:**
   - HTTP status code
   - Response headers
   - Response body

3. **Environment:**
   - API version
   - Client library/version
   - Operating system
   - Network configuration

### Example Debug Output

```bash
# Debug request
curl -v -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "debug-test", "room_name": "Debug Room"}'

# Output includes:
# > POST /api/v1/devices HTTP/1.1
# > Host: localhost:3000
# > Content-Type: application/json
# > Content-Length: 52
# > 
# < HTTP/1.1 201 Created
# < Content-Type: application/json; charset=utf-8
# < Content-Length: 123
```

For persistent issues, check:
- API server logs
- Network connectivity
- Database status
- MQTT broker status (for device-related issues)

## 🔗 Related Documentation

- **[📱 Devices API](DEVICES.md)** - Device endpoint details
- **[📊 Readings API](READINGS.md)** - Readings endpoint details
- **[📖 Examples](EXAMPLES.md)** - Working code examples
- **[🏥 Health Monitoring](../deployment/MONITORING.md)** - System health (future)
