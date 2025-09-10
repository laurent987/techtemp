#!/bin/bash
#
# Script de bootstrap complet pour un nouveau Raspberry Pi TechTemp
# Journal #008 - Configuration automatisée
#
# Usage: ./bootstrap-pi.sh <pi_ip> <home_id> <room_id> <device_label>
# Exemple: ./bootstrap-pi.sh 192.168.1.100 home-001 salon "Capteur Salon"
#

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
BROKER_HOST="192.168.0.180"
BROKER_PORT="1883"
MQTT_USERNAME=""
MQTT_PASSWORD=""
I2C_BUS="1"
I2C_ADDRESS="0x38"
READ_INTERVAL="30"
LOG_LEVEL="info"

# Fonction d'aide
usage() {
    echo "Usage: $0 <pi_ip> [options]"
    echo ""
    echo "Arguments obligatoires:"
    echo "  pi_ip          Adresse IP du Raspberry Pi (ex: 192.168.1.100)"
    echo ""
    echo "Options:"
    echo "  --broker-host HOST    Adresse du broker MQTT (défaut: $BROKER_HOST)"
    echo "  --broker-port PORT    Port du broker MQTT (défaut: $BROKER_PORT)"
    echo "  --username USER       Username MQTT (optionnel)"
    echo "  --password PASS       Password MQTT (optionnel)"
    echo "  --read-interval SEC   Intervalle de lecture en secondes (défaut: $READ_INTERVAL)"
    echo "  --log-level LEVEL     Niveau de log: debug,info,warn,error (défaut: $LOG_LEVEL)"
    echo "  --non-interactive     Mode non-interactif (utilise les valeurs par défaut)"
    echo ""
    echo "Exemple:"
    echo "  $0 192.168.1.100"
    echo "  $0 192.168.1.101 --broker-host 192.168.1.10 --non-interactive"
    exit 1
}

# Validation des arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Erreur: Adresse IP du Pi requise${NC}"
    usage
fi

PI_IP="$1"
shift 1

# Mode interactif par défaut
INTERACTIVE=true

# Parsing des options
while [[ $# -gt 0 ]]; do
    case $1 in
        --broker-host)
            BROKER_HOST="$2"
            shift 2
            ;;
        --broker-port)
            BROKER_PORT="$2"
            shift 2
            ;;
        --username)
            MQTT_USERNAME="$2"
            shift 2
            ;;
        --password)
            MQTT_PASSWORD="$2"
            shift 2
            ;;
        --read-interval)
            READ_INTERVAL="$2"
            shift 2
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --non-interactive)
            INTERACTIVE=false
            shift 1
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            usage
            ;;
    esac
done

echo -e "${BLUE}🚀 Bootstrap TechTemp Device${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "Pi IP: ${YELLOW}$PI_IP${NC}"
echo ""

# Test de connectivité
echo -e "${BLUE}🔍 Test de connectivité...${NC}"
if ! ping -c 1 -W 3 "$PI_IP" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de joindre le Pi à l'adresse $PI_IP${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pi accessible${NC}"

# Test SSH
echo -e "${BLUE}🔑 Test de la connexion SSH...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes pi@$PI_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter en SSH${NC}"
    echo -e "${YELLOW}💡 Assurez-vous que:${NC}"
    echo -e "   - SSH est activé sur le Pi"
    echo -e "   - Votre clé publique est dans ~/.ssh/authorized_keys sur le Pi"
    echo -e "   - L'utilisateur pi existe et est accessible"
    exit 1
fi
echo -e "${GREEN}✅ SSH accessible${NC}"

# Récupération de la MAC address pour générer l'UID
echo -e "${BLUE}🔍 Récupération de l'identifiant unique du Pi...${NC}"
MAC_ADDRESS=$(ssh pi@$PI_IP "cat /sys/class/net/eth0/address 2>/dev/null || cat /sys/class/net/wlan0/address 2>/dev/null || echo 'unknown'")
if [ "$MAC_ADDRESS" = "unknown" ]; then
    echo -e "${RED}❌ Impossible de récupérer l'adresse MAC${NC}"
    exit 1
