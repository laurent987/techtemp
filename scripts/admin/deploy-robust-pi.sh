#!/bin/bash
# Script de déploiement TechTemp robuste pour Raspberry Pi
# Usage:
#   ./scripts/admin/deploy-robust-pi.sh [PI_IP]                # déploie l'exemple web (web-example/)
#   ./scripts/admin/deploy-robust-pi.sh [PI_IP] --with-dashboard  # build le dashboard React et le déploie

set -euo pipefail  # Arrêt immédiat en cas d'erreur

# Parsing des arguments (PI_IP positional, --with-dashboard flag)
PI_IP="192.168.0.42"
WITH_DASHBOARD=false
for arg in "$@"; do
    case "$arg" in
        --with-dashboard) WITH_DASHBOARD=true ;;
        --help|-h)
            echo "Usage: $0 [PI_IP] [--with-dashboard]"
            echo "  PI_IP              IP du Pi central (défaut: 192.168.0.42)"
            echo "  --with-dashboard   Build le dashboard React (dashboard/) et le sert au lieu de l'exemple"
            exit 0
            ;;
        --*) echo "Option inconnue: $arg" >&2; exit 1 ;;
        *)   PI_IP="$arg" ;;
    esac
done

PROJECT_DIR="/home/pi/techtemp"
MIN_SPACE_MB=300
LOG_FILE="/tmp/techtemp-deploy-$(date +%Y%m%d_%H%M%S).log"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ ERREUR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  ATTENTION: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Fonction pour exécuter une commande SSH avec gestion d'erreur
ssh_exec() {
    local cmd="$1"
    local desc="$2"
    log "Exécution: $desc"
    
    if ssh pi@$PI_IP "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
        success "$desc - OK"
        return 0
    else
        error "$desc - ECHEC"
        return 1
    fi
}

