**[⬅️ Back to Setup Guide](../README.md)**

# 🚨 Troubleshooting Guide

> **Solve common TechTemp issues quickly** - Step-by-step fixes for typical problems.

---

## 🔍 **Quick Diagnostics**

**First, run the health check:**
```bash
cd techtemp
./scripts/user/check-system.sh pi@192.168.1.100 --verbose
```

This will show you exactly what's working and what's not!

---

## 🌡️ **Sensor Issues**

### **❌ Sensor Not Detected**

**Symptoms:** No temperature readings, sensor shows "offline"

**Solutions:**
```bash
# 1. Check physical connections
# Verify AHT20 wiring: VCC→3.3V, GND→GND, SDA→GPIO2, SCL→GPIO3

# 2. Test I2C detection
ssh pi@192.168.1.100
sudo i2cdetect -y 1
# Should show "38" at address 0x38

# 3. Reconfigure sensor
exit  # Back to your computer
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Living Room" --force-reconfigure

# 4. Test sensor directly
./scripts/user/test-sensor.sh pi@192.168.1.100 "Living Room"
```

### **📊 Sensor Readings Incorrect**

**Symptoms:** Temperature/humidity values seem wrong

**Solutions:**
```bash
# 1. Calibrate against known reference
./scripts/user/test-sensor.sh pi@192.168.1.100 "Living Room" --calibrate

# 2. Apply temperature offset
./scripts/user/manage-room.sh pi@192.168.1.100 configure "Living Room" --temp-offset 1.2

# 3. Apply humidity offset  
./scripts/user/manage-room.sh pi@192.168.1.100 configure "Living Room" --humid-offset -3.5

# 4. Check sensor placement
# Ensure sensor is:
# - Away from heat sources
# - Good air circulation  
# - Not in direct sunlight
# - At least 1m from air vents
```

### **⏰ Sensor Updates Slowly**

**Symptoms:** Long delays between readings

**Solutions:**
```bash
# 1. Reduce reading interval
./scripts/user/manage-room.sh pi@192.168.1.100 configure "Living Room" --interval 30

# 2. Check system load
./scripts/user/check-system.sh pi@192.168.1.100 --performance

# 3. Restart sensor service
./scripts/user/restart-services.sh pi@192.168.1.100 --room "Living Room"

# 4. Check power supply (should be 2.5A minimum)
```

---

## 🖥️ **Server Issues**

### **❌ Dashboard Won't Load**

**Symptoms:** Browser can't reach http://192.168.1.100:3000

**Solutions:**
```bash
# 1. Check if server is running
./scripts/user/check-system.sh pi@192.168.1.100

# 2. Restart TechTemp server
./scripts/user/restart-services.sh pi@192.168.1.100 --server

# 3. Check firewall (on Pi)
ssh pi@192.168.1.100
sudo ufw status
sudo ufw allow 3000
exit

# 4. Verify IP address
ping 192.168.1.100  # Should respond

# 5. Try different port
ssh pi@192.168.1.100 "sudo netstat -tulpn | grep :3000"
```

### **📱 Dashboard Loads but No Data**

**Symptoms:** Dashboard appears but shows "No data available"

**Solutions:**
```bash
# 1. Check database
./scripts/user/check-system.sh pi@192.168.1.100 --database

# 2. Verify data collection
./scripts/user/view-rooms.sh pi@192.168.1.100 --with-data

# 3. Check sensor status
./scripts/user/check-system.sh pi@192.168.1.100 --sensors

# 4. Force data refresh
./scripts/user/restart-services.sh pi@192.168.1.100 --all

# 5. Check recent readings
ssh pi@192.168.1.100
cd techtemp
npm run db:recent
exit
```

### **🐌 Dashboard Very Slow**

**Symptoms:** Dashboard takes long time to load or update

**Solutions:**
```bash
# 1. Check Pi performance
./scripts/user/check-system.sh pi@192.168.1.100 --performance

# 2. Clear browser cache
# In browser: Ctrl+Shift+R (hard refresh)

# 3. Reduce data range in dashboard
# Use date picker to show less data

# 4. Check database size
ssh pi@192.168.1.100
cd techtemp
du -h backend/db/techtemp.db
exit

# 5. Optimize database (if large)
./scripts/user/maintenance.sh pi@192.168.1.100 --optimize-db
```

---

## 🌐 **Network Issues**

### **❌ Can't Connect to Pi**

**Symptoms:** SSH connection fails, ping doesn't respond

**Solutions:**
```bash
# 1. Check Pi IP address
nmap -sn 192.168.1.0/24 | grep -i raspberry

# 2. Try different IP ranges
nmap -sn 192.168.0.0/24 | grep -i raspberry

# 3. Connect monitor to Pi and check IP
# On Pi desktop: ip addr show

# 4. Check router admin panel for connected devices

# 5. Reset network (on Pi with keyboard/monitor)
sudo systemctl restart networking
```

