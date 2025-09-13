#!/bin/bash

# TechTemp Sensor Health Monitor
# Vérifie que les capteurs envoient des données régulièrement

set -euo pipefail

# Configuration
TECHTEMP_API_URL="${TECHTEMP_API_URL:-http://localhost:3001}"
ALERT_THRESHOLD_MINUTES="${ALERT_THRESHOLD_MINUTES:-5}"
LOG_FILE="${LOG_FILE:-/var/log/techtemp-monitor.log}"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

check_api_connectivity() {
    if ! curl -s --max-time 10 "$TECHTEMP_API_URL/api/v1/health" > /dev/null; then
        log "ERROR" "❌ TechTemp API not accessible at $TECHTEMP_API_URL"
        return 1
    fi
    log "INFO" "✅ TechTemp API accessible"
    return 0
}

get_devices() {
    curl -s --max-time 10 "$TECHTEMP_API_URL/api/v1/devices" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for device in data.get('data', []):
        print(device.get('uid', ''))
except:
    pass
"
}

check_device_health() {
    local device_uid="$1"
    local latest_reading_response
    local latest_timestamp
    local current_timestamp
    local age_minutes
    
    # Récupérer la dernière lecture
    latest_reading_response=$(curl -s --max-time 10 "$TECHTEMP_API_URL/api/v1/devices/$device_uid/readings?limit=1")
    
    if [[ -z "$latest_reading_response" ]]; then
        log "ERROR" "❌ No data found for device $device_uid"
        return 1
    fi
    
    # Extraire le timestamp (format ISO dans data[0].ts)
    latest_timestamp=$(echo "$latest_reading_response" | python3 -c "
import sys, json
from datetime import datetime
try:
    data = json.load(sys.stdin)
    if data.get('data') and len(data['data']) > 0:
        ts_iso = data['data'][0].get('ts', '')
        if ts_iso:
            # Convertir ISO en timestamp milliseconds
            dt = datetime.fromisoformat(ts_iso.replace('Z', '+00:00'))
            print(int(dt.timestamp() * 1000))
        else:
            print(0)
    else:
        print(0)
except Exception as e:
    print(0)
")
    
    if [[ "$latest_timestamp" == "0" ]]; then
        log "ERROR" "❌ Invalid or missing timestamp for device $device_uid"
        return 1
    fi
    
    # Calculer l'âge en minutes
    current_timestamp=$(date +%s)000  # Convertir en millisecondes
    age_minutes=$(( (current_timestamp - latest_timestamp) / 60000 ))
    
    if [[ $age_minutes -gt $ALERT_THRESHOLD_MINUTES ]]; then
        log "WARNING" "⚠️  Device $device_uid: Last reading $age_minutes minutes ago (threshold: $ALERT_THRESHOLD_MINUTES min)"
        return 1
    else
        log "INFO" "✅ Device $device_uid: Last reading $age_minutes minutes ago"
        return 0
    fi
}

restart_device_service() {
    local device_uid="$1"
    log "INFO" "🔄 Attempting to restart service for device $device_uid"
    
    # Cette fonction devrait être adaptée selon votre infrastructure
    # Pour l'instant, on log juste l'action nécessaire
    log "INFO" "📋 Action required: Restart techtemp-device service on Pi for device $device_uid"
    
    # Si vous avez SSH configuré vers les Pi:
    # ssh "pi@device-${device_uid}" 'sudo systemctl restart techtemp-device'
}

main() {
    log "INFO" "🔍 Starting TechTemp sensor health check"
    
    # Vérifier la connectivité API
    if ! check_api_connectivity; then
        log "ERROR" "❌ Health check failed: API not accessible"
        exit 1
    fi
    
    # Récupérer la liste des devices
    local devices
    devices=$(get_devices)
    
    if [[ -z "$devices" ]]; then
        log "WARNING" "⚠️  No devices found in system"
        exit 0
    fi
    
    local all_healthy=true
    local total_devices=0
    local healthy_devices=0
    
    # Vérifier chaque device
    while IFS= read -r device_uid; do
        if [[ -n "$device_uid" ]]; then
            total_devices=$((total_devices + 1))
            log "INFO" "📡 Checking device: $device_uid"
            
            if check_device_health "$device_uid"; then
                healthy_devices=$((healthy_devices + 1))
            else
                all_healthy=false
                # Optionnel: tenter un redémarrage automatique
                # restart_device_service "$device_uid"
            fi
        fi
    done <<< "$devices"
    
    # Résumé
    log "INFO" "📊 Health check complete: $healthy_devices/$total_devices devices healthy"
    
    if [[ "$all_healthy" == true ]]; then
        log "INFO" "✅ All sensors are healthy"
        exit 0
    else
        log "WARNING" "⚠️  Some sensors require attention"
        exit 1
    fi
}

# Gestion des paramètres
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--continuous [interval]]"
        echo ""
        echo "Options:"
        echo "  --continuous [interval]  Run continuously with specified interval (default: 300s)"
        echo "  --help, -h              Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  TECHTEMP_API_URL             TechTemp API URL (default: http://localhost:3001)"
        echo "  ALERT_THRESHOLD_MINUTES      Alert threshold in minutes (default: 5)"
        echo "  LOG_FILE                     Log file path (default: /var/log/techtemp-monitor.log)"
        exit 0
        ;;
    --continuous)
        interval="${2:-300}"
        log "INFO" "🔄 Starting continuous monitoring (interval: ${interval}s)"
        while true; do
            main
            sleep "$interval"
        done
        ;;
    *)
        main
        ;;
esac