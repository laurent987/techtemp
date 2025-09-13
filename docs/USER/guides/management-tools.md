**[⬅️ Back to Setup Guide](../README.md)**

# 🛠️ Management Tools Guide

> **Maintain and expand your TechTemp system** - User-friendly commands to manage your home monitoring.

---

## 🎯 **Tool Overview**

All TechTemp management happens from your computer - no need to SSH directly to your Pi!

**🖥️ Run from your computer:**
```bash
cd techtemp  # Navigate to TechTemp folder first
./scripts/user/[command] pi@192.168.1.100 [options]
```

---

## 📋 **Available Tools**

### **🔍 System Monitoring**

#### **`check-system.sh` - Health Check**
```bash
# Quick system overview
./scripts/user/check-system.sh pi@192.168.1.100

# Detailed diagnostics
./scripts/user/check-system.sh pi@192.168.1.100 --verbose

# Check specific room
./scripts/user/check-system.sh pi@192.168.1.100 --room "Living Room"
```

**Shows you:**
- ✅ Server status (running/stopped)
- ✅ Database health and size
- ✅ All sensors and their status
- ✅ Current temperature readings
- ✅ Disk space and memory usage
- ✅ Network connectivity

#### **`view-rooms.sh` - Room Overview**
```bash
# List all configured rooms
./scripts/user/view-rooms.sh pi@192.168.1.100

# Show with current readings
./scripts/user/view-rooms.sh pi@192.168.1.100 --with-data

# Export room configuration
./scripts/user/view-rooms.sh pi@192.168.1.100 --export rooms.json
```

**Output example:**
```
📊 TechTemp Rooms Overview
┌─────────────┬─────────────┬─────────────┬──────────────┐
│ Room        │ Temperature │ Humidity    │ Last Update  │
├─────────────┼─────────────┼─────────────┼──────────────┤
│ Living Room │ 22.5°C      │ 45%         │ 30s ago      │
│ Kitchen     │ 24.1°C      │ 52%         │ 45s ago      │
│ Bedroom     │ 20.8°C      │ 38%         │ 1m ago       │
└─────────────┴─────────────┴─────────────┴──────────────┘
```

---

### **🏠 Room Management**

#### **`setup-room-sensor.sh` - Add New Rooms**
```bash
# Add a new room (basic)
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Office"

# Add with custom settings
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Basement" \
  --interval 60 \
  --temp-offset -0.5 \
  --gpio-sda 4 \
  --gpio-scl 5

# Add room on different Pi
./scripts/user/setup-room-sensor.sh pi@192.168.1.101 "Garage"
```

#### **`manage-room.sh` - Modify Existing Rooms**
```bash
# Rename a room
./scripts/user/manage-room.sh pi@192.168.1.100 rename "Living Room" "Main Floor"

# Update room settings
./scripts/user/manage-room.sh pi@192.168.1.100 configure "Kitchen" \
  --interval 30 \
  --temp-offset 0.8

# Move room to different Pi
./scripts/user/manage-room.sh pi@192.168.1.100 move "Office" pi@192.168.1.102

# Remove a room (keeps historical data)
./scripts/user/manage-room.sh pi@192.168.1.100 remove "Old Bedroom"
```

---

### **📤 Data Management**

#### **`export-data.sh` - Export Historical Data**
```bash
# Export last 30 days, all rooms
./scripts/user/export-data.sh pi@192.168.1.100 --days 30 --format csv

# Export specific room and date range
./scripts/user/export-data.sh pi@192.168.1.100 \
  --room "Living Room" \
  --start 2024-01-01 \
  --end 2024-01-31 \
  --format excel

# Export for analysis tools
./scripts/user/export-data.sh pi@192.168.1.100 \
  --format json \
  --output ~/temperature_analysis.json

# Export with statistics
./scripts/user/export-data.sh pi@192.168.1.100 \
  --days 7 \
  --include-stats \
  --format csv
```