### **📡 Wi-Fi Connection Drops**

**Symptoms:** Pi goes offline intermittently

**Solutions:**
```bash
# 1. Check Wi-Fi signal strength
ssh pi@192.168.1.100
iwconfig wlan0
# Signal level should be better than -70 dBm

# 2. Switch to Ethernet if possible
# Much more reliable than Wi-Fi

# 3. Improve Wi-Fi signal
# - Move Pi closer to router
# - Remove physical obstructions
# - Change Wi-Fi channel on router

# 4. Disable Wi-Fi power management
sudo iwconfig wlan0 power off
exit

# 5. Make power management change permanent
ssh pi@192.168.1.100
echo 'iwconfig wlan0 power off' | sudo tee -a /etc/rc.local
exit
```

---

## 💾 **Data Issues**

### **📈 Missing Historical Data**

**Symptoms:** Gaps in temperature history

**Solutions:**
```bash
# 1. Check when data collection stopped
./scripts/user/export-data.sh pi@192.168.1.100 --days 7 --format csv
# Open CSV and look for gaps

# 2. Check system uptime history
ssh pi@192.168.1.100
last reboot
exit

# 3. Check disk space issues
./scripts/user/check-system.sh pi@192.168.1.100 --disk

# 4. Verify database integrity
ssh pi@192.168.1.100
cd techtemp
npm run db:check
exit

# 5. Restore from backup if needed
./scripts/user/backup-data.sh pi@192.168.1.100 --restore ~/backups/latest.tar.gz
```

### **💾 Database Corruption**

**Symptoms:** Error messages about database, export fails

**Solutions:**
```bash
# 1. Backup current database first
./scripts/user/backup-data.sh pi@192.168.1.100 --database-only --output ~/emergency-backup.db

# 2. Check database integrity
ssh pi@192.168.1.100
cd techtemp
sqlite3 backend/db/techtemp.db "PRAGMA integrity_check;"
exit

# 3. Repair database
ssh pi@192.168.1.100
cd techtemp
sqlite3 backend/db/techtemp.db "PRAGMA integrity_check;"
sqlite3 backend/db/techtemp.db ".recover" | sqlite3 repaired.db
mv backend/db/techtemp.db backend/db/techtemp.db.corrupt
mv repaired.db backend/db/techtemp.db
exit

# 4. Restart services
./scripts/user/restart-services.sh pi@192.168.1.100 --all
```

---

## 🔄 **System Issues**

### **💥 TechTemp Won't Start**

**Symptoms:** Services fail to start, error messages

**Solutions:**
```bash
# 1. Check system logs
ssh pi@192.168.1.100
sudo journalctl -u techtemp -f
# Look for error messages

# 2. Check file permissions
cd techtemp
ls -la
# All files should be owned by pi user

# 3. Reinstall dependencies
npm install
exit

# 4. Clean restart
./scripts/user/restart-services.sh pi@192.168.1.100 --clean

# 5. Full TechTemp reinstall if needed
ssh pi@192.168.1.100
cd ~
rm -rf techtemp
exit
# Then run server installation again
```

### **🔥 Pi Running Hot/Slow**

**Symptoms:** High CPU temperature, sluggish performance

**Solutions:**
```bash
# 1. Check temperature
ssh pi@192.168.1.100
vcgencmd measure_temp
# Should be under 70°C

# 2. Check running processes
top
# Look for high CPU usage

# 3. Add cooling
# - Install heatsinks
# - Add fan
# - Improve case ventilation

# 4. Reduce load
# - Increase sensor reading intervals
# - Disable unnecessary services

# 5. Check power supply
# Should be official 2.5A+ adapter
exit
```

### **💾 Disk Space Full**

**Symptoms:** "No space left on device" errors

**Solutions:**
```bash
# 1. Check disk usage
ssh pi@192.168.1.100
df -h
du -h ~ | sort -hr | head -20

# 2. Clean up logs
sudo journalctl --vacuum-time=7d
sudo rm -f /var/log/*.log.1

# 3. Clean old data (keep last year)
cd techtemp
npm run db:cleanup -- --older-than 365

# 4. Archive old data
exit
./scripts/user/export-data.sh pi@192.168.1.100 --days 365 --archive

# 5. Expand SD card (if recently imaged)
ssh pi@192.168.1.100
sudo raspi-config
# Choose "Advanced Options" → "Expand Filesystem"
sudo reboot
```

---

## 🔧 **Hardware Issues**

### **⚡ Power Supply Problems**

