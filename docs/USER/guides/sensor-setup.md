**[⬅️ Back to Setup Guide](../README.md)**

# 🌡️ Sensor Setup Guide

> **Add temperature sensors to your rooms** - Connect AHT20 sensors and start collecting real data.

---

## ⏱️ **Time Required: 5 minutes per sensor**

Simple 4-wire connection + one command to configure each room.

---

## 🔧 **Prerequisites**

Before starting, make sure you have:

✅ **TechTemp server running** (completed [Server Installation](server-installation.md))  
✅ **AHT20 temperature sensor** ($5 on Amazon/AliExpress)  
✅ **4 jumper wires** (male-to-female)  
✅ **Breadboard** (optional, makes connections easier)  

---

## 🔌 **Hardware Connection**

### **AHT20 to Raspberry Pi Wiring**

```
AHT20 Pin → Raspberry Pi Pin
VCC (3.3V) → Pin 1  (3.3V Power)
GND        → Pin 6  (Ground)  
SDA        → Pin 3  (GPIO 2 / I2C Data)
SCL        → Pin 5  (GPIO 3 / I2C Clock)
```

### **Visual Wiring Guide**

```
Raspberry Pi (Top View)
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│ │3│ │5│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │6│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘

Pin 1: 3.3V  → AHT20 VCC (Red wire)
Pin 3: SDA   → AHT20 SDA (Blue wire)  
Pin 5: SCL   → AHT20 SCL (Yellow wire)
Pin 6: GND   → AHT20 GND (Black wire)
```

### **Connection Tips**

- **🔴 Red wire:** VCC to Pin 1 (3.3V power)
- **⚫ Black wire:** GND to Pin 6 (ground)  
- **🔵 Blue wire:** SDA to Pin 3 (data)
- **🟡 Yellow wire:** SCL to Pin 5 (clock)

**⚠️ Important:** Use 3.3V, not 5V! AHT20 sensors can be damaged by 5V.

---

## 💻 **Software Setup**

### **Configure Your First Room**

**From your work computer:**

```bash
# Navigate to TechTemp folder
cd techtemp

# Set up sensor for a specific room (replace IP and room name)
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Living Room"
```

**What the script does:**
- ✅ Install I2C drivers on the Pi
- ✅ Detect the AHT20 sensor  
- ✅ Configure the room in TechTemp database
- ✅ Start collecting temperature/humidity data
- ✅ Test sensor readings

### **Verify It's Working**

```bash
# Check system status
./scripts/user/check-system.sh pi@192.168.1.100

# You should see:
# ✅ Server running
# ✅ Living Room: 22.5°C, 45% humidity (AHT20)
```

**Check the dashboard:** `http://192.168.1.100:3000`
- You should see "Living Room" with real temperature data!

---

## 🏠 **Adding More Rooms**

### **Option A: Multiple Sensors on One Pi**

**Connect additional AHT20s to different I2C addresses:**

```bash
# Each sensor needs different GPIO pins
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Bedroom" --gpio-sda 4 --gpio-scl 5
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Kitchen" --gpio-sda 6 --gpio-scl 7
```

**Wiring for multiple sensors:**
```
Sensor 1 (Living Room): SDA→Pin3, SCL→Pin5  
Sensor 2 (Bedroom):     SDA→Pin7, SCL→Pin11
Sensor 3 (Kitchen):     SDA→Pin8, SCL→Pin10
```

### **Option B: Separate Pi Per Room (Recommended)**

**Set up dedicated sensor nodes:**

```bash
# Kitchen Pi (different IP address)
./scripts/user/setup-room-sensor.sh pi@192.168.1.101 "Kitchen"

# Bedroom Pi  
./scripts/user/setup-room-sensor.sh pi@192.168.1.102 "Bedroom"

# Office Pi
./scripts/user/setup-room-sensor.sh pi@192.168.1.103 "Office"
```

**Benefits:**
- ✅ More reliable (one sensor failure doesn't affect others)
- ✅ Better sensor placement (center of each room)
- ✅ Easier troubleshooting
- ✅ Can use Pi Zero W ($15) for sensor nodes

---

## 📊 **Sensor Data Flow**

```
AHT20 Sensor → Raspberry Pi → TechTemp Server → Web Dashboard
     ↑              ↑              ↑               ↑
  Measures       Reads every    Stores in      Shows graphs
  temp/humidity   30 seconds    database       & current data
```

**Data collection:**
- 📈 **Reading frequency:** Every 30 seconds
- 💾 **Data storage:** SQLite database on server Pi
- 🌐 **Web access:** Real-time dashboard updates
- 📱 **Mobile friendly:** Responsive design

---

## 🔧 **Advanced Configuration**

### **Custom Sensor Settings**

```bash
# Change reading frequency (default: 30 seconds)
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Garage" --interval 60

# Set temperature offset for calibration
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Basement" --temp-offset -0.5

# Custom I2C bus (for multiple sensors)
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Attic" --i2c-bus 1
```

### **Room Management**

```bash
# List all configured rooms
./scripts/user/view-rooms.sh pi@192.168.1.100

# Rename a room
./scripts/user/manage-room.sh pi@192.168.1.100 rename "Living Room" "Main Floor"

# Remove a room
./scripts/user/manage-room.sh pi@192.168.1.100 remove "Old Office"
```

---

## 🚨 **Troubleshooting**

### **❌ "No sensor detected"**

**Problem:** Script can't find AHT20 sensor

**Check wiring:**
```bash
# Test I2C connection on Pi
ssh pi@192.168.1.100 "i2cdetect -y 1"

# Should show device at address 0x38:
#      0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
# 30: -- -- -- -- -- -- -- -- 38 -- -- -- -- -- -- --
```

**Common fixes:**
- Double-check wire connections
- Ensure using 3.3V, not 5V
- Try different jumper wires (they can break)
- Make sure AHT20 is genuine (cheap clones exist)

### **❌ "Sensor readings are wrong"**

**Problem:** Temperature/humidity values seem incorrect

**Calibration:**
```bash
# Add temperature offset if sensor reads high/low
./scripts/user/calibrate-sensor.sh pi@192.168.1.100 "Living Room" --temp-offset -1.2

# Test with known reference (thermometer)
./scripts/user/test-sensor.sh pi@192.168.1.100 "Living Room"
```

### **❌ "Data not appearing in dashboard"**

**Problem:** Sensor connected but no data in web interface

**Check data flow:**
```bash
# Verify sensor is sending data
ssh pi@192.168.1.100 "tail -f /var/log/techtemp/sensor.log"

# Check database connection
./scripts/user/check-system.sh pi@192.168.1.100 --verbose
```

### **❌ "Multiple sensors conflict"**

**Problem:** Only one sensor works when multiple connected

**Solution:** Use different I2C buses or addresses
```bash
# Check which sensors are detected
ssh pi@192.168.1.100 "i2cdetect -y 1"

# Configure sensors on different buses
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Room1" --i2c-bus 1
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Room2" --i2c-bus 0
```

---

## 🎉 **Success! What's Next?**

Your sensors are now collecting data. Next steps:

1. **[Explore the Dashboard](dashboard-guide.md)** - Learn the web interface
2. **[Management Tools](management-tools.md)** - Maintain your sensors  
3. **[Data Export](data-export.md)** - Export historical data

---

<div align="center">

**🌡️ Your rooms are now monitored!**

**[📱 Setup Guide](../README.md)** • **[📊 Dashboard](dashboard-guide.md)** • **[🛠️ Troubleshooting](troubleshooting/)**

</div>