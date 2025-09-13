**[⬅️ Back to Setup Guide](../README.md)**

# 🔍 Find Your Pi's IP Address

> **Quick reference** for finding your Raspberry Pi's IP address on your network.

---

## 🚀 **Quick Methods**

### **Method 1: Network Scan (Recommended)**
```bash
# From your work computer:
nmap -sn 192.168.1.0/24

# Look for output like:
# Nmap scan report for 192.168.1.100
# Host is up (0.0024s latency).
# MAC Address: B8:27:EB:XX:XX:XX (Raspberry Pi Foundation)
```

**Different network ranges?** Try:
```bash
nmap -sn 192.168.0.0/24    # Common alternative
nmap -sn 10.0.0.0/24       # Some routers use this
```

### **Method 2: Router Admin Page**
1. Open your router's web interface:
   - Usually: http://192.168.1.1 or http://192.168.0.1
   - Login with admin credentials
2. Look for "Connected Devices" or "DHCP Clients"
3. Find device named "raspberrypi" or similar

### **Method 3: Direct on Pi (keyboard/monitor needed)**
```bash
# Connect keyboard/monitor to Pi and run:
hostname -I

# Shows Pi's IP addresses
# Example output: 192.168.1.100
```

---

## 📱 **Don't Have nmap?**

**Install nmap:**
```bash
# macOS (with Homebrew):
brew install nmap

# Ubuntu/Debian:
sudo apt install nmap

# Windows:
# Download from: https://nmap.org/download.html
```

**Alternative tools:**
```bash
# Use ping to test specific IPs:
ping 192.168.1.100
ping 192.168.1.101
# ... (try common IPs)

# Use arp (may show cached entries):
arp -a | grep -i raspberry
```

---

## 🔧 **Advanced: Specific Pi Detection**

**Find only Raspberry Pi devices:**
```bash
nmap -sn 192.168.1.0/24 | grep -B2 -A2 "Raspberry Pi"
```

**Scan for SSH ports:**
```bash
nmap -p 22 192.168.1.0/24 | grep -B4 "22/tcp open"
```

**Check Pi manufacturer (MAC address):**
```bash
# Raspberry Pi MAC addresses start with:
# B8:27:EB, DC:A6:32, E4:5F:01, or 28:CD:C1
```

---

## 🚨 **Troubleshooting**

### **Pi Not Found**
- **Check WiFi connection:** Pi might not be connected
- **Try different network ranges:** Your router might use 192.168.0.x or 10.0.0.x
- **Check Pi is powered on:** Look for LED activity
- **Firewall issues:** Pi might be blocking ping/scan

### **Multiple Devices Found**
- **Check MAC addresses:** Look for Raspberry Pi Foundation in nmap output
- **Test SSH connection:** `ssh pi@IP_ADDRESS` to verify it's your Pi
- **Physical identification:** Check which Pi responds to shutdown: `sudo shutdown now`

### **Router Admin Access**
- **Common login credentials:**
  - admin/admin
  - admin/password
  - admin/[blank]
- **Check router label:** Login info often printed on device
- **Reset router:** Hold reset button if locked out (last resort)

---

## 📋 **IP Reference Sheet**

**Common network ranges:**
- `192.168.1.x` - Most common home networks
- `192.168.0.x` - Alternative common range  
- `10.0.0.x` - Some routers/mesh networks
- `192.168.100.x` - Some ISP routers

**Common router admin pages:**
- http://192.168.1.1
- http://192.168.0.1
- http://10.0.0.1
- http://192.168.100.1

---

## 🔗 **Related Guides**

- **[Initial Pi Setup](initial-setup.md)** - Complete WiFi and SSH setup
- **[SSH Help](troubleshooting/ssh-help.md)** - Connection troubleshooting
- **[Device Setup](README.md)** - Hardware and software setup

---

<div align="center">

**🔍 Never lose your Pi again!**

**[🏠 Main Guide](../README.md)** • **[🔌 Device Setup](README.md)** • **[🔐 SSH Help](troubleshooting/ssh-help.md)**

</div>
