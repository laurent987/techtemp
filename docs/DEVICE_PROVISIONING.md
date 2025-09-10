# 📱 **TechTemp Device Provisioning Guide**

Guide pour ajouter un nouveau Raspberry Pi dans le système TechTemp.

---

## 🎯 **Vue d'Ense🆔 Device UID: [aht20-b827eb123456] ▶ Press enter or customizeble**

### **Objectif**
Ajouter rapidement un nouveau capteur de température/humidité dans une pièce avec un workflow simple et robuste.

### **Prérequis**
- Ras# Vérifier device enregistré
curl http://192.168.1.100:3000/api/v1/devices | jq '.[] | select(.device_uid=="aht20-b827eb123456")'

# Vérifier données récentes (dernières 5min)
curl "http://192.168.1.100:3000/api/v1/readings?device_uid=aht20-b827eb123456&since=5m" | jq '.'

# Vérifier format données
# Attendu: {"device_uid":"aht20-b827eb123456","device_id":"aht20-b827eb123456","temperature":22.5,"humidity":45.2,"timestamp":"..."}i 4 (ou 3B+)
- Capteur AHT20 connecté en I2C
- Carte SD (16GB+) 
- Accès réseau (WiFi ou Ethernet)
- Serveur TechTemp Backend fonctionnel sur le réseau

---

## ⚡ **Workflow Rapide (5 minutes)**

### **1. Préparation Hardware (2 min)**
```bash
# Matériel nécessaire
✓ Raspberry Pi 4
✓ Capteur AHT20 connecté:
  - VCC → 3.3V (Pin 1)
  - GND → Ground (Pin 6) 
  - SDA → GPIO 2 (Pin 3)
  - SCL → GPIO 3 (Pin 5)
✓ Carte SD avec Raspberry Pi OS
✓ Réseau configuré (WiFi/Ethernet)
```

### **2. Boot & SSH (1 min)**
```bash
# Boot le Pi
# Enable SSH (raspi-config ou SSH file sur boot partition)
ssh pi@<PI_IP_ADDRESS>
```

### **3. Installation One-Liner (2 min)**
```bash
# Sur le Raspberry Pi
curl -sSL https://setup.techtemp.local/install | bash
```

**Le script va demander :**
- **Server IP ?** → IP du serveur TechTemp backend 
- **Room name ?** → Nom de la pièce (ex: kitchen, bedroom)
- **Device name ?** → [Auto-généré: aht20-MAC] ou personnalisé

**Device UID Auto-Generation :**
```bash
# Basé sur MAC address pour unicité garantie
MAC_ADDR=$(cat /sys/class/net/eth0/address | tr -d ':')
DEVICE_UID="aht20-${MAC_ADDR}"
# Exemple: aht20-b827eb123456
```

### **4. Validation Automatique (30 sec)**
Le script valide automatiquement :
- ✅ Capteur AHT20 détecté sur I2C
- ✅ Compilation du code client  
- ✅ Connexion MQTT au serveur
- ✅ Première lecture de données envoyée
- ✅ Service systemd démarré

---

## 🔧 **Workflow Détaillé**

### **Phase 1 : Préparation Pi**

#### **A. Hardware Setup**
```bash
# Vérification brochage AHT20
Pin 1  (3.3V)  → AHT20 VCC
Pin 3  (SDA)   → AHT20 SDA  
Pin 5  (SCL)   → AHT20 SCL
Pin 6  (GND)   → AHT20 GND
```

#### **B. OS Setup**
```bash
# Flash Raspberry Pi OS sur SD
# Boot → Enable SSH
sudo raspi-config
# → Interface Options → I2C → Enable
# → Advanced → SSH → Enable
```

#### **C. Network Setup**
```bash
# WiFi (si nécessaire)
sudo raspi-config
# → System Options → Wireless LAN → Configure

# Test connectivité
ping 8.8.8.8
```

### **Phase 2 : Installation TechTemp**

#### **A. Installation Automatique**
```bash
curl -sSL https://setup.techtemp.local/install | bash
```

**Le script exécute :**
1. **Detection serveur** : Scan réseau pour trouver TechTemp backend
2. **Installation dépendances** : `build-essential`, `libmosquitto-dev`, `i2c-tools`
3. **Clone repository** : Git clone du code TechTemp
4. **Configuration interactive** : Prompts utilisateur
5. **Compilation** : Build du client C
6. **Tests hardware** : Vérification I2C + capteur AHT20
7. **Installation service** : Service systemd
8. **Test intégration** : Envoi données test → backend
9. **Validation finale** : Health check complet

#### **B. Configuration Interactive**
```bash
🏠 TechTemp Device Setup
━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Scanning network for TechTemp server...
✅ Found TechTemp server at 192.168.1.100:3000

📍 Server IP: [192.168.1.100] ▶ Press enter or type new IP
🏠 Room name: kitchen ▶ Enter room name
� Device UUID: [aht20-b827eb123456] ▶ Press enter or customize

🔧 Configuring device...
✅ I2C enabled
✅ AHT20 sensor detected at 0x38
✅ Device UID generated: aht20-b827eb123456
✅ Dependencies installed
✅ TechTemp client compiled
✅ Configuration generated
✅ Device registered in backend (ID: 5)
✅ Service installed and started
✅ Test data sent successfully

🎉 Device ready! 
   View data at: http://192.168.1.100:3000
   Device UID: aht20-b827eb123456
   Device ID: 5
   Status: curl http://192.168.1.100:3000/api/v1/devices/aht20-b827eb123456
```

