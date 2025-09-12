# 🔌 IoT Device Documentation

Complete documentation for TechTemp IoT devices - hardware setup, configuration, and troubleshooting.

## 🎯 Quick Start

**New to TechTemp devices?** Follow this path:

1. **[🔧 Hardware Setup](hardware/aht20.md)** - Wire your AHT20 sensor (15 min)
2. **[🚀 Device Bootstrap](setup/bootstrap.md)** - Auto-configure your device (5 min)  
3. **[⚡ Test Connection](setup/configuration.md)** - Verify MQTT communication (5 min)

## 📋 Device Support

### ✅ Supported Sensors

| Sensor | Type | Communication | Documentation |
|--------|------|---------------|---------------|
| **AHT20** | Temperature/Humidity | I2C | [Hardware Guide](hardware/aht20.md) |
| DHT22 | Temperature/Humidity | 1-Wire | *Coming soon* |
| BME280 | Temperature/Humidity/Pressure | I2C/SPI | *Planned* |

### 🏗️ Supported Platforms

| Platform | Status | Setup Guide |
|----------|--------|-------------|
| **Raspberry Pi** | ✅ Production Ready | [Bootstrap Guide](setup/bootstrap.md) |
| Arduino | 🔄 In Development | *Coming soon* |
| ESP32 | 📋 Planned | *Future* |

## 📚 Documentation Sections

### 🔧 Hardware Documentation
- **[🌡️ AHT20 Sensor](hardware/aht20.md)** - Wiring, specifications, calibration
- **[🔌 GPIO Pinout](hardware/gpio-reference.md)** - Raspberry Pi pin reference *(future)*
- **[⚡ Power Requirements](hardware/power.md)** - Power consumption and supply *(future)*

### 🚀 Setup & Configuration  
- **[🎯 Bootstrap Script](setup/bootstrap.md)** - Automated device setup
- **[⚙️ Manual Configuration](setup/configuration.md)** - Step-by-step manual setup
- **[🔐 Security Setup](setup/security.md)** - Device security configuration *(future)*

### 🔍 Troubleshooting
- **[🛠️ Common Issues](troubleshooting/common-issues.md)** - Frequent problems and solutions
- **[📊 Diagnostics](troubleshooting/diagnostics.md)** - Debug tools and techniques *(future)*
- **[🔧 Hardware Debug](troubleshooting/hardware-debug.md)** - Hardware-specific debugging *(future)*

### 📡 Communication Protocols
- **[📨 MQTT Protocol](../api/EXAMPLES.md#mqtt-device-integration)** - Message format and topics
- **[🔌 Device API](../api/DEVICES.md)** - Device provisioning and management
- **[📊 Data Format](../api/READINGS.md)** - Sensor data structure

## 🔄 Device Lifecycle

### 1. **Provisioning**
```bash
# Via API (recommended)
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "aht20-kitchen-01", "room_name": "Kitchen"}'

# Via bootstrap script
./bootstrap-device.sh --uid aht20-kitchen-01 --room Kitchen
```

### 2. **Configuration**
- Network setup (WiFi/Ethernet)
- MQTT broker connection
- Sensor calibration
- Reading intervals

### 3. **Operation**
- Continuous sensor reading
- MQTT data publishing
- Health monitoring
- Automatic reconnection

### 4. **Maintenance**
- Software updates
- Sensor recalibration
- Performance monitoring
- Log analysis

## 🏢 Production Deployment

### 📊 Monitoring

**Device Health:**
```bash
# Check device status via API
curl http://localhost:3000/api/v1/devices/aht20-kitchen-01

# Monitor MQTT messages
mosquitto_sub -h broker.local -t "devices/aht20-kitchen-01/data"
```

**Key Metrics:**
- Message frequency (every 30s expected)
- Connection stability
- Sensor accuracy
- Power consumption

### 🔄 Updates

**Automated Updates:**
```bash
# Update device software
./update-device.sh aht20-kitchen-01

# Bulk update
./bulk-update.sh --room Kitchen
```

**Manual Updates:**
- SSH access for development
- Configuration file updates
- Sensor recalibration

## 🛠️ Development

### 🧪 Testing New Devices

**Local Development:**
```bash
# Compile device code
cd device/
make clean && make

# Run tests
make test

# Deploy to test device
make deploy DEVICE_IP=192.168.1.100
```

**Integration Testing:**
```bash
# Test MQTT communication
./test-mqtt.sh aht20-test-01

# Test API integration
./test-api-integration.sh
```

### 📋 Adding New Sensors

1. **Hardware Support** - Add driver in `device/src/sensors/`
2. **Configuration** - Update config format
3. **Documentation** - Add hardware guide
4. **Testing** - Add integration tests
5. **API Updates** - Update data format if needed

## 🔗 Related Documentation

### 📚 Main Documentation
- **[🏗️ System Architecture](../ARCHITECTURE.md)** - Overall system design
- **[🚀 Development Setup](../SETUP.md)** - Development environment
- **[🤝 Contributing](../CONTRIBUTING.md)** - How to contribute

### 🔌 API Documentation  
- **[📋 API Overview](../api/README.md)** - API introduction
- **[📱 Device Management](../api/DEVICES.md)** - Device CRUD operations
- **[📊 Data Retrieval](../api/READINGS.md)** - Reading sensor data
- **[📖 Integration Examples](../api/EXAMPLES.md)** - Code samples

## 🆘 Getting Help

### 📋 Before Asking for Help

1. **Check Common Issues** - [troubleshooting/common-issues.md](troubleshooting/common-issues.md)
2. **Verify Wiring** - [hardware/aht20.md](hardware/aht20.md)
3. **Test API Connection** - [../api/EXAMPLES.md](../api/EXAMPLES.md)
4. **Review Logs** - Check device and service logs

### 📞 Support Channels

- **🐛 Hardware Issues** - [GitHub Issues: hardware](https://github.com/your-org/techtemp/issues?q=label%3Ahardware)
- **⚙️ Configuration Help** - [GitHub Discussions: devices](https://github.com/your-org/techtemp/discussions?discussions_q=category%3Adevices)
- **📚 Documentation** - [GitHub Issues: docs](https://github.com/your-org/techtemp/issues?q=label%3Adocumentation)

---

## ⚡ Quick Reference

**Essential Commands:**
```bash
# Provision new device
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_uid": "aht20-new", "room_name": "Room Name"}'

# Check device status  
curl http://localhost:3000/api/v1/devices/aht20-new

# Monitor device data
mosquitto_sub -h localhost -t "devices/aht20-new/data"

# Get latest readings
curl http://localhost:3000/api/v1/devices/aht20-new/readings?limit=5
```

**Quick Links:**
- [🔧 AHT20 Wiring](hardware/aht20.md)
- [🚀 Bootstrap Guide](setup/bootstrap.md)  
- [🛠️ Troubleshooting](troubleshooting/common-issues.md)
- [📡 MQTT Examples](../api/EXAMPLES.md#mqtt-device-integration)
