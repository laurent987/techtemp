# 🏗️ TechTemp for Contributors

> **Contribute to the TechTemp IoT platform** - Development setup, architecture deep-dive, coding standards, and release process.

![Contributors](../assets/contributors.png)

---

## 🎯 **Welcome, Contributor!**

Thank you for your interest in contributing to TechTemp! This guide will get you:

✅ **Development environment** setup and running (20 minutes)  
✅ **Architecture understanding** of the system design  
✅ **Coding standards** and best practices  
✅ **Testing guidelines** and quality gates  
✅ **Release process** and deployment pipeline  

## 🚀 **Quick Development Setup**

### **Prerequisites**

- **Node.js 18+** - Runtime for backend services
- **Docker & Docker Compose** - For MQTT broker and deployment
- **Git** - Version control
- **Code Editor** - VS Code recommended with ESLint extension

### **Step 1: Clone and Setup** (5 minutes)

```bash
# Clone the repository
git clone https://github.com/laurent987/techtemp.git
cd techtemp

# Install dependencies
cd backend
npm install

# Setup development environment
cp .env.example .env
# Edit .env with your local settings
```

### **Step 2: Start Dependencies** (3 minutes)

```bash
# Start MQTT broker
docker compose up mqtt -d

# Verify MQTT is running
docker compose ps
# Should show mosquitto container running on port 1883
```

### **Step 3: Run Tests** (2 minutes)

```bash
# Run the full test suite
npm test

# Expected: All 175 tests passing ✅
```

### **Step 4: Start Development Server** (2 minutes)

```bash
# Start in development mode (auto-reload)
npm run dev

# Or start normally
npm start

# Verify server is running
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### **Step 5: Access Development Tools** (3 minutes)

```bash
# Development dashboard
open http://localhost:3000

# Database inspection
./scripts/db-overview.sh

# View logs
npm run logs
```

**✅ You're ready to develop!** The system is running locally with:
- 🖥️ **Backend API** on `http://localhost:3000`
- 🦟 **MQTT Broker** on `localhost:1883`
- 📊 **Database** at `backend/db/techtemp.db`
- 🌐 **Web Dashboard** at `http://localhost:3000`

---

## 🏗️ **Architecture Deep Dive**

