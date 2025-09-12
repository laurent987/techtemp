# 🤝 Contributing to TechTemp

This guide outlines the development workflow, coding standards, and contribution process for the TechTemp project.

## 🎯 Project Goals

TechTemp aims to be a **simple, reliable, and extensible** IoT platform for environmental monitoring. Our development principles:

- **Simplicity**: Easy to understand, deploy, and extend
- **Reliability**: Robust error handling and graceful degradation
- **Performance**: Efficient data processing and API responses
- **Developer Experience**: Clear APIs, good documentation, easy debugging

## 📋 Getting Started

### Prerequisites

1. **Development Environment**: Follow the [Setup Guide](SETUP.md)
2. **Understanding**: Read the [Architecture Guide](ARCHITECTURE.md)
3. **API Knowledge**: Familiarize yourself with the [API Documentation](api/README.md)

### First Contribution

1. **Pick a Good First Issue**: Look for issues labeled `good first issue` or `help wanted`
2. **Start Small**: Begin with documentation improvements or bug fixes
3. **Ask Questions**: Don't hesitate to ask for clarification in issues or discussions

## 🔄 Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/techtemp.git
cd techtemp

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/techtemp.git
```

### 2. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions:**
- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `test/test-improvement` - Test additions/improvements
- `refactor/code-cleanup` - Code refactoring
- `chore/maintenance-task` - Maintenance tasks

### 3. Make Your Changes

Follow the coding standards and best practices outlined below.

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Test specific functionality
npm test -- --testPathPattern=your-test-file.test.js

# Manual testing
npm run dev
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add device auto-discovery feature"
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(api): add device readings endpoint with pagination
fix(mqtt): handle broker reconnection gracefully  
docs(api): update device provisioning examples
test(devices): add integration tests for CRUD operations
refactor(db): extract repository pattern for better testing
```

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

## 📝 Coding Standards

### JavaScript Style Guide

We follow a relaxed but consistent JavaScript style:

**File Structure:**
```javascript
// 1. Node.js imports
const express = require('express');
const mqtt = require('mqtt');

// 2. Local imports
const { deviceRepository } = require('../db/repositories');
const { validateDeviceData } = require('../utils/validation');

// 3. Constants
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 1000;

// 4. Main code
class DeviceService {
  // Implementation
}

// 5. Exports
module.exports = DeviceService;
```

**Naming Conventions:**
- **Variables/Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.js`
- **Classes**: `PascalCase`

**Code Style:**
```javascript
// ✅ Good
const deviceData = await deviceRepository.findByUid(uid);
if (!deviceData) {
  return res.status(404).json({ error: 'Device not found' });
}

// ❌ Avoid
const data=await deviceRepository.findByUid(uid)
if(!data){
return res.status(404).json({error:'Device not found'})
}
```

### Error Handling

**Consistent Error Responses:**
```javascript
// ✅ Good - Consistent error format
return res.status(400).json({ 
  error: 'device_uid is required and must be a string' 
});

