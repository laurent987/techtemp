#!/bin/bash
##############################################################################
# TechTemp Device - Script d'Installation Raspberry Pi
# Journal #008 - Phase 3 
# Date: 10 septembre 2025
##############################################################################

set -e  # Arrêt en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DEVICE_USER="pi"
DEVICE_HOME="/home/$DEVICE_USER"
REPO_URL="https://github.com/laurent987/techtemp.git"
CONFIG_FILE="$DEVICE_HOME/device.conf"
LOG_FILE="/var/log/techtemp-install.log"

##############################################################################
# Fonctions utilitaires
##############################################################################

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root (sudo)"
        exit 1
    fi
}

check_raspberry_pi() {
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        log_warn "Ce script est conçu pour Raspberry Pi"
        read -p "Continuer quand même ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

##############################################################################
# Fonctions d'installation
##############################################################################

install_system_dependencies() {
    log "📦 Installation des dépendances système..."
    
    # Mise à jour des paquets
    apt update && apt upgrade -y
    
    # Outils de base
    apt install -y \
        build-essential \
        git \
        cmake \
        curl \
        wget \
        nano \
        htop \
        i2c-tools
    
    log "✅ Dépendances système installées"
}

enable_i2c() {
    log "🔧 Activation I2C..."
    
    # Activer I2C dans /boot/config.txt
    if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt; then
        echo "dtparam=i2c_arm=on" >> /boot/config.txt
        log "I2C activé dans /boot/config.txt"
    else
        log "I2C déjà activé dans /boot/config.txt"
    fi
    
    # Charger le module I2C
    modprobe i2c-bcm2835 || true
    modprobe i2c-dev || true
    
    # Ajouter utilisateur au groupe i2c
    usermod -a -G i2c "$DEVICE_USER"
    
    log "✅ I2C configuré"
}

install_wiringpi() {
    log "📡 Installation WiringPi..."
    
    # Essayer installation via apt
    if apt install -y wiringpi; then
        log "WiringPi installé via apt"
    else
        log_warn "Installation apt échouée, compilation manuelle..."
        
        # Compilation manuelle
        cd /tmp
        git clone https://github.com/WiringPi/WiringPi.git
        cd WiringPi
        ./build
        cd /
        rm -rf /tmp/WiringPi
    fi
    
    # Vérification
    if gpio -v &>/dev/null; then
        log "✅ WiringPi installé et fonctionnel"
    else
        log_error "Échec installation WiringPi"
        exit 1
    fi
}

install_mosquitto() {
    log "🦟 Installation libmosquitto..."
    
    apt install -y libmosquitto-dev mosquitto-clients
    
    # Vérification
    if ldconfig -p | grep -q libmosquitto; then
        log "✅ libmosquitto installé"
    else
        log_error "Échec installation libmosquitto"
        exit 1
    fi
}

clone_repository() {
    log "📂 Clonage du repository TechTemp..."
    
    # Supprimer ancien clone si existant
    if [[ -d "$DEVICE_HOME/techtemp" ]]; then
        log_warn "Repository existant trouvé, sauvegarde..."
        mv "$DEVICE_HOME/techtemp" "$DEVICE_HOME/techtemp.backup.$(date +%s)"
    fi
    
    # Cloner en tant qu'utilisateur pi
    sudo -u "$DEVICE_USER" git clone "$REPO_URL" "$DEVICE_HOME/techtemp"
    
    # Aller sur la bonne branche
    cd "$DEVICE_HOME/techtemp"
    sudo -u "$DEVICE_USER" git checkout feature/journal-008-premier-capteur-physique
    
    log "✅ Repository cloné"
}

compile_application() {
    log "🔨 Compilation de l'application..."
    
    cd "$DEVICE_HOME/techtemp/device"
    
    # Compilation
    sudo -u "$DEVICE_USER" make clean
    sudo -u "$DEVICE_USER" make
    
    # Vérification
    if [[ -x "build/techtemp-device" ]]; then
        log "✅ Application compilée avec succès"
    else
        log_error "Échec de compilation"
        exit 1
    fi
}

create_configuration() {
    log "⚙️  Création de la configuration..."
    
    # Générer device_uid basé sur le serial Pi
    DEVICE_UID="aht20-$(hostname)"
    if [[ -f /proc/cpuinfo ]]; then
        SERIAL=$(grep "Serial" /proc/cpuinfo | cut -d':' -f2 | tr -d ' ')
        if [[ -n "$SERIAL" && "$SERIAL" != "0000000000000000" ]]; then
            DEVICE_UID="aht20-${SERIAL: -8}"
        fi
    fi
    
    # Créer configuration
    cat > "$CONFIG_FILE" << EOF
# TechTemp Device Configuration
# Généré automatiquement le $(date)

[device]
device_uid = $DEVICE_UID
home_id = home-001
label = Capteur Raspberry Pi
read_interval = 30

[sensor]
i2c_bus = 1
i2c_address = 0x38
temp_offset = 0.0
humidity_offset = 0.0

[mqtt]
host = localhost
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
EOF
    
    chown "$DEVICE_USER:$DEVICE_USER" "$CONFIG_FILE"
    chmod 644 "$CONFIG_FILE"
    
    log "✅ Configuration créée: $CONFIG_FILE"
    log "🏷️  Device UID: $DEVICE_UID"
}

create_systemd_service() {
    log "🔧 Création du service systemd..."
    
    cat > /etc/systemd/system/techtemp-device.service << EOF
[Unit]
Description=TechTemp Device Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=$DEVICE_USER
Group=$DEVICE_USER
WorkingDirectory=$DEVICE_HOME/techtemp/device
ExecStart=$DEVICE_HOME/techtemp/device/build/techtemp-device $CONFIG_FILE
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Recharger systemd
    systemctl daemon-reload
    
    log "✅ Service systemd créé"
}

test_i2c_sensor() {
    log "🌡️  Test du capteur I2C..."
    
    # Attendre un peu pour l'initialisation I2C
    sleep 2
    
    # Scanner I2C
    I2C_RESULT=$(i2cdetect -y 1 2>/dev/null || true)
    
    if echo "$I2C_RESULT" | grep -q "38"; then
        log "✅ Capteur AHT20 détecté à l'adresse 0x38"
        return 0
    else
        log_warn "⚠️  Capteur AHT20 non détecté à 0x38"
        log_warn "Scan I2C complet:"
        echo "$I2C_RESULT"
        return 1
    fi
}

test_application() {
    log "🧪 Test de l'application..."
    
    cd "$DEVICE_HOME/techtemp/device"
    
    # Test rapide (5 secondes max)
    timeout 5s sudo -u "$DEVICE_USER" ./build/techtemp-device "$CONFIG_FILE" || true
    
    log "✅ Test application terminé"
}

##############################################################################
# Script principal
##############################################################################

main() {
    log "🚀 Début installation TechTemp Device"
    log "📅 $(date)"
    log "🖥️  Système: $(uname -a)"
    
    # Vérifications préalables
    check_root
    check_raspberry_pi
    
    # Installation
    install_system_dependencies
    enable_i2c
    install_wiringpi
    install_mosquitto
    clone_repository
    compile_application
    create_configuration
    create_systemd_service
    
    # Tests
    test_i2c_sensor
    test_application
    
    log "🎉 Installation terminée avec succès!"
    echo
    log "📋 Prochaines étapes:"
    log "1. Redémarrer le Pi: sudo reboot"
    log "2. Vérifier capteur I2C: sudo i2cdetect -y 1"
    log "3. Configurer MQTT: nano $CONFIG_FILE"
    log "4. Tester: sudo systemctl start techtemp-device"
    log "5. Activer au démarrage: sudo systemctl enable techtemp-device"
    echo
    log "📂 Fichiers importants:"
    log "- Configuration: $CONFIG_FILE"
    log "- Application: $DEVICE_HOME/techtemp/device/build/techtemp-device"
    log "- Logs: tail -f /var/log/techtemp-device.log"
    log "- Service: sudo systemctl status techtemp-device"
    echo
}

# Exécution avec capture des erreurs
if ! main "$@"; then
    log_error "Installation échouée"
    exit 1
fi
