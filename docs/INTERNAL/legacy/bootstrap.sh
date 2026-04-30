#!/bin/bash
##############################################################################
# TechTemp Device - Bootstrap Rapide
# One-liner pour démarrage installation sur Raspberry Pi
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 TechTemp Device - Bootstrap Installation${NC}"
echo "=============================================="

# Variables
REPO_URL="https://github.com/laurent987/techtemp.git"
BRANCH="feature/journal-008-premier-capteur-physique"
INSTALL_DIR="/home/pi/techtemp"

# Test si on est sur un Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Ce script est conçu pour Raspberry Pi"
fi

# Vérifier git
if ! command -v git &> /dev/null; then
    echo "📦 Installation git..."
    sudo apt update && sudo apt install -y git
fi

# Cloner repository
echo -e "${GREEN}📂 Clonage TechTemp repository...${NC}"
if [[ -d "$INSTALL_DIR" ]]; then
    echo "⚠️  Répertoire existant trouvé, sauvegarde..."
    sudo mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%s)"
fi

git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
git checkout "$BRANCH"

# Permissions scripts
echo -e "${GREEN}🔧 Configuration permissions...${NC}"
chmod +x scripts/*.sh

echo -e "${GREEN}✅ Bootstrap terminé !${NC}"
echo
echo "Prochaines étapes :"
echo "1. Test hardware :    ./scripts/test-hardware.sh"
echo "2. Installation :     sudo ./scripts/install-device.sh"
echo "3. Documentation :    cat docs/DEVICE_DEPLOYMENT.md"
echo
echo "Répertoire : $INSTALL_DIR"
cd "$INSTALL_DIR"
ls -la scripts/