// ❌ Avoid - Inconsistent format
return res.status(400).send('Bad request');
```

**Async/Await Error Handling:**
```javascript
// ✅ Good
async function getDevice(req, res) {
  try {
    const device = await deviceRepository.findByUid(req.params.uid);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error getting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ❌ Avoid - Unhandled promise rejection
async function getDevice(req, res) {
  const device = await deviceRepository.findByUid(req.params.uid);
  res.json(device);
}
```

### Database Patterns

**Repository Pattern:**
```javascript
// ✅ Good - Repository handles business logic
class DeviceRepository {
  async create(deviceData) {
    // Validation
    this.validateDeviceData(deviceData);
    
    // Business logic
    const room = await this.findOrCreateRoom(deviceData.room_name);
    
    // Database operation
    return await dataAccess.createDevice({
      ...deviceData,
      room_id: room.id
    });
  }
}

// ❌ Avoid - API route handling database directly
app.post('/devices', async (req, res) => {
  const result = await db.run('INSERT INTO devices ...');
  res.json(result);
});
```

**SQL Best Practices:**
```javascript
// ✅ Good - Parameterized queries
const sql = `
  SELECT d.*, r.name as room_name 
  FROM devices d 
  LEFT JOIN rooms r ON d.room_id = r.id 
  WHERE d.uid = ?
`;
const device = await db.get(sql, [uid]);

// ❌ Avoid - String concatenation (SQL injection risk)
const sql = `SELECT * FROM devices WHERE uid = '${uid}'`;
```

### API Design

**RESTful Endpoints:**
```javascript
// ✅ Good - RESTful design
GET    /api/v1/devices           # List devices
POST   /api/v1/devices           # Create device
GET    /api/v1/devices/:uid      # Get device
PUT    /api/v1/devices/:uid      # Update device
DELETE /api/v1/devices/:uid      # Delete device

// ❌ Avoid - Non-RESTful design
GET    /api/v1/getDevices
POST   /api/v1/createDevice
POST   /api/v1/updateDevice
```

**Request Validation:**
```javascript
// ✅ Good - Validate early, fail fast
function validateDeviceCreation(req, res, next) {
  const { device_uid, room_name } = req.body;
  
  if (!device_uid || typeof device_uid !== 'string') {
    return res.status(400).json({ 
      error: 'device_uid is required and must be a string' 
    });
  }
  
  if (!room_name || typeof room_name !== 'string') {
    return res.status(400).json({ 
      error: 'room_name is required and must be a string' 
    });
  }
  
  next();
}
```

## 🧪 Testing Guidelines

### Test Structure

**File Organization:**
```
tests/
├── unit/
│   ├── repositories/
│   │   ├── devices.test.js
│   │   └── readings.test.js
│   ├── utils/
│   │   └── validation.test.js
├── integration/
│   ├── api/
│   │   ├── devices.test.js
│   │   └── health.test.js
│   └── mqtt/
│       └── message-processing.test.js
└── setup.js
```

### Unit Tests

**Testing Repositories:**
```javascript
// tests/unit/repositories/devices.test.js
const DeviceRepository = require('../../../src/db/repositories/devices');

describe('DeviceRepository', () => {
  let deviceRepo;
  
  beforeEach(() => {
    // Setup test database
    deviceRepo = new DeviceRepository(testDb);
  });
  
  describe('create', () => {
    it('should create device with room', async () => {
      const deviceData = {
        device_uid: 'test-device',
        room_name: 'Test Room',
        label: 'Test Device'
      };
      
      const device = await deviceRepo.create(deviceData);
      
      expect(device.uid).toBe('test-device');
      expect(device.room.name).toBe('Test Room');
    });
    
    it('should reject invalid device_uid', async () => {
      const deviceData = {
        device_uid: 123,  // Invalid type
        room_name: 'Test Room'
      };
      
      await expect(deviceRepo.create(deviceData))
        .rejects.toThrow('device_uid is required and must be a string');
    });
  });
});
```

### Integration Tests

**Testing API Endpoints:**
```javascript
// tests/integration/api/devices.test.js
const request = require('supertest');
const app = require('../../../src/http/server');

describe('Device API', () => {
  beforeEach(async () => {
    // Clean test database
    await testDb.exec('DELETE FROM devices');
    await testDb.exec('DELETE FROM rooms');
  });
  
  describe('POST /api/v1/devices', () => {
    it('should create new device', async () => {
      const deviceData = {
        device_uid: 'test-device',
        room_name: 'Test Room',
        label: 'Test Device'
      };
      
      const response = await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(201);
      
      expect(response.body.uid).toBe('test-device');
      expect(response.body.room.name).toBe('Test Room');
    });
    
    it('should return 400 for missing device_uid', async () => {
      const response = await request(app)
        .post('/api/v1/devices')
        .send({ room_name: 'Test Room' })
        .expect(400);
      
      expect(response.body.error).toContain('device_uid is required');
    });
  });
});
```

### MQTT Tests

**Testing Message Processing:**
```javascript
// tests/integration/mqtt/message-processing.test.js
const MqttHandler = require('../../../src/mqtt');

describe('MQTT Message Processing', () => {
  let mqttHandler;
  
  beforeEach(() => {
    mqttHandler = new MqttHandler({
      db: testDb,
      brokerUrl: 'mqtt://test-broker:1883'
    });
  });
  
  it('should process device data message', async () => {
    const message = {
      device_uid: 'test-sensor',
      temperature: 22.5,
      humidity: 45.2,
      timestamp: '2025-01-10T10:30:45.123Z'
    };
    
    await mqttHandler.processMessage(
      'devices/test-sensor/data', 
      JSON.stringify(message)
    );
    
    // Verify device was created
    const device = await testDb.get(
      'SELECT * FROM devices WHERE uid = ?', 
      ['test-sensor']
    );
    expect(device).toBeTruthy();
    
    // Verify reading was stored
    const reading = await testDb.get(
      'SELECT * FROM readings WHERE device_id = ?', 
      [device.id]
    );
    expect(reading.temperature).toBe(22.5);
  });
});
```

### Test Data Management

**Setup and Teardown:**
```javascript
// tests/setup.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let testDb;

beforeAll(async () => {
  // Create in-memory test database
  testDb = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });
  
  // Run migrations
  await runMigrations(testDb);
});

