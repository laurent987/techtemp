# Configuration TechTemp Device

## 📄 Fichier de Configuration

Le fichier `device/config/device.conf` configure tous les aspects du device TechTemp.

### Structure générale

```ini
# TechTemp Device Configuration
# Generated on 2025-09-10

[device]
device_uid = aht20-f49c53
home_id = home-001
room_id = salon
label = Capteur Salon

[sensor]
i2c_address = 0x38
i2c_bus = 1
read_interval_seconds = 30
temperature_offset = 0.0
humidity_offset = 0.0

[mqtt]
broker_host = 192.168.0.180
broker_port = 1883
username = 
password = 
topic_prefix = techtemp/devices
qos = 1
retain = false
keepalive_seconds = 60
reconnect_delay_seconds = 5
max_reconnect_attempts = 10

[logging]
log_level = info
log_to_console = true
log_to_file = false
log_file_path = /var/log/techtemp-device.log

[system]
daemon_mode = false
pid_file = /var/run/techtemp-device.pid
shutdown_timeout_seconds = 10
```

## ⚙️ Sections Détaillées

### [device] - Identification

```ini
[device]
device_uid = aht20-f49c53    # UID unique du device (généré automatiquement)
home_id = home-001           # Identifiant du logement/maison
room_id = salon              # Identifiant de la pièce
label = Capteur Salon        # Nom descriptif
```

**Notes :**
- `device_uid` : Généré à partir de la MAC address (6 derniers caractères)
- `home_id` : Requis pour le topic MQTT contractuel
- `room_id` : Utilisé par le backend pour organiser les données
- `label` : Affiché dans l'interface utilisateur

### [sensor] - Configuration Capteur

```ini
[sensor]
i2c_address = 0x38                 # Adresse I2C du AHT20 (fixe)
i2c_bus = 1                        # Bus I2C (1 pour Pi Zero 2W)
read_interval_seconds = 30         # Intervalle entre les lectures
temperature_offset = 0.0           # Correction température (°C)
humidity_offset = 0.0              # Correction humidité (%)
```

**Paramètres avancés :**
- `read_interval_seconds` : 10-3600 secondes recommandées
- `*_offset` : Calibration manuelle si nécessaire

### [mqtt] - Communication

```ini
[mqtt]
broker_host = 192.168.0.180        # IP/hostname du broker MQTT
broker_port = 1883                 # Port MQTT (1883 standard, 8883 TLS)
username =                         # Username MQTT (vide = anonyme)
password =                         # Password MQTT
topic_prefix = techtemp/devices    # Préfixe des topics
qos = 1                           # Quality of Service (0,1,2)
retain = false                     # Messages persistants
keepalive_seconds = 60            # Keepalive MQTT
reconnect_delay_seconds = 5       # Délai entre reconnexions
max_reconnect_attempts = 10       # Tentatives max avant abandon
```

**Format des topics :**
- Publication : `home/{home_id}/sensors/{device_uid}/reading` (Contrat 001)
- Exemple : `home/home-001/sensors/aht20-f49c53/reading`

### [logging] - Journalisation

```ini
[logging]
log_level = info                   # debug, info, warn, error
log_to_console = true             # Logs vers stdout
log_to_file = false               # Logs vers fichier
log_file_path = /var/log/techtemp-device.log
```

**Niveaux de log :**
- `debug` : Très détaillé (développement)
- `info` : Informations normales (production)
- `warn` : Avertissements uniquement
- `error` : Erreurs uniquement

### [system] - Comportement Système

```ini
[system]
daemon_mode = false               # Mode démon (true pour systemd)
pid_file = /var/run/techtemp-device.pid
shutdown_timeout_seconds = 10    # Timeout arrêt propre
```

## 🔧 Configuration Avancée

### Authentification MQTT

Pour un broker MQTT sécurisé :

