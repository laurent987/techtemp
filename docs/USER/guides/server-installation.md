**[⬅️ Back to Setup Guide](../README.md)**

# 🐳 Server Installation Guide

> **Set up your TechTemp central hub** - This server collects data from all your room sensors.

---

## ⏱️ **Time Required: 10-15 minutes**

Most of this is automated - you just need to run one command!

---

## 🔧 **Prerequisites**

Before starting, make sure you have:

✅ **Raspberry Pi with SSH access** (completed [Initial Pi Setup](initial-setup.md))  
✅ **Your computer can SSH to Pi without password** - Test: `ssh pi@192.168.1.100`  
✅ **Pi connected to internet** via WiFi/Ethernet  

---

## 🚀 **Quick Installation**

### **Step 1: Download TechTemp** (2 minutes)

**On your work computer:**
```bash
# Clone the TechTemp project
git clone https://github.com/laurent987/techtemp.git
cd techtemp
```

### **Step 2: Find Your Pi's IP** (1 minute)

```bash
# Scan your network for the Pi
nmap -sn 192.168.1.0/24

# Look for "Raspberry Pi Foundation" in the results
# Note the IP address (e.g., 192.168.1.100)
```

**Can't find your Pi?** → [Find Pi IP Guide](find-pi-ip.md)

### **Step 3: Run Automated Setup** (5-10 minutes)

```bash
# Replace 192.168.1.100 with your Pi's actual IP
./scripts/user/setup-server.sh pi@192.168.1.100
```

**What the script does automatically:**
- ✅ Install Docker on your Pi
- ✅ Set up the TechTemp database  
- ✅ Start the web server
- ✅ Create the monitoring dashboard
- ✅ Test everything works

---

## ✅ **Verify Installation**

### **Test the Web Dashboard**

Open in your browser: `http://192.168.1.100:3000` (replace with your Pi's IP)

**You should see:**
- 🎯 TechTemp dashboard homepage
- 📊 Empty graphs (ready for sensor data)
- 🏠 "No rooms configured yet" message

### **Test the API**

```bash
# Check if the API is responding
curl http://192.168.1.100:3000/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🔧 **Alternative Installation Methods**

<details>
<summary><strong>🐳 Docker on Your Computer/NAS</strong></summary>

**If you want to run TechTemp on your existing computer:**

```bash
# Clone the project
git clone https://github.com/laurent987/techtemp.git
cd techtemp

# Start with Docker Compose
docker-compose up -d

# Access dashboard
open http://localhost:3000
```

**Pros:** Use existing hardware, no new Pi needed  
**Cons:** Computer must stay on 24/7 for continuous monitoring

</details>

<details>
<summary><strong>⚙️ Manual Installation (Advanced)</strong></summary>

**For users who want full control:**

```bash
# SSH to your Pi
ssh pi@192.168.1.100

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install TechTemp
git clone https://github.com/laurent987/techtemp.git
cd techtemp
npm install

# Set up the database
npm run db:setup

# Start the server
npm start
```

**Dashboard:** `http://192.168.1.100:3000`

</details>

---

## 🚨 **Troubleshooting**

### **❌ "Connection refused" to Pi**

**Problem:** Can't SSH to your Pi  
**Solution:** Check [SSH Troubleshooting Guide](troubleshooting/ssh-help.md)

### **❌ "Docker installation failed"**

**Problem:** Docker won't install on Pi  
**Solutions:**
```bash
# Try updating Pi first
ssh pi@192.168.1.100 "sudo apt update && sudo apt upgrade -y"

# Then re-run setup
./scripts/user/setup-server.sh pi@192.168.1.100
```

### **❌ "Can't access dashboard"**

**Problem:** `http://192.168.1.100:3000` doesn't load  

**Check if server is running:**
```bash
ssh pi@192.168.1.100 "docker ps"
# Should show TechTemp containers running
```

**Restart if needed:**
```bash
ssh pi@192.168.1.100 "cd techtemp && docker-compose restart"
```

### **❌ "Setup script fails"**

**Problem:** `setup-server.sh` exits with errors  

**Get detailed logs:**
```bash
./scripts/user/setup-server.sh pi@192.168.1.100 --verbose
```

**Common fixes:**
- Ensure Pi has internet connection
- Check SSH key authentication works
- Verify Pi has enough disk space: `ssh pi@192.168.1.100 "df -h"`

---

## 🎉 **Success! What's Next?**

Your TechTemp server is now ready. Next steps:

1. **[Add Your First Sensor](sensor-setup.md)** - Connect temperature sensors
2. **[Explore the Dashboard](dashboard-guide.md)** - Learn the interface
3. **[Management Tools](management-tools.md)** - Maintain your system

---

<div align="center">

**🐳 Your central hub is ready for sensors!**

**[📱 Setup Guide](../README.md)** • **[🌡️ Add Sensor](sensor-setup.md)** • **[🛠️ Troubleshooting](troubleshooting.md)**

</div>