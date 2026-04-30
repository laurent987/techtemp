#!/bin/bash
##############################################################################
# TechTemp Device - Test Hardware Rapide
# Validation capteur AHT20 + I2C + prérequis
##############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔍 TechTemp Device - Test Hardware Rapide"
echo "========================================"

# Test 1: Raspberry Pi
echo
echo "🍓 Test Raspberry Pi..."
if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    MODEL=$(grep "Model" /proc/cpuinfo | cut -d':' -f2 | xargs)
    log "Raspberry Pi détecté: $MODEL"
else
    warn "Pas un Raspberry Pi détecté"
fi

# Test 2: I2C activé
echo
echo "🔧 Test I2C..."
if lsmod | grep -q i2c_bcm2835; then
    log "Module I2C chargé"
else
    error "Module I2C non chargé - Activer I2C avec: sudo raspi-config"
fi

if [[ -c /dev/i2c-1 ]]; then
    log "Interface I2C-1 disponible"
else
    error "Interface I2C-1 non disponible"
fi

# Test 3: Permissions I2C
echo
echo "👤 Test permissions I2C..."
if groups | grep -q i2c; then
    log "Utilisateur dans le groupe i2c"
else
    warn "Ajouter utilisateur au groupe i2c: sudo usermod -a -G i2c \$(whoami)"
fi

# Test 4: Outils I2C
echo
echo "🛠️  Test outils I2C..."
if command -v i2cdetect &> /dev/null; then
    log "i2c-tools installé"
    
    echo
    echo "📡 Scan périphériques I2C..."
    I2C_SCAN=$(sudo i2cdetect -y 1 2>/dev/null)
    echo "$I2C_SCAN"
    
    if echo "$I2C_SCAN" | grep -q "38"; then
        log "🌡️  Capteur AHT20 détecté à l'adresse 0x38!"
    else
        warn "Capteur AHT20 non détecté à 0x38"
        warn "Vérifier le câblage:"
        warn "  Pi Pin 1 (3.3V) → AHT20 VCC"
        warn "  Pi Pin 3 (SDA)  → AHT20 SDA"
        warn "  Pi Pin 5 (SCL)  → AHT20 SCL"
        warn "  Pi Pin 9 (GND)  → AHT20 GND"
    fi
else
    error "i2c-tools non installé: sudo apt install i2c-tools"
fi

# Test 5: Dépendances compilation
echo
echo "🔨 Test dépendances compilation..."
if command -v gcc &> /dev/null; then
    log "GCC installé: $(gcc --version | head -n1)"
else
    error "GCC non installé: sudo apt install build-essential"
fi

if command -v make &> /dev/null; then
    log "Make installé"
else
    error "Make non installé: sudo apt install build-essential"
fi

if command -v git &> /dev/null; then
    log "Git installé"
else
    error "Git non installé: sudo apt install git"
fi

# Test 6: WiringPi
echo
echo "📡 Test WiringPi..."
if command -v gpio &> /dev/null; then
    log "WiringPi installé: $(gpio -v 2>&1 | head -n1)"
else
    warn "WiringPi non installé: sudo apt install wiringpi"
fi

# Test 7: libmosquitto
echo
echo "🦟 Test libmosquitto..."
if ldconfig -p | grep -q libmosquitto; then
    log "libmosquitto installé"
else
    warn "libmosquitto non installé: sudo apt install libmosquitto-dev"
fi

if command -v mosquitto_pub &> /dev/null; then
    log "Clients MQTT installés"
else
    warn "Clients MQTT non installés: sudo apt install mosquitto-clients"
fi

# Test 8: Réseau
echo
echo "🌐 Test réseau..."
if ping -c 1 8.8.8.8 &> /dev/null; then
    log "Connectivité Internet OK"
else
    warn "Pas de connectivité Internet"
fi

# Test 9: Espace disque
echo
echo "💾 Test espace disque..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -lt 80 ]]; then
    log "Espace disque OK ($DISK_USAGE% utilisé)"
else
    warn "Espace disque faible ($DISK_USAGE% utilisé)"
fi

# Résumé
echo
echo "📋 Résumé:"
echo "=========="

# Prêt pour installation ?
READY=true

if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    warn "Pas un Raspberry Pi"
    READY=false
fi

if ! lsmod | grep -q i2c_bcm2835; then
    error "I2C non activé"
    READY=false
fi

if ! command -v i2cdetect &> /dev/null; then
    error "i2c-tools manquant"
    READY=false
fi

if ! echo "$(sudo i2cdetect -y 1 2>/dev/null)" | grep -q "38"; then
    warn "Capteur AHT20 non détecté"
    # Pas bloquant pour l'installation
fi

if ! command -v gcc &> /dev/null; then
    error "Build tools manquants"
    READY=false
fi

echo
if $READY; then
    log "🎉 Hardware prêt pour l'installation TechTemp!"
    echo
    echo "Prochaines étapes:"
    echo "1. Installer TechTemp: sudo /path/to/install-device.sh"
    echo "2. Ou compilation manuelle dans device/"
else
    error "❌ Hardware pas prêt - Corriger les erreurs ci-dessus"
    echo
    echo "Actions requises:"
    echo "1. Activer I2C: sudo raspi-config → Interface Options → I2C"
    echo "2. Installer dépendances: sudo apt install build-essential i2c-tools git"
    echo "3. Redémarrer: sudo reboot"
    echo "4. Relancer ce test"
fi

echo
