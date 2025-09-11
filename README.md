# 🌡️ TechTemp IoT Platform

A complete home monitoring solution: deploy Raspberry Pi sensors throughout your home, collect temperature/humidity data via MQTT, and access everything through a REST API.

## 🏠 How TechTemp Works

**1. Install sensors in your rooms**
- Place Raspberry Pi + AHT20 sensors in different rooms
- Each Pi automatically sends data every 30 seconds via MQTT

**2. Run the central server** 
- Collects all sensor data and stores in database
- Provides REST API for accessing readings
- Organizes devices by rooms automatically

**3. Build your applications**
- Use the API for dashboards, alerts, automation
- Integrate with Home Assistant, custom apps, monitoring systems

## 📦 What's in This Repository

This repository contains **everything you need**:

### 💻 Code & Applications
- **🖥️ Backend Server** (`/backend/`) - Node.js service that collects MQTT data and provides REST API
- **📡 Device Firmware** (`/device/`) - C code for Raspberry Pi sensors with AHT20 integration
- **🌐 Web Dashboard** (`/web/`) - React dashboard for monitoring your sensors *(coming soon)*

### 📚 Documentation  
- **📡 [Device Setup](docs/devices/README.md)** (`/docs/devices/`) - Complete guides to setup and configure your Raspberry Pi sensors 
- **📖 API Reference** (`/docs/api/`) - Full documentation for integrating with the REST API → [API Docs](docs/api/README.md)
- **🔧 Development** (`/docs/`) - Installation, architecture, and contributing guides → [Setup Guide](docs/SETUP.md)

