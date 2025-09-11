#!/bin/bash
# Script de déploiement TechTemp robuste pour Raspberry Pi
# Usage: ./scripts/deploy-robust-pi.sh [PI_IP]

set -euo pipefail  # Arrêt immédiat en cas d'erreur

PI_IP=${1:-"192.168.0.42"}
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
    
    # Port 1883 (MQTT)
    if ssh pi@$PI_IP "netstat -tulpn 2>/dev/null | grep :1883" >/dev/null 2>&1; then
        warning "Port 1883 (MQTT) déjà utilisé"
        ssh_exec "
            sudo systemctl stop mosquitto 2>/dev/null || true
            sudo systemctl disable mosquitto 2>/dev/null || true
            sudo pkill mosquitto 2>/dev/null || true
        " "Arrêt services MQTT existants"
    fi
    
    # Port 3000 (API)
    if ssh pi@$PI_IP "netstat -tulpn 2>/dev/null | grep :3000" >/dev/null 2>&1; then
        warning "Port 3000 (API) déjà utilisé"
        ssh_exec "
            sudo pkill -f 'node.*3000' 2>/dev/null || true
            docker stop \$(docker ps -q --filter 'publish=3000') 2>/dev/null || true
        " "Libération port 3000"
    fi
    
    success "Ports libérés"
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
    
    # Suppression de la ligne version obsolète du docker-compose.yml
    ssh_exec "
        cd '$PROJECT_DIR'
        sed -i '/^version:/d' docker-compose.yml
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

# Fonction de test de l'API
test_api() {
    info "Test de l'API..."
    
    local retries=5
    while [ $retries -gt 0 ]; do
        if curl -s "http://$PI_IP:3000/health" | grep -q "ok" 2>/dev/null; then
            success "API fonctionnelle"
            return 0
        fi
        info "Attente API... ($retries tentatives restantes)"
        sleep 5
        ((retries--))
    done
    
    warning "API pas encore accessible"
    return 1
}

# === EXECUTION PRINCIPALE ===

echo "🚀 Déploiement TechTemp robuste sur Pi: $PI_IP"
echo "==============================================="
log "Début du déploiement sur $PI_IP"

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
deploy_techtemp

# Tests finaux
test_api

# Affichage final
echo ""
echo "🎉 Déploiement terminé !"
echo "======================="
echo "🌐 API: http://$PI_IP:3000"
echo "📊 Health: http://$PI_IP:3000/health"
echo "📱 Devices: http://$PI_IP:3000/api/v1/devices"
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