**Symptoms:** Random reboots, USB devices not working, voltage warnings

**Solutions:**
```bash
# 1. Check for voltage warnings
ssh pi@192.168.1.100
dmesg | grep -i voltage

# 2. Check power supply rating
# Must be 2.5A minimum, 3A recommended

# 3. Use shorter, higher quality USB cable

# 4. Avoid USB hubs or powered devices

# 5. Check for rainbow square in top-right corner
# Indicates power issues
exit
```

### **💳 SD Card Issues**

**Symptoms:** File corruption, read-only filesystem, random errors

**Solutions:**
```bash
# 1. Check SD card health
ssh pi@192.168.1.100
sudo fsck /dev/mmcblk0p2
exit

# 2. Backup everything immediately
./scripts/user/backup-data.sh pi@192.168.1.100 --full-system

# 3. Use high-quality SD card
# Recommended: SanDisk Extreme, Samsung EVO Select
# Minimum Class 10, prefer A1/A2 rating

# 4. Enable log2ram to reduce writes
ssh pi@192.168.1.100
sudo apt install log2ram
sudo reboot
exit

# 5. Replace SD card if problems persist
```

---

## 🆘 **Emergency Recovery**

### **🚨 Complete System Failure**

**When nothing else works:**

```bash
# 1. Image new SD card with fresh Raspberry Pi OS

# 2. Restore from backup
./scripts/user/setup-server.sh pi@192.168.1.100 --restore ~/backups/latest.tar.gz

# 3. Or start fresh and restore data only
./scripts/user/setup-server.sh pi@192.168.1.100
./scripts/user/backup-data.sh pi@192.168.1.100 --restore-data ~/backups/database.db

# 4. Reconfigure sensors
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Living Room"
./scripts/user/setup-room-sensor.sh pi@192.168.1.100 "Kitchen"
# ... repeat for each room
```

### **📱 Emergency Dashboard Access**

**If main dashboard is down:**

```bash
# 1. Access via direct IP and port
http://192.168.1.100:3000

# 2. Use simple dashboard
http://192.168.1.100:3000/simple

# 3. Check data via SSH
ssh pi@192.168.1.100
cd techtemp
npm run db:recent
exit

# 4. Export data for external viewing
./scripts/user/export-data.sh pi@192.168.1.100 --days 1 --format csv
```

---

## 📞 **Getting Help**

### **📝 Gathering Information**

**Before asking for help, collect this info:**

```bash
# 1. System information
./scripts/user/check-system.sh pi@192.168.1.100 --verbose > system-info.txt

# 2. Error logs
ssh pi@192.168.1.100
sudo journalctl -u techtemp --since "1 hour ago" > ~/error-logs.txt
exit
scp pi@192.168.1.100:~/error-logs.txt .

# 3. Hardware setup
# Take photos of sensor wiring
# Note Pi model and power supply specs

# 4. Network setup
ping 192.168.1.100
nmap -p 3000 192.168.1.100
```

### **📚 Documentation References**

- **[Setup Guide](../README.md)** - Complete setup instructions
- **[Management Tools](management-tools.md)** - All available commands
- **[Dashboard Guide](dashboard-guide.md)** - Web interface help
- **[SSH Setup](ssh-setup-guide.md)** - Connection troubleshooting

### **🐛 Reporting Issues**

**Include in your report:**
1. What you were trying to do
2. What happened instead
3. Error messages (exact text)
4. System info from `check-system.sh --verbose`
5. When the problem started
6. What changed recently

---

## ✅ **Prevention Tips**

### **🔄 Regular Maintenance**

```bash
# Weekly (automate with cron)
./scripts/user/check-system.sh pi@192.168.1.100
./scripts/user/backup-data.sh pi@192.168.1.100

# Monthly
./scripts/user/update-system.sh pi@192.168.1.100
./scripts/user/export-data.sh pi@192.168.1.100 --days 30

# When needed
./scripts/user/cleanup-data.sh pi@192.168.1.100 --older-than 365
```

### **🛡️ Best Practices**

- ✅ **Use quality power supply** (official 3A adapter)
- ✅ **Backup regularly** (automated weekly backups)  
- ✅ **Monitor disk space** (keep 20% free)
- ✅ **Keep system updated** (monthly updates)
- ✅ **Use Ethernet when possible** (more reliable than Wi-Fi)
- ✅ **Proper ventilation** (heatsinks, case fans)
- ✅ **Quality SD card** (A1/A2 rated, brand name)

---

<div align="center">

**🚨 Most problems have simple solutions!**

**[📱 Setup Guide](../README.md)** • **[🛠️ Management Tools](management-tools.md)** • **[📊 Dashboard](dashboard-guide.md)**

</div>