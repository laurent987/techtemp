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
BACKEND_HOST="192.168.0.42"
BACKEND_PORT="3000"
MQTT_USERNAME=""
MQTT_PASSWORD=""
I2C_BUS="1"
I2C_ADDRESS="0x38"
READ_INTERVAL="30"
LOG_LEVEL="info"
GIT_BRANCH="develop"

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
    echo "  --backend-host HOST   Adresse du serveur backend (défaut: $BACKEND_HOST)"
    echo "  --backend-port PORT   Port du serveur backend (défaut: $BACKEND_PORT)"
    echo "  --username USER       Username MQTT (optionnel)"
    echo "  --password PASS       Password MQTT (optionnel)"
    echo "  --read-interval SEC   Intervalle de lecture en secondes (défaut: $READ_INTERVAL)"
    echo "  --log-level LEVEL     Niveau de log: debug,info,warn,error (défaut: $LOG_LEVEL)"
    echo "  --git-branch BRANCH   Branche git à utiliser (défaut: $GIT_BRANCH)"
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
        --backend-host)
            BACKEND_HOST="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
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
        --git-branch)
            GIT_BRANCH="$2"
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
    
    # Room Name
    echo -e "🏠 ${BLUE}Nom de la pièce${NC}"
    echo -n -e "   Où placer ce capteur ? (ex: Salon, Cuisine, Bureau, Chambre): "
    read ROOM_NAME
    while [ -z "$ROOM_NAME" ]; do
        echo -n -e "   ${YELLOW}⚠️ Ce champ est requis:${NC} "
        read ROOM_NAME
    done
    
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
    DEVICE_LABEL="Capteur $ROOM_NAME"
fi

echo ""
echo -e "${BLUE}📋 Récapitulatif de la configuration${NC}"
echo -e "${BLUE}===================================${NC}"
echo -e "Pi IP:          ${YELLOW}$PI_IP${NC}"
echo -e "Device UID:     ${YELLOW}$DEVICE_UID${NC} ${GREEN}(basé sur MAC)${NC}"
echo -e "Home ID:        ${YELLOW}$HOME_ID${NC}"
echo -e "Room:           ${YELLOW}$ROOM_NAME${NC} ${GREEN}(auto-generated ID)${NC}"
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

# 4. Installation/réinstallation propre du projet
echo -e "${BLUE}📥 Installation du projet TechTemp...${NC}"
ssh pi@$PI_IP "
    if [ -d 'techtemp' ]; then
        echo 'Suppression de l installation existante...'
        
        # Backup de la config existante si elle existe
        if [ -f 'techtemp/device/config/device.conf' ]; then
            cp techtemp/device/config/device.conf device.conf.backup.\$(date +%Y%m%d_%H%M%S)
            echo 'Config existante sauvegardée'
        fi
        
        # Suppression complète pour repartir proprement
        rm -rf techtemp
        echo 'Installation existante supprimée'
    fi
    
    # Clone propre de la bonne branche
    echo 'Clonage du projet (branche: $GIT_BRANCH)...'
    git clone -b $GIT_BRANCH https://github.com/laurent987/techtemp.git 2>/dev/null || {
        # Si la branche n'existe pas, clone master/main puis switch
        git clone https://github.com/laurent987/techtemp.git
        cd techtemp && git checkout $GIT_BRANCH 2>/dev/null || echo 'Branche $GIT_BRANCH non trouvée, utilisation de la branche par défaut'
    }
    
    echo 'Projet installé proprement'
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

# 9. Configuration du device dans l'API backend via l'API REST
echo -e "${BLUE}🌐 Provisioning du device dans le backend...${NC}"

