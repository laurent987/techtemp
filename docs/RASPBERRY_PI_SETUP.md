# 🥧 Préparation Raspberry Pi - Carte SD + SSH

## **📋 Prérequis**
- **Raspberry Pi Zero 2W** (recommandé pour capteurs IoT) ou Pi 3B+/4B
- Carte microSD (8GB+ pour Zero 2W, 16GB+ pour Pi 4)
- Raspberry Pi OS Lite ou Desktop
- Ordinateur avec lecteur SD
- Capteur AHT20 (optionnel pour début)

---

## **🔧 Étape 1 : Installation Raspberry Pi OS**

### **📥 Télécharger Raspberry Pi Imager**
- **Site officiel :** https://www.raspberrypi.com/software/
- Installer Raspberry Pi Imager sur votre ordinateur

### **💾 Flash Carte SD**
1. **Lancer Raspberry Pi Imager**
2. **Choisir OS :** 
   - `Raspberry Pi OS Lite (64-bit)` - Pour serveur headless
   - `Raspberry Pi OS (64-bit)` - Avec interface graphique
3. **Choisir Storage :** Votre carte microSD
4. **⚙️ Configuration Avancée** (IMPORTANT !)

---

## **🔑 Étape 2 : Configuration SSH + Wi-Fi**

### **⚙️ Dans Raspberry Pi Imager - Paramètres Avancés :**

```yaml
✅ Activer SSH
   → Utiliser authentification par mot de passe
   → Utilisateur: pi
   → Mot de passe: [votre_mot_de_passe_sécurisé]

✅ Configurer Wi-Fi
   → SSID: [nom_de_votre_wifi]
   → Mot de passe: [mot_de_passe_wifi]
   → Pays: FR

✅ Paramètres localisés
   → Fuseau horaire: Europe/Paris
   → Clavier: French (France)
```

### **🚀 Flash la carte !**
- Cliquer sur "Écrire"
- Attendre la fin du processus
- Éjecter proprement la carte

---

## **🔌 Étape 3 : Premier Boot**

### **🥧 Insérer et Démarrer**
1. Insérer la carte SD dans le Raspberry Pi
2. Connecter l'alimentation
3. **Attendre 2-3 minutes** (premier boot + config SSH)

### **🌐 Trouver l'IP du Pi**
```bash
# Option 1 : Scanner réseau local
nmap -sn 192.168.1.0/24 | grep -A2 "Raspberry"

# Option 2 : Via routeur
# Vérifier dans l'interface web de votre box/routeur

# Option 3 : Pi connecté en Ethernet
arp -a | grep -i raspberry
```

---

## **🔐 Étape 4 : Test Connexion SSH**

```bash
# Connexion SSH
ssh pi@[IP_DU_PI]
# Exemple: ssh pi@192.168.1.150

# Première connexion : accepter la clé
# Entrer le mot de passe configuré
```

### **✅ Une fois connecté :**
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Vérifier I2C activé (pour AHT20)
sudo raspi-config
# → Interface Options → I2C → Enable

# Reboot si I2C activé
sudo reboot
```

---

## **🚀 Étape 5 : Déploiement TechTemp**

### **📥 Installation One-Liner**
```bash
# Une fois connecté en SSH au Pi :
curl -sSL https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh | bash
```

### **🔍 Test Installation**
```bash
cd /home/pi/techtemp

# Test système sans capteur
./scripts/test-hardware.sh

# Si capteur AHT20 connecté, lancer le client
./device/bin/techtemp-device
```

---

## **🔌 Branchement AHT20 (Optionnel)**

```
AHT20    →    Raspberry Pi
------------------------
VCC      →    3.3V (Pin 1)
GND      →    GND (Pin 6)
SDA      →    GPIO 2 (Pin 3)
SCL      →    GPIO 3 (Pin 5)
```

### **🧪 Test Capteur**
```bash
# Vérifier détection I2C
sudo i2cdetect -y 1
# Le capteur AHT20 doit apparaître à l'adresse 0x38

# Test complet avec TechTemp
./device/bin/techtemp-device
```

---

## **📝 Checklist Préparation**

- [ ] Raspberry Pi OS flashé avec Imager
- [ ] SSH activé et configuré
- [ ] Wi-Fi configuré (ou Ethernet)
- [ ] Première connexion SSH réussie
- [ ] I2C activé via raspi-config
- [ ] Bootstrap TechTemp exécuté
- [ ] Scripts de test fonctionnels
- [ ] AHT20 branché et détecté (si disponible)

---

## **🆘 Dépannage**

### **🔍 Diagnostic Réseau Pi**
```bash
# 1. Scan réseau pour détecter nouveaux appareils
nmap -sn 192.168.0.0/24

# 2. Comparer avant/après boot Pi
nmap -sn 192.168.0.0/24 > avant.txt  # Pi éteint
# ... démarrer le Pi, attendre 3-5 minutes
nmap -sn 192.168.0.0/24 > apres.txt  # Pi allumé
diff avant.txt apres.txt

# 3. Identifier par adresse MAC (Pi spécifique)
nmap -sn 192.168.0.0/24 | grep -A1 -B1 "B8:27:EB\|DC:A6:32\|E4:5F:01"

# 4. Test hostname par défaut
ping raspberrypi.local
ping techtemp-pi-01.local  # Votre hostname configuré
```

### **🔧 Problèmes de Connexion Courants**

#### **Pi détecté mais SSH refuse :**
```bash
# Test avec hostname
ssh pi@techtemp-pi-01.local

# Forcer mot de passe si clé SSH échoue
ssh -o PreferredAuthentications=password pi@techtemp-pi-01.local

# Mode verbose pour debug
ssh -v pi@techtemp-pi-01.local
```

#### **Cache réseau Mac qui traîne :**
```bash
# Vider cache ARP
sudo arp -a -d

# Nouveau scan propre
nmap -sn 192.168.0.0/24
```

### **SSH ne fonctionne pas :**
```bash
# Vérifier si SSH est activé
# Créer fichier ssh vide sur la partition boot de la SD
touch /Volumes/bootfs/ssh     # macOS (bootfs)
touch /media/bootfs/ssh       # Linux
```

### **Wi-Fi ne se connecte pas :**
```bash
# Méthode 1: Créer fichier wpa_supplicant.conf sur partition boot
cat > /Volumes/bootfs/wpa_supplicant.conf << EOF
country=BE
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="VOTRE_WIFI"
    psk="VOTRE_MOT_DE_PASSE"
    key_mgmt=WPA-PSK
}
EOF

# Méthode 2: Configuration directe dans /rootfs
nano /Volumes/rootfs/etc/wpa_supplicant/wpa_supplicant.conf
```

### **I2C ne fonctionne pas :**
```bash
# Dans config.txt, décommenter :
dtparam=i2c_arm=on

# Vérifier modules chargés
lsmod | grep i2c

# Forcer activation
sudo modprobe i2c-dev
sudo modprobe i2c-bcm2708
```

### **🎯 Procédure de Validation Complète**
```bash
# 1. Pi physiquement allumé ?
# LED rouge fixe + LED verte clignote = OK

# 2. Pi sur réseau ?
ping techtemp-pi-01.local

# 3. SSH accessible ?
ssh pi@techtemp-pi-01.local

# 4. I2C activé ?
sudo i2cdetect -y 1

# 5. Prêt pour TechTemp !
curl -sSL https://raw.../bootstrap.sh | bash
```

---

**🎯 Objectif :** Pi prêt pour Journal #008 - Premier Capteur Physique !

*Une fois SSH fonctionnel, le bootstrap fera le reste automatiquement !*
