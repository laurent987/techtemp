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

- **🖥️ Backend Server** (`/backend/`) - Node.js service that collects MQTT data and provides REST API
- **📡 Device Firmware** (`/device/`) - C code for Raspberry Pi sensors with AHT20 integration
- **🌐 Web Dashboard** (`/web/`) - React + Chakra UI dashboard (MVP)

---

## 🚪 **Choose Your Path** 

TechTemp serves different audiences with tailored documentation:

<table>
<tr>
<th width="33%" style="text-align: center;">👤 <strong>END USER</strong></th>
<th width="33%" style="text-align: center;">👩‍💻 <strong>DEVELOPER</strong></th>
<th width="33%" style="text-align: center;">🏗️ <strong>CONTRIBUTOR</strong></th>
</tr>
<tr>
<td valign="top">

*Want to monitor your home/office?*

**You need:** Room monitoring solution  
**Time:** 30 min setup + 10 min per sensor

**[📱 Start Here →](docs/USER/README.md)**
- Quick setup guide
- Device installation
- Troubleshooting


</td>
<td valign="top">

*Building apps with TechTemp API?*

**You need:** API integration guide  
**Time:** 15 min to first API call

**[⚡ Start Here →](docs/DEVELOPER/README.md)**
- API reference & examples
- SDKs and client libraries
- Integration patterns
- Testing and debugging

</td>
<td valign="top">

*Contributing to TechTemp?*

**You need:** Development environment  
**Time:** 20 min setup + architecture overview

**[🏗️ Start Here →](docs/CONTRIBUTOR/README.md)**
- Development setup
- Architecture deep-dive
- Coding standards
- Release process

</td>
</tr>
</table>

---


## 🏠 **Architecture Overview**

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
                    │ • Web Dashboard         │
                    │ • Room Management       │
                    └─────────┬───────────────┘
                              │ REST API
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Web Dashboard  │    │   Mobile App     │    │ Home Assistant  │
│  (Built-in)     │    │   (Your App)     │    │   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ⚡ **Quick Demo** 

**⚠️ Prerequisites Required:**
- Docker & Docker Compose installed
- MQTT broker (Mosquitto) running

```bash
# 1. Clone the repository
git clone https://github.com/laurent987/techtemp.git
cd techtemp

# 2. Set up environment (see docs/DEVELOPER/ for details)
cp .env.example .env
# Edit .env with your MQTT broker settings

# 3. Start the system
docker compose up -d

# 4. Check the API is running
curl http://localhost:3000/api/v1/health

# 5. Create demo devices
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "living-room-01", "room_name": "Living Room", "label": "Main Sensor"}'

curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "kitchen-01", "room_name": "Kitchen", "label": "Kitchen Sensor"}'

# 6. Add some test data
curl -X POST http://localhost:3000/api/v1/readings \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "living-room-01", "temperature": 22.5, "humidity": 45.2}'

curl -X POST http://localhost:3000/api/v1/readings \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "kitchen-01", "temperature": 24.1, "humidity": 52.8}'

# 7. Check your data
curl http://localhost:3000/api/v1/devices
curl http://localhost:3000/api/v1/readings/latest

# 8. View dashboard with real data
open http://localhost:3000
```

**📖 For complete setup:** See [User Guide](docs/USER/README.md) or [Developer Guide](docs/DEVELOPER/README.md)

---


## 🏗️ **Repository Structure**

```
techtemp/
├── 📖 README.md                     # 🚪 YOU ARE HERE - Start here for any audience
├── 
├── 🎯 docs/                         # 📚 Documentation by audience
│   ├── 👤 USER/                     # End-user guides (home monitoring)
│   ├── 🔧 DEVELOPER/                # API integration & development  
│   ├── 🏗️ CONTRIBUTOR/              # Contributing to TechTemp
│   └── 📁 INTERNAL/                 # Internal docs & archives
│
├── 💻 backend/                      # Node.js backend service
│   ├── http/                        # REST API server
│   ├── mqtt/                        # MQTT data ingestion  
│   ├── db/                          # Database layer
│   └── repositories/                # Business logic
│
├── 🌐 web/                          # React web dashboard
│   ├── index.html                   # Main dashboard page
│   ├── app-simple.js                # Dashboard React app
│   └── styles.css                   # Responsive styles
│
├── 📡 device/                       # Raspberry Pi sensor code
│   ├── src/                         # C source code
│   ├── include/                     # Headers
│   └── config/                      # Configuration files
│
├── 🚀 scripts/                      # Deployment & utility scripts
├── 🐳 docker-compose.yml            # Container orchestration
└── 🧪 test/                         # Comprehensive test suite
```

## 🤝 **Contributing Quick Links**

- **🐛 Bug Reports:** [Create Issue](https://github.com/laurent987/techtemp/issues/new?template=bug_report.md)
- **✨ Feature Requests:** [Create Issue](https://github.com/laurent987/techtemp/issues/new?template=feature_request.md)  
- **💬 Questions:** [GitHub Discussions](https://github.com/laurent987/techtemp/discussions)
- **🔧 Development:** [Contributor Guide](docs/CONTRIBUTOR/README.md)

## 📄 **License & Support**

- **License:** MIT License - see [LICENSE](LICENSE)
- **Maintainer:** Laurent ([@laurent987](https://github.com/laurent987))
- **Status:** Active development, production-ready

---

<div align="center">

**🌡️ TechTemp** - Professional IoT platform for environmental monitoring

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#) 
[![API Status](https://img.shields.io/badge/API-v1-blue)](#)
[![Web Dashboard](https://img.shields.io/badge/dashboard-online-green)](#)
[![Documentation](https://img.shields.io/badge/docs-comprehensive-yellow)](#)

[🚀 Get Started](#-choose-your-path) • [📚 Documentation](docs/) • [💻 GitHub](https://github.com/laurent987/techtemp)

</div>