**Export formats:**
- **CSV:** For Excel, Google Sheets
- **JSON:** For programming/analysis
- **Excel:** Native .xlsx format
- **SQLite:** Raw database export

#### **`backup-data.sh` - Backup System**
```bash
# Full system backup
./scripts/user/backup-data.sh pi@192.168.1.100 --output ~/techtemp-backup.tar.gz

# Database only
./scripts/user/backup-data.sh pi@192.168.1.100 --database-only

# Automatic daily backups
./scripts/user/backup-data.sh pi@192.168.1.100 --schedule daily --destination ~/backups/
```

---

### **🔧 System Maintenance**

#### **`update-system.sh` - Keep TechTemp Updated**
```bash
# Check for updates
./scripts/user/update-system.sh pi@192.168.1.100 --check

# Update TechTemp software
./scripts/user/update-system.sh pi@192.168.1.100

# Update with automatic backup
./scripts/user/update-system.sh pi@192.168.1.100 --backup-first

# Update Pi OS as well
./scripts/user/update-system.sh pi@192.168.1.100 --include-os
```

#### **`restart-services.sh` - Restart Components**
```bash
# Restart TechTemp server
./scripts/user/restart-services.sh pi@192.168.1.100 --server

# Restart all sensors
./scripts/user/restart-services.sh pi@192.168.1.100 --sensors

# Full system restart
./scripts/user/restart-services.sh pi@192.168.1.100 --all

# Restart specific room sensor
./scripts/user/restart-services.sh pi@192.168.1.100 --room "Kitchen"
```

---

### **🧪 Testing and Diagnostics**

#### **`test-sensor.sh` - Sensor Testing**
```bash
# Test specific sensor
./scripts/user/test-sensor.sh pi@192.168.1.100 "Living Room"

# Test all sensors
./scripts/user/test-sensor.sh pi@192.168.1.100 --all

# Continuous monitoring test
./scripts/user/test-sensor.sh pi@192.168.1.100 "Kitchen" --continuous --duration 5m

# Calibration test
./scripts/user/test-sensor.sh pi@192.168.1.100 "Bedroom" --calibrate
```

#### **`network-test.sh` - Network Diagnostics**
```bash
# Test Pi connectivity
./scripts/user/network-test.sh pi@192.168.1.100

# Test from multiple sensor Pis
./scripts/user/network-test.sh --discover

# Speed test between Pi and computer
./scripts/user/network-test.sh pi@192.168.1.100 --speed-test
```

---

## 🔄 **Automation Examples**

### **Daily Maintenance Script**

Create `~/daily-techtemp.sh`:
```bash
#!/bin/bash
PI_IP="pi@192.168.1.100"
cd ~/techtemp

echo "🔍 Daily TechTemp Check - $(date)"

# System health check
./scripts/user/check-system.sh $PI_IP

# Backup data (keep last 7 days)
./scripts/user/backup-data.sh $PI_IP --database-only --output ~/backups/daily-$(date +%Y%m%d).db

# Clean old backups
find ~/backups/ -name "daily-*.db" -mtime +7 -delete

echo "✅ Daily check complete"
```

### **Weekly Reports**

Create `~/weekly-report.sh`:
```bash
#!/bin/bash
PI_IP="pi@192.168.1.100"
cd ~/techtemp

# Export last week's data
./scripts/user/export-data.sh $PI_IP \
  --days 7 \
  --include-stats \
  --format csv \
  --output ~/reports/week-$(date +%Y%W).csv

# Email report (if sendmail configured)
echo "Weekly TechTemp report attached" | mail -s "Home Temperature Report" \
  -A ~/reports/week-$(date +%Y%W).csv \
  your-email@example.com
```

---

## 📊 **Monitoring Multiple Pis**

### **Multi-Pi Management**

