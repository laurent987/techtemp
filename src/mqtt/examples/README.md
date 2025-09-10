# 📡 MQTT Examples

This folder contains structured and educational examples to demonstrate MQTT client usage.

## � Structure

```
src/mqtt/examples/
├── publisher.js      # ✈️ Sending MQTT messages
├── subscriber.js     # 📥 Listening for MQTT messages  
├── cleaner.js        # 🧹 Cleaning retained messages
└── README.md         # 📚 This guide
```

## 🎯 Educational Objectives

### **publisher.js** - Sending messages
✅ **Demonstrated features:**
- Connection to MQTT broker
- Publishing with different QoS (0, 1, 2)
- JSON and text formats
- Option handling (retain, qos)
- Clean disconnection

### **subscriber.js** - Receiving messages  
✅ **Demonstrated features:**
- Connection to MQTT broker
- Subscription with patterns/wildcards (`+`, `#`)
- Automatic JSON vs text analysis
- Message metadata (QoS, retain, size)
- Real-time statistics
- Clean shutdown with Ctrl+C

### **cleaner.js** - Retained cleanup
✅ **Demonstrated features:**
- Removal of retained messages
- Cleanup statistics
- Error handling
- Operation validation

## 🚀 Usage

### **Complete test in 3 terminals**

#### Terminal 1 - Subscriber (listening)
```bash
cd service-app
node src/mqtt/examples/subscriber.js
```

#### Terminal 2 - Publisher (sending)
```bash
cd service-app  
node src/mqtt/examples/publisher.js
```

#### Terminal 3 - Cleaner (cleanup)
```bash
cd service-app
node src/mqtt/examples/cleaner.js
```

### **Custom options**

```bash
# Custom broker
node publisher.js mqtt://localhost:1883

# Custom topic
node subscriber.js mqtt://test.mosquitto.org "sensors/#"

# Single message
node publisher.js mqtt://test.mosquitto.org sensors/temp001 "Hello MQTT"
```

### **Built-in help**

```bash
node publisher.js --help
node subscriber.js --help  
node cleaner.js --help
```

## 📋 Useful MQTT Patterns

| Pattern | Description | Examples |
|---------|-------------|----------|
| `home/+/sensors/+/reading` | IoT sensor data | `home/home-001/sensors/temp001/reading`, `home/home-002/sensors/humidity001/reading` |
| `home/home-001/sensors/#` | All sensors in home | `home/home-001/sensors/temp001/reading`, `home/home-001/sensors/humidity001/reading` |
| `home/+/sensors/temp001/reading` | Specific sensor across homes | `home/home-001/sensors/temp001/reading`, `home/home-002/sensors/temp001/reading` |
| `+/status` | All device status | `temp001/status`, `humidity001/status` |
| `sensors/+` | All sensor topics | `sensors/temp001`, `sensors/humidity001` |

## 🔧 Test MQTT Brokers

| Broker | URL | Description |
|--------|-----|-------------|
| Eclipse Mosquitto | `mqtt://test.mosquitto.org:1883` | Public test broker |
| HiveMQ | `mqtt://broker.hivemq.com:1883` | Public test broker |
| Local | `mqtt://localhost:1883` | Local broker (if installed) |

## 💡 Usage Tips

### **Recommended startup:**
1. Launch `subscriber.js` first (to see messages)
2. Launch `publisher.js` (to send messages)
3. Observe messages in the subscriber terminal
4. Use `cleaner.js` if cleanup is needed

### **QoS (Quality of Service):**
- **QoS 0**: Fire and forget (no guarantee)
- **QoS 1**: At least once (with acknowledgment)  
- **QoS 2**: Exactly once (with double handshake)

### **Retained Messages:**
- Stored by the broker
- Automatically sent to new subscribers
- Removed with empty payload + retain=true

## 🐛 Troubleshooting

### **Connection error**
```
💥 Publisher failed: Error: Connection refused
```
**Solution:** Check that the broker is accessible and the URL is correct.

### **No messages received**
**Check:**
- The subscriber is launched before the publisher
- Topics match (watch out for wildcards)
- The broker is working correctly

### **Duplicate messages**
**Possible causes:**
- QoS 1 with retransmission
- Multiple publishers on the same topic
- Retained messages repeating

## 📚 Useful Links

- [MQTT Documentation](https://mqtt.org/)
- [MQTT.js (library used)](https://github.com/mqttjs/MQTT.js)
- [Public test brokers](https://github.com/mqtt/mqtt.github.io/wiki/public_brokers)