```ini
[mqtt]
broker_host = mqtt.example.com
broker_port = 8883
username = techtemp_user
password = secure_password
```

### Calibration Capteur

Si le capteur dérive :

```ini
[sensor]
temperature_offset = -0.5    # Capteur lit 0.5°C trop haut
humidity_offset = 2.0        # Capteur lit 2% trop bas
```

### Logs détaillés

Pour le debugging :

```ini
[logging]
log_level = debug
log_to_console = true
log_to_file = true
log_file_path = /home/pi/techtemp-debug.log
```

### Lecture rapide

Pour tests ou applications critiques :

```ini
[sensor]
read_interval_seconds = 10

[mqtt]
qos = 2                      # Garantie de livraison
retain = true               # Message persistant
```

## 🛠️ Génération et Modification

### Génération automatique

Le script bootstrap génère automatiquement la configuration :

```bash
./deployment/bootstrap-pi.sh 192.168.0.134
```

### Modification manuelle

```bash
# Éditer la config
sudo nano /home/pi/techtemp/device/config/device.conf

# Redémarrer le service
sudo systemctl restart techtemp-device

# Vérifier les logs
journalctl -u techtemp-device -f
```

### Validation

```bash
# Test de la config
cd /home/pi/techtemp/device
sudo ./build/techtemp-device config/device.conf --validate-config

# Test sans démarrage
sudo ./build/techtemp-device config/device.conf --dry-run
```

## 📋 Templates

### Configuration Minimale

```ini
[device]
device_uid = aht20-123456
home_id = home-001
room_id = salon
label = Capteur Test

[sensor]
i2c_address = 0x38
i2c_bus = 1
read_interval_seconds = 30

[mqtt]
broker_host = 192.168.1.100
broker_port = 1883
topic_prefix = techtemp/devices

[logging]
log_level = info
log_to_console = true

[system]
daemon_mode = false
```

### Configuration Production

```ini
[device]
device_uid = aht20-f49c53
home_id = home-001
room_id = salon
label = Capteur Salon Principal

[sensor]
i2c_address = 0x38
i2c_bus = 1
read_interval_seconds = 30
temperature_offset = 0.0
humidity_offset = 0.0

[mqtt]
broker_host = iot.maison.local
broker_port = 1883
username = 
password = 
topic_prefix = techtemp/devices
qos = 1
retain = false
keepalive_seconds = 60
reconnect_delay_seconds = 5
max_reconnect_attempts = 10

[logging]
log_level = info
log_to_console = false
log_to_file = true
log_file_path = /var/log/techtemp-device.log

[system]
daemon_mode = true
pid_file = /var/run/techtemp-device.pid
shutdown_timeout_seconds = 10
```

## 🔄 Migration et Sauvegarde

### Sauvegarde

```bash
# Sauvegarder la config
cp /home/pi/techtemp/device/config/device.conf /home/pi/device.conf.backup

# Avec timestamp
cp /home/pi/techtemp/device/config/device.conf /home/pi/device.conf.$(date +%Y%m%d-%H%M%S)
```

### Restauration

```bash
# Restaurer une sauvegarde
cp /home/pi/device.conf.backup /home/pi/techtemp/device/config/device.conf
sudo systemctl restart techtemp-device
```

### Migration entre devices

```bash
# Sur l'ancien device
scp /home/pi/techtemp/device/config/device.conf user@nouveau-pi:/tmp/

# Sur le nouveau device
# Modifier le device_uid dans la config
sed -i 's/device_uid = .*/device_uid = aht20-NOUVEAU-UID/' /tmp/device.conf
cp /tmp/device.conf /home/pi/techtemp/device/config/device.conf
```

## 🔗 Références

- [Guide Bootstrap](bootstrap.md) : Génération automatique
- [Troubleshooting](../troubleshooting/common-issues.md) : Résolution de problèmes
- [Hardware AHT20](../hardware/aht20.md) : Configuration capteur
