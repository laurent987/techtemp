# 👤 User Scripts

> **Simple scripts** for TechTemp end users - no technical knowledge required!

---

## 🚀 **Quick Start Scripts**

### **🏠 `setup-server.sh`**
*Set up your central TechTemp server on a Raspberry Pi*

```bash
./scripts/user/setup-server.sh 192.168.1.100
```

**What it does:**
- Installs Docker automatically on your Pi
- Downloads and configures TechTemp
- Sets up MQTT broker for sensors
- Tests everything works correctly
- Gives you the dashboard URL

**When to use:** First time setting up TechTemp

---

### **🏠 `setup-room-sensor.sh`**
*Add a new room sensor to your home monitoring*

```bash
./scripts/user/setup-room-sensor.sh 192.168.1.100
```

**What it does:**
- Guides you through adding a new Raspberry Pi sensor
- Asks friendly questions (room name, sensor description)
- Automatically configures everything
- Shows you next steps

**When to use:** Every time you want to monitor a new room

---

### **📊 `view-rooms.sh`**
*See current readings from all your rooms*

```bash
# View last 10 readings
./scripts/user/view-rooms.sh

# View last 20 readings  
./scripts/user/view-rooms.sh 20
```

**What you see:**
- Table of all rooms with current temperature/humidity
- When each reading was taken
- Which sensors are active

**When to use:** Quick check of your home's climate

---

### **🔍 `check-system.sh`**
*Make sure everything is working correctly*

```bash
./scripts/user/check-system.sh
```

**What it checks:**
- ✅ TechTemp server running
- ✅ Web dashboard accessible  
- ✅ Database healthy
- ✅ MQTT broker for sensors

**When to use:** If something seems broken or not working

---

## 📱 **Quick Reference**

**📊 View your data:**
```bash
./scripts/user/view-rooms.sh          # See current readings
open http://localhost:3000            # Open web dashboard
```

**🏠 Add new room:**
```bash
./scripts/user/setup-room-sensor.sh   # Set up new sensor
```

**🔧 Check system:**
```bash
./scripts/user/check-system.sh        # Diagnose problems
```

---

## 💡 **Tips**

- Run scripts from the project root directory
- Scripts automatically call robust admin tools
- All scripts show helpful progress messages
- Check logs in `logs/` if something fails

## 🔐 **SSH Problems?**

**Can't connect to your Raspberry Pi?** See our quick help:
- **[SSH Quick Help](../../docs/USER/guides/troubleshooting/ssh-help.md)** - Common SSH problems and solutions
- **[Initial Pi Setup](../../docs/USER/guides/initial-setup.md)** - Complete WiFi + SSH setup guide

## 🆘 **Need Help?**

- Check our [USER documentation](../../docs/USER/README.md)
- Run `./scripts/user/check-system.sh` to diagnose issues
- For advanced features, see [admin scripts](../admin/README.md)
```

**🔧 Troubleshoot:**
```bash
./scripts/user/check-system.sh       # System health check
docker compose logs -f               # View server logs
```

**🔄 Restart everything:**
```bash
docker compose restart               # Restart TechTemp
docker compose up -d                 # Start TechTemp
```

---

## 🆘 **Need Help?**

- **📖 User Guide:** [docs/USER/README.md](../../docs/USER/README.md)
- **🛠️ Troubleshooting:** [docs/USER/guides/troubleshooting/](../../docs/USER/guides/troubleshooting/)
- **💬 Community:** [GitHub Discussions](https://github.com/laurent987/techtemp/discussions)

---

## 💡 **Pro Tips**

**🔍 Find your Pi's IP address:**
```bash
# Scan your network
nmap -sn 192.168.1.0/24

# Or check your router's admin page
# Usually: http://192.168.1.1 or http://192.168.0.1
```

**📈 Export your data:**
- Open dashboard → Click room → Download CSV
- Use for Excel analysis or backup

**🏠 Organize rooms:**
- Use clear names: "Living Room", "Kitchen", "Bedroom 1"
- Avoid special characters or spaces in device names

---

<div align="center">

**🏠 Happy monitoring!**

Need more advanced features? Check **[Admin Scripts](../admin/)** or **[Dev Scripts](../dev/)**

</div>
