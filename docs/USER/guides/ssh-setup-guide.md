**[⬅️ Back to Setup Guide](../README.md)**

# 🔐 Complete SSH Setup Guide

> **Master SSH for TechTemp** - Everything you need to know about SSH keys, connections, and security for your Raspberry Pi.

---

## 🎯 **Why SSH Matters for TechTemp**

SSH (Secure Shell) is **essential** for TechTemp because:
- ✅ **Remote control** - Manage your Pi from your computer
- ✅ **File transfer** - Copy sensor code and configurations
- ✅ **Automation** - Our scripts need SSH to install/update TechTemp
- ✅ **Security** - Encrypted connections over WiFi
- ✅ **No extra hardware** - No keyboard/monitor needed on Pi

---

## 🚀 **Quick Start (For Impatient Users)**

**If you just want it working now:**

```bash
# 1. Generate SSH key (on your computer)
ssh-keygen -t rsa -b 4096

# 2. Copy to your Pi (replace IP)
ssh-copy-id pi@192.168.1.100

# 3. Test connection (should work without password)
ssh pi@192.168.1.100
```

**Done!** ✅ If this worked, you can skip to [Testing Your Setup](#-testing-your-setup).

---

## 🎓 **Understanding SSH (Recommended Reading)**

### **What is SSH?**

Think of SSH like a **secure telephone line** between your computer and your Pi:
- 🖥️ **Your computer** = You (the caller)
- 🍓 **Raspberry Pi** = Your friend (receiving the call)
- 🔒 **SSH encryption** = Secret code so nobody can eavesdrop
- 💻 **Terminal commands** = Your conversation

### **SSH Keys vs Passwords**

| Method | Security | Convenience | TechTemp Compatibility |
|--------|----------|-------------|----------------------|
| **SSH Keys** | 🟢 Excellent | 🟢 Automatic login | ✅ **Required** |
| **Passwords** | 🟡 Good | 🔴 Type every time | ❌ Scripts won't work |

**Why TechTemp needs SSH keys:**
- Our automation scripts connect to your Pi dozens of times
- Typing passwords manually would be impossible
- Keys provide both security AND convenience

### **🎓 Understanding SSH Keys (Essential Knowledge)**

Before we create keys, let's understand what we're actually doing:

#### **🔑 What is an SSH Key Pair?**

An SSH key pair is like a **special lock and key system**:

```
🔐 Key Pair = Private Key + Public Key
```

**🔒 Private Key (`id_rsa`)**
- **What it is:** Your personal, secret "master key"
- **Where it stays:** On your computer ONLY (never leaves)
- **What it does:** Proves to the Pi "I am really the authorized user"
- **Analogy:** Like your house key - only you should have it
- **File location:** `~/.ssh/id_rsa`

**🔓 Public Key (`id_rsa.pub`)**
- **What it is:** A special "lock" that matches your private key
- **Where it goes:** On the Pi (and any computer you want to access)
- **What it does:** Recognizes your private key when you connect
- **Analogy:** Like the lock on your house - safe to show everyone
- **File location:** `~/.ssh/id_rsa.pub`

#### ** How the Magic Works**

When you connect to your Pi:

1. **🖥️ Your computer says:** "Hi Pi, I want to connect. Here's my identity."
2. **🍓 Pi responds:** "Prove it! Sign this challenge with your private key."
3. **🖥️ Your computer signs:** Uses your private key to create a unique signature
4. **🍓 Pi verifies:** "This signature matches the public key I have. You're authorized!"
5. **✅ Connection granted:** You're logged in without typing a password

#### **🎯 What You'll Actually Do**

1. **Generate the pair:** Create both private and public key on your computer
2. **Keep private key safe:** It stays on your computer forever
3. **Share public key:** Copy it to your Pi during setup
4. **Enjoy automatic login:** SSH "just works" from then on

#### **📁 Where Your Keys Live**

**On your computer:**
```
~/.ssh/
├── id_rsa          ← Private key (SECRET!)
├── id_rsa.pub      ← Public key (safe to share)
├── config          ← SSH settings (optional)
└── known_hosts     ← Remembered Pi fingerprints
```

**On your Pi (after setup):**
```
/home/pi/.ssh/
└── authorized_keys ← Contains your public key
```

#### **🤔 Common Questions**

**Q: Can someone hack me if they get my public key?**
A: No! The public key is designed to be shared. It's like giving someone your mailing address - useful but not dangerous.

**Q: What if I lose my private key?**
A: You'll need to generate a new pair and copy the new public key to your Pi. The old keys become useless.

**Q: Can I use the same key pair for multiple Pis?**
A: Yes! Copy your public key to multiple Pis and your private key will work with all of them.

**Q: Why not just use passwords?**
A: TechTemp scripts need to connect automatically. Imagine typing a password 50 times during an installation!

---

## �🔑 **SSH Key Setup (Step by Step)**

Now that you understand what we're doing, let's create your keys:

### **Step 1: Generate Your SSH Key Pair**

**On your work computer** (not the Pi), open a terminal:

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

**You'll see prompts like this:**

```
Generating public/private rsa key pair.
Enter file in which to save the key (/home/username/.ssh/id_rsa): 
```
👉 **Press Enter** (use default location)

```
Enter passphrase (empty for no passphrase): 
```
👉 **Press Enter** (empty = no passphrase, more convenient)

```
Enter same passphrase again: 
```
👉 **Press Enter** again

**Result:** You now have two files:
- `~/.ssh/id_rsa` - **Private key** (keep secret!)
- `~/.ssh/id_rsa.pub` - **Public key** (safe to share)

<details>
<summary><strong>🤔 Should I use a passphrase?</strong></summary>

**No passphrase (recommended for TechTemp):**
- ✅ **Convenience** - Automatic login for scripts
- ✅ **Automation** - TechTemp scripts work seamlessly
- ⚠️ **Security consideration** - If someone steals your computer, they could access your Pi

**With passphrase (more secure):**
- ✅ **Extra security** - Even if computer is stolen, keys are protected
- ❌ **Less convenient** - Must type passphrase for each connection
- ❌ **Scripts may fail** - TechTemp automation might not work

**For home lab/hobby use:** No passphrase is usually fine
**For production/sensitive data:** Consider using a passphrase
</details>

### **Step 2: Copy Public Key to Your Pi**

> **⚠️ Important:** This step is only needed if you **didn't** put your SSH key in Raspberry Pi Imager. If you already selected your public key during the imager setup, **skip to Step 3** - you're already done!

**🎯 What we're doing:** Taking your public key from your computer and putting it on the Pi so it recognizes you.

**🔄 The process:**
1. Your computer reads your public key file (`~/.ssh/id_rsa.pub`)
2. Connects to Pi using password (one last time!)
3. Adds your public key to Pi's `authorized_keys` file
4. From now on, Pi trusts your private key

**Two scenarios:**

#### **Scenario A: You used SSH keys in Raspberry Pi Imager ✅**
**What happened:** When you browsed to your `id_rsa.pub` file in the imager, it automatically copied your public key to the Pi image.

**Result:** Your key is already on the Pi. **Skip to Step 3!**

#### **Scenario B: You used password authentication in Raspberry Pi Imager 🔑**
**What happened:** You enabled SSH with password instead of keys in the imager.

**What you need to do:** Manually copy your key to the Pi now.

**Method 1: Automatic (recommended)**
```bash
ssh-copy-id pi@192.168.1.100
```
- Replace `192.168.1.100` with your Pi's actual IP
- Enter your Pi's password when prompted (the one you set in imager)
- This copies your public key to the Pi automatically

**Method 2: Manual (if ssh-copy-id doesn't work)**
```bash
# Display your public key
cat ~/.ssh/id_rsa.pub

# Copy the output, then SSH to your Pi with password
ssh pi@192.168.1.100

# On the Pi, create .ssh directory and add your key
mkdir -p ~/.ssh
echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

### **Step 3: Test Automatic Login**

```bash
ssh pi@192.168.1.100
```

**✅ Success looks like:**
- No password prompt
- Direct connection to Pi
- You see: `pi@raspberrypi:~ $`

**❌ If it asks for password:**
- Key wasn't copied correctly
- Try Method 2 above
- Check IP address is correct

---

## 🖥️ **What Happens During Raspberry Pi Imager Setup?**

When you configure SSH in Raspberry Pi Imager:

### **SSH Key Method:**
1. **You browse** to your `~/.ssh/id_rsa.pub` file
2. **Imager copies** your public key to the Pi image
3. **When Pi boots** it automatically trusts your computer
4. **Result:** Instant passwordless SSH ✅

**⚠️ Important:** If you choose this method, you **cannot** SSH with a password later. Only your SSH key will work.

### **Password Method:**
1. **You set** a username and password
2. **Imager configures** SSH server to accept passwords
3. **When Pi boots** you can SSH with password
4. **Result:** Manual password entry required 🔑

**📝 Note:** With this method, you can add SSH keys later using `ssh-copy-id` (see Step 2 above).

### **What Files Are Created on the Pi:**

**SSH Keys method:**
```
/home/pi/.ssh/authorized_keys  <- Your public key goes here
/etc/ssh/sshd_config          <- SSH server configuration
```

**Password method:**
```
/etc/passwd                   <- User account with password
/etc/ssh/sshd_config         <- SSH server allows passwords
```

---

## 🔧 **Advanced SSH Configuration**

### **Custom SSH Config (Optional)**

Create `~/.ssh/config` on your computer for easier connections:

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this content:
Host mypi
    HostName 192.168.1.100
    User pi
    IdentityFile ~/.ssh/id_rsa

Host techtemp-server
    HostName 192.168.1.100
    User pi
    IdentityFile ~/.ssh/id_rsa
```

**Now you can connect with:**
```bash
ssh mypi              # Instead of ssh pi@192.168.1.100
ssh techtemp-server   # Same Pi, different alias
```

### **Multiple Pi Setup**

**If you have multiple Raspberry Pis:**

```bash
# Generate separate keys for each Pi (optional)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/pi1_key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/pi2_key

# Copy to each Pi
ssh-copy-id -i ~/.ssh/pi1_key.pub pi@192.168.1.100
ssh-copy-id -i ~/.ssh/pi2_key.pub pi@192.168.1.101

# SSH config for each
Host pi1
    HostName 192.168.1.100
    User pi
    IdentityFile ~/.ssh/pi1_key

Host pi2
    HostName 192.168.1.101
    User pi
    IdentityFile ~/.ssh/pi2_key
```

---

## ✅ **Testing Your Setup**

### **Basic Connection Test**
```bash
ssh pi@192.168.1.100
```
**Expected:** Immediate login without password

### **File Transfer Test**
```bash
# Create test file
echo "Hello from $(hostname)" > test.txt

# Copy to Pi
scp test.txt pi@192.168.1.100:~/

# Verify on Pi
ssh pi@192.168.1.100 "cat ~/test.txt"

# Clean up
rm test.txt
ssh pi@192.168.1.100 "rm ~/test.txt"
```

### **TechTemp Script Compatibility Test**
```bash
# This is what TechTemp scripts do internally
ssh pi@192.168.1.100 "whoami && pwd && ls -la"
```
**Expected:** Output showing user, directory, and file list

---

## 🚨 **Troubleshooting Common Issues**

### **❌ "Permission denied (publickey)"**

**Causes:**
- Public key not properly copied to Pi
- Wrong permissions on `.ssh` directory
- SSH server only allows key authentication

**Solutions:**
```bash
# Check if your key is loaded
ssh-add -l

# Force password authentication (temporary)
ssh -o PreferredAuthentications=password pi@192.168.1.100

# Then re-copy your key
ssh-copy-id pi@192.168.1.100
```

### **❌ "Connection refused"**

**Causes:**
- SSH service not running on Pi
- Wrong IP address
- Pi not on network

**Solutions:**
```bash
# Find Pi's real IP
nmap -sn 192.168.1.0/24 | grep -B2 -A2 "Raspberry Pi"

# Test if SSH port is open
telnet 192.168.1.100 22

# If you have keyboard/monitor access to Pi:
sudo systemctl enable ssh
sudo systemctl start ssh
```

### **❌ "Host key verification failed"**

**Cause:** Pi's host key changed (reinstalled OS, etc.)

**Solution:**
```bash
# Remove old host key
ssh-keygen -R 192.168.1.100

# Connect again (will ask to verify new key)
ssh pi@192.168.1.100
```

### **❌ Scripts ask for password**

**Cause:** SSH keys not working properly

**Test:**
```bash
# This should work without password
ssh pi@192.168.1.100 "echo 'Key authentication working!'"
```

**If it asks for password:** Go back to [Step 2: Copy Public Key](#step-2-copy-public-key-to-your-pi)

---

## 🔒 **Security Best Practices**

### **Essential Security:**
- ✅ **Use SSH keys** instead of passwords
- ✅ **Keep private keys secure** (never share `id_rsa`)
- ✅ **Use strong Pi passwords** as backup
- ✅ **Regular Pi updates** `sudo apt update && sudo apt upgrade`

### **Advanced Security (Optional):**
- 🔐 **Change default SSH port** (edit `/etc/ssh/sshd_config`)
- 🚫 **Disable password authentication** entirely
- 🛡️ **Enable UFW firewall** on Pi
- 📊 **Monitor SSH logs** for intrusion attempts

### **Network Security:**
- 🏠 **Home network** is usually safe for SSH keys without passphrase
- 🏢 **Public networks** should use passphrases
- 🌐 **Internet exposure** requires advanced hardening

---

## 🎓 **How SSH Keys Work (Deep Dive)**

<details>
<summary><strong>🤓 Technical Details (Optional Reading)</strong></summary>

### **Cryptographic Key Pairs:**

**Private Key (`id_rsa`):**
- 🔐 **Mathematical secret** only you know
- 🖥️ **Stays on your computer** always
- 🔑 **Proves your identity** to the Pi
- ⚠️ **Never share this file**

**Public Key (`id_rsa.pub`):**
- 🔓 **Mathematical lock** that matches your private key
- 🍓 **Goes on the Pi** in `authorized_keys`
- 📢 **Safe to share** with anyone
- 🔍 **Verifies your identity** without revealing secrets

### **Authentication Process:**
1. **You initiate:** `ssh pi@192.168.1.100`
2. **Pi challenges:** "Prove you have the private key for this public key"
3. **Your computer signs:** Uses private key to sign a challenge
4. **Pi verifies:** Uses public key to verify the signature
5. **Success:** Pi grants access

### **Why This Is Secure:**
- 🔒 **Private key never transmitted** over network
- 🧮 **Computationally impossible** to derive private from public key
- 🎯 **Unique signatures** prevent replay attacks
- 🔐 **Quantum-resistant** with proper key sizes (2048+ bits)

</details>

---

## 📚 **Quick Reference**

### **Essential Commands:**
```bash
# Generate key pair
ssh-keygen -t rsa -b 4096

# Copy public key to Pi
ssh-copy-id pi@192.168.1.100

# Connect to Pi
ssh pi@192.168.1.100

# Copy files to Pi
scp file.txt pi@192.168.1.100:~/

# Run command on Pi
ssh pi@192.168.1.100 "ls -la"
```

### **Key Files:**
- `~/.ssh/id_rsa` - Your private key (keep secret)
- `~/.ssh/id_rsa.pub` - Your public key (safe to share)
- `~/.ssh/config` - SSH client configuration
- `~/.ssh/known_hosts` - Remembered host keys

---

## 🚀 **Next Steps**

**✅ SSH Working?** Great! Now you can:

1. **[Install TechTemp Server](../README.md#-easy-setup-with-docker)** - Set up the main system
2. **[Add Room Sensors](../README.md#️-add-your-first-room-sensor)** - Connect temperature sensors  
3. **[Use User Tools](../README.md#️-user-friendly-tools)** - Manage your system

**❌ Still having issues?** Check our troubleshooting:
- **[SSH Quick Help](troubleshooting/ssh-help.md)** - Common problems and solutions
- **[Find Pi IP](find-pi-ip.md)** - Network discovery guide
- **[Common Issues](troubleshooting/common-issues.md)** - General troubleshooting

---

<div align="center">

**🔐 Master SSH for seamless TechTemp automation**

**[📱 Main Guide](../README.md)** • **[🔌 Device Setup](sensor-setup.md)** • **[🛠️ Troubleshooting](troubleshooting.md)**

</div>