### **System Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        TechTemp Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📡 IoT Devices          🖥️ Backend Services         🌐 Clients │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌───────────┐ │
│  │ Raspberry Pi    │    │   HTTP Server       │    │ Web UI    │ │
│  │ + AHT20 Sensor  │───▶│   ┌─────────────┐   │◀───│ Dashboard │ │
│  │                 │    │   │ REST API    │   │    │           │ │
│  │ C Device Code   │    │   │ /api/v1/*   │   │    └───────────┘ │
│  └─────────────────┘    │   └─────────────┘   │                  │
│                         │                     │    ┌───────────┐ │
│  📤 MQTT Messages       │   ┌─────────────┐   │    │ External  │ │
│                         │   │ MQTT Client │   │◀───│ Apps      │ │
│          │              │   │ Subscriber  │   │    │ (HA, etc) │ │
│          │              │   └─────────────┘   │    └───────────┘ │
│          ▼              │            │        │                  │
│  ┌─────────────────┐    │   ┌────────▼────┐   │                  │
│  │ MQTT Broker     │◀───┼───│ Ingestion   │   │                  │
│  │ (Mosquitto)     │    │   │ Pipeline    │   │                  │
│  └─────────────────┘    │   └─────────────┘   │                  │
│                         │            │        │                  │
│                         │   ┌────────▼────┐   │                  │
│                         │   │ Repository  │   │                  │
│                         │   │ Layer       │   │                  │
│                         │   └─────────────┘   │                  │
│                         │            │        │                  │
│                         │   ┌────────▼────┐   │                  │
│                         │   │ Database    │   │                  │
│                         │   │ (SQLite)    │   │                  │
│                         │   └─────────────┘   │                  │
│                         └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Backend Layer Architecture**

```
backend/
├── 🚪 main.js                   # Application entry point & orchestration
├── ⚙️ config.js                # Environment configuration & validation
├── 📝 logger.js                # Centralized logging system
│
├── 🌐 http/                    # HTTP Server & REST API
│   ├── server.js               # Express server setup
│   └── routes/                 # API endpoint definitions
│       ├── health.js           # Health checks
│       ├── devices.js          # Device management
│       └── readings.js         # Sensor data retrieval
│
├── 🦟 mqtt/                    # MQTT Client & Message Handling
│   └── client.js              # MQTT connection & subscription
│
├── 📊 db/                      # Database Layer
│   ├── index.js               # Database connection & initialization
│   └── dataAccess.js          # SQL queries & data operations
│
├── 🏪 repositories/            # Business Logic Layer
│   └── index.js               # Repository pattern implementation
│
└── 🔄 ingestion/               # Data Processing Pipeline
    ├── index.js               # Main ingestion orchestrator
    ├── ingestMessage.js       # MQTT message processing
    ├── parseTopic.js          # Topic parsing & validation
    └── validateReading.js     # Sensor data validation
```

### **Data Flow**

1. **📡 Device Sends Data** → C code reads AHT20, publishes to MQTT
2. **🦟 MQTT Reception** → Backend subscribes to device topics
3. **🔄 Ingestion Pipeline** → Parse topic, validate data, extract device info
4. **🏪 Repository Layer** → Business logic, device lookups, data transformation
5. **📊 Database Layer** → Store readings, update device last_seen
6. **🌐 API Layer** → Serve data via REST endpoints
7. **📱 Clients** → Web dashboard, external apps consume API

### **Key Design Patterns**

#### **Repository Pattern**
- **Purpose:** Separate business logic from data access
- **Benefits:** Testable, swappable data sources, clean interfaces
- **Location:** `backend/repositories/index.js`

```javascript
// Clean business interface
const devices = await repo.devices.findAll();
const readings = await repo.readings.getLatestByDevice(uid);

// Hides complex SQL joins and data transformation
```

#### **Configuration Management**
- **Purpose:** Environment-based configuration with validation
- **Benefits:** Fail-fast on misconfiguration, clear env var documentation
- **Location:** `backend/config.js`

```javascript
// Validated configuration with clear error messages
const config = {
  db: { path: process.env.DB_PATH },     // Required
  mqtt: { url: process.env.MQTT_URL },   // Validated URL format
  http: { port: process.env.HTTP_PORT }  // Validated port number
};
```

#### **Ingestion Pipeline**
- **Purpose:** Reliable message processing with validation
- **Benefits:** Data quality, error handling, device management
- **Location:** `backend/ingestion/`

```javascript
// Multi-stage processing pipeline
MQTT Message → Parse Topic → Validate Data → Process Reading → Store
              ↓            ↓              ↓               ↓
           Device ID    Sensor Values   Device Lookup   Database
```

---

## 🧪 **Testing Strategy**

### **Test Structure**

```
test/
├── 🔧 config.test.js              # Configuration validation
├── 📊 dataAccess.test.js          # Database operations
├── 🏪 repositories.test.js        # Business logic layer
├── 🌐 http/                       # API endpoint tests
│   ├── health.test.js             # Health check endpoints
│   ├── devices.test.js            # Device management API
│   ├── readings.test.js           # Readings API
│   └── server.test.js             # Server setup & middleware
├── 🦟 mqtt.client.test.js         # MQTT client functionality
├── 🔄 ingestion/                  # Data processing tests
│   ├── ingestMessage.test.js      # Message processing
│   ├── parseTopic.test.js         # Topic parsing logic
│   └── validateReading.test.js    # Data validation
└── 🏗️ integration/                # End-to-end tests
    ├── http-api.test.js           # Full API workflows
    └── mqtt-to-db.test.js         # MQTT to database pipeline
```

### **Testing Principles**

#### **Unit Tests** (Fast, Isolated)
- **Scope:** Individual functions and methods
- **Mocking:** External dependencies (database, MQTT, HTTP)
- **Focus:** Business logic, data transformation, validation

```javascript
// Example unit test
describe('validateReading', () => {
  test('should reject temperature outside valid range', () => {
    const reading = { temperature: 150, humidity: 50 };
    expect(() => validateReading(reading)).toThrow('Temperature out of range');
  });
});
```

#### **Integration Tests** (Medium, Real Dependencies)
- **Scope:** Multiple components working together
- **Real:** Database, MQTT broker (test instances)
- **Focus:** Data flow, API contracts, error handling

```javascript
// Example integration test
describe('MQTT to Database Pipeline', () => {
  test('should process MQTT message and store in database', async () => {
    // Send MQTT message
    await mqttClient.publish('devices/test-sensor/data', JSON.stringify(sensorData));
    
    // Verify stored in database
    await waitFor(() => expect(db.getReadings('test-sensor')).toHaveLength(1));
  });
});
```

#### **End-to-End Tests** (Slow, Full System)
- **Scope:** Complete user workflows
- **Real:** All components, production-like environment
- **Focus:** User scenarios, performance, deployment

### **Quality Gates**

Before any PR is merged:

✅ **All tests passing** (175 tests, ~2 seconds)  
✅ **Code coverage ≥ 90%** for critical paths  
✅ **No ESLint errors** or warnings  
✅ **No security vulnerabilities** in dependencies  
✅ **Performance benchmarks** maintained  

### **Running Tests**

```bash
# Run all tests
npm test

# Run specific test files
npm test -- devices.test.js
npm test -- --testPathPattern=ingestion

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run performance tests
npm run test:performance
```

---

## 📐 **Coding Standards**

### **JavaScript/Node.js Style**

#### **ESLint Configuration**
We use a strict ESLint configuration based on:
- **Airbnb base** - Industry standard JavaScript style
- **Prettier integration** - Automatic formatting
- **Jest rules** - Testing-specific linting

```json
// .eslintrc.json
{
  "extends": ["airbnb-base", "prettier"],
  "plugins": ["jest"],
  "rules": {
    "no-console": "warn",           // Prefer logger over console
    "prefer-const": "error",        // Immutability by default
    "no-unused-vars": "error",      // Clean code
    "jest/expect-expect": "error"   // Ensure tests have assertions
  }
}
```

#### **Code Structure**

**File Organization:**
```javascript
/**
 * @file filename.js - Brief description of purpose
 */

