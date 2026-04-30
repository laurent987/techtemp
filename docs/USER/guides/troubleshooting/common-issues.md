**[⬅️ Back to Setup Guide](../../README.md)**

# Problèmes Courants - TechTemp Device

## 🚨 Diagnostics Rapides

### ❌ Device ne démarre pas

**Symptômes :**
- Aucun log dans `journalctl`
- Service en erreur

**Diagnostic :**
```bash
# Vérifier le status du service
sudo systemctl status techtemp-devi## 🔐 Problèmes SSH/Connexione

# Tenter un démarrag```

## 📞 Support

### Collecte d'informationsuel
cd /home/pi/techtemp/device
sudo ./build/techtemp-device config/device.conf
```

**Solutions courantes :**
1. **Fichier de config manquant** : Regénérer avec bootstrap
2. **Permissions** : `sudo chown pi:pi /home/pi/techtemp -R`
3. **Dépendances** : `sudo apt-get install libmosquitto1`

### ❌ Capteur non détecté

**Symptômes :**
```
⚠️ Capteur AHT20 non détecté à l'adresse 0x38
```

**Diagnostic :**
```bash
# Test I2C
sudo i2cdetect -y 1

# Vérifier I2C activé
lsmod | grep i2c_bcm2835
```

**Solutions :**
1. **I2C non activé** : `sudo raspi-config nonint do_i2c 0`
2. **Mauvais câblage** : Voir [guide sensor setup](../sensor-setup.md)
3. **Redémarrer** : `sudo reboot`

### ❌ Pas de données MQTT

**Symptômes :**
- Device démarre mais pas de données dans l'API
- Logs MQTT en erreur

**Diagnostic :**
```bash
# Vérifier la config MQTT
cat /home/pi/techtemp/device/config/device.conf | grep broker

# Test de connexion MQTT
mosquitto_pub -h BROKER_IP -t test/topic -m "test"
```

**Solutions :**
1. **Broker inaccessible** : Vérifier l'IP dans la config
2. **Port fermé** : Tester `telnet BROKER_IP 1883`
3. **Credentials** : Vérifier username/password

### ❌ Compilation échoue

**Symptômes :**
```
gcc: error: libmosquitto: No such file or directory
```

**Solutions :**
```bash
# Installer les dépendances
sudo apt-get update
sudo apt-get install build-essential libmosquitto-dev

# Nettoyer et recompiler
cd /home/pi/techtemp/device
make clean && make
```

## 🔍 Diagnostics Avancés

### Logs détaillés

```bash
# Logs du service
journalctl -u techtemp-device -f

# Logs avec debug
sudo ./build/techtemp-device config/device.conf --log-level debug

# Logs système I2C
dmesg | grep i2c
```

### Test MQTT manuel

```bash
# Écouter les messages
mosquitto_sub -h BROKER_IP -t "techtemp/devices/+/reading"

# Publier un test
mosquitto_pub -h BROKER_IP -t "techtemp/devices/test/reading" -m '{"temperature":20.0}'
```

### Vérification réseau

```bash
# Ping broker
ping BROKER_IP

# Port MQTT ouvert
nc -zv BROKER_IP 1883

# Résolution DNS
nslookup BROKER_HOSTNAME
```

## 🛠️ Outils de Debug

### Script de diagnostic

Créer `/home/pi/debug-techtemp.sh` :

```bash
#!/bin/bash
echo "=== TechTemp Diagnostic ==="
echo "Date: $(date)"
echo ""

echo "=== System Info ==="
uname -a
echo "Uptime: $(uptime)"
echo ""

echo "=== I2C Status ==="
lsmod | grep i2c
sudo i2cdetect -y 1
echo ""

echo "=== Network ==="
ip addr show
ping -c 3 8.8.8.8
echo ""

echo "=== TechTemp Service ==="
systemctl status techtemp-device
echo ""

echo "=== Config ==="
cat /home/pi/techtemp/device/config/device.conf
echo ""

echo "=== Recent Logs ==="
journalctl -u techtemp-device --no-pager -n 20
```

### Test manuel complet

```bash
# 1. Test hardware
sudo i2cdetect -y 1

