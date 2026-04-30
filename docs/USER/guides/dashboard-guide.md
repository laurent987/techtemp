**[⬅️ Back to Setup Guide](../README.md)**

# 📱 Dashboard Guide

> **Access and understand your TechTemp data** - Learn the web interface and all its features.

---

## 🌐 **Accessing Your Dashboard**

### **Web Address**

**From any device on your network:**
- **🖥️ Computer:** `http://192.168.1.100:3000` (replace with your Pi's IP)
- **📱 Phone/Tablet:** Same URL, mobile-optimized interface  
- **🔖 Bookmark it!** Add to home screen for quick access

### **Finding Your Pi's IP**

**Don't remember your Pi's IP?**
```bash
# From your computer
nmap -sn 192.168.1.0/24 | grep -B2 -A2 "Raspberry Pi"

# Or check your router's admin page
# Usually: http://192.168.1.1 or http://192.168.0.1
```

---

## 📊 **Dashboard Overview**

### **Main Dashboard Screen**

When you open TechTemp, you'll see:

**🏠 Room Cards**
- **Current temperature** (large number)
- **Current humidity** (percentage)  
- **Last updated** timestamp
- **Sensor status** (online/offline)

**📈 Live Graphs**
- **Temperature trends** over last 24 hours
- **Humidity trends** over last 24 hours
- **Multi-room comparison** on same chart

**⚙️ System Status**
- **Server health** indicator
- **Database size** and status
- **Active sensors** count

### **Mobile Interface**

**📱 Phone/Tablet view automatically:**
- Stacks room cards vertically
- Simplified navigation
- Touch-friendly controls
- Swipe between time ranges

---

## 📈 **Understanding the Data**

### **Temperature Display**

**🌡️ Current readings:**
- **Large number:** Current temperature (°C or °F)
- **Color coding:** 
  - 🔵 Blue: Cold (< 18°C)
  - 🟢 Green: Comfortable (18-25°C)  
  - 🟡 Yellow: Warm (25-28°C)
  - 🔴 Red: Hot (> 28°C)

### **Humidity Display**

**💧 Humidity levels:**
- **Percentage:** Current relative humidity
- **Comfort zones:**
  - 🔴 Too Dry: < 30%
  - 🟢 Comfortable: 30-60%
  - 🔴 Too Humid: > 60%

### **Historical Graphs**

**📊 Time range options:**
- **Last Hour:** Real-time monitoring
- **Last 24 Hours:** Daily patterns  
- **Last Week:** Weekly trends
- **Last Month:** Monthly overview
- **Custom Range:** Pick any date range

**Graph features:**
- **Zoom:** Click and drag to zoom into specific times
- **Hover:** See exact values at any point
- **Multiple rooms:** Compare different rooms on same chart
- **Export:** Download graph data as CSV

---

## 🏠 **Room Management**

### **Adding Rooms**

**From the dashboard:**
1. Click **"+ Add Room"** button
2. Enter room name (e.g., "Master Bedroom")
3. Select sensor Pi (if multiple)
4. Configure sensor settings
5. Click **"Save"**

**Or use command line:**
```bash
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "New Room"
```

### **Editing Rooms**

**Click any room card to:**
- **Rename** the room
- **Change sensor settings** (reading frequency, calibration)
- **View detailed history** for that room
- **Export data** for that room only
- **Delete** the room (keeps historical data)

### **Room Organization**

**Dashboard layout:**
- **Drag and drop** room cards to reorder
- **Favorite rooms** appear first
- **Hide/show** specific rooms
- **Group by floor** or area

---

## 📤 **Data Export**

### **Export Options**

**From the dashboard:**
1. Click **"Export Data"** button
2. Choose **date range**
3. Select **rooms** to include
4. Pick **format** (CSV, JSON, Excel)
5. Click **"Download"**

### **Command Line Export**

```bash
# Export last 30 days for all rooms
./scripts/user/export-data.sh pi@192.168.1.100 --days 30 --format csv

# Export specific room and date range  
./scripts/user/export-data.sh pi@192.168.1.100 --room "Living Room" --start 2024-01-01 --end 2024-01-31

# Export for analysis tools
./scripts/user/export-data.sh pi@192.168.1.100 --format json --output ~/temperature_data.json
```

### **Data Format**

**CSV export includes:**
```csv
timestamp,room,temperature_c,humidity_percent,sensor_id
2024-01-15 10:30:00,Living Room,22.5,45.2,aht20_001
2024-01-15 10:30:30,Living Room,22.6,45.1,aht20_001
2024-01-15 10:31:00,Kitchen,24.1,52.8,aht20_002
```

---

## ⚙️ **Settings and Configuration**

### **System Settings**

**Click the ⚙️ gear icon to access:**

**🌡️ Temperature Units**
- Celsius (°C) or Fahrenheit (°F)
- Applies to all displays and exports

**⏰ Time Settings**  
- Timezone configuration
- 12-hour or 24-hour format
- Data collection frequency

**🔔 Alerts (Coming Soon)**
- Temperature thresholds
- Humidity warnings
- Sensor offline notifications

### **User Preferences**

**💾 Saved preferences:**
- Default time range for graphs
- Preferred room layout
- Export format defaults
- Dashboard refresh rate

---

## 📱 **Mobile App Features**

### **Add to Home Screen**

**iPhone/iPad:**
1. Open dashboard in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Name it "TechTemp"

**Android:**
1. Open dashboard in Chrome
2. Tap menu (⋮)
3. Select "Add to Home screen"
4. Confirm with "Add"

### **Mobile-Specific Features**

**📱 Touch gestures:**
- **Swipe left/right:** Change time ranges
- **Pinch to zoom:** On graphs
- **Pull to refresh:** Update all data
- **Long press:** Room management menu

---

## 🔍 **Advanced Features**

### **API Access**

**For developers and automation:**

```bash
# Get current readings
curl http://192.168.1.100:3000/api/readings/current

# Get historical data
curl "http://192.168.1.100:3000/api/readings/history?room=Living%20Room&hours=24"

# System status
curl http://192.168.1.100:3000/api/status
```

### **Integration with Home Automation**

**Examples for Home Assistant, Node-RED, etc:**

```yaml
# Home Assistant sensor
sensor:
  - platform: rest
    resource: "http://192.168.1.100:3000/api/readings/current/Living%20Room"
    name: "Living Room Temperature"
    value_template: "{{ value_json.temperature }}"
    unit_of_measurement: "°C"
```

---

## 🚨 **Troubleshooting**

### **❌ Dashboard won't load**

**Problem:** `http://192.168.1.100:3000` shows error or times out

**Check server status:**
```bash
# Verify TechTemp is running
./scripts/user/check-system.sh pi@192.168.1.100

# Restart if needed
ssh pi@192.168.1.100 "cd techtemp && docker-compose restart"
```

### **❌ No data in graphs**

**Problem:** Dashboard loads but shows empty graphs

**Check sensors:**
```bash
# Verify sensors are collecting data
./scripts/user/check-system.sh pi@192.168.1.100 --verbose

# Check recent data
ssh pi@192.168.1.100 "cd techtemp && npm run db:latest-readings"
```

### **❌ Mobile interface issues**

**Problem:** Dashboard doesn't work well on phone/tablet

**Solutions:**
- Clear browser cache
- Try different browser (Chrome, Safari, Firefox)
- Check if JavaScript is enabled
- Ensure good WiFi connection

### **❌ Export fails**

**Problem:** Data export buttons don't work

**Manual export:**
```bash
# Export via command line
./scripts/user/export-data.sh pi@192.168.1.100 --days 7 --format csv
```

---

## 🎉 **Tips and Tricks**

### **📊 Data Analysis Tips**

- **Compare rooms:** Use multi-room graphs to see temperature differences
- **Find patterns:** Weekly view shows daily heating/cooling cycles  
- **Energy efficiency:** Monitor how quickly rooms heat/cool
- **Seasonal trends:** Monthly view shows longer-term changes

### **🏠 Home Monitoring Ideas**

- **HVAC efficiency:** See which rooms heat/cool faster
- **Insulation quality:** Compare temperature stability between rooms
- **Humidity control:** Monitor bathroom humidity after showers
- **Energy savings:** Track when heating/cooling is most needed

---

## 🎉 **Enjoy Your Data!**

You now have full access to your home's temperature and humidity data. Next steps:

1. **[Management Tools](management-tools.md)** - Maintain your system
2. **[Troubleshooting](troubleshooting.md)** - Fix any issues
3. **[Advanced Features](management-tools.md)** - API access and automation

---

<div align="center">

**📊 Monitor your home like a pro!**

**[📱 Setup Guide](../README.md)** • **[🌡️ Add Sensors](sensor-setup.md)** • **[🛠️ Management](management-tools.md)**

</div>