afterAll(async () => {
  await testDb.close();
});

// Make testDb available globally
global.testDb = testDb;
```

## 📖 Documentation Standards

### Code Documentation

**Function Documentation:**
```javascript
/**
 * Creates a new device and associates it with a room
 * @param {Object} deviceData - Device information
 * @param {string} deviceData.device_uid - Unique device identifier
 * @param {string} deviceData.room_name - Room name (creates if not exists)
 * @param {string} [deviceData.label] - Optional human-readable label
 * @returns {Promise<Object>} Created device with room information
 * @throws {Error} If device_uid already exists or validation fails
 */
async function createDevice(deviceData) {
  // Implementation
}
```

**API Documentation:**
- Update OpenAPI/Swagger specs when adding endpoints
- Include request/response examples
- Document error cases and status codes
- Provide curl examples for testing

### README Updates

When adding features that affect setup or usage:

1. **Update main README.md** with new capabilities
2. **Update API documentation** with new endpoints
3. **Add examples** showing how to use new features
4. **Update architecture docs** for significant changes

## 🚀 Performance Guidelines

### Database Performance

**Efficient Queries:**
```javascript
// ✅ Good - Use indexes effectively
const sql = `
  SELECT d.*, r.name as room_name 
  FROM devices d 
  LEFT JOIN rooms r ON d.room_id = r.id 
  WHERE d.uid = ?
`;

// ✅ Good - Limit results for large datasets
const sql = `
  SELECT * FROM readings 
  WHERE device_id = ? 
  ORDER BY timestamp DESC 
  LIMIT ?
`;

// ❌ Avoid - N+1 queries
for (const device of devices) {
  const readings = await getReadingsForDevice(device.id);
}
```

**Connection Management:**
```javascript
// ✅ Good - Reuse database connection
class Repository {
  constructor(db) {
    this.db = db;  // Shared connection
  }
}

// ❌ Avoid - Creating new connections
async function getDevice(uid) {
  const db = await openDatabase();  // New connection each time
  return db.get('SELECT * FROM devices WHERE uid = ?', [uid]);
}
```

### API Performance

**Response Optimization:**
```javascript
// ✅ Good - Pagination for large datasets
app.get('/api/v1/devices/:uid/readings', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 1000);
  const readings = await readingsRepo.findByDevice(req.params.uid, limit);
  res.json(readings);
});

// ✅ Good - Return only necessary data
const deviceFields = ['uid', 'label', 'is_active', 'created_at'];
const sql = `SELECT ${deviceFields.join(', ')} FROM devices`;
```

### Memory Management

**MQTT Message Processing:**
```javascript
// ✅ Good - Process messages efficiently
client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    await processMessage(topic, data);
  } catch (error) {
    console.error('Message processing error:', error);
    // Continue processing other messages
  }
});

// ❌ Avoid - Blocking event loop
client.on('message', (topic, message) => {
  // Synchronous processing blocks other messages
  const data = JSON.parse(message.toString());
  processMessageSync(topic, data);
});
```

## 🔧 Debugging Guidelines

### Logging Best Practices

**Structured Logging:**
```javascript
// ✅ Good - Structured logs with context
console.log('Device created', {
  device_uid: device.uid,
  room_name: room.name,
  timestamp: new Date().toISOString()
});