```bash
# Define your Pis
MAIN_PI="pi@192.168.1.100"
KITCHEN_PI="pi@192.168.1.101"  
BEDROOM_PI="pi@192.168.1.102"

# Check all systems
for pi in $MAIN_PI $KITCHEN_PI $BEDROOM_PI; do
  echo "Checking $pi..."
  ./scripts/user/check-system.sh $pi
done

# Bulk data export
./scripts/user/export-data.sh $MAIN_PI --all-pis --days 30
```

### **Centralized Configuration**

Create `~/.techtemp/config`:
```bash
# TechTemp Configuration
MAIN_SERVER="pi@192.168.1.100"
SENSOR_NODES=(
  "pi@192.168.1.101:Kitchen"
  "pi@192.168.1.102:Bedroom" 
  "pi@192.168.1.103:Office"
)
BACKUP_DIR="~/techtemp-backups"
EXPORT_FORMAT="csv"
```

---

## 🚨 **Troubleshooting Tools**

### **Common Issues and Solutions**

#### **Sensor Stopped Working**
```bash
# Check specific sensor
./scripts/user/test-sensor.sh pi@192.168.1.100 "Kitchen"

# Restart sensor
./scripts/user/restart-services.sh pi@192.168.1.100 --room "Kitchen"

# Reconfigure if needed
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Kitchen" --force-reconfigure
```

#### **Dashboard Not Responding**
```bash
# Check server status
./scripts/user/check-system.sh pi@192.168.1.100 --verbose

# Restart server
./scripts/user/restart-services.sh pi@192.168.1.100 --server

# Check logs
./scripts/user/check-system.sh pi@192.168.1.100 --logs
```

#### **High Disk Usage**
```bash
# Check disk space
./scripts/user/check-system.sh pi@192.168.1.100 --disk

# Clean old data (older than 1 year)
./scripts/user/cleanup-data.sh pi@192.168.1.100 --older-than 365

# Compress database
./scripts/user/maintenance.sh pi@192.168.1.100 --compress-db
```

---

## 💡 **Pro Tips**

### **⏰ Scheduled Maintenance**

Add to your crontab (`crontab -e`):
```bash
# Daily health check (8 AM)
0 8 * * * cd ~/techtemp && ./scripts/user/check-system.sh pi@192.168.1.100 > ~/logs/daily-check.log

# Weekly backup (Sunday 2 AM)  
0 2 * * 0 cd ~/techtemp && ./scripts/user/backup-data.sh pi@192.168.1.100 --output ~/backups/weekly-$(date +\%Y\%W).tar.gz

# Monthly data export (1st of month, 3 AM)
0 3 1 * * cd ~/techtemp && ./scripts/user/export-data.sh pi@192.168.1.100 --days 30 --output ~/exports/monthly-$(date +\%Y\%m).csv
```

### **🔔 Alert Notifications**

Create monitoring alerts:
```bash
# Temperature alert script
#!/bin/bash
TEMP=$(./scripts/user/check-system.sh pi@192.168.1.100 --room "Server Room" --temp-only)
if (( $(echo "$TEMP > 28" | bc -l) )); then
  echo "🚨 Server room too hot: ${TEMP}°C" | mail -s "Temperature Alert" admin@example.com
fi
```

---

## 🎉 **You're Now a TechTemp Pro!**

You have all the tools to manage and maintain your home monitoring system. Remember:

- 🔍 **Monitor regularly** with `check-system.sh`
- 💾 **Backup your data** with `backup-data.sh`  
- 🔄 **Keep updated** with `update-system.sh`
- 📊 **Export data** for analysis with `export-data.sh`

**Need more help?** Check [Troubleshooting](troubleshooting/) guides!

---

<div align="center">

**🛠️ Manage your system like a pro!**

**[📱 Setup Guide](../README.md)** • **[📊 Dashboard](dashboard-guide.md)** • **[🚨 Troubleshooting](troubleshooting/)**

</div>