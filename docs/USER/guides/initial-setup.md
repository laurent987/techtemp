**[⬅️ Back to Setup Guide](../README.md)**


# 🔧 Initial Raspberry Pi Setup

> **Essential first-time setup** for your Raspberry Pi before installing TechTemp sensors.


---

## 🎯 **What This Guide Does**

This guide helps you:
- ✅ **Install Raspberry Pi OS** on your SD card
- ✅ **Set up WiFi** on your Raspberry Pi  
- ✅ **Enable SSH** for remote access (control Pi from your computer)
- ✅ **Test the connection** from your computer
- ✅ **Prepare for TechTemp** sensor installation

**⏱️ Time needed:** 15-20 minutes

---

## 📖 **More Help**

- **[Complete SSH Setup Guide](ssh-setup-guide.md)** - Detailed SSH explanation and key setup
- **[SSH Troubleshooting Guide](troubleshooting/ssh-help.md)** - Quick SSH help
- **[Find Pi IP Address](find-pi-ip.md)** - Detailed network discovery guide

---

## 📦 **What You Need**

- **Raspberry Pi** (any model with WiFi)
- **MicroSD card** (16GB+) 
- **Computer** with SD card reader
- **WiFi network** name and password

---

## 🚀 **Setup Process**

*Headless setup - configure everything without keyboard/monitor*

### **Step 1: Prepare the Imager** (3 minutes)

*Download the tool and select the OS - we'll configure before installing*

1. **Download Raspberry Pi Imager:** https://www.raspberrypi.org/software/
2. **Install and run** the Raspberry Pi Imager on your computer
3. **Insert SD card** into your computer  
4. **In the imager:**
   - Choose OS: **Raspberry Pi OS (32-bit)**
   - Choose Storage: Your SD card
   - **Don't write yet!** Click the **⚙️ gear icon** for advanced options

<details>
<summary><strong>🤔 What's happening in this step?</strong></summary>

**Raspberry Pi Imager** is a tool that will:
- ✅ **Download the operating system** (Raspberry Pi OS - like Windows but for Pi)
- ✅ **Let you configure settings** (WiFi, SSH, user account) before writing
- ✅ **Write everything to your SD card** (OS + your configuration)
- ✅ **Make it bootable** - Pi will start up perfectly from this SD card

**Why not write immediately?** We want to configure WiFi and SSH **before** writing the image. This way, when your Pi boots for the first time, it immediately connects to WiFi and allows SSH - no keyboard/monitor needed!

**This is called "headless setup"** - the Pi works perfectly without any extra hardware.
</details>

### **Step 2: Configure WiFi and SSH** (2 minutes)

> **🔐 New to SSH?** Read our **[Complete SSH Setup Guide](ssh-setup-guide.md)** first to understand SSH keys, security, and best practices.

**In the advanced options:**

#### **🔐 SSH Configuration (Choose ONE):**

**Option A: SSH Keys (Recommended for TechTemp)**
```
✅ Enable SSH
   ● Allow public-key authentication only
   [Browse and select your SSH public key file: ~/.ssh/id_rsa.pub]
```
- ✅ **Most secure** and convenient for TechTemp automation
- ✅ **No passwords** needed after setup
- ❓ **Need help?** See [SSH Setup Guide](ssh-setup-guide.md) for key generation

**Option B: Password Authentication (Simpler)**
```
✅ Enable SSH
   ○ Use password authentication
   Username: pi
   Password: [choose a secure password]
```
- ✅ **Simple setup** - just set a password
- ⚠️ **Less convenient** - must type password for every connection
- 📝 **Note:** You can add SSH keys later if needed

#### **📶 WiFi Configuration:**
```
✅ Configure WiFi
   SSID: [your WiFi network name]
   Password: [your WiFi password]
   WiFi country: [your country, e.g., US, FR, DE]

✅ Set username and password
   Username: pi
   Password: [same as SSH password above]
```

<details>
<summary><strong>📶 WiFi Configuration Details</strong></summary>

**SSID:** Your WiFi network name
- Find this in your WiFi settings or router admin page
- Case-sensitive! Must match exactly
- Special characters are OK

**Password:** Your WiFi password  
- The same password you use on your phone/laptop
- Case-sensitive and special characters matter
- Will be stored securely on the Pi

