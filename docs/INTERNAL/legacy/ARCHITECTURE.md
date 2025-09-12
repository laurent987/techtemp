# 🏗️ Architecture & Configuration

This document describes the TechTemp system architecture, data flow, and configuration details.

## 📐 System Overview

TechTemp is a distributed IoT system consisting of multiple components working together to collect, store, and serve sensor data.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   IoT Devices   │───▶│   MQTT Broker    │───▶│   Service App   │
│  (Sensors)      │    │  (Eclipse        │    │   (Node.js)     │
│                 │    │   Mosquitto)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                               ┌─────────▼─────────┐
┌─────────────────┐    ┌──────────────────┐    │                 │
│                 │    │                  │    │   SQLite        │
│   Web UI        │◀───│   REST API       │◀───│   Database      │
│  (React/Vue)    │    │  (HTTP Server)   │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 Data Flow

### 1. Sensor Data Collection

1. **IoT Devices** continuously collect environmental data (temperature, humidity, etc.)
2. **MQTT Publishing**: Devices publish data to specific topics on the MQTT broker
3. **Topic Format**: `devices/{device_uid}/data`
4. **Message Format**: JSON with timestamp and sensor readings

```json
{
  "device_uid": "aht20-f49c53",
  "timestamp": "2025-01-10T10:30:45.123Z",
  "temperature": 22.5,
  "humidity": 45.2
}
```

### 2. Data Processing

1. **MQTT Subscription**: Service app subscribes to `devices/+/data`
2. **Data Validation**: Incoming messages are validated and parsed
3. **Device Auto-Discovery**: New devices are automatically added to the database
4. **Data Storage**: Validated readings are stored in SQLite database

### 3. Data Access

1. **REST API**: HTTP endpoints provide access to stored data
2. **Real-time Queries**: API can retrieve latest readings or historical data
3. **Web Interface**: Frontend applications consume the REST API
4. **External Integration**: Third-party systems can integrate via the API

## 🏢 Service Architecture

### Core Components

#### 1. MQTT Subscriber (`/backend/mqtt`)

**Purpose**: Handles real-time data ingestion from IoT devices

**Responsibilities**:
- Connect to MQTT broker
- Subscribe to device data topics
- Parse and validate incoming messages
- Store readings in database
- Handle device auto-provisioning

**Key Features**:
- Automatic reconnection on connection loss
- Message validation and error handling
- Device lifecycle management
- Concurrent message processing

#### 2. HTTP API Server (`/backend/http/`)

**Purpose**: Provides REST API for data access and device management

**Structure**:
```
src/http/
├── server.js          # Express.js server setup
├── routes/
│   ├── devices.js     # Device CRUD operations
│   ├── health.js      # Health check endpoint
│   └── index.js       # Route registration
└── middleware/        # Custom middleware (future)
```

**Responsibilities**:
- Handle HTTP requests/responses
- Validate request data
- Interact with business logic layer
- Return JSON responses
- Handle errors gracefully

#### 3. Database Layer (`/backend/db/`)

**Purpose**: Data persistence and retrieval

**Structure**:
```
src/db/
├── database.js        # Database connection and setup
├── migrations.js      # Schema migrations
├── dataAccess.js      # Raw SQL queries
└── repositories/      # Business logic layer
    ├── index.js       # Repository exports
    ├── devices.js     # Device operations
    └── readings.js    # Readings operations
```

**Architecture Pattern**: Repository Pattern
- **DataAccess Layer**: Raw SQL queries
- **Repository Layer**: Business logic and validation
- **API Layer**: HTTP interface

## 🗄️ Database Schema

### Tables

#### `rooms`
```sql
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,      -- Public identifier
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `devices`
```sql
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,      -- Device unique identifier
    label TEXT,                    -- Human-readable name
    room_id INTEGER,               -- Foreign key to rooms
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
);
```

#### `readings`
```sql
CREATE TABLE readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,    -- Foreign key to devices
    temperature REAL,
    humidity REAL,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices (id)
);
```

### Indexes

```sql
-- Performance optimization for readings queries
CREATE INDEX idx_readings_device_timestamp ON readings (device_id, timestamp DESC);
CREATE INDEX idx_readings_timestamp ON readings (timestamp DESC);

