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
   curl http://localhost:3000/readings
   ```

## 📁 Project Structure

```
techtemp/
├── src/                    # Service source code
├── test/                   # Unit & integration tests
├── infrastructure/         # Docker configs (MQTT, monitoring)
├── clients/               # Example client implementations
├── docs/                  # Documentation & ADRs
└── docker-compose.yml     # Full stack deployment
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