**WiFi Country:** Important for legal compliance
- **US** - United States
- **FR** - France  
- **DE** - Germany
- **GB** - United Kingdom
- **CA** - Canada
- [Full list here](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

**Why country matters:** Different countries allow different WiFi channels and power levels. Setting this correctly ensures your Pi follows local wireless regulations.
</details>

### **Step 3: Install to SD Card** (3-5 minutes)

*Now we actually install the configured OS to your SD card*

4. **Click "Save"** to save your configuration
5. **Click "Write"** to start installing to SD card

<details>
<summary><strong>💾 What's happening during installation?</strong></summary>

**The Raspberry Pi Imager is now:**
1. **Downloading** Raspberry Pi OS (if not cached) - ~1GB download
2. **Installing the OS** to your SD card - All the files needed to boot
3. **Creating partitions** - Boot partition + main system partition  
4. **Applying your configuration** - WiFi settings, SSH keys, user account
5. **Verifying** - Checking the installation was successful

**This takes 3-5 minutes** depending on your SD card speed and internet connection.

**When it's done:** Your SD card contains a complete, pre-configured Raspberry Pi system ready to boot with WiFi and SSH working immediately!
</details>

### **Step 4: Boot and Find Your Pi** (3 minutes)

1. **Insert SD card** into Raspberry Pi
2. **Power on** the Pi (it will boot automatically)
3. **Wait 2-3 minutes** for first boot
4. **Find Pi's IP address:**

**From your computer:**
```bash
# Scan your network for the Pi
nmap -sn 192.168.1.0/24

# Look for "Raspberry Pi Foundation" in the results
# Note the IP address (e.g., 192.168.1.100)
```

**Or check your router's admin page** to see connected devices.

<details>
<summary><strong>🔍 What's happening during first boot?</strong></summary>

**When your Pi boots for the first time:**
1. **Loading the OS** - Raspberry Pi OS starts up from your SD card
2. **Applying configuration** - WiFi connects, SSH starts, user account is created
3. **Expanding filesystem** - Uses the full SD card space (not just the image size)
4. **Network connection** - Connects to your WiFi and gets an IP address
5. **SSH service starts** - Now ready to accept connections from your computer

**The green LED** on your Pi will blink during boot, then stay solid when ready.

**IP address:** Your router assigns an IP address to your Pi (like 192.168.1.100). This is how your computer will find and connect to it.
</details>

### **Step 5: Test SSH Connection** (2 minutes)

```bash
# Connect to your Pi (replace with actual IP)
ssh pi@192.168.1.100

# First time will ask about host authenticity
# Type "yes" to continue

# If you used SSH keys: connects automatically! 🎉
# If you used password: enter the password you set

# You should see the Pi command prompt:
# pi@raspberrypi:~ $
```

<details>
<summary><strong>🔒 What's the "host authenticity" message about?</strong></summary>

**When you first connect, you'll see something like:**
```
The authenticity of host '192.168.1.100 (192.168.1.100)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

**What this means:**
- Your computer has never connected to this Pi before
- SSH is being extra careful about security
- It's asking "are you sure this is really your Pi?"

**Just type "yes"** - this is normal for first-time connections.

**What happens next:**
- Your computer remembers this Pi's "fingerprint"
- Future connections won't ask this question
- If the fingerprint ever changes, SSH will warn you (security feature)

**This is SSH protecting you** from connecting to the wrong device or a hacker's fake Pi.
</details>

<details>
<summary><strong>🎯 What should I see if it worked?</strong></summary>

**Successful SSH connection looks like:**
```
pi@raspberrypi:~ $ 
```

**What this means:**
- ✅ **`pi`** - You're logged in as user "pi"
- ✅ **`raspberrypi`** - The Pi's hostname (computer name)
- ✅ **`~`** - You're in the home directory (/home/pi)
- ✅ **`$`** - Ready for commands (you have a shell prompt)

**You can now:**
- Type Linux commands and they run on your Pi
- Install software on your Pi remotely
- Run TechTemp setup scripts from your computer
- Control your Pi from anywhere on your network!

**To exit SSH:** Type `exit` or press Ctrl+D
</details>

**🎉 Success!** Your Pi is ready for TechTemp setup.

---

## ✅ **Verify Everything Works**

**Test the complete setup:**

```bash
# From your work computer, connect to Pi:
ssh pi@192.168.1.100

# Check WiFi connection:
ping google.com

# Check system updates:
sudo apt update

# Exit Pi:
exit
```

**All working?** ✅ Ready for [TechTemp setup](../README.md)!

---

## 🛠️ **Troubleshooting**

### **Can't Find Pi on Network**
```bash
# Try different network range:
nmap -sn 192.168.0.0/24    # Some routers use .0.x
nmap -sn 10.0.0.0/24       # Some use 10.x.x.x

# Check router admin page for connected devices
# Usually: http://192.168.1.1 or http://192.168.0.1
```

### **SSH Connection Refused**
```bash
# SSH might not be enabled - use keyboard/monitor method
# Or re-flash SD card with SSH enabled in advanced options
```

### **WiFi Not Connecting**
```bash
# Check WiFi credentials in advanced options
# Some networks need special characters escaped
# Try connecting with keyboard/monitor first
```

### **Permission Denied (SSH)**
```bash
# Wrong username/password
# Default: username=pi, password=what you set
# Try: ssh -v pi@IP_ADDRESS for verbose debugging
```

---

## 🚀 **Next Steps**

**✅ Pi setup complete!** Now you can:

1. **[Install TechTemp Server](../README.md#-easy-setup-with-docker)** - Set up the main system
2. **[Add Room Sensors](../README.md#️-add-your-first-room-sensor)** - Connect temperature sensors
3. **[Use User Tools](../README.md#️-user-friendly-tools)** - Manage your system

---

## 🔧 **Alternative Setup**

**Headless setup not working for you?** 

If you prefer or need to use keyboard/monitor setup:
1. Flash Raspberry Pi OS normally (no advanced options)
2. Connect keyboard, mouse, monitor to Pi and boot
3. Follow the setup wizard (WiFi, user account, etc.)
4. Enable SSH: `sudo systemctl enable ssh && sudo systemctl start ssh`
5. Get IP address: `hostname -I`
6. Test SSH from your computer: `ssh pi@[IP_ADDRESS]`

This method works but requires physical access to your Pi.

---

## 📚 **More Help**

- **[TechTemp User Guide](../README.md)** - Main documentation
- **[Device Setup Guide](README.md)** - Sensor installation
- **[Troubleshooting](troubleshooting/)** - Common issues
- **[Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)** - Official Pi docs

---

<div align="center">

**🔧 Essential first step for TechTemp success**

**[📱 Main Guide](../README.md)** • **[🔌 Device Setup](README.md)** • **[🛠️ Troubleshooting](troubleshooting/)**

</div>