-- Device lookups by UID
CREATE INDEX idx_devices_uid ON devices (uid);
CREATE INDEX idx_rooms_uid ON rooms (uid);
```

## 🚀 Deployment Architecture

### Docker Composition

The system runs as multiple Docker containers orchestrated by Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MQTT_BROKER_URL=mqtt://mqtt:1883
      - PORT=3000
    depends_on:
      - mqtt
    volumes:
      - ./backend/db:/app/db  # SQLite persistence

  mqtt:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./backend/mqtt-config:/mosquitto/config
```

### Container Details

#### Service App Container

**Base Image**: `node:18-alpine`

**Environment Variables**:
- `MQTT_BROKER_URL`: MQTT broker connection string
- `PORT`: HTTP server port (default: 3000)
- `DB_PATH`: SQLite database file path
- `NODE_ENV`: Environment (development/production)

**Volumes**:
- `/app/db`: SQLite database persistence
- `/app/logs`: Application logs (future)

**Health Check**: HTTP GET `/health`

#### MQTT Broker Container

**Image**: `eclipse-mosquitto:2`

**Ports**:
- `1883`: MQTT protocol
- `9001`: WebSocket interface (future web clients)

**Configuration**: Basic setup, no authentication (suitable for local development)

## 🔧 Configuration Management

### Environment Configuration

```bash
# .env file (development)
MQTT_BROKER_URL=mqtt://localhost:1883
PORT=3000
DB_PATH=/app/db/techtemp.db
NODE_ENV=development
LOG_LEVEL=info
```

### MQTT Configuration

```ini
# mqtt-config/mosquitto.conf
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
```

### Database Configuration

**Connection Settings**:
```javascript
// src/db/database.js
const dbConfig = {
  filename: process.env.DB_PATH || '/app/db/techtemp.db',
  driver: sqlite3.Database,
  options: {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
  }
};
```

**Migration Strategy**:
```javascript
// Automatic migrations on startup
const migrations = [
  { version: 1, description: 'Initial schema', sql: '...' },
  { version: 2, description: 'Add UIDs', sql: '...' },
  { version: 3, description: 'Add indexes', sql: '...' }
];
```

## 📡 API Design Principles

### RESTful Design

- **Resources**: Devices, Readings, Rooms
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: Standard HTTP codes (200, 201, 400, 404, 500)
- **Content Type**: `application/json`

### Public vs Private Identifiers

**Public UIDs**: Exposed in API, used by external clients
```json
{
  "uid": "aht20-f49c53",    // Public, stable identifier
  "label": "Kitchen Sensor"
}
```

**Private IDs**: Internal database keys, never exposed
```sql
SELECT * FROM devices WHERE id = 42;  -- Internal use only
```

### API Versioning

**URL Versioning**: `/api/v1/devices`
- Clear version identification
- Backward compatibility support
- Easy migration path for clients

### Pagination Strategy

**Limit-based**: Simple offset pagination
```
GET /api/v1/devices/aht20-f49c53/readings?limit=100
```

**Future**: Cursor-based pagination for large datasets
```
GET /api/v1/devices/aht20-f49c53/readings?cursor=2025-01-10T10:30:45Z&limit=100
```

## 🔐 Security Considerations

### Current Security Posture

**Development Environment**: 
- No authentication required
- Open MQTT broker
- Local network only

**Production Readiness Gaps**:
- API authentication needed
- MQTT broker security required
- Input validation hardening
- Rate limiting implementation

### Future Security Enhancements

1. **API Authentication**:
   ```javascript
   // JWT-based authentication
   app.use('/api', authenticateToken);
   ```

2. **MQTT Security**:
   ```ini
   # mosquitto.conf
   allow_anonymous false
   password_file /etc/mosquitto/passwd
   ```

3. **Input Validation**:
   ```javascript
   // Schema validation with Joi or similar
   const deviceSchema = Joi.object({
     device_uid: Joi.string().alphanum().required(),
     room_name: Joi.string().max(100).required()
   });
   ```

## 🔄 Scalability Considerations

### Current Limits

- **SQLite**: Single-node, suitable for moderate data volumes
- **MQTT**: Single broker, handles hundreds of devices
- **Node.js**: Single-threaded, but with async I/O

### Scaling Strategies

#### Horizontal Scaling