# Générer l'ID de la room basé sur le nom
ROOM_ID=$(echo "$ROOM_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

# Si nous avons accès au serveur backend (localhost), provisioner directement
if curl -s http://$BACKEND_HOST:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}🔍 Backend détecté en local, provisioning direct...${NC}"
    
    # D'abord vérifier si le device existe déjà
    echo -e "${BLUE}🔍 Vérification de l'existence du device '$DEVICE_UID'...${NC}"
    EXISTING_DEVICE=$(curl -s http://$BACKEND_HOST:$BACKEND_PORT/api/v1/devices/$DEVICE_UID)
    
    if [[ "$EXISTING_DEVICE" == *"Device not found"* ]]; then
        # Device n'existe pas, création normale
        echo -e "${GREEN}📱 Création du nouveau device '$DEVICE_LABEL' dans la room '$ROOM_NAME'...${NC}"
        DEVICE_RESPONSE=$(curl -s -X POST http://$BACKEND_HOST:$BACKEND_PORT/api/v1/devices \
            -H "Content-Type: application/json" \
            -d "{\"device_uid\":\"$DEVICE_UID\",\"label\":\"$DEVICE_LABEL\",\"room_name\":\"$ROOM_NAME\"}")
        
        if [[ $? -eq 0 ]] && [[ "$DEVICE_RESPONSE" == *"$DEVICE_UID"* ]]; then
            echo -e "${GREEN}✅ Device créé avec succès${NC}"
            echo -e "${GREEN}   Device UID: $DEVICE_UID${NC}"
            echo -e "${GREEN}   Room Name: $ROOM_NAME${NC}"
            echo -e "${GREEN}   Label: $DEVICE_LABEL${NC}"
            echo -e "${GREEN}   🏠 Room créée automatiquement si nécessaire${NC}"
        else
            echo -e "${YELLOW}⚠️ Erreur lors de la création du device${NC}"
            echo -e "${YELLOW}💡 Réponse de l'API: $DEVICE_RESPONSE${NC}"
        fi
    else
        # Device existe déjà, vérifier s'il faut le mettre à jour
        echo -e "${YELLOW}� Device '$DEVICE_UID' existe déjà${NC}"
        
        # Extraire les infos du device existant
        CURRENT_ROOM=$(echo "$EXISTING_DEVICE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        CURRENT_LABEL=$(echo "$EXISTING_DEVICE" | grep -o '"label":"[^"]*"' | cut -d'"' -f4)
        
        echo -e "${BLUE}   Room actuelle: ${CURRENT_ROOM:-"<aucune>"}${NC}"
        echo -e "${BLUE}   Label actuel: ${CURRENT_LABEL:-"<aucun>"}${NC}"
        
        # Déterminer s'il faut faire une mise à jour
        NEEDS_UPDATE=false
        UPDATE_MSG=""
        
        if [[ "$CURRENT_ROOM" != "$ROOM_NAME" ]]; then
            NEEDS_UPDATE=true
            UPDATE_MSG="${UPDATE_MSG}🏠 Changement de room: '$CURRENT_ROOM' → '$ROOM_NAME'\n"
        fi
        
        if [[ "$CURRENT_LABEL" != "$DEVICE_LABEL" ]]; then
            NEEDS_UPDATE=true
            UPDATE_MSG="${UPDATE_MSG}🏷️ Changement de label: '$CURRENT_LABEL' → '$DEVICE_LABEL'\n"
        fi
        
        if [[ "$NEEDS_UPDATE" == "true" ]]; then
            echo -e "${YELLOW}🔄 Mise à jour nécessaire:${NC}"
            echo -e "${YELLOW}$UPDATE_MSG${NC}"
            
            # Mettre à jour le device
            UPDATE_RESPONSE=$(curl -s -X PUT http://$BACKEND_HOST:$BACKEND_PORT/api/v1/devices/$DEVICE_UID \
                -H "Content-Type: application/json" \
                -d "{\"label\":\"$DEVICE_LABEL\",\"room_name\":\"$ROOM_NAME\"}")
            
            if [[ $? -eq 0 ]] && [[ "$UPDATE_RESPONSE" == *"$DEVICE_UID"* ]]; then
                echo -e "${GREEN}✅ Device mis à jour avec succès${NC}"
                echo -e "${GREEN}   📍 Ancien placement fermé automatiquement${NC}"
                echo -e "${GREEN}   📍 Nouveau placement créé dans '$ROOM_NAME'${NC}"
                echo -e "${GREEN}   📊 Historique des placements conservé${NC}"
            else
                echo -e "${YELLOW}⚠️ Erreur lors de la mise à jour${NC}"
                echo -e "${YELLOW}💡 Réponse de l'API: $UPDATE_RESPONSE${NC}"
            fi
        else
            echo -e "${GREEN}✅ Device déjà configuré correctement${NC}"
            echo -e "${GREEN}   Aucune modification nécessaire${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Backend non accessible - provisioning manuel requis${NC}"
    echo -e "${YELLOW}💡 Créer le device via l'API (room créée automatiquement):${NC}"
    echo -e "${YELLOW}   curl -X POST http://$BACKEND_HOST:$BACKEND_PORT/api/v1/devices -H 'Content-Type: application/json' -d '{\"device_uid\":\"$DEVICE_UID\",\"label\":\"$DEVICE_LABEL\",\"room_name\":\"$ROOM_NAME\"}'${NC}"
    echo -e "${YELLOW}💡 Ou via l'interface web d'administration${NC}"
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
echo -e "   Room:        ${YELLOW}$ROOM_NAME${NC} ${GREEN}(auto-generated ID)${NC}"
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
echo -e "   ${YELLOW}curl 'http://$BACKEND_HOST:$BACKEND_PORT/api/v1/readings/latest?deviceId=$DEVICE_UID'${NC}"
echo ""
echo -e "${GREEN}✅ Le device est prêt à fonctionner !${NC}"