# 2. Test compilation
cd /home/pi/techtemp/device && make clean && make

# 3. Test lecture capteur
sudo ./build/techtemp-device config/device.conf --test-sensor

# 4. Test MQTT
sudo ./build/techtemp-device config/device.conf --test-mqtt

# 5. Test complet
sudo ./build/techtemp-device config/device.conf --dry-run
```

## 🔧 Réparations Courantes

### Réinstallation complète

```bash
# Sauvegarder la config
cp /home/pi/techtemp/device/config/device.conf /tmp/

# Supprimer et réinstaller
rm -rf /home/pi/techtemp
# Relancer le bootstrap

# Restaurer la config
cp /tmp/device.conf /home/pi/techtemp/device/config/
```

### Reset du capteur

```bash
# Reset soft AHT20
sudo i2cset -y 1 0x38 0xba i
sleep 0.02

# Réinitialisation
sudo i2cset -y 1 0x38 0xac 0x33 0x00 i
```

### Reconstruction du service

```bash
# Arrêter le service
sudo systemctl stop techtemp-device
sudo systemctl disable techtemp-device

# Supprimer le service
sudo rm /etc/systemd/system/techtemp-device.service

# Relancer le bootstrap ou recréer manuellement
sudo systemctl daemon-reload
```

## 📊 Monitoring Préventif

### Vérifications régulières

```bash
# Script de monitoring (/home/pi/monitor-techtemp.sh)
#!/bin/bash

# Vérifier le service
if ! systemctl is-active --quiet techtemp-device; then
    echo "ALERT: TechTemp service down"
    sudo systemctl restart techtemp-device
fi

# Vérifier les données récentes
LAST_READING=$(curl -s "http://BROKER_IP:3000/api/v1/readings/latest?deviceId=DEVICE_UID" | jq -r '.timestamp // empty')
if [ -z "$LAST_READING" ]; then
    echo "ALERT: No recent data"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "ALERT: Disk usage $DISK_USAGE%"
fi
```

### Crontab pour monitoring

```bash
# Ajouter au crontab (crontab -e)
*/5 * * * * /home/pi/monitor-techtemp.sh >> /var/log/techtemp-monitor.log 2>&1
```

## � Problèmes SSH/Connexion

### ❌ Impossible de se connecter en SSH

**Symptômes :**
```
ssh: connect to host 192.168.1.100 port 22: Connection refused
```

**Diagnostic :**
```bash
# Ping le Raspberry Pi
ping 192.168.1.100

# Vérifier le port SSH
nmap -p 22 192.168.1.100

# Scanner le réseau
nmap -sn 192.168.1.0/24
```

**Solutions :**
1. **SSH non activé** : Utiliser clavier/écran, puis `sudo systemctl enable ssh`
2. **Mauvaise IP** : Vérifier sur votre box/routeur
3. **Réseau différent** : Essayer 192.168.0.x ou 10.0.0.x

### ❌ Demande le mot de passe à chaque fois

**Solution (clés SSH) :**
```bash
# Sur votre ordinateur de travail
ssh-keygen -t rsa -b 4096
ssh-copy-id pi@192.168.1.100

# Test
ssh pi@192.168.1.100  # Devrait marcher sans mot de passe
```

### ❌ Permission denied

**Causes courantes :**
- Mauvais nom d'utilisateur (utiliser `pi`)
- Mauvais mot de passe
- Clé SSH corrompue

**Solutions :**
```bash
# Test avec mot de passe
ssh -o PreferredAuthentications=password pi@192.168.1.100

# Supprimer anciennes clés
ssh-keygen -R 192.168.1.100
```

## �📞 Support

### Collecte d'informations

Avant de demander de l'aide, collecter :

```bash
# Générer un rapport complet
/home/pi/debug-techtemp.sh > /tmp/techtemp-diagnostic-$(date +%Y%m%d-%H%M%S).txt
```

### Contacts

- **GitHub Issues** : [techtemp/issues](https://github.com/laurent987/techtemp/issues)
- **Documentation** : Voir `/device/docs/` pour les guides détaillés
