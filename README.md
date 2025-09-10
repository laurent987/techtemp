# TechTemp IoT Service

**TechTemp IoT Backend Service** — Core IoT data ingestion service for temperature and humidity monitoring.

## 🎯 What is this repository?

This repository contains the **backend service** of the TechTemp IoT ecosystem:
- MQTT data ingestion from IoT devices
- SQLite database storage  
- REST API for data access
- Health monitoring and metrics
- Docker containerization

## 🏗️ Architecture

```
IoT Devices → MQTT → TechTemp Service → Database
                         ↓
                    REST API ← Web/Mobile Clients
```

## 🚀 Quick Start

1. **Start the service:**
   ```bash
   npm install
   npm start
   ```

2. **Or with Docker:**
   ```bash
   docker-compose up
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/v1/readings/latest
   ```

## 🖥️ Device Setup

**New Raspberry Pi with sensor?** → Use the bootstrap script:

```bash
# Interactive setup (recommended)
./deployment/bootstrap-pi.sh 192.168.1.100

# Automatic setup
./deployment/bootstrap-pi.sh 192.168.1.100 --non-interactive
```

**📚 Complete device documentation:** [`device/docs/`](device/docs/README.md)

- **🚀 [Bootstrap Guide](device/docs/setup/bootstrap.md)** - One-command setup
- **🔌 [Hardware Guide](device/docs/hardware/aht20.md)** - AHT20 wiring
- **🔧 [Troubleshooting](device/docs/troubleshooting/common-issues.md)** - Problem solving

## 📁 Project Structure

```
techtemp/
├── backend/               # Backend service (Node.js + SQLite)
├── device/                # Device client code (C + I2C sensors)
│   ├── src/              # Source code (C)
│   ├── include/          # Headers
│   ├── config/           # Configuration files
│   └── docs/             # 📚 Device documentation
│       ├── setup/        # Installation & bootstrap guides
│       ├── hardware/     # Hardware guides (AHT20, wiring)
│       ├── troubleshooting/ # Problem resolution
│       └── api/          # Protocol documentation
├── deployment/           # Scripts (bootstrap, update)
├── web/                  # Web interface (future)
├── infrastructure/       # Docker configs
├── test/                 # Tests
└── docs/                 # 📚 General documentation
```

## 🔌 Client Examples

See `clients/` directory for example implementations:
- **Web Dashboard** (`clients/web-example/`)
- **Raspberry Pi Client** (`clients/device-example/`)

For production clients, use separate repositories:
- `techtemp-web` - Web application
- `techtemp-device` - Device firmware
- `techtemp-mobile` - Mobile app

## 📊 API Endpoints

- `GET /health` - Service health check
- `GET /readings` - Get sensor readings
- `GET /readings?device=<id>` - Device-specific readings

## 🔧 Development

```bash
npm test           # Run tests
npm test:watch     # Watch mode
npm start          # Development mode
npm run start:prod # Production mode
```

## 📈 Monitoring

The service exposes Prometheus metrics at `/metrics` and includes Grafana dashboards in `infrastructure/grafana/`.

---

**Note**: This is the core service only. Web interfaces and device firmware are maintained in separate repositories.