### **Phase 3 : Validation & Monitoring**

#### **A. Tests Automatiques**
```bash
# Tests exécutés par le script
sudo i2cdetect -y 1                    # AHT20 visible sur I2C ?
./test_sensor                          # Lecture température/humidité ?
./test_mqtt                           # Connexion MQTT ?
curl http://SERVER/api/v1/health      # Backend accessible ?
```

#### **B. Service Management**
```bash
# Status service
sudo systemctl status techtemp-device

# Logs en temps réel  
journalctl -u techtemp-device -f

# Restart si nécessaire
sudo systemctl restart techtemp-device
```

#### **C. Validation Backend**
```bash
# Vérifier device enregistré
curl http://192.168.1.100:3000/api/v1/devices

# Vérifier données reçues
curl http://192.168.1.100:3000/api/v1/readings?device_id=kitchen-001&limit=5
```

---

## 🛠️ **Configuration Manuelle (Backup)**

Si le script automatique échoue, workflow manuel :

### **1. Installation Dépendances**
```bash
sudo apt update
sudo apt install -y build-essential git libmosquitto-dev i2c-tools
```

### **2. Clone & Build**
```bash
cd /home/pi
git clone https://github.com/laurent987/techtemp.git
cd techtemp/device
make clean && make
```

### **3. Configuration Manuelle**
```bash
# device/config/device.conf
cp device.conf.example device.conf
nano device.conf

# Éditer:
device_uuid=aht20-b827eb123456
room=kitchen
mqtt_broker=192.168.1.100
mqtt_port=1883
mqtt_topic_base=home/kitchen/sensors/aht20-b827eb123456
```

### **4. Test & Service**
```bash
# Test
sudo ./test_sensor
sudo ./test_mqtt

# Install service
sudo cp systemd/techtemp-device.service /etc/systemd/system/
sudo systemctl enable techtemp-device
sudo systemctl start techtemp-device
```

---

## 🔍 **Troubleshooting**

### **Problèmes Courants**

#### **❌ AHT20 non détecté**
```bash
# Vérification I2C
sudo i2cdetect -y 1
# Si vide → vérifier câblage + enable I2C

# Test GPIO
gpio readall  # Vérifier pins SDA/SCL
```

#### **❌ Erreur compilation**
```bash
# Vérifier dépendances
sudo apt install -y build-essential libmosquitto-dev

# Clean build
cd techtemp/device
make clean && make
```

#### **❌ Connexion MQTT échec**
```bash
# Test réseau
ping 192.168.1.100

# Test MQTT
mosquitto_pub -h 192.168.1.100 -t test -m "hello"
```

#### **❌ Backend non trouvé**
```bash
# Vérifier backend
curl http://192.168.1.100:3000/health

# Vérifier Docker stack
ssh user@192.168.1.100
docker-compose ps
```

### **Debug Logs**
```bash
# Service logs
journalctl -u techtemp-device -f

# Application logs  
tail -f /var/log/techtemp-device.log

# MQTT debug
mosquitto_sub -h 192.168.1.100 -t "home/+/sensors/+/reading"
```

---

## 📊 **Validation Finale**

### **Checklist Succès**
- [ ] Pi boot + SSH accessible
- [ ] I2C activé + AHT20 détecté à 0x38
- [ ] Code TechTemp compilé sans erreur
- [ ] Service systemd démarré et actif
- [ ] Données visibles dans backend API
- [ ] Logs service propres (pas d'erreurs)

### **Test d'Intégration**
```bash
# 1. Vérifier device enregistré
curl http://192.168.1.100:3000/api/v1/devices | jq '.[] | select(.device_id=="kitchen-001")'

# 2. Vérifier données récentes (dernières 5min)
curl "http://192.168.1.100:3000/api/v1/readings?device_id=kitchen-001&since=5m" | jq '.'

# 3. Vérifier format données
# Attendu: {"device_id":"kitchen-001","temperature":22.5,"humidity":45.2,"timestamp":"..."}
```

---

## 🚀 **Optimisations Futures**

### **V2 Enhancements**
- [ ] **QR Code Setup** : Scan config depuis mobile
- [ ] **mDNS Discovery** : Auto-find backend server
- [ ] **OTA Updates** : Remote firmware updates  
- [ ] **Health Monitoring** : Watchdog + self-healing
- [ ] **Web Dashboard** : Status interface sur Pi
- [ ] **Image Custom** : Pre-configured SD images

### **Automation Scripts**
- [ ] `./provision.sh room_name` - One command setup
- [ ] `./deploy_batch.sh` - Multi-Pi deployment
- [ ] `./health_check.sh` - Network-wide validation

---

## 📞 **Support**

### **Ressources**
- **Documentation** : `docs/` dans le repository
- **Issues GitHub** : Report bugs/feature requests
- **API Reference** : `backend/docs/api.md`

### **Contact**
- **Repository** : https://github.com/laurent987/techtemp
- **Documentation** : https://docs.techtemp.local