1. **Database Migration**: SQLite → PostgreSQL/MySQL
2. **MQTT Clustering**: Multiple broker instances
3. **Service Scaling**: Multiple API instances behind load balancer

#### Performance Optimization

1. **Database**:
   - Connection pooling
   - Query optimization
   - Read replicas

2. **API**:
   - Response caching
   - Compression middleware
   - CDN for static assets

3. **MQTT**:
   - Message persistence
   - QoS optimization
   - Topic partitioning

## 📊 Monitoring and Observability

### Health Monitoring

**Endpoint**: `GET /health`
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T10:30:45.123Z",
  "uptime": 3600,
  "database": "connected",
  "mqtt": "connected"
}
```

### Metrics Collection (Future)

**Key Metrics**:
- Request rate and latency
- Database query performance
- MQTT message throughput
- Device connectivity status
- Error rates and types

**Tools**:
- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for notifications

### Logging Strategy

**Current**: Console logging with timestamps
**Future**: Structured logging with levels
```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' }),
    new winston.transports.Console()
  ]
});
```

## 🔗 Integration Patterns

### Device Integration

**MQTT Client Libraries**:
- Python: `paho-mqtt`
- JavaScript: `mqtt.js`
- C++: `mosquitto` library
- Arduino: `PubSubClient`

**Message Publishing**:
```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("mqtt-broker", 1883, 60)

message = {
    "device_uid": "aht20-sensor-01",
    "timestamp": "2025-01-10T10:30:45.123Z",
    "temperature": 22.5,
    "humidity": 45.2
}

client.publish("devices/aht20-sensor-01/data", json.dumps(message))
```

### External System Integration

**Webhook Pattern** (Future):
```javascript
// Notify external systems of new readings
const webhooks = [
  'https://external-system.com/api/sensor-data',
  'https://dashboard.example.com/webhooks/devices'
];

// Send notifications for each new reading
```

**Pull Pattern** (Current):
```javascript
// External systems poll the API
const response = await fetch('/api/v1/devices/aht20-f49c53/readings?limit=1');
const latestReading = await response.json();
```

## 🧪 Testing Architecture

### Unit Testing

**Framework**: Jest
**Coverage**: Database access, business logic, utilities
```javascript
describe('Device Repository', () => {
  test('should create device with room', async () => {
    const device = await deviceRepo.create({
      device_uid: 'test-device',
      room_name: 'Test Room'
    });
    expect(device.uid).toBe('test-device');
  });
});
```

### Integration Testing

**API Testing**: Supertest with test database
```javascript
describe('Device API', () => {
  test('GET /api/v1/devices', async () => {
    const response = await request(app)
      .get('/api/v1/devices')
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### MQTT Testing

**Message Testing**: In-memory MQTT broker for tests
```javascript
describe('MQTT Handler', () => {
  test('should process device message', async () => {
    const message = {
      device_uid: 'test-device',
      temperature: 22.5
    };
    await mqttHandler.processMessage('devices/test-device/data', message);
    // Verify database state
  });
});
```

## 🔄 Development Workflow

### Local Development

1. **Setup**: `docker-compose up`
2. **Development**: Edit code, auto-restart with nodemon
3. **Testing**: `npm test` for unit tests
4. **Debugging**: Node.js debugger or VS Code integration

### Code Organization

```
backend/
├── src/                 # Source code
│   ├── mqtt.js         # MQTT subscriber
│   ├── http/           # HTTP API
│   ├── db/             # Database layer
│   └── utils/          # Utilities
├── tests/              # Test files
├── docker/             # Docker configuration
├── docs/               # Documentation
└── package.json        # Dependencies
```

### Dependency Management

**Core Dependencies**:
- `express`: HTTP server
- `mqtt`: MQTT client
- `sqlite3`: Database driver
- `uuid`: UID generation

**Development Dependencies**:
- `jest`: Testing framework
- `nodemon`: Auto-restart
- `eslint`: Code linting

## 🔗 Related Documentation

- **[🚀 Setup Guide](SETUP.md)** - Development environment setup
- **[📚 API Reference](api/README.md)** - Complete API documentation
- **[🏥 Monitoring](MONITORING.md)** - Production monitoring setup
- **[🤝 Contributing](CONTRIBUTING.md)** - Development guidelines
