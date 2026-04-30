**[⬅️ Back to Setup Guide](../../README.md)**

# 🔧 SSH Quick Help

> **Quick solutions** for common SSH problems when using TechTemp scripts.

---

## ❌ "Connection refused" Error

```bash
ssh: connect to host 192.168.1.100 port 22: Connection refused
```

**Quick fixes:**

1. **Check if Pi is on network:**
   ```bash
   ping 192.168.1.100
   ```

2. **Find Pi's real IP address:**
   ```bash
   nmap -sn 192.168.1.0/24
   # Look for "Raspberry Pi Foundation"
   ```

3. **Try different network ranges:**
   ```bash
   nmap -sn 192.168.0.0/24    # Some routers use .0.x
   nmap -sn 10.0.0.0/24       # Some use 10.x.x.x
   ```

4. **Enable SSH on Pi (need keyboard/monitor):**
   ```bash
   sudo systemctl enable ssh
   sudo systemctl start ssh
   ```

---

## ❌ "Permission denied" Error

```bash
pi@192.168.1.100: Permission denied (publickey,password).
```

**Quick fixes:**

1. **Use password authentication:**
   ```bash
   ssh -o PreferredAuthentications=password pi@192.168.1.100
   ```

2. **Set up SSH keys (recommended):**
   ```bash
   ssh-keygen -t rsa -b 4096          # Generate key
   ssh-copy-id pi@192.168.1.100       # Copy to Pi
   ssh pi@192.168.1.100               # Test (no password needed)
   ```

3. **Reset SSH connection:**
   ```bash
   ssh-keygen -R 192.168.1.100        # Remove old host key
   ```

---

## ❌ Pi Not Found on Network

**Find your Pi's IP address:**

👉 **[Complete IP Finding Guide](../find-pi-ip.md)** - All methods and troubleshooting

**Quick methods:**

**Method 1: Router admin page**
- Open your router's web interface (usually http://192.168.1.1)
- Look for "Connected Devices" or "DHCP Clients"
- Find device named "raspberrypi"

**Method 2: Network scan**
```bash
nmap -sn 192.168.1.0/24 | grep -B2 -A2 "Raspberry Pi"
```

**Method 3: Use Pi with keyboard/monitor**
```bash
hostname -I    # Shows Pi's IP address
```

---

## 🔐 Set Up SSH Keys (Skip Password Typing)

**Tired of typing passwords?** Set up SSH keys for automatic login:

```bash
# 1. Generate SSH key on your work computer (if you don't have one)
ssh-keygen -t rsa -b 4096
# Press Enter for all prompts (uses default location)

# 2. Copy key to your Pi
ssh-copy-id pi@192.168.1.100

# 3. Test - should connect without password!
ssh pi@192.168.1.100
```

**If ssh-copy-id doesn't work:**
```bash
# Manual method:
cat ~/.ssh/id_rsa.pub | ssh pi@192.168.1.100 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

---

## 🆕 Fresh Raspberry Pi Setup

**Need to set up WiFi and SSH from scratch?**

👉 **[Complete Initial Setup Guide](../initial-setup.md)**

**Quick version (with keyboard/monitor):**
1. Connect keyboard, mouse, monitor to Pi
2. Boot Pi and run setup wizard
3. Connect to WiFi
4. Enable SSH: `sudo systemctl enable ssh`
5. Get IP: `hostname -I`
6. Test from computer: `ssh pi@[IP_ADDRESS]`

---

## 📱 Still Having Problems?

**Try these:**

1. **Check our complete guides:**
   - [Initial Pi Setup](../initial-setup.md)
   - [Troubleshooting Guide](common-issues.md)

2. **Test basic connectivity:**
   ```bash
   ping 192.168.1.100                    # Pi responds?
   telnet 192.168.1.100 22               # SSH port open?
   ```

3. **Get help:**
   - [GitHub Discussions](https://github.com/laurent987/techtemp/discussions)
   - [GitHub Issues](https://github.com/laurent987/techtemp/issues)

---

<div align="center">

**🔧 Quick help for TechTemp SSH problems**

**[📱 User Guide](../../README.md)** • **[🔌 Device Setup](../sensor-setup.md)** • **[🛠️ Troubleshooting](./)**

</div>
