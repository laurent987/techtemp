#!/usr/bin/env bash
# Bibliothèque watchdog TechTemp — fonctions pures + orchestrateur distant.
# Sourcer ce fichier ; ne s'exécute pas tout seul.

# render_watchdog_conf <role> <gateway>
# Imprime le contenu de /etc/watchdog.conf sur stdout.
#   role = sensor : watchdog matériel + ping de la passerelle -> reboot après retry-timeout
#   role = server : watchdog matériel seul (aucun ping, reboot uniquement sur gel OS total)
render_watchdog_conf() {
  local role="$1" gateway="${2:-}"
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

# ensure_line_in_file <line> <file>
# Ajoute <line> à <file> seulement si elle n'y est pas déjà (match exact ligne entière).
ensure_line_in_file() {
  local line="$1" file="$2"
  if ! grep -qxF "$line" "$file" 2>/dev/null; then
    printf '%s\n' "$line" >> "$file"
  fi
}

# pick_existing_path <path...>
# Imprime le premier chemin qui est un fichier régulier existant ; code 1 si aucun.
pick_existing_path() {
  local f
  for f in "$@"; do
    [ -f "$f" ] && { printf '%s\n' "$f"; return 0; }
  done
  return 1
}

