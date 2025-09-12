# 🚀 Development Setup Guide

This guide will help you set up the TechTemp development environment on your local machine.

## 📋 Prerequisites

### Required Software

- **Docker Desktop** (latest version)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

- **Git** (version 2.30+)
  - [Download and install](https://git-scm.com/downloads)

- **Node.js** (version 18+) - *Optional, for local development*
  - [Download LTS version](https://nodejs.org/)

- **Code Editor** - Recommended:
  - [VS Code](https://code.visualstudio.com/) with extensions:
    - Docker
    - JavaScript (ES6) code snippets
    - REST Client (for API testing)

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for Docker image downloads

## 🏗️ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/techtemp.git
cd techtemp
```

### 2. Start the Development Environment

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check services are running
docker-compose ps
```

Expected output:
```
NAME                   COMMAND                  SERVICE       STATUS
techtemp-mqtt-1        "/docker-entrypoint.…"   mqtt          running
techtemp-backend-1       "docker-entrypoint.s…"   backend       running
```

### 3. Verify the Setup

**Check API Health:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T10:30:45.123Z"
}
```

**Check MQTT Broker:**
```bash
# Install mosquitto clients (if not already installed)
# macOS:
brew install mosquitto

# Ubuntu/Debian:
sudo apt-get install mosquitto-clients

# Test MQTT connection
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "Hello World"
```

### 4. Test Device Provisioning

```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "development-test",
    "room_name": "Development Room",
    "label": "Test Device"
  }'
```

✅ **You're ready to develop!**

## 🛠️ Development Workflows

### Option 1: Docker Development (Recommended)

**Pros**: Consistent environment, easy setup, matches production
**Cons**: Slightly slower file watching

```bash
# Start development environment
docker-compose up

# Watch logs
docker-compose logs -f backend

# Run tests in container
docker-compose exec backend npm test

# Access container shell
docker-compose exec backend sh
```

### Option 2: Local Node.js Development

**Pros**: Faster iteration, native debugging
**Cons**: Requires local Node.js setup

```bash
# Install dependencies
cd backend
npm install

# Start MQTT broker only
docker-compose up mqtt -d

# Run service locally
MQTT_BROKER_URL=mqtt://localhost:1883 npm run dev

# Run tests locally
npm test
```

### Option 3: Hybrid Development

**Best of both worlds**: MQTT in Docker, API locally

```bash
# Start only MQTT broker
docker-compose up mqtt -d

# Run API locally with auto-restart
cd backend
npm run dev

# In another terminal, monitor MQTT messages
mosquitto_sub -h localhost -p 1883 -t "devices/+/data"
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the project root:

```bash
# .env
MQTT_BROKER_URL=mqtt://localhost:1883
PORT=3000
DB_PATH=./db/techtemp.db
NODE_ENV=development
LOG_LEVEL=debug
```

### Docker Compose Override

Create `docker-compose.override.yml` for local customizations:

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  backend:
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./backend:/app
      - /app/node_modules  # Preserve node_modules
    command: npm run dev  # Use development command

  mqtt:
    ports:
      - "1883:1883"
      - "9001:9001"  # WebSocket port for debugging
```

### VS Code Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Service App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/main.js",
      "env": {
        "MQTT_BROKER_URL": "mqtt://localhost:1883",
        "PORT": "3000",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "node",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Attach to Docker",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/backend",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

Create `.vscode/tasks.json` for common tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Environment",
      "type": "shell",
      "command": "docker-compose up -d",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Stop Development Environment",
      "type": "shell",
      "command": "docker-compose down",
      "group": "build"
    },
    {
      "label": "View Logs",
      "type": "shell",
      "command": "docker-compose logs -f",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "shared"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm test",
      "group": "test",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

## 🧪 Testing Setup

### Running Tests

```bash
# All tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- --testPathPattern=devices.test.js
```

### Test Database

Tests use an in-memory SQLite database:

```javascript
// tests/setup.js
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
```

### MQTT Testing

Use a test MQTT broker for integration tests:

```javascript
// tests/mqtt.test.js
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1884; // Different port for testing

beforeAll(async () => {
  await new Promise(resolve => server.listen(port, resolve));
});

afterAll(async () => {
  server.close();
});
```

## 📊 Monitoring and Debugging

### Development Tools

**View Database:**
```bash
# Access SQLite database
docker-compose exec backend sqlite3 /app/db/techtemp.db

# List all devices
.tables
SELECT * FROM devices;
SELECT * FROM readings LIMIT 10;
```

**Monitor MQTT Messages:**
```bash
# Subscribe to all device messages
mosquitto_sub -h localhost -p 1883 -t "devices/+/data" -v

# Publish test message
mosquitto_pub -h localhost -p 1883 -t "devices/test-device/data" \
  -m '{"device_uid":"test-device","temperature":22.5,"humidity":45.2,"timestamp":"2025-01-10T10:30:45.123Z"}'
```

**API Testing with REST Client:**

Create `api-tests.http` file:
```http
### Health Check
GET http://localhost:3000/health

### List Devices
GET http://localhost:3000/api/v1/devices

### Provision Device
POST http://localhost:3000/api/v1/devices
Content-Type: application/json

{
  "device_uid": "dev-sensor-01",
  "room_name": "Development Room",
  "label": "Development Sensor"
}

### Get Device Readings
GET http://localhost:3000/api/v1/devices/dev-sensor-01/readings?limit=5
```

### Log Analysis

**Service Logs:**
```bash
# Follow logs in real-time
docker-compose logs -f backend

# Search for errors
docker-compose logs backend | grep ERROR

# Filter by timestamp
docker-compose logs --since="1h" backend
```

**MQTT Broker Logs:**
```bash
# MQTT broker logs
docker-compose logs mqtt

# View MQTT config
docker-compose exec mqtt cat /mosquitto/config/mosquitto.conf
```

## 🔄 Development Best Practices

### Code Style

**ESLint Configuration (`.eslintrc.js`):**
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-console': 'warn',
    'no-unused-vars': 'error'
  }
};
```

**Prettier Configuration (`.prettierrc`):**
```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Git Workflow

**Branch Naming:**
- `feature/device-auto-discovery`
- `bugfix/mqtt-reconnection`
- `docs/api-documentation`

**Commit Messages:**
```bash
# Good commit messages
git commit -m "feat: add device auto-provisioning API endpoint"
git commit -m "fix: handle MQTT reconnection on broker restart"
git commit -m "docs: update API documentation with examples"
git commit -m "test: add integration tests for device endpoints"
```

**Pre-commit Hooks:**
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test && npm run lint"
```

### Testing Strategy

**Test Pyramid:**
1. **Unit Tests** (70%): Individual functions and modules
2. **Integration Tests** (20%): API endpoints and database
3. **E2E Tests** (10%): Full system workflows

**Test Organization:**
```
tests/
├── unit/
│   ├── db/
│   ├── mqtt/
│   └── utils/
├── integration/
│   ├── api/
│   └── mqtt/
└── e2e/
    └── workflows/
```

### Performance Monitoring

**Local Performance Testing:**
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
echo "
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Get devices'
    requests:
      - get:
          url: '/api/v1/devices'
" > load-test.yml

# Run load test
artillery run load-test.yml
```

**Memory and CPU Monitoring:**
```bash
# Monitor Docker container resources
docker stats

# Check Node.js memory usage
curl http://localhost:3000/health | jq '.memory'
```

## 🚨 Troubleshooting

### Common Issues

#### Docker Issues

**Problem**: Services won't start
```bash
# Check Docker daemon is running
docker info

# Clean up and restart
docker-compose down
docker system prune -f
docker-compose up --build
```

**Problem**: Port conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

#### MQTT Issues

**Problem**: Can't connect to MQTT broker
```bash
# Check MQTT container is running
docker-compose ps mqtt

# Test connection directly
telnet localhost 1883

# Check MQTT logs
docker-compose logs mqtt
```

**Problem**: Messages not being processed
```bash
# Check backend logs for MQTT errors
docker-compose logs backend | grep mqtt

# Verify topic subscription
mosquitto_sub -h localhost -p 1883 -t "devices/+/data" -v
```

#### Database Issues

**Problem**: Database file permissions
```bash
# Check database directory permissions
ls -la backend/db/

# Fix permissions if needed
chmod 755 backend/db/
chmod 644 backend/db/techtemp.db
```

**Problem**: Database corruption
```bash
# Backup and recreate database
cp backend/db/techtemp.db backend/db/techtemp.db.backup
rm backend/db/techtemp.db

# Restart service (will recreate database)
docker-compose restart backend
```

#### API Issues

**Problem**: API returns 500 errors
```bash
# Check service logs for stack traces
docker-compose logs backend

# Verify database connection
curl http://localhost:3000/health

# Test with simple curl request
curl -v http://localhost:3000/api/v1/devices
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in docker-compose.yml
environment:
  - LOG_LEVEL=debug
```

**Node.js Debugging:**
```bash
# Enable Node.js inspector
node --inspect=0.0.0.0:9229 src/index.js

# In Docker, expose debug port
ports:
  - "3000:3000"
  - "9229:9229"  # Debug port
```

### Getting Help

1. **Check Documentation**: Start with this guide and the API docs
2. **Search Issues**: Look through existing GitHub issues
3. **Enable Debug Logging**: Set `LOG_LEVEL=debug` for detailed logs
4. **Create Minimal Reproduction**: Isolate the problem to specific steps
5. **Report Issues**: Include logs, environment details, and reproduction steps

## 🔄 Next Steps

Once your development environment is set up:

1. **Read the Architecture**: Understanding the system design ([ARCHITECTURE.md](ARCHITECTURE.md))
2. **Explore the API**: Try the endpoints documented in ([api/README.md](api/README.md))
3. **Run Examples**: Test the code samples in ([api/EXAMPLES.md](api/EXAMPLES.md))
4. **Contribute**: Check the contributing guidelines ([CONTRIBUTING.md](CONTRIBUTING.md))

## 🔗 Related Documentation

- **[🏗️ Architecture](ARCHITECTURE.md)** - System design and components
- **[📚 API Reference](api/README.md)** - Complete API documentation  
- **[📖 Examples](api/EXAMPLES.md)** - Working code examples
- **[🤝 Contributing](CONTRIBUTING.md)** - Development guidelines