// External imports first
import express from 'express';
import { Router } from 'express';

// Internal imports second  
import { validateReading } from '../validation/index.js';
import { logger } from '../logger.js';

// Constants and types
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 1000;

/**
 * @typedef {Object} Reading
 * @property {string} ts - ISO timestamp
 * @property {number} temperature - Temperature in Celsius
 * @property {number} humidity - Humidity percentage
 */

// Main implementation
export function createSomething(deps) {
  // Implementation here
}
```

**Function Documentation:**
```javascript
/**
 * Process an MQTT message containing sensor readings
 * @param {string} topic - MQTT topic (e.g., "devices/sensor-123/data")
 * @param {Object} message - Parsed JSON message
 * @param {string} message.device_uid - Device identifier
 * @param {number} message.temperature - Temperature reading
 * @param {number} message.humidity - Humidity reading
 * @param {Object} deps - Dependencies
 * @param {import('../repositories/index.js').Repository} deps.repo
 * @returns {Promise<{success: boolean, reading?: Object}>}
 * @throws {Error} When device not found or data invalid
 */
async function processMessage(topic, message, deps) {
  // Implementation
}
```

#### **Error Handling**

**Consistent Error Patterns:**
```javascript
// API endpoints
try {
  const result = await businessLogic();
  res.status(200).json({ data: result });
} catch (error) {
  logger.error('Operation failed', { error: error.message, context });
  res.status(500).json({ error: 'Internal server error' });
}

