# 👤 TechTemp for End Users

> **Monitor your home's temperature and humidity** with professional-grade sensors and a beautiful web dashboard.

![TechTemp Dashboard](../assets/dashboard-screenshot.png)

---

## 🎯 **What You'll Get**

After following this guide (30 minutes), you'll have:

✅ **Real-time monitoring** of temperature & humidity in multiple rooms  
✅ **Web dashboard** accessible from any device on your network  
✅ **Historical data** tracking trends over time  
✅ **Room organization** with automatic device management  
✅ **Mobile-friendly** interface for checking from anywhere  

## 📋 **What You Need**

### **Central Server** (One-time setup)
- **Computer/Server:** Any machine that can run Docker (Raspberry Pi 4, old laptop, NAS, etc.)
- **Network:** Connected to your home WiFi/Ethernet
- **Storage:** 2GB free space minimum

### **For Each Room You Want to Monitor**
- **Raspberry Pi** (Pi Zero W, Pi 3, Pi 4 - any will work)
- **AHT20 Temperature/Humidity Sensor** (~$5 on AliExpress/Amazon)
- **MicroSD Card** (8GB minimum)
- **Power Supply** for the Pi
- **Basic wiring** (4 jumper wires)

**💰 Total Cost:** ~$40 for server + ~$35 per room sensor

---

## 🚀 **Quick Start Guide**

### **Step 1: Start the TechTemp Server** (10 minutes)

Choose your server setup method:

<details>
<summary><strong>🐳 Option A: Docker (Recommended)</strong></summary>

**Requirements:** Docker installed on your server machine

```bash
# 1. Download TechTemp
git clone https://github.com/laurent987/techtemp.git
cd techtemp

# 2. Start the server
docker compose up -d

# 3. Verify it's running
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

**✅ Server running at:** `http://YOUR_SERVER_IP:3000`

</details>

<details>
<summary><strong>💻 Option B: Direct Installation</strong></summary>

**Requirements:** Node.js 18+ installed

```bash
# 1. Download and setup
git clone https://github.com/laurent987/techtemp.git
cd techtemp/backend
npm install

# 2. Start MQTT broker (separate terminal)
# You'll need Mosquitto MQTT broker installed
mosquitto -p 1883

# 3. Start TechTemp (separate terminal)
cd backend
npm start
```

</details>

### **Step 2: Access Your Dashboard** (2 minutes)

1. **Open your browser** and go to: `http://YOUR_SERVER_IP:3000`
2. **You should see** the TechTemp dashboard (empty for now)
3. **Bookmark this URL** for easy access

![Empty Dashboard](../assets/empty-dashboard.png)

### **Step 3: Setup Your First Sensor** (15 minutes)

**🔌 Hardware Wiring:**

Connect your AHT20 sensor to Raspberry Pi:

```
AHT20 Sensor    →    Raspberry Pi
─────────────────────────────────
VCC (+)         →    3.3V (Pin 1)
GND (-)         →    Ground (Pin 6)  
SDA (Data)      →    GPIO 2 (Pin 3)
SCL (Clock)     →    GPIO 3 (Pin 5)
```

**💿 Software Setup:**

1. **Flash Raspberry Pi OS** to your SD card
2. **Enable SSH and WiFi** during setup
3. **Copy our device code** to your Pi:

```bash
# On your Pi (via SSH)
git clone https://github.com/laurent987/techtemp.git
cd techtemp/device

# Compile the sensor code
make

# Configure for your network
cp config/device.conf.simple config/device.conf
# Edit config/device.conf with your MQTT server IP
```

4. **Register your device** with the server:

```bash
# From any computer, register your new sensor
curl -X POST http://YOUR_SERVER_IP:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "sensor-living-room",
    "room_name": "Living Room", 
    "label": "Living Room Temperature Sensor"
  }'
```

5. **Start sending data:**

```bash
# On your Pi, start the sensor
cd techtemp/device
./build/techtemp-device
```

### **Step 4: Verify Everything Works** (3 minutes)

1. **Refresh your dashboard** - you should see your new device
2. **Check the data** - temperature/humidity readings should appear
3. **Wait a few minutes** - data updates every 30 seconds

![Working Dashboard](../assets/working-dashboard.png)

---

## 📱 **Using Your Dashboard**

### **Main Dashboard Features**

- **🏠 Rooms Overview:** See all your rooms at a glance
- **📊 Current Readings:** Latest temperature/humidity from each sensor  
- **🕒 Last Updated:** When each sensor last sent data
- **📈 Status Indicators:** Green = healthy, Yellow = warning, Red = offline

### **Navigation**

- **Auto-refresh:** Dashboard updates every 30 seconds automatically
- **Mobile-friendly:** Works perfectly on phones and tablets
- **Room filtering:** Click on rooms to focus on specific areas
- **Device details:** Click on any sensor for detailed information

### **Reading the Data**

