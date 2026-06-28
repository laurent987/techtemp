#!/usr/bin/env bash
# Bibliothèque watchdog TechTemp — fonctions pures + orchestrateur distant.
# Sourcer ce fichier ; ne s'exécute pas tout seul.

# render_watchdog_conf <role> <gateway>
# Imprime le contenu de /etc/watchdog.conf sur stdout.
#   role = sensor : watchdog matériel + ping de la passerelle -> reboot après retry-timeout
#   role = server : watchdog matériel seul (aucun ping, reboot uniquement sur gel OS total)
render_watchdog_conf() {
  local role="$1" gateway="${2:-}"
  case "$role" in
    sensor|server) ;;
    *) echo "render_watchdog_conf: rôle inconnu: $role" >&2; return 2 ;;
  esac
  cat <<EOF
# Généré par setup-watchdog.sh — ne pas éditer à la main
watchdog-device = /dev/watchdog
interval        = 10
realtime        = yes
priority        = 1
EOF
  if [ "$role" = "sensor" ]; then
    cat <<EOF
ping            = ${gateway}
retry-timeout   = 600
EOF
  fi
}

# remote_install_watchdog <ssh_host> <role> <gateway>
# Installe + configure le daemon watchdog sur un Pi distant, de façon idempotente.
# Effets : apt install watchdog, charge le module HW (immédiat) + le persiste,
#          écrit /etc/watchdog.conf selon le rôle, active le service.
remote_install_watchdog() {
  local host="$1" role="$2" gateway="${3:-}"
  local tmpconf
  tmpconf="$(mktemp)"
  trap 'rm -f "$tmpconf"' RETURN
  render_watchdog_conf "$role" "$gateway" > "$tmpconf" || return 1

  scp "$tmpconf" "${host}:/tmp/techtemp-watchdog.conf" || return 1

  # Le heredoc est entre quotes ('REMOTE') => exécuté tel quel sur le Pi.
  ssh "$host" 'bash -s' <<'REMOTE'
set -e
sudo apt-get update -qq || true
sudo apt-get install -y watchdog

# Charger le module HW maintenant (sans reboot) pour que /dev/watchdog existe.
sudo modprobe bcm2835_wdt 2>/dev/null || true

# Persister l'activation du watchdog HW pour les boots futurs.
for f in /boot/firmware/config.txt /boot/config.txt; do
  if [ -f "$f" ]; then
    grep -qxF 'dtparam=watchdog=on' "$f" || echo 'dtparam=watchdog=on' | sudo tee -a "$f" >/dev/null
    break
  fi
done

# Mettre en place la conf générée puis (re)démarrer le service.
sudo mv /tmp/techtemp-watchdog.conf /etc/watchdog.conf
sudo systemctl enable watchdog
sudo systemctl restart watchdog
sudo systemctl --no-pager --full status watchdog | head -n 5 || true
REMOTE
}