// Business logic
if (!deviceUid) {
  throw new Error('Device UID is required');
}

// Validation
if (temperature < -50 || temperature > 100) {
  throw new Error('Temperature must be between -50°C and 100°C');
}
```

### **Database Standards**

#### **SQL Style**
```sql
-- Use uppercase for SQL keywords
-- Use snake_case for table/column names
-- Include comments for complex queries

SELECT 
  d.uid,
  d.label,
  r.name as room_name,
  latest.ts as last_reading_time
FROM devices d
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN (
  -- Get latest reading per device
  SELECT device_id, MAX(ts) as ts
  FROM readings_raw
  GROUP BY device_id
) latest ON d.id = latest.device_id
WHERE d.active = 1
ORDER BY d.created_at DESC;
```

#### **Migration Pattern**
```javascript
// migrations/20250312_add_device_status.js
export async function up(db) {
  db.exec(`
    ALTER TABLE devices 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'maintenance'))
  `);
}

export async function down(db) {
  // Rollback logic
  db.exec(`ALTER TABLE devices DROP COLUMN status`);
}
```

### **API Standards**

#### **REST Conventions**
- **Resource-based URLs:** `/api/v1/devices`, `/api/v1/readings`
- **HTTP methods:** GET (read), POST (create), PUT (update), DELETE (remove)
- **Status codes:** 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Error)
- **Consistent response format:** `{"data": {...}}` or `{"error": "message"}`

#### **Validation Patterns**
```javascript
// Input validation
const { device_uid, room_name, label } = req.body;

if (!device_uid || typeof device_uid !== 'string') {
  return res.status(400).json({
    error: 'device_uid is required and must be a string'
  });
}

if (label && typeof label !== 'string') {
  return res.status(400).json({
    error: 'label must be a string if provided'
  });
}
```

---

## 🔄 **Development Workflow**

### **Branch Strategy**

```
main              ←── Production releases (protected)
  ↑
develop           ←── Integration branch (protected)
  ↑
feature/xyz       ←── Feature development
hotfix/urgent     ←── Critical production fixes
```

**Branch Naming:**
- `feature/point-4-interface-web` - New features
- `bugfix/api-error-handling` - Bug fixes
- `hotfix/security-patch` - Critical fixes
- `docs/api-restructure` - Documentation updates

### **Commit Standards**

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description
feat(api): add device readings endpoint
fix(mqtt): handle connection timeouts gracefully  
docs(readme): update quick start guide
test(devices): add integration tests for device API
refactor(db): optimize device lookup queries
perf(ingestion): reduce memory usage in message processing
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code improvement
- `perf` - Performance improvement
- `ci` - CI/CD changes

### **Pull Request Process**

#### **Before Creating PR**

```bash
# 1. Update from develop
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop

# 2. Run quality checks
npm test                    # All tests pass
npm run lint               # No linting errors  
npm run test:coverage      # Coverage requirements met

# 3. Test integration
docker compose up -d       # Start full system
./scripts/test-integration.sh  # End-to-end tests
```

#### **PR Requirements**

✅ **Clear title and description** explaining the change  
✅ **Link to issue** if applicable  
✅ **All tests passing** in CI  
✅ **Code review approval** from maintainer  
✅ **Documentation updated** if needed  
✅ **No merge conflicts** with develop  

#### **PR Template**

```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

## 🔧 Changes
- List of specific changes made
- Files modified and why
- Any breaking changes

## 🧪 Testing  
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📚 Documentation
- [ ] README updated if needed
- [ ] API docs updated if needed
- [ ] Code comments added