### 📋 Ready-to-Use Examples
- **🏠 Home Assistant** - Sensor configurations and automation examples → [HA Examples](docs/api/EXAMPLES.md#home-assistant)
- **🐍 Python Scripts** - Data collection and monitoring scripts → [Python Examples](docs/api/EXAMPLES.md#python)
- **⚛️ JavaScript Clients** - Web integration examples → [JS Examples](docs/api/EXAMPLES.md#javascript)


## 👥 Who is TechTemp for?

### 🏠 **End Users** (Home/Office Monitoring)
- **What you get**: Monitor temperature/humidity in multiple rooms
- **What you need**: Raspberry Pi devices with AHT20 sensors (see [device setup](docs/devices/))
- **Setup time**: ~30 minutes for server + 10 minutes per device

### 🔧 **Makers & Integrators** (Custom Solutions)  
- **What you get**: Ready-to-use API for building dashboards, automation, alerts
- **What you need**: Basic understanding of REST APIs
- **Integration**: Home Assistant, custom web apps, monitoring systems

### 💻 **Developers** (Contributing & Extending)
- **What you get**: Well-documented codebase with comprehensive tests
- **What you need**: Node.js, Docker, MQTT knowledge
- **Extend**: Add new sensor types, custom endpoints, different databases

## 🏗️ How it Works

```
🏠 Living Room          🏠 Kitchen            🏠 Bedroom
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Raspberry Pi    │    │ Raspberry Pi    │    │ Raspberry Pi    │
│ + AHT20 Sensor  │    │ + AHT20 Sensor  │    │ + AHT20 Sensor  │
│ (22.5°C, 45%)   │    │ (24.1°C, 52%)   │    │ (20.8°C, 38%)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │ MQTT Messages
                                 ▼
                    ┌─────────────────────────┐
                    │    Central Server       │
                    │  ⚡ This Repository     │
                    ├─────────────────────────┤
                    │ • MQTT Data Collection  │
                    │ • SQLite Database       │
                    │ • REST API Server       │
                    │ • Room Management       │
                    └─────────┬───────────────┘
                              │ REST API
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Web Dashboard  │    │   Mobile App     │    │ Home Assistant  │
│                 │    │                  │    │   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

**Choose your path:**

### 🏠 For End Users (Home Monitoring)

**First, clone and start the server:**
```bash
git clone https://github.com/your-org/techtemp.git
cd techtemp
docker-compose up -d

# Verify server is running
curl http://localhost:3000/health
```

**Then setup your Raspberry Pi devices:**
- 📖 **[Device Setup Guide](docs/devices/setup/bootstrap.md)** - Step-by-step Pi configuration
- 🔌 **[AHT20 Wiring](docs/devices/hardware/aht20.md)** - Sensor connection guide
- 🛠️ **[Troubleshooting](docs/devices/troubleshooting/common-issues.md)** - Common device issues

### 🔧 For Integrators (API Access)

**Start the server:**
```bash
git clone https://github.com/your-org/techtemp.git
cd techtemp
docker-compose up -d
```

**Test the API:**
```bash
# Get all devices and their rooms
curl http://localhost:3000/api/v1/devices

# Get latest readings from a specific device
curl http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=10
```

**Documentation:**
- 📚 **[API Documentation](docs/api/README.md)** - Complete API reference
- 📖 **[Integration Examples](docs/api/EXAMPLES.md)** - Home Assistant, Python, JavaScript

### 💻 For Developers (Contributing)

**Setup development environment:**
```bash
git clone https://github.com/your-org/techtemp.git
cd techtemp

# Start MQTT broker only
docker-compose up mqtt -d

# Run backend in development mode
cd backend
npm install
npm run dev
```

**Development guides:**
- 🚀 **[Development Setup](docs/SETUP.md)** - Complete dev environment
- 🏗️ **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and components
- 🤝 **[Contributing Guide](docs/CONTRIBUTING.md)** - Development workflow

## 🔌 Try the API

**Provision a new device:**
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "demo-sensor",
    "room_name": "Living Room",
    "label": "Demo Temperature Sensor"
  }'
```

**Send test data via MQTT:**
```bash
# Publish sensor reading
mosquitto_pub -h localhost -p 1883 \
  -t "devices/demo-sensor/data" \
  -m '{"device_uid":"demo-sensor","temperature":22.5,"humidity":45.2,"timestamp":"2025-01-10T10:30:45.123Z"}'

# Get the data back
curl http://localhost:3000/api/v1/devices/demo-sensor/readings
```

##  Documentation

TechTemp provides comprehensive documentation for all audiences:

### 🏃‍♂️ Getting Started
- **[🚀 Setup Guide](docs/SETUP.md)** - Development environment setup
- **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)** - System design and components
- **[🤝 Contributing Guide](docs/CONTRIBUTING.md)** - Development workflow and standards

### 📚 API Documentation
- **[📋 API Overview](docs/api/README.md)** - Quick start and design principles
- **[📱 Device API](docs/api/DEVICES.md)** - Device management endpoints
- **[📊 Readings API](docs/api/READINGS.md)** - Data retrieval endpoints
- **[🚨 Error Handling](docs/api/ERRORS.md)** - Error codes and troubleshooting
- **[📖 Examples](docs/api/EXAMPLES.md)** - Complete integration examples

### 🔌 IoT Device Setup
- **[🔌 Device Overview](docs/devices/README.md)** - IoT device documentation hub
- **[🌡️ AHT20 Setup](docs/devices/hardware/aht20.md)** - Temperature/humidity sensor wiring
- **[🚀 Bootstrap Guide](docs/devices/setup/bootstrap.md)** - Automated device configuration
- **[🛠️ Troubleshooting](docs/devices/troubleshooting/common-issues.md)** - Common device problems

### 🔧 Technical Guides
- **[📐 Documentation Plan](docs/DOCUMENTATION_PLAN.md)** - Documentation strategy and phases

## 🎯 Current Status

**✅ Live System**: Real sensor `aht20-f49c53` sending data every 30 seconds
```bash
# Check current live data
curl http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=5
```

**✅ Complete API**: Device management with room integration
- Device CRUD operations with UIDs
- Room auto-creation and management  
- Readings retrieval with pagination
- Comprehensive error handling

**✅ Professional Documentation**: Ready for team onboarding
- Developer setup guides
- Complete API reference with examples
- Architecture documentation
- Contributing guidelines

## 🔌 Integration Examples

**JavaScript/Node.js:**
```javascript
const TechTempClient = require('./techtemp-client');
const client = new TechTempClient('http://localhost:3000');

// Get all devices
const devices = await client.getDevices();

// Get latest readings
const readings = await client.getDeviceReadings('aht20-f49c53', 10);
```

**Python:**
```python
import requests

# Get device status
response = requests.get('http://localhost:3000/api/v1/devices/aht20-f49c53')
device = response.json()

print(f"Device: {device['label']} in {device['room']['name']}")
```

**Home Assistant:**
```yaml
sensor:
  - platform: rest
    resource: http://localhost:3000/api/v1/devices/aht20-f49c53/readings?limit=1
    name: Kitchen Temperature
    value_template: "{{ value_json[0].temperature }}"
    unit_of_measurement: "°C"
```

See **[complete examples](docs/api/EXAMPLES.md)** for monitoring scripts, dashboards, and integrations.

## 🏢 Project Structure

```
techtemp/
├── backend/                  # Node.js backend service
│   ├── http/                # REST API server
│   ├── mqtt/                # MQTT data ingestion
│   ├── db/                  # Database layer
│   ├── repositories/        # Business logic layer
│   ├── main.js              # Application entry point
│   └── package.json
├── docs/                     # 📚 Complete documentation
│   ├── SETUP.md             # Development setup
│   ├── ARCHITECTURE.md      # System design
│   ├── CONTRIBUTING.md      # Development workflow
│   ├── api/                 # API documentation
│   │   ├── README.md        # API overview
│   │   ├── DEVICES.md       # Device endpoints
│   │   ├── READINGS.md      # Readings endpoints
│   │   ├── ERRORS.md        # Error handling
│   │   └── EXAMPLES.md      # Integration examples
│   └── devices/             # IoT device documentation
│       ├── README.md        # Device overview
│       ├── hardware/        # Hardware guides
│       ├── setup/           # Configuration guides
│       └── troubleshooting/ # Problem solving
├── docker-compose.yml       # Container orchestration
└── README.md               # This file
```

## 🧪 Testing

```bash
# Run all tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Development testing
npm run test:watch

# Test specific functionality
npm test -- --testPathPattern=devices.test.js
```

## 🚀 Deployment

**Development:**
```bash
docker-compose up -d
```

**Production:**
```bash
# With environment configuration
MQTT_BROKER_URL=mqtt://production-broker:1883 docker-compose up -d

# Or with custom compose file
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

**Environment Variables:**
```bash
MQTT_BROKER_URL=mqtt://localhost:1883  # MQTT broker connection
PORT=3000                             # HTTP server port
DB_PATH=/app/db/techtemp.db          # SQLite database path
NODE_ENV=development                  # Environment mode
LOG_LEVEL=info                       # Logging level
```

## 🔍 Database Inspection & Debugging

**Quick database overview:**
```bash
./scripts/db-overview.sh
```

**Inspect device placement history:**
```bash
./scripts/db-inspect-device.sh aht20-f49c53
```

**Health check:**
```bash
./scripts/db-health-check.sh
```

📖 **Full documentation:** [Database Inspection Guide](docs/development/DATABASE_INSPECTION.md)

**Docker Compose Configuration:**
```yaml
services:
  backend:
    environment:
      - MQTT_BROKER_URL=mqtt://mqtt:1883
      - PORT=3000
    volumes:
      - ./backend/db:/app/db  # Database persistence
```

## 🔗 Related Projects

- **Web Dashboard** - [techtemp-web](https://github.com/your-org/techtemp-web) *(planned)*
- **Mobile App** - [techtemp-mobile](https://github.com/your-org/techtemp-mobile) *(planned)*
- **Device Firmware** - [techtemp-device](https://github.com/your-org/techtemp-device) *(planned)*

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for:

- Development workflow and standards
- Testing guidelines
- Code review process
- Performance and security considerations

**Quick Contributing Steps:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the [setup guide](docs/SETUP.md) for development environment
4. Make your changes with tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Contributors

- **[Your Name]** - Initial development and architecture
- **[Team Member]** - API design and documentation
- **[Another Contributor]** - Testing and quality assurance

## 🆘 Support

- **📖 Documentation**: Check our comprehensive [docs](docs/)
- **🐛 Issues**: Report bugs on [GitHub Issues](https://github.com/your-org/techtemp/issues)
- **💬 Discussions**: Join project [Discussions](https://github.com/your-org/techtemp/discussions)
- **📧 Contact**: [your-email@example.com](mailto:your-email@example.com)

---

**TechTemp** - Professional IoT platform for environmental monitoring 🌡️📊