- **Temperature:** Displayed in Celsius (°C)
- **Humidity:** Displayed as percentage (%)
- **Timestamp:** Shows when the reading was taken
- **Trends:** Color coding shows if values are rising/falling

---

## 🏠 **Adding More Rooms**

Once your first sensor is working, adding more is easy:

### **For Each New Room:**

1. **Setup hardware:** Wire another Pi + AHT20 sensor
2. **Copy the device code** to the new Pi  
3. **Register the device** with a new `device_uid`:

```bash
curl -X POST http://YOUR_SERVER_IP:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_uid": "sensor-bedroom",
    "room_name": "Bedroom",
    "label": "Bedroom Temperature Sensor"
  }'
```

4. **Start the sensor** on the new Pi
5. **Check your dashboard** - new room appears automatically!

### **Room Organization Tips**

- **Use descriptive names:** "Master Bedroom", "Kids Room", "Basement"
- **Consistent naming:** Keep device UIDs simple: `sensor-kitchen`, `sensor-garage`
- **Label clearly:** "Kitchen Temperature Sensor" is better than "Sensor 1"

---

## 🛠️ **Troubleshooting**

### **Dashboard Not Loading**

**Problem:** Can't access `http://YOUR_SERVER_IP:3000`

**Solutions:**
1. **Check server is running:** `docker compose ps` or `curl localhost:3000/health`
2. **Check firewall:** Make sure port 3000 is open
3. **Check IP address:** Use `ip addr` to find your server's real IP
4. **Try localhost:** If on same machine, try `http://localhost:3000`

### **No Data from Sensors**

**Problem:** Sensor appears in dashboard but no readings

**Solutions:**
1. **Check sensor wiring:** Verify AHT20 connections
2. **Check device logs:** Look for error messages on the Pi
3. **Check MQTT connection:** Verify Pi can reach your server
4. **Check device registration:** Make sure device is provisioned in API

### **Sensor Goes Offline**

**Problem:** Sensor was working but stopped sending data

**Solutions:**
1. **Check Pi power:** Make sure Pi is still running
2. **Check WiFi:** Pi might have lost network connection  
3. **Restart sensor:** Reboot the Pi or restart the sensor program
4. **Check server logs:** Look for MQTT connection issues

### **Getting Help**

- **📖 Device Setup:** [Detailed hardware guide](../devices/README.md)
- **🔧 API Reference:** [Developer documentation](../DEVELOPER/README.md)
- **💬 Community:** [GitHub Discussions](https://github.com/laurent987/techtemp/discussions)
- **🐛 Bug Reports:** [GitHub Issues](https://github.com/laurent987/techtemp/issues)

---

## 🔄 **Maintenance**

### **Daily Tasks**
- **None!** TechTemp runs automatically

### **Weekly Check**
- **Glance at dashboard** to make sure all sensors are online
- **Check for any alerts** or offline devices

### **Monthly Tasks**
- **Update software:** `docker compose pull && docker compose up -d`
- **Check disk space:** Make sure server has enough storage
- **Review sensor performance:** Look for any patterns or issues

### **Backup**
Your data is stored in `./backend/db/techtemp.db`. To backup:

```bash
# Create backup
cp backend/db/techtemp.db backup-$(date +%Y%m%d).db

# Restore from backup
cp backup-20250312.db backend/db/techtemp.db
```

---

## 📈 **Next Steps**

Once you're comfortable with TechTemp:

### **🏠 Home Assistant Integration**
Connect TechTemp to Home Assistant for advanced automation:
- **Temperature-based climate control**
- **Humidity alerts and notifications**  
- **Historical charts and trends**

See: [Home Assistant Integration Guide](home-assistant.md)

### **📱 Mobile Notifications**
Set up alerts for:
- **Temperature extremes** (too hot/cold)
- **Humidity issues** (too dry/humid)
- **Sensor offline** notifications

See: [Notification Setup Guide](notifications.md)

### **📊 Advanced Monitoring**
- **Historical data analysis**
- **Export data to spreadsheets**
- **Custom dashboards and reports**

See: [Advanced Features Guide](advanced.md)

---

## 💡 **Tips & Best Practices**

### **Sensor Placement**
- **Avoid direct sunlight** - affects temperature readings
- **Away from heat sources** - radiators, electronics, etc.
- **Good airflow** - don't enclose in tight spaces
- **Stable mounting** - secure to prevent movement

### **Network Setup**
- **Use 2.4GHz WiFi** - better range for IoT devices
- **Static IP for server** - prevents dashboard URL changes
- **Good WiFi coverage** - ensure all sensor locations have signal

### **Performance**
- **One sensor per room** is usually sufficient
- **30-second updates** are ideal for most use cases
- **Check battery life** if using portable sensors

---

**🎉 Congratulations!** You now have a professional home monitoring system running. Your TechTemp setup will reliably track your home's environment and help you maintain optimal comfort and air quality.

**Questions?** Check our [FAQ](faq.md) or visit [GitHub Discussions](https://github.com/laurent987/techtemp/discussions).