## 🔗 Related Issues
Closes #123
```

### **Code Review Checklist**

**Functionality:**
- [ ] Code solves the stated problem
- [ ] Edge cases are handled
- [ ] Error scenarios are covered
- [ ] Performance implications considered

**Code Quality:**
- [ ] Code is readable and well-commented
- [ ] Functions are single-purpose and testable
- [ ] No code duplication
- [ ] Follows project conventions

**Testing:**
- [ ] Tests cover the new functionality
- [ ] Tests are meaningful and not just for coverage
- [ ] Error paths are tested
- [ ] Integration scenarios covered

**Documentation:**
- [ ] Public APIs are documented
- [ ] Complex business logic is explained
- [ ] Setup/usage instructions updated

---

## 🚀 **Release Process**

### **Version Strategy**

We use [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **Major** - Breaking changes
- **Minor** - New features (backward compatible)
- **Patch** - Bug fixes

### **Release Workflow**

#### **1. Prepare Release**

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version in package.json
npm version minor  # or major/patch

# Update CHANGELOG.md
vim CHANGELOG.md

# Commit version changes
git commit -m "chore: prepare release v1.2.0"
```

#### **2. Testing & Validation**

```bash
# Full test suite
npm test

# Performance benchmarks
npm run test:performance

# Integration testing
./scripts/test-full-deployment.sh

# Security audit
npm audit
```

#### **3. Release Notes**

```markdown
# TechTemp v1.2.0 - 2025-03-12

## 🚀 New Features
- **Web Dashboard**: React-based responsive interface
- **Device Readings API**: GET /api/v1/devices/:uid/readings endpoint
- **Room Objects**: Full room information in device responses

## 🐛 Bug Fixes  
- Fixed MQTT connection timeout handling
- Resolved device placement edge cases
- Improved error message clarity

## 📚 Documentation
- Restructured docs by audience (User/Developer/Contributor)
- Added comprehensive API examples
- Updated deployment guides

## ⚠️ Breaking Changes
None in this release.

## 🔄 Migration Guide
No migration required for this release.
```

#### **4. Deploy & Tag**

```bash
# Merge to main
git checkout main
git merge release/v1.2.0

# Create git tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push to GitHub
git push origin main --tags

# Merge back to develop
git checkout develop  
git merge main
git push origin develop

# Clean up release branch
git branch -d release/v1.2.0
```

### **Deployment Pipeline**

#### **Automated Deployment**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t techtemp:${{ github.ref_name }} .
      - name: Deploy to production
        run: ./scripts/deploy-production.sh ${{ github.ref_name }}
```

#### **Manual Deployment**

```bash
# Deploy to staging
./scripts/deploy-robust-pi.sh staging.example.com

# Deploy to production  
./scripts/deploy-robust-pi.sh production.example.com

# Verify deployment
curl https://api.techtemp.com/health
```

### **Rollback Procedures**

```bash
# Quick rollback to previous version
docker compose down
docker compose pull techtemp:v1.1.9  # Previous stable version
docker compose up -d

# Database rollback (if needed)
cp backup/techtemp-v1.1.9.db backend/db/techtemp.db
```

---

## 🛠️ **Development Tools**

### **Recommended VS Code Extensions**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-eslint",           // JavaScript linting
    "esbenp.prettier-vscode",            // Code formatting
    "ms-vscode.vscode-jest",             // Test runner integration
    "bradlc.vscode-tailwindcss",         // CSS framework support
    "ms-vscode.vscode-docker",           // Docker integration
    "humao.rest-client"                  // API testing
  ]
}
```

### **VS Code Settings**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "jest.autoRun": "watch",
  "rest-client.defaultHeaders": {
    "Content-Type": "application/json"
  }
}
```

### **API Testing Files**

```http
// .vscode/api-tests.http
### Health Check
GET http://localhost:3000/health

### Get All Devices
GET http://localhost:3000/api/v1/devices

### Get Device Readings
GET http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=5

### Provision New Device
POST http://localhost:3000/api/v1/devices
Content-Type: application/json

{
  "device_uid": "test-sensor-123",
  "room_name": "Test Room",
  "label": "Test Sensor"
}
```

### **Database Tools**

```bash
# Database inspection scripts
./scripts/db-overview.sh              # General database overview
./scripts/db-inspect-device.sh sensor-123  # Device-specific data
./scripts/db-latest-readings.sh       # Recent sensor readings
./scripts/db-health-check.sh          # Database integrity check