// ❌ Avoid - Unstructured logs
console.log(`Device ${device.uid} created in room ${room.name}`);
```

**Log Levels:**
```javascript
// Use appropriate log levels
console.error('Database connection failed', error);  // Errors
console.warn('High API usage detected', { rate });   // Warnings  
console.log('Device provisioned', { device_uid });   // Info
console.debug('Processing MQTT message', data);      // Debug
```

### Development Debugging

**VS Code Debug Configuration:**
```json
{
  "name": "Debug API Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "tests/integration/api"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**MQTT Message Debugging:**
```bash
# Monitor all MQTT traffic
mosquitto_sub -h localhost -p 1883 -t "#" -v

# Debug specific device
mosquitto_sub -h localhost -p 1883 -t "devices/aht20-f49c53/+" -v
```

## 🚨 Security Considerations

### Input Validation

**Always Validate User Input:**
```javascript
// ✅ Good - Validate and sanitize
function validateDeviceUid(uid) {
  if (!uid || typeof uid !== 'string') {
    throw new Error('device_uid is required and must be a string');
  }
  
  if (uid.length > 100) {
    throw new Error('device_uid must be less than 100 characters');
  }
  
  if (!/^[a-zA-Z0-9\-_]+$/.test(uid)) {
    throw new Error('device_uid contains invalid characters');
  }
  
  return uid;
}

// ❌ Avoid - Direct usage without validation
const device = await db.get('SELECT * FROM devices WHERE uid = ?', [req.params.uid]);
```

### SQL Injection Prevention

**Always Use Parameterized Queries:**
```javascript
// ✅ Good - Parameterized query
const sql = 'SELECT * FROM devices WHERE uid = ? AND room_id = ?';
const device = await db.get(sql, [uid, roomId]);

// ❌ Avoid - String concatenation
const sql = `SELECT * FROM devices WHERE uid = '${uid}'`;
```

## 📊 Code Review Process

### Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error conditions are handled gracefully
- [ ] No obvious performance issues

**Code Quality:**
- [ ] Code follows project style guidelines
- [ ] Functions are reasonably sized and focused
- [ ] Variable names are descriptive
- [ ] Comments explain why, not what

**Testing:**
- [ ] New features have tests
- [ ] Tests cover happy path and error cases
- [ ] Tests are clear and maintainable
- [ ] All tests pass

**Security:**
- [ ] User input is validated
- [ ] SQL queries are parameterized
- [ ] Sensitive data is not logged
- [ ] No hardcoded credentials

**Documentation:**
- [ ] API changes are documented
- [ ] Breaking changes are noted
- [ ] Examples are provided for new features

### Review Guidelines

**For Reviewers:**
- Be respectful and constructive
- Explain the "why" behind suggestions
- Ask questions if unclear about intent
- Approve when ready, request changes if needed

**For Authors:**
- Respond to all comments
- Ask for clarification if needed
- Make requested changes or explain why not
- Thank reviewers for their time

## 🎉 Recognition

### Contribution Types

We value all types of contributions:

- **Code**: New features, bug fixes, performance improvements
- **Documentation**: API docs, tutorials, examples
- **Testing**: Unit tests, integration tests, bug reports
- **Design**: UI/UX improvements, architecture proposals
- **Community**: Helping others, issue triage, discussions

### Contributor Recognition

- **README**: Contributors listed in main README
- **Releases**: Contributions highlighted in release notes
- **Issues**: Credit given when issues are resolved
- **Reviews**: Thanks for thoughtful code reviews

## 🔗 Resources

### Learning Resources

- **JavaScript**: [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- **Node.js**: [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **SQLite**: [SQLite Tutorial](https://www.sqlitetutorial.net/)
- **MQTT**: [MQTT Essentials](https://www.hivemq.com/mqtt-essentials/)
- **Testing**: [Jest Documentation](https://jestjs.io/docs/getting-started)

### Development Tools

- **VS Code Extensions**:
  - JavaScript (ES6) code snippets
  - REST Client
  - SQLite Viewer
  - Docker

- **Browser Tools**:
  - [Postman](https://www.postman.com/) for API testing
  - [MQTT Explorer](http://mqtt-explorer.com/) for MQTT debugging

### Getting Help

1. **Documentation**: Check existing docs first
2. **Search Issues**: Look for similar problems
3. **Ask Questions**: Create a discussion or issue
4. **Join Community**: Participate in project discussions

## 🔄 Release Process

### Version Numbers

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

Before releasing:
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Version number is bumped
- [ ] Changelog is updated

## 🤝 Code of Conduct

### Our Standards

**Positive Behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable Behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Instances of unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## 🎯 Quick Reference

**Common Commands:**
```bash
# Setup development environment
docker-compose up -d

# Run tests
npm test

# Check code style
npm run lint

# Start development server
npm run dev

# View logs
docker-compose logs -f backend
```

**Useful Links:**
- [Setup Guide](SETUP.md) - Development environment setup
- [Architecture](ARCHITECTURE.md) - System design overview
- [API Docs](api/README.md) - Complete API reference
- [Examples](api/EXAMPLES.md) - Working code samples

Thank you for contributing to TechTemp! 🚀
