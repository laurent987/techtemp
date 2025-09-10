# 🔧 TechTemp Device - Guide de Déploiement Raspberry Pi

**Date :** 10 septembre 2025  
**Journal :** #008 - Phase 3  
**Objectif :** Déploiement du client C sur Raspberry Pi avec capteur AHT20

---

## 📋 **Prérequis Hardware**

> **🚀 Nouveau sur Raspberry Pi ?**  
> Consultez notre **[Guide de Préparation Raspberry Pi](RASPBERRY_PI_SETUP.md)** pour :  
> Configuration carte SD, activation SSH, Wi-Fi, et dépannage connexion.

### **Raspberry Pi**
- **Recommandé :** **Raspberry Pi Zero 2W** (optimal prix/performance pour capteurs)
- **Alternatives :** Raspberry Pi 3B+, 4B
- **OS :** Raspberry Pi OS Lite/Desktop (Debian-based)
- **Connectivité :** Wi-Fi intégré (Zero 2W) ou Ethernet
- **GPIO :** I2C activé

### **Capteur AHT20**
- **Capteur :** AHT20 température/humidité
- **Interface :** I2C (SDA/SCL)
- **Alimentation :** 3.3V ou 5V

> **💡 Pourquoi Pi Zero 2W pour TechTemp ?**  
> - ✅ **Prix :** ~15€ vs 80€+ pour Pi 4  
> - ✅ **Consommation :** <1W (parfait pour capteurs 24/7)  
> - ✅ **Wi-Fi intégré :** Pas besoin d'adaptateur  
> - ✅ **Performance :** ARM Cortex-A53 suffisant pour notre client C  
> - ✅ **Compact :** Idéal pour boîtiers capteurs discrets

### **Câblage I2C**
```
Raspberry Pi          AHT20
=================================
Pin 1  (3.3V)    →    VCC
Pin 3  (SDA)     →    SDA  
Pin 5  (SCL)     →    SCL
Pin 9  (GND)     →    GND
```

---

## 🔧 **Étape 1 : Préparation Raspberry Pi**

### **1.1 Activation I2C**
```bash
# Activer I2C via raspi-config
sudo raspi-config
# → Interface Options → I2C → Enable

# Vérifier activation
sudo reboot
lsmod | grep i2c_bcm2835
```

### **1.2 Installation Dépendances**
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation outils I2C
sudo apt install -y i2c-tools

# Installation bibliothèques développement
sudo apt install -y build-essential git cmake

# Installation wiringPi
sudo apt install -y wiringpi
# Ou compilation manuelle si nécessaire:
# git clone https://github.com/WiringPi/WiringPi.git
# cd WiringPi && ./build

# Installation libmosquitto
sudo apt install -y libmosquitto-dev mosquitto-clients

# Test wiringPi
gpio -v
```

### **1.3 Vérification Capteur I2C**
```bash
# Scan des périphériques I2C
sudo i2cdetect -y 1

# Résultat attendu (AHT20 à l'adresse 0x38):
#      0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
# 00:          -- -- -- -- -- -- -- -- -- -- -- -- --
# 10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
# 20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
# 30: -- -- -- -- -- -- -- -- 38 -- -- -- -- -- -- --
# 40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
# 50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
# 60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
# 70: -- -- -- -- -- -- -- --
```

---

## 📦 **Étape 2 : Déploiement Application**

> **⚡ Installation Ultra-Rapide ?**  
> Consultez notre **[Guide d'Accès Rapide](ACCESS_GUIDE.md)** pour toutes les  
> méthodes de téléchargement et d'installation des scripts TechTemp.

### **🚀 Installation Rapide (One-Liner)**
```bash
# Bootstrap rapide - Télécharge et configure tout automatiquement
curl -sSL https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh | bash
```

### **📂 Installation Manuelle**

#### **2.1 Clonage Repository**
```bash
# Cloner le repository TechTemp
cd /home/pi
git clone https://github.com/laurent987/techtemp.git
cd techtemp/

# Aller sur la bonne branche
git checkout feature/journal-008-premier-capteur-physique

