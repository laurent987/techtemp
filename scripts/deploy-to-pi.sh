#!/bin/bash
# Script de déploiement TechTemp sur Raspberry Pi
# Usage: ./scripts/deploy-to-pi.sh [PI_IP]

PI_IP=${1:-"192.168.0.42"}
PROJECT_DIR="/home/pi/techtemp"
SERVICE_NAME="techtemp-backend"

echo "🚀 Déploiement TechTemp sur Pi: $PI_IP"
echo "======================================"

# Vérifier la connectivité
echo "🔍 Test de connectivité..."
if ! ping -c 1 $PI_IP > /dev/null 2>&1; then
    echo "❌ Pi $PI_IP non accessible"
    exit 1
fi
echo "✅ Pi accessible"

# Vérifier SSH
echo "🔑 Test SSH..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes pi@$PI_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    echo "❌ SSH non accessible sur pi@$PI_IP"
    echo "💡 Vérifiez que les clés SSH sont configurées ou utilisez ssh-copy-id"
    exit 1
fi
echo "✅ SSH accessible"

# Arrêter l'ancien service s'il existe
echo "🛑 Arrêt de l'ancien service..."
ssh pi@$PI_IP "sudo systemctl stop $SERVICE_NAME 2>/dev/null || echo 'Service pas encore installé'"
ssh pi@$PI_IP "sudo systemctl disable $SERVICE_NAME 2>/dev/null || echo 'Service pas encore installé'"

# Sauvegarder l'ancienne installation si elle existe
echo "💾 Sauvegarde de l'ancienne installation..."
ssh pi@$PI_IP "
if [ -d '$PROJECT_DIR' ]; then
    sudo cp -r '$PROJECT_DIR' '${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)' 2>/dev/null || echo 'Pas de sauvegarde nécessaire'
    sudo rm -rf '$PROJECT_DIR'
fi
sudo mkdir -p '$PROJECT_DIR'
sudo chown pi:pi '$PROJECT_DIR'
"

# Transférer les fichiers
echo "📤 Transfert des fichiers via rsync..."
rsync -avz --delete \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=data \
    --exclude=logs \
    --exclude=*.log \
    . pi@$PI_IP:$PROJECT_DIR/

# Installation des dépendances
echo "📦 Installation des dépendances..."
ssh pi@$PI_IP "
cd '$PROJECT_DIR'
# Installer Node.js 20+ si nécessaire
if ! command -v node &> /dev/null || [[ \$(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo 'Installation de Node.js 20...'
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

cd backend
npm install --production
"

# Configuration pour Pi
echo "⚙️ Configuration pour Pi..."
ssh pi@$PI_IP "
cd '$PROJECT_DIR'
# Créer les dossiers nécessaires
mkdir -p data logs backend/db

# Configuration d'environnement
cat > .env << EOF
# TechTemp Configuration for Raspberry Pi
NODE_ENV=production
PORT=3000
DB_PATH=/home/pi/techtemp/data/techtemp.db
MQTT_BROKER_URL=mqtt://localhost:1883
LOG_LEVEL=info
EOF
"

# Créer le service systemd
echo "🔧 Installation du service systemd..."
ssh pi@$PI_IP "
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=TechTemp Backend Service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=/usr/bin/node main.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=$PROJECT_DIR/data/techtemp.db
Environment=MQTT_BROKER_URL=mqtt://localhost:1883
Environment=LOG_LEVEL=info

# Logging
StandardOutput=append:$PROJECT_DIR/logs/techtemp-backend.log
StandardError=append:$PROJECT_DIR/logs/techtemp-backend-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR

[Install]
WantedBy=multi-user.target
EOF

# Recharger systemd et activer le service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
"

# Démarrer le service
echo "🚀 Démarrage du service..."
ssh pi@$PI_IP "sudo systemctl start $SERVICE_NAME"

# Vérifier le statut
echo "🔍 Vérification du service..."
sleep 3
ssh pi@$PI_IP "sudo systemctl status $SERVICE_NAME --no-pager"

# Test de l'API
echo "🧪 Test de l'API..."
sleep 2
API_RESPONSE=$(ssh pi@$PI_IP "curl -s http://localhost:3000/health" 2>/dev/null)
if [[ "$API_RESPONSE" == *"ok"* ]]; then
    echo "✅ API fonctionnelle sur http://$PI_IP:3000"
else
    echo "⚠️ API pas encore prête, vérifiez les logs:"
    echo "   ssh pi@$PI_IP 'sudo journalctl -u $SERVICE_NAME -f'"
fi

echo ""
echo "🎉 Déploiement terminé !"
echo "======================="
echo "🌐 API: http://$PI_IP:3000"
echo "📊 Health: http://$PI_IP:3000/health"
echo "📱 Devices: http://$PI_IP:3000/api/v1/devices"
echo ""
echo "🔧 Commandes utiles:"
echo "   Logs:      ssh pi@$PI_IP 'sudo journalctl -u $SERVICE_NAME -f'"
echo "   Restart:   ssh pi@$PI_IP 'sudo systemctl restart $SERVICE_NAME'"
echo "   Stop:      ssh pi@$PI_IP 'sudo systemctl stop $SERVICE_NAME'"
echo "   Status:    ssh pi@$PI_IP 'sudo systemctl status $SERVICE_NAME'"