# Direct SQLite access
sqlite3 backend/db/techtemp.db
.tables                               # List all tables
.schema devices                       # Show table structure
SELECT * FROM devices LIMIT 5;       # Query data
```

### **Debugging Tools**

```bash
# Backend logs
npm run logs                          # Application logs
docker compose logs -f techtemp      # Container logs
docker compose logs -f mqtt          # MQTT broker logs

# Network debugging
netstat -tlnp | grep 3000            # Check port usage
nmap localhost                       # Scan open ports

# MQTT debugging
mosquitto_sub -h localhost -t "devices/+/data"  # Listen to all device messages
mosquitto_pub -h localhost -t "test/topic" -m "test message"  # Send test message
```

---

## 🎯 **Contributing Areas**

Looking for ways to contribute? Here are high-impact areas:

### **🚀 High Priority**

- **📊 Historical Charts** - Add charts.js integration to web dashboard
- **🔔 Notification System** - Email/SMS alerts for sensor thresholds
- **📱 PWA Features** - Offline support, push notifications
- **🏠 Multi-room Management** - Advanced room organization UI
- **⚡ Real-time Updates** - WebSocket/SSE for live dashboard updates

### **🔧 Medium Priority**

- **🧪 Test Coverage** - Expand integration and E2E tests
- **📈 Performance** - Optimize database queries, add caching
- **🔐 Security** - Add authentication, rate limiting, input sanitization
- **📚 Documentation** - More examples, video tutorials, deployment guides
- **🐳 DevOps** - Improve CI/CD, monitoring, automated deployments

### **💡 Experimental**

- **🤖 Machine Learning** - Anomaly detection, predictive maintenance
- **🌐 Distributed Setup** - Multiple server instances, load balancing
- **📊 Advanced Analytics** - Data export, trend analysis, reporting
- **🔌 New Sensors** - Support for different sensor types (BME280, DS18B20)
- **☁️ Cloud Integration** - AWS IoT, Azure IoT Hub connectors

### **Getting Started with Contributions**

1. **Browse issues** labeled [`good first issue`](https://github.com/laurent987/techtemp/labels/good%20first%20issue)
2. **Join discussions** about features and improvements
3. **Review PRs** and provide feedback
4. **Improve documentation** - always appreciated!
5. **Share your setup** - blog posts, videos, configurations

---

## 📚 **Additional Resources**

### **Learning Materials**
- **📖 [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)** - Industry standards
- **🧪 [Testing JavaScript](https://testingjavascript.com/)** - Comprehensive testing guide
- **🏗️ [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)** - System design principles
- **🔄 [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)** - Data access patterns

### **TechTemp-Specific Guides**
- **🏠 [Device Hardware Guide](../devices/README.md)** - Sensor setup and wiring
- **🔧 [API Integration Examples](../DEVELOPER/README.md)** - External integrations
- **📱 [Web Dashboard Customization](../USER/dashboard-customization.md)** - UI modifications
- **🚀 [Deployment Options](../deployment/README.md)** - Production deployment strategies

### **Community Resources**
- **💬 [GitHub Discussions](https://github.com/laurent987/techtemp/discussions)** - Q&A, ideas, showcase
- **📊 [Project Board](https://github.com/laurent987/techtemp/projects)** - Development roadmap
- **🐛 [Issue Tracker](https://github.com/laurent987/techtemp/issues)** - Bug reports, feature requests
- **📚 [Wiki](https://github.com/laurent987/techtemp/wiki)** - Community guides and tips

---

**🎉 Thank you for contributing to TechTemp!** Your efforts help make this platform better for everyone in the IoT community.

**Questions?** Don't hesitate to ask in [GitHub Discussions](https://github.com/laurent987/techtemp/discussions) or create an issue. We're here to help!

**Ready to code?** Check out our [`good first issue`](https://github.com/laurent987/techtemp/labels/good%20first%20issue) label for beginner-friendly contributions.
