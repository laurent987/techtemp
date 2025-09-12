#!/bin/bash
# Script de déploiement TechTemp avec Docker sur Raspberry Pi
# Usage: ./scripts/deploy-docker-to-pi.sh [PI_IP]

PI_IP=${1:-"192.168.0.42"}
PROJECT_DIR="/home/pi/techtemp"

echo "🐳 Déploiement TechTemp avec Docker sur Pi: $PI_IP"
echo "=================================================="

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
    echo "💡 Vérifiez que les clés SSH sont configurées"
    exit 1
fi
echo "✅ SSH accessible"

# Vérifier Docker
echo "🐳 Vérification de Docker..."
ssh pi@$PI_IP "
if ! command -v docker &> /dev/null; then
    echo 'Docker non installé. Utilisez: curl -fsSL https://get.docker.com | sh'
    exit 1
fi

# Tester Docker sans sudo
if ! docker ps &> /dev/null; then
    echo 'Docker installé mais permissions manquantes'
    echo 'Exécutez: sudo usermod -aG docker pi && exit'
    echo 'Puis reconnectez-vous'
    exit 1
fi

# Vérifier docker compose (intégré dans Docker moderne)
if ! docker compose version &> /dev/null; then
    echo 'Docker Compose non disponible'
    exit 1
fi

echo 'Docker et Docker Compose prêts !'
"

if [ $? -ne 0 ]; then
    echo "⚠️ Docker installé, redémarrez le Pi et relancez le script"
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
ssh pi@$PI_IP "
cd '$PROJECT_DIR' 2>/dev/null && docker compose down 2>/dev/null || echo 'Pas de conteneurs à arrêter'
"

# Préparer le répertoire
echo "📁 Préparation du répertoire..."
ssh pi@$PI_IP "
sudo rm -rf '$PROJECT_DIR'
mkdir -p '$PROJECT_DIR'
"

# Transférer les fichiers
echo "📤 Transfert des fichiers..."
rsync -avz --delete \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=data \
    --exclude=logs \
    --exclude=*.log \
    . pi@$PI_IP:$PROJECT_DIR/

# Construire et démarrer les conteneurs
echo "🔨 Construction et démarrage des conteneurs..."
ssh pi@$PI_IP "
cd '$PROJECT_DIR'
docker compose build --no-cache
docker compose up -d
"

# Vérifier le statut
echo "🔍 Vérification du déploiement..."
sleep 10
ssh pi@$PI_IP "
cd '$PROJECT_DIR'
docker compose ps
echo
echo 'Logs des 20 dernières lignes:'
docker compose logs --tail=20
"

# Test de l'API
echo "🧪 Test de l'API..."
sleep 5
if curl -s http://$PI_IP:3000/health | grep -q "ok"; then
    echo "✅ API fonctionnelle sur http://$PI_IP:3000"
else
    echo "⚠️ API pas encore prête, vérifiez les logs:"
    echo "   ssh pi@$PI_IP 'cd $PROJECT_DIR && docker-compose logs -f'"
fi

echo ""
echo "🎉 Déploiement Docker terminé !"
echo "==============================="
echo "🌐 API: http://$PI_IP:3000"
echo "📊 Health: http://$PI_IP:3000/health"
echo "📱 Devices: http://$PI_IP:3000/api/v1/devices"
echo "🦟 MQTT: $PI_IP:1883"
echo ""
echo "🔧 Commandes utiles:"
echo "   Logs:      ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose logs -f'"
echo "   Restart:   ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose restart'"
echo "   Stop:      ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose down'"
echo "   Status:    ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose ps'"
echo "   Update:    ./scripts/deploy-docker-to-pi.sh $PI_IP"
