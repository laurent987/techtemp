#!/usr/bin/env bash
# Tests des fonctions pures de setup-watchdog.sh (aucun effet de bord, aucun Pi requis).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
. "$HERE/setup-watchdog.sh"

fail=0
check() { # check <description> <condition-cmd...>
  local desc="$1"; shift
  if "$@"; then
    echo "ok   - $desc"
  else
    echo "FAIL - $desc"; fail=1
  fi
}

# --- render_watchdog_conf: rôle sensor ---
sensor_conf="$(render_watchdog_conf sensor 192.168.0.1)"
check "sensor: contient watchdog-device" grep -qxF 'watchdog-device = /dev/watchdog' <<<"$sensor_conf"
check "sensor: pinge la passerelle"        grep -qxF 'ping            = 192.168.0.1' <<<"$sensor_conf"
check "sensor: retry-timeout 600"          grep -qxF 'retry-timeout   = 600' <<<"$sensor_conf"
check "sensor: interval 10"                grep -qxF 'interval        = 10' <<<"$sensor_conf"

# --- render_watchdog_conf: rôle server (HW seul, AUCUN ping) ---
server_conf="$(render_watchdog_conf server '')"
check "server: contient watchdog-device" grep -qxF 'watchdog-device = /dev/watchdog' <<<"$server_conf"
check "server: AUCUNE ligne ping"        bash -c '! grep -q "^ping" <<<"$server_conf"'
check "server: AUCUN retry-timeout"      bash -c '! grep -q "^retry-timeout" <<<"$server_conf"'

# --- ensure_line_in_file: idempotent ---
tmp="$(mktemp)"
ensure_line_in_file 'dtparam=watchdog=on' "$tmp"
ensure_line_in_file 'dtparam=watchdog=on' "$tmp"
count="$(grep -cxF 'dtparam=watchdog=on' "$tmp")"
check "ensure_line_in_file: une seule occurrence après 2 appels" test "$count" -eq 1
rm -f "$tmp"

# --- pick_existing_path ---
tmpf="$(mktemp)"
check "pick_existing_path: trouve le fichier existant" \
  bash -c '[ "$(pick_existing_path /nope/a /nope/b "'"$tmpf"'")" = "'"$tmpf"'" ]'
check "pick_existing_path: code 1 si rien" bash -c '! pick_existing_path /nope/a /nope/b'
rm -f "$tmpf"

exit "$fail"