# Fonction pour vérifier l'espace disque
check_disk_space() {
    info "Vérification de l'espace disque..."
    
    local available_mb=$(ssh pi@$PI_IP "df / | tail -1 | awk '{print int(\$4/1024)}'" 2>/dev/null || echo "0")
    
    if [ "$available_mb" -lt "$MIN_SPACE_MB" ]; then
        warning "Espace disponible: ${available_mb}MB (minimum requis: ${MIN_SPACE_MB}MB)"
        
        info "Nettoyage automatique en cours..."
        ssh_exec "
            # Nettoyage Docker (sans sudo)
            docker system prune -af 2>/dev/null || true
            
            # Nettoyage logs utilisateur
            rm -rf ~/.cache/* 2>/dev/null || true
            rm -f /tmp/*.log 2>/dev/null || true
            
            # Si on a accès sudo sans mot de passe, nettoyer plus
            if sudo -n true 2>/dev/null; then
                sudo apt-get autoremove -y
                sudo apt-get autoclean
                sudo journalctl --vacuum-time=1d
            else
                echo 'Nettoyage limité (pas de sudo sans mot de passe)'
            fi
        " "Nettoyage système"
        
        # Vérifier à nouveau
        available_mb=$(ssh pi@$PI_IP "df / | tail -1 | awk '{print int(\$4/1024)}'" 2>/dev/null || echo "0")
        if [ "$available_mb" -lt "$MIN_SPACE_MB" ]; then
            error "Espace disque insuffisant après nettoyage: ${available_mb}MB"
        fi
    fi
    
    success "Espace disque: ${available_mb}MB disponible"
}

# Fonction pour installer Docker si nécessaire
install_docker() {
    info "Vérification de Docker..."
    
    if ssh pi@$PI_IP "docker --version" >/dev/null 2>&1; then
        success "Docker déjà installé"
        
        # Vérifier les permissions
        if ! ssh pi@$PI_IP "docker ps" >/dev/null 2>&1; then
            warning "Permissions Docker manquantes"
            ssh_exec "
                sudo usermod -aG docker pi
                newgrp docker
            " "Configuration permissions Docker"
            
            info "Redémarrage nécessaire pour les permissions Docker"
            ssh_exec "sudo reboot" "Redémarrage du Pi"
            
            info "Attente redémarrage (60s)..."
            sleep 60
            
            # Attendre que le Pi soit disponible
            local retries=12
            while [ $retries -gt 0 ]; do
                if ping -c 1 $PI_IP >/dev/null 2>&1; then
                    break
                fi
                info "Attente Pi... ($retries tentatives restantes)"
                sleep 5
                ((retries--))
            done
            
            if [ $retries -eq 0 ]; then
                error "Pi non accessible après redémarrage"
            fi
        fi
    else
        info "Installation de Docker..."
        ssh_exec "
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker pi
            rm get-docker.sh
        " "Installation Docker"
        
        info "Redémarrage nécessaire après installation Docker"
        ssh_exec "sudo reboot" "Redémarrage du Pi"
        
        info "Attente redémarrage (60s)..."
        sleep 60
        
        # Attendre que le Pi soit disponible
        local retries=12
        while [ $retries -gt 0 ]; do
            if ping -c 1 $PI_IP >/dev/null 2>&1 && ssh pi@$PI_IP "docker ps" >/dev/null 2>&1; then
                break
            fi
            info "Attente Pi et Docker... ($retries tentatives restantes)"
            sleep 5
            ((retries--))
        done
        
        if [ $retries -eq 0 ]; then
            error "Docker non fonctionnel après installation"
        fi
    fi
    
    success "Docker opérationnel"
}

# Fonction pour gérer les conflits de ports
handle_port_conflicts() {
    info "Vérification des conflits de ports..."
    
    # Port 1883 (MQTT) — best-effort, on bypass ssh_exec pour les mêmes raisons que pour le 3000.
    if ssh pi@$PI_IP "netstat -tulpn 2>/dev/null | grep :1883" >/dev/null 2>&1; then
        warning "Port 1883 (MQTT) occupé — tentative d'arrêt des services existants"
        ssh pi@$PI_IP "
            sudo systemctl stop mosquitto 2>/dev/null
            sudo systemctl disable mosquitto 2>/dev/null
            sudo pkill mosquitto 2>/dev/null
        " >>"$LOG_FILE" 2>&1 || true
        info "Nettoyage best-effort du port 1883 effectué"
    fi
    
    # Port 3000 (API). Best-effort uniquement : 'docker compose down' juste après libérera
    # de toute façon le port s'il est occupé par un container techtemp. On bypass ssh_exec ici
    # pour ne pas faire planter le déploiement à cause d'un pipefail sur du nettoyage cosmétique.
    if ssh pi@$PI_IP "netstat -tulpn 2>/dev/null | grep :3000" >/dev/null 2>&1; then
        warning "Port 3000 (API) occupé — sera libéré par 'docker compose down' à l'étape suivante"
        ssh pi@$PI_IP "
            sudo pkill -f 'node.*3000' 2>/dev/null
            CONTAINERS=\$(docker ps -q --filter 'publish=3000' 2>/dev/null)
            if [ -n \"\$CONTAINERS\" ]; then
                docker stop \$CONTAINERS >/dev/null 2>&1
            fi
        " >>"$LOG_FILE" 2>&1 || true
        info "Nettoyage best-effort du port 3000 effectué"
    fi
    
    success "Ports libérés"
}

# Prépare le dossier web/ local (servi par le backend) avant le rsync.
# Sans flag : copie web-example/ → web/ (exemple buildless minimal).
# Avec --with-dashboard : build le dashboard React puis copie son build/ → web/.
prepare_web_dir() {
    local repo_root
    repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

    info "Préparation du dossier web/ à servir..."

    # Repartir d'un web/ propre pour éviter d'embarquer des résidus du déploiement précédent.
    rm -rf "$repo_root/web"
    mkdir -p "$repo_root/web"

    if [ "$WITH_DASHBOARD" = "true" ]; then
        info "Build du dashboard React (peut prendre 1-2 min)..."

        if ! command -v npm >/dev/null 2>&1; then
            error "npm requis pour --with-dashboard mais introuvable sur le PATH"
        fi
        if [ ! -d "$repo_root/dashboard" ]; then
            error "Dossier dashboard/ introuvable, impossible de builder"
        fi

        (
            cd "$repo_root/dashboard"
            if [ ! -d node_modules ]; then
                info "Installation des dépendances dashboard..."
                npm install --no-audit --no-fund
            fi
            # NB: on n'utilise pas CI=true pour ne pas promouvoir les warnings ESLint en errors —
            # ce build vise un déploiement local, pas une vraie CI.
            npm run build
        ) || error "Échec du build du dashboard (voir output ci-dessus)"

        if [ ! -d "$repo_root/dashboard/build" ]; then
            error "Build dashboard absent (dashboard/build/ manquant)"
        fi

        cp -R "$repo_root/dashboard/build/." "$repo_root/web/"
        success "Dashboard buildé et copié dans web/ ($(du -sh "$repo_root/web" | awk '{print $1}'))"
    else
        if [ ! -d "$repo_root/web-example" ]; then
            error "Dossier web-example/ introuvable"
        fi
        cp -R "$repo_root/web-example/." "$repo_root/web/"
        success "Exemple buildless copié dans web/"
    fi
}

# Fonction principale de déploiement
deploy_techtemp() {
    info "Déploiement TechTemp..."
    
    # Arrêter les conteneurs existants
    ssh_exec "
        cd '$PROJECT_DIR' 2>/dev/null && docker compose down 2>/dev/null || true
        docker stop \$(docker ps -q) 2>/dev/null || true
    " "Arrêt conteneurs existants"
    
    # Sauvegarder et nettoyer
    ssh_exec "
        if [ -d '$PROJECT_DIR' ]; then
            sudo cp -r '$PROJECT_DIR' '${PROJECT_DIR}.backup.\$(date +%Y%m%d_%H%M%S)' 2>/dev/null || true
            sudo rm -rf '$PROJECT_DIR'
        fi
        mkdir -p '$PROJECT_DIR'
    " "Préparation répertoire"
    
    # Transfert des fichiers
    info "Transfert des fichiers..."
    if rsync -avz --delete \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=data \
        --exclude=logs \
        --exclude=*.log \
        . pi@$PI_IP:$PROJECT_DIR/ 2>&1 | tee -a "$LOG_FILE"; then
        success "Fichiers transférés"
    else
        error "Echec transfert fichiers"
    fi
    
    # Suppression de la ligne version obsolète du docker-compose.yml (si présente)
    ssh_exec "
        cd '$PROJECT_DIR'
        # Supprimer la ligne version avec gestion des espaces
        sed -i '/^[[:space:]]*version:[[:space:]]*/d' docker-compose.yml
    " "Nettoyage docker-compose.yml"
    
    # Construction et démarrage
    ssh_exec "
        cd '$PROJECT_DIR'
        docker compose build --no-cache
        docker compose up -d
    " "Construction et démarrage conteneurs"
    
    # Vérification du démarrage
    info "Vérification du démarrage..."
    sleep 15
    
    local retries=6
    while [ $retries -gt 0 ]; do
        if ssh pi@$PI_IP "cd '$PROJECT_DIR' && docker compose ps | grep -q 'Up.*healthy'" 2>/dev/null; then
            success "Conteneurs démarrés et sains"
            break
        fi
        info "Attente démarrage conteneurs... ($retries tentatives restantes)"
        sleep 10
        ((retries--))
    done
    
    if [ $retries -eq 0 ]; then
        warning "Conteneurs pas encore sains, vérification des logs..."
        ssh pi@$PI_IP "cd '$PROJECT_DIR' && docker compose logs --tail=20" | tee -a "$LOG_FILE"
    fi
}