fi

# Générer device UID basé sur les 6 derniers caractères de la MAC (plus sécurisé)
MAC_SUFFIX=$(echo $MAC_ADDRESS | tr -d ':' | tr '[:upper:]' '[:lower:]' | tail -c 7)
DEVICE_UID="aht20-${MAC_SUFFIX}"
echo -e "${GREEN}✅ Device UID généré: ${YELLOW}$DEVICE_UID${NC}"

# Mode interactif pour la configuration
if [ "$INTERACTIVE" = true ]; then
    echo ""
    echo -e "${BLUE}📝 Configuration du device${NC}"
    echo -e "${BLUE}========================${NC}"
    
    # Home ID
    echo -e "🏠 ${BLUE}Identifiant de votre maison${NC}"
    echo -n -e "   Entrez un nom unique (ex: home-001, maison-dupont): "
    read HOME_ID
    while [ -z "$HOME_ID" ]; do
        echo -n -e "   ${YELLOW}⚠️ Ce champ est requis:${NC} "
        read HOME_ID
    done
    
    # Room ID  
    echo -e "🏠 ${BLUE}Nom de la pièce${NC}"
    echo -n -e "   Où placer ce capteur ? (ex: Salon, Cuisine, Bureau, Chambre): "
    read ROOM_NAME
    while [ -z "$ROOM_NAME" ]; do
        echo -n -e "   ${YELLOW}⚠️ Ce champ est requis:${NC} "
        read ROOM_NAME
    done
    
    # Générer room_id à partir du nom (minuscules, sans espaces)
    ROOM_ID=$(echo "$ROOM_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
    
    # Device Label
    echo -e "🏷️ ${BLUE}Nom descriptif du capteur${NC}"
    echo -n -e "   Comment l'appeler ? [Capteur $ROOM_NAME]: "
    read DEVICE_LABEL
    if [ -z "$DEVICE_LABEL" ]; then
        DEVICE_LABEL="Capteur $ROOM_NAME"
    fi
    
    echo ""
    echo -e "${BLUE}⚙️ Configuration avancée (optionnel)${NC}"
    echo -e "Appuyez sur Entrée pour garder les valeurs par défaut"
    
    # Broker host (optionnel)
    echo -n -e "🌐 Adresse du serveur MQTT [${BROKER_HOST}]: "
    read BROKER_INPUT
    if [ ! -z "$BROKER_INPUT" ]; then
        BROKER_HOST="$BROKER_INPUT"
    fi
else
    # Mode non-interactif : valeurs par défaut
    HOME_ID="home-001"
    ROOM_NAME="Salon"
    ROOM_ID="salon"
    DEVICE_LABEL="Capteur $ROOM_NAME"
fi

echo ""
echo -e "${BLUE}📋 Récapitulatif de la configuration${NC}"
echo -e "${BLUE}===================================${NC}"
echo -e "Pi IP:          ${YELLOW}$PI_IP${NC}"
echo -e "Device UID:     ${YELLOW}$DEVICE_UID${NC} ${GREEN}(basé sur MAC)${NC}"
echo -e "Home ID:        ${YELLOW}$HOME_ID${NC}"
echo -e "Room:           ${YELLOW}$ROOM_NAME${NC} ${GREEN}(ID: $ROOM_ID)${NC}"
echo -e "Device Label:   ${YELLOW}$DEVICE_LABEL${NC}"
echo -e "Broker:         ${YELLOW}$BROKER_HOST:$BROKER_PORT${NC}"
echo -e "Read Interval:  ${YELLOW}${READ_INTERVAL}s${NC}"
echo ""

# Confirmation
read -p "Continuer avec cette configuration ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️ Annulé par l'utilisateur${NC}"
    exit 0
fi

# 1. Mise à jour du système
echo -e "${BLUE}📦 Mise à jour du système...${NC}"
ssh pi@$PI_IP "sudo apt-get update -qq && sudo apt-get upgrade -y -qq"
echo -e "${GREEN}✅ Système mis à jour${NC}"

# 2. Installation des dépendances
echo -e "${BLUE}🔧 Installation des dépendances...${NC}"
ssh pi@$PI_IP "sudo apt-get install -y -qq git build-essential libmosquitto-dev i2c-tools"
echo -e "${GREEN}✅ Dépendances installées${NC}"

# 3. Activation I2C
echo -e "${BLUE}⚙️ Configuration I2C...${NC}"
ssh pi@$PI_IP "sudo raspi-config nonint do_i2c 0"  # 0 = enable
echo -e "${GREEN}✅ I2C activé${NC}"

# 4. Clonage/mise à jour du projet
echo -e "${BLUE}📥 Installation du projet TechTemp...${NC}"
ssh pi@$PI_IP "
    if [ -d 'techtemp' ]; then
        cd techtemp && git pull
    else
        git clone https://github.com/laurent987/techtemp.git
    fi
"
echo -e "${GREEN}✅ Projet installé${NC}"

# 5. Génération de la configuration
echo -e "${BLUE}📝 Génération de la configuration...${NC}"

# Créer le fichier de configuration localement
cat > /tmp/device.conf << EOF
# TechTemp Device Configuration
# Generated on $(date)
# Pi IP: $PI_IP

[device]
device_uid = $DEVICE_UID
home_id = $HOME_ID
room_id = $ROOM_ID
label = $DEVICE_LABEL

[sensor]
i2c_address = $I2C_ADDRESS
i2c_bus = $I2C_BUS
read_interval_seconds = $READ_INTERVAL
temperature_offset = 0.0
humidity_offset = 0.0

[mqtt]
broker_host = $BROKER_HOST
broker_port = $BROKER_PORT
username = $MQTT_USERNAME
password = $MQTT_PASSWORD
topic_prefix = techtemp/devices
qos = 1
retain = false
keepalive_seconds = 60
reconnect_delay_seconds = 5
max_reconnect_attempts = 10

[logging]
log_level = $LOG_LEVEL
log_to_console = true
log_to_file = false
log_file_path = /var/log/techtemp-device.log

[system]
daemon_mode = false
pid_file = /var/run/techtemp-device.pid
shutdown_timeout_seconds = 10
EOF

# Copier la configuration sur le Pi
scp /tmp/device.conf pi@$PI_IP:techtemp/device/config/device.conf
rm /tmp/device.conf
echo -e "${GREEN}✅ Configuration générée${NC}"

# 6. Copie des sources et compilation
echo -e "${BLUE}🔨 Compilation du projet...${NC}"
rsync -av --delete device/src/ pi@$PI_IP:techtemp/device/src/
rsync -av --delete device/include/ pi@$PI_IP:techtemp/device/include/

ssh pi@$PI_IP "cd techtemp/device && make clean && make"
echo -e "${GREEN}✅ Compilation terminée${NC}"

# 7. Test du capteur I2C
echo -e "${BLUE}🔍 Test du capteur AHT20...${NC}"
I2C_TEST=$(ssh pi@$PI_IP "sudo i2cdetect -y 1 | grep ' 38 '")
if [ -z "$I2C_TEST" ]; then
    echo -e "${YELLOW}⚠️ Capteur AHT20 non détecté à l'adresse 0x38${NC}"
    echo -e "${YELLOW}💡 Vérifiez le câblage:${NC}"
    echo -e "   - VCC → 3.3V"
    echo -e "   - GND → GND"  
    echo -e "   - SDA → GPIO 2 (Pin 3)"
    echo -e "   - SCL → GPIO 3 (Pin 5)"
else
    echo -e "${GREEN}✅ Capteur AHT20 détecté${NC}"
fi

# 8. Test rapide du client
echo -e "${BLUE}🧪 Test du client TechTemp...${NC}"
TEST_OUTPUT=$(ssh pi@$PI_IP "cd techtemp/device && timeout 10s sudo ./build/techtemp-device config/device.conf 2>&1 || true")
if echo "$TEST_OUTPUT" | grep -q "TechTemp Device Client started successfully"; then
    echo -e "${GREEN}✅ Client fonctionnel${NC}"
    if echo "$TEST_OUTPUT" | grep -q "📊"; then
        TEMP_LINE=$(echo "$TEST_OUTPUT" | grep "📊" | tail -1)
        echo -e "${GREEN}📊 Mesure test: ${TEMP_LINE#*📊}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Problème détecté dans le test${NC}"
    echo -e "${YELLOW}Logs du test:${NC}"
    echo "$TEST_OUTPUT" | tail -10
fi

# 9. Configuration du device dans l'API backend
echo -e "${BLUE}🌐 Configuration du device dans l'API...${NC}"
API_URL="http://localhost:3000/api/v1/devices/$DEVICE_UID"

# Payload JSON pour l'API
DEVICE_PAYLOAD=$(cat << EOF
{
  "home_id": "$HOME_ID",
  "room_id": "$ROOM_ID",
  "label": "$DEVICE_LABEL"
}
EOF
)

# Configurer le device via l'API
if command -v curl > /dev/null 2>&1; then
    API_RESPONSE=$(curl -s -X PUT "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$DEVICE_PAYLOAD" 2>/dev/null || echo "API_ERROR")
    
    if [[ "$API_RESPONSE" != "API_ERROR" ]] && echo "$API_RESPONSE" | grep -q "device_id"; then
        echo -e "${GREEN}✅ Device configuré dans l'API${NC}"
    else
        echo -e "${YELLOW}⚠️ Configuration API échouée - configurer manuellement:${NC}"
        echo -e "${YELLOW}   curl -X PUT '$API_URL' \\${NC}"
        echo -e "${YELLOW}        -H 'Content-Type: application/json' \\${NC}"
        echo -e "${YELLOW}        -d '$DEVICE_PAYLOAD'${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ curl non disponible - configurer manuellement via l'API${NC}"
fi

# 10. Installation du service systemd
echo -e "${BLUE}⚙️ Installation du service systemd...${NC}"
cat > /tmp/techtemp-device.service << EOF
[Unit]
Description=TechTemp Device Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/pi/techtemp/device
ExecStart=/home/pi/techtemp/device/build/techtemp-device /home/pi/techtemp/device/config/device.conf
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=techtemp-device

[Install]
WantedBy=multi-user.target
EOF

scp /tmp/techtemp-device.service pi@$PI_IP:/tmp/
ssh pi@$PI_IP "sudo mv /tmp/techtemp-device.service /etc/systemd/system/ && sudo systemctl daemon-reload"
rm /tmp/techtemp-device.service
echo -e "${GREEN}✅ Service systemd installé${NC}"

# 11. Récapitulatif final
echo ""
echo -e "${GREEN}🎉 Bootstrap terminé avec succès !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📋 Informations du device:${NC}"
echo -e "   Device UID:  ${YELLOW}$DEVICE_UID${NC}"
echo -e "   Home ID:     ${YELLOW}$HOME_ID${NC}"
echo -e "   Room ID:     ${YELLOW}$ROOM_ID${NC}"
echo -e "   Label:       ${YELLOW}$DEVICE_LABEL${NC}"
echo ""
echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo -e "   Démarrer:    ${YELLOW}ssh pi@$PI_IP 'sudo systemctl start techtemp-device'${NC}"
echo -e "   Arrêter:     ${YELLOW}ssh pi@$PI_IP 'sudo systemctl stop techtemp-device'${NC}"
echo -e "   Auto-start:  ${YELLOW}ssh pi@$PI_IP 'sudo systemctl enable techtemp-device'${NC}"
echo -e "   Logs:        ${YELLOW}ssh pi@$PI_IP 'journalctl -u techtemp-device -f'${NC}"
echo -e "   Test manuel: ${YELLOW}ssh pi@$PI_IP 'cd techtemp/device && sudo ./build/techtemp-device config/device.conf'${NC}"
echo ""
echo -e "${BLUE}🌐 API pour vérifier les données:${NC}"
echo -e "   ${YELLOW}curl 'http://localhost:3000/api/v1/readings/latest?deviceId=$DEVICE_UID'${NC}"
echo ""
echo -e "${GREEN}✅ Le device est prêt à fonctionner !${NC}"
