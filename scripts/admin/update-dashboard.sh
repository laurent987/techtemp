#!/bin/bash
# Mise à jour RAPIDE du dashboard, sans rebuild Docker.
#
# Pourquoi : web/ est monté en bind mount lecture seule (./web:/app/web:ro dans
# docker-compose.yml) et servi en direct par le conteneur. Mettre à jour le dashboard
# = builder en local + synchroniser web/ sur le Pi. Aucun docker build, aucun restart.
#
# Prérequis (à faire UNE fois) : un déploiement complet
#   ./scripts/admin/deploy-robust-pi.sh <PI_IP> --with-dashboard
# pour livrer le docker-compose.yml mis à jour et (re)lancer le conteneur AVEC le bind mount.
# Ensuite, ce script suffit pour toutes les itérations suivantes.
#
# Usage : ./scripts/admin/update-dashboard.sh [PI_IP]   (défaut : 192.168.0.42)

set -euo pipefail

PI_IP="${1:-192.168.0.42}"
PROJECT_DIR="/home/pi/techtemp"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

command -v npm >/dev/null 2>&1 || fail "npm introuvable sur le PATH"
[ -d "$REPO_ROOT/dashboard" ] || fail "dossier dashboard/ introuvable"

# 1. Build local du dashboard
info "Build du dashboard (vite)..."
( cd "$REPO_ROOT/dashboard" && npm run build ) || fail "build du dashboard échoué"
[ -d "$REPO_ROOT/dashboard/build" ] || fail "dashboard/build/ absent après le build"

# 2. Vérif SSH
info "Vérification SSH vers pi@$PI_IP..."
ssh -o ConnectTimeout=10 -o BatchMode=yes "pi@$PI_IP" 'true' \
    || fail "SSH vers pi@$PI_IP impossible (réseau local ? clé SSH ?)"

# 3. Synchronisation de web/ (le conteneur le lit en direct, rien d'autre à faire)
#    --delete : purge les anciens fichiers (vite produit des noms hashés).
info "Synchronisation de web/ sur le Pi..."
rsync -avz --delete "$REPO_ROOT/dashboard/build/" "pi@$PI_IP:$PROJECT_DIR/web/" \
    || fail "rsync de web/ échoué"

# 4. Vérification que l'interface répond
info "Test de l'interface..."
if curl -s "http://$PI_IP:3000/" | grep -q "TechTemp"; then
    ok "Dashboard mis à jour : http://$PI_IP:3000"
else
    warn "Interface non confirmée. Le conteneur tourne-t-il AVEC le bind mount ?"
    warn "Si c'est la 1re fois, lance d'abord : ./scripts/admin/deploy-robust-pi.sh $PI_IP --with-dashboard"
fi