# Fonction de test de l'API et de l'interface web
test_api() {
    info "Test de l'API..."
    
    local retries=5
    while [ $retries -gt 0 ]; do
        if curl -s "http://$PI_IP:3000/health" | grep -q "ok" 2>/dev/null; then
            success "API fonctionnelle"
            break
        fi
        info "Attente API... ($retries tentatives restantes)"
        sleep 5
        ((retries--))
    done
    
    if [ $retries -eq 0 ]; then
        warning "API pas encore accessible"
        return 1
    fi
    
    # Test de l'interface web
    info "Test de l'interface web..."
    if curl -s "http://$PI_IP:3000/" | grep -q "TechTemp" 2>/dev/null; then
        success "Interface web accessible"
    else
        warning "Interface web pas encore accessible"
    fi
    
    return 0
}

# === EXECUTION PRINCIPALE ===

echo "🚀 Déploiement TechTemp robuste sur Pi: $PI_IP"
if [ "$WITH_DASHBOARD" = "true" ]; then
    echo "   Mode UI: dashboard React (build local)"
else
    echo "   Mode UI: exemple buildless (web-example/)"
fi
echo "==============================================="
log "Début du déploiement sur $PI_IP (with_dashboard=$WITH_DASHBOARD)"

# Vérifications préliminaires
info "🔍 Vérifications préliminaires..."

if ! ping -c 1 $PI_IP >/dev/null 2>&1; then
    error "Pi $PI_IP non accessible"
fi
success "Pi accessible"

if ! ssh -o ConnectTimeout=10 -o BatchMode=yes pi@$PI_IP "echo 'SSH OK'" >/dev/null 2>&1; then
    error "SSH non accessible sur pi@$PI_IP - Vérifiez les clés SSH"
fi
success "SSH accessible"

# Étapes de déploiement
check_disk_space
install_docker
handle_port_conflicts
prepare_web_dir
deploy_techtemp

# Tests finaux
test_api

# Affichage final
echo ""
echo "🎉 Déploiement terminé !"
echo "======================="
echo "🌐 Interface Web: http://$PI_IP:3000"
echo "📊 Health: http://$PI_IP:3000/health"
echo "📱 API Devices: http://$PI_IP:3000/api/v1/devices"
echo "📈 API Readings: http://$PI_IP:3000/api/v1/readings/latest"
echo "🦟 MQTT: $PI_IP:1883"
echo ""
echo "📋 Log complet: $LOG_FILE"
echo ""
echo "🔧 Commandes utiles:"
echo "   Logs:      ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose logs -f'"
echo "   Restart:   ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose restart'"
echo "   Stop:      ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose down'"
echo "   Status:    ssh pi@$PI_IP 'cd $PROJECT_DIR && docker compose ps'"

log "Déploiement terminé avec succès"