# Permissions scripts
chmod +x scripts/*.sh
```

### **2.3 Test Connexion SSH**

#### **📍 Localiser le Raspberry Pi**
```bash
# Scan réseau pour trouver votre Pi
nmap -sn 192.168.0.0/24

# Test par hostname configuré
ping techtemp-pi-01.local   # Remplacer par votre hostname
ping raspberrypi.local      # Hostname par défaut

# Identifier spécifiquement les Pi par MAC
nmap -sn 192.168.0.0/24 | grep -A1 -B1 "B8:27:EB\|DC:A6:32\|E4:5F:01"
```

#### **🔐 Connexion SSH**
```bash
# Méthode recommandée (par hostname)
ssh pi@techtemp-pi-01.local

# Alternative par IP directe
ssh pi@192.168.0.XXX        # IP trouvée avec nmap

# Si échec authentification par clé SSH
ssh -o PreferredAuthentications=password pi@techtemp-pi-01.local

# Debug connexion
ssh -v pi@techtemp-pi-01.local
```

#### **✅ Validation Connexion**
```bash
# Une fois connecté, vérifier :
uname -a                    # Système
hostname                    # Nom configuré
sudo i2cdetect -y 1        # I2C pour capteurs
df -h                      # Espace disque
```

### **2.4 Installation TechTemp**
```bash
# Si vous voulez juste les scripts sans clone complet
mkdir -p /home/pi/techtemp-scripts
cd /home/pi/techtemp-scripts

# Télécharger scripts individuellement
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/test-hardware.sh
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/install-device.sh
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh

chmod +x *.sh
```

### **2.2 Compilation**
```bash
# Compilation normale (hardware réel)
make clean && make

# Vérification exécutable
ls -la build/techtemp-device
file build/techtemp-device
```

### **2.3 Configuration**
```bash
# Copier configuration par défaut
cp config/device.conf /home/pi/device.conf

# Éditer configuration
nano /home/pi/device.conf
```

**Configuration type :**
```ini
[device]
device_uid = aht20-$(hostname)
home_id = home-001
label = Capteur Salon
read_interval = 30

[sensor]
i2c_bus = 1
i2c_address = 0x38
temp_offset = 0.0
humidity_offset = 0.0

[mqtt]
host = 192.168.1.100  # IP du serveur TechTemp
port = 1883
username = 
password = 
qos = 1
keepalive = 60

[logging]
level = INFO
console = true
file = true
log_file = /var/log/techtemp-device.log

[system]
daemon = false
pid_file = /var/run/techtemp-device.pid
```

---

## 🚀 **Étape 3 : Tests & Validation**

### **3.1 Test Manuel**
```bash
# Exécution manuelle avec logs détaillés
cd /home/pi/techtemp/device
sudo ./build/techtemp-device /home/pi/device.conf

# Logs attendus:
# [2025-09-10 16:30:15] INFO  Configuration loaded successfully
# [2025-09-10 16:30:15] INFO  AHT20 sensor initialized successfully
# [2025-09-10 16:30:15] INFO  MQTT client initialized successfully
# [2025-09-10 16:30:15] INFO  🚀 TechTemp Device Client started!
# [2025-09-10 16:30:45] INFO  Temperature: 23.45°C, Humidity: 58.2%
```

### **3.2 Vérification MQTT**
```bash
# Écoute des messages MQTT (terminal séparé)
mosquitto_sub -h 192.168.1.100 -t "home/+/sensors/+/reading" -v

# Messages attendus:
# home/home-001/sensors/aht20-raspberrypi/reading {
#   "device_uid": "aht20-raspberrypi",
#   "timestamp": 1725975045000,
#   "temperature": 23.45,
#   "humidity": 58.2,
#   "sensor_type": "AHT20"
# }
```

### **3.3 Vérification Backend**
```bash
# Test API backend (depuis Pi ou autre machine)
curl http://192.168.1.100:3000/api/v1/readings?device_uid=aht20-raspberrypi

# Réponse attendue:
# {
#   "status": "success",
#   "data": [
#     {
#       "id": 1,
#       "device_uid": "aht20-raspberrypi",
#       "temperature": 23.45,
#       "humidity": 58.2,
#       "timestamp": "2025-09-10T14:30:45.000Z"
#     }
#   ]
# }
```

---

## ⚙️ **Étape 4 : Service Système (Optionnel)**

### **4.1 Création Service Systemd**
```bash
# Créer fichier service
sudo nano /etc/systemd/system/techtemp-device.service
```

```ini
[Unit]
Description=TechTemp Device Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/techtemp/device
ExecStart=/home/pi/techtemp/device/build/techtemp-device /home/pi/device.conf
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### **4.2 Activation Service**
```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer au démarrage
sudo systemctl enable techtemp-device

# Démarrer service
sudo systemctl start techtemp-device

# Vérifier statut
sudo systemctl status techtemp-device

# Logs service
sudo journalctl -u techtemp-device -f
```

---

## 🔍 **Dépannage**

### **Erreurs Communes**

**1. Capteur non détecté (i2cdetect ne montre pas 0x38)**
```bash
# Vérifier câblage
# Vérifier alimentation capteur
# Tester autre adresse I2C si AHT20 modifié
```

**2. Permission I2C refusée**
```bash
# Ajouter utilisateur au groupe i2c
sudo usermod -a -G i2c pi
# Redémarrer session
```

**3. Erreur compilation wiringPi**
```bash
# Installation manuelle wiringPi
git clone https://github.com/WiringPi/WiringPi.git
cd WiringPi
./build
```

**4. Connexion MQTT échoue**
```bash
# Vérifier réseau
ping 192.168.1.100

# Tester connexion MQTT
mosquitto_pub -h 192.168.1.100 -t test -m "hello"

# Vérifier firewall serveur
# Vérifier configuration broker MQTT
```

---

## 📊 **Critères de Succès Phase 3**

- [ ] **Hardware** : Capteur AHT20 détecté à l'adresse 0x38
- [ ] **Compilation** : Application compile sans erreurs sur Pi
- [ ] **Lecture Capteur** : Valeurs température/humidité cohérentes
- [ ] **MQTT** : Messages publiés et reçus correctement
- [ ] **Backend** : Données visibles via API `/api/v1/readings`
- [ ] **Persistence** : Données stockées en base SQLite
- [ ] **Stabilité** : Fonctionnement continu sans erreurs

---

## 📝 **Logs & Monitoring**

```bash
# Logs application
tail -f /var/log/techtemp-device.log

# Logs système
sudo journalctl -u techtemp-device -f

# Monitoring CPU/mémoire
htop

# Monitoring I2C
watch -n 5 'sudo i2cdetect -y 1'
```
