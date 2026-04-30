# 🏠 TechTemp - Setup Guide

> **Ready to build your home monitoring system?** Follow this step-by-step guide to get TechTemp running in 30 minutes.

You'll transform simple Raspberry Pis into a professional monitoring network that tracks temperature and humidity in every room. Let's get started!

## 🛒 **Shopping List** *(~$80 to start)*

### **🖥️ Central Server** *(one-time setup)*
- **<img src="../icons/rpi.svg" alt="Raspberry Pi" style="display: inline-block; vertical-align: middle; width: 20px;"/> Raspberry Pi Zero 2W** ~$15
- **💾 MicroSD card 32GB** ~$8 *(stores all sensor data)*

### **🌡️ Per Room Sensor** *(~$50 each)*
- **<img src="../icons/rpi.svg" alt="Raspberry Pi" style="display: inline-block; vertical-align: middle; width: 20px;"/> Raspberry Pi Zero 2W** ~$15
- **🌡️ AHT20 sensor** ~$25 *(accurate ±0.3°C)*
- **💾 MicroSD card 8GB** ~$5 *(device software only)*
- **🔌 4 jumper wires** ~$2 *(GPIO connection)*

**💡 Smart start:** Begin with server + 1 room (~$80), then add rooms as needed

## ⚡ **Build Your System** *(30 minutes total)*

| Step | What You'll Do | Result |
|------|----------------|---------|
| **[1. Setup Raspberry Pi's](#step1-raspberry-setup)** | Prepare all your Pis (server + sensors) | ✅ All Pis ready with WiFi & SSH |
| **[2. Install TechTemp Server](#step2-server)** | Install complete server stack (database, API, dashboard) | ✅ Central server running |
| **[3. Connect First Sensor](#step3-sensor)** | Wire AHT20 sensor + install device software | ✅ One room monitored |
| **[4. Access Dashboard](#step4-dashboard)** | Open web interface, explore your data | ✅ Full monitoring system |

<br>

<a id="step1-raspberry-setup"></a>
### **Step 1 - Setup Your Raspberry Pi's** *(15 minutes each)*

Set up all your Raspberry Pi's with WiFi and SSH access so they're ready for TechTemp installation.

**Ready to start?** **[Follow the Raspberry Pi Setup Guide](guides/initial-setup.md)**

---
<br>

<a id="step2-server"></a>
### **Step 2 - Install TechTemp Server** *(10 minutes)*

Install the complete TechTemp server stack (database, API, web dashboard) on your central Pi to collect all sensor data.

**Let's install the server:** **[Follow the Server Installation Guide](guides/server-installation.md)**

---
<br>

<a id="step3-sensors"></a>
### **Step 3 - Setup Sensors** *(5 minutes each)*

Wire an AHT20 sensor to a Pi and install the device software to start monitoring your first room's temperature.

**Time to add your first sensor:** **[Follow the Sensor Setup Guide](guides/sensor-setup.md)**

---
<br>

<a id="step4-monitor"></a>
### **Step 4 - Monitor Your System** *(2 minutes)*

Open the web interface from any device to explore your temperature data, view graphs, and monitor your home.

**See your data in action:** **[Access Your Dashboard Now](guides/dashboard-guide.md)**

<br>


## 🔧 **System Management**

Add more sensors, manage rooms, and maintain your system to create a complete home monitoring solution.

**Expand your system:** **[Explore Management Tools](guides/management-tools.md)**




