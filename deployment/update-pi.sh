#!/bin/bash
#
# Script de mise à jour du code sur le Pi
# Journal #008 - Premier capteur physique
#

set -e

PI_HOST="pi@192.168.0.134"
PROJECT_DIR="/home/pi/techtemp"

echo "🚀 Déploiement des modifications sur le Pi..."

# 1. Copier les fichiers modifiés
echo "📁 Copie des fichiers source..."
scp device/src/main.c device/src/aht20.c device/src/mqtt_client.c device/src/config.c device/src/common.c ${PI_HOST}:${PROJECT_DIR}/device/src/
scp device/include/aht20.h device/include/mqtt_client.h device/include/config.h device/include/common.h ${PI_HOST}:${PROJECT_DIR}/device/include/

# 2. Recompiler sur le Pi
echo "🔨 Compilation sur le Pi..."
ssh ${PI_HOST} "cd ${PROJECT_DIR}/device && make clean && make"

echo "✅ Mise à jour terminée !"
echo ""
echo "🔧 Pour tester :"
echo "ssh ${PI_HOST}"
echo "cd ${PROJECT_DIR}/device"
echo "sudo ./build/techtemp-device config/device.conf"
