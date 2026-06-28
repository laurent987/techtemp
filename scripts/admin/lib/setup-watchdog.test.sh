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
refute_match() { ! grep -q "$1" <<<"$2"; } # succeeds when pattern NOT found in text

# --- render_watchdog_conf: rôle sensor ---
sensor_conf="$(render_watchdog_conf sensor 192.168.0.1)"
check "sensor: contient watchdog-device" grep -qxF 'watchdog-device = /dev/watchdog' <<<"$sensor_conf"
check "sensor: pinge la passerelle"        grep -qxF 'ping            = 192.168.0.1' <<<"$sensor_conf"
check "sensor: retry-timeout 600"          grep -qxF 'retry-timeout   = 600' <<<"$sensor_conf"
check "sensor: interval 10"                grep -qxF 'interval        = 10' <<<"$sensor_conf"

# --- render_watchdog_conf: rôle server (HW seul, AUCUN ping) ---
server_conf="$(render_watchdog_conf server '')"
check "server: contient watchdog-device" grep -qxF 'watchdog-device = /dev/watchdog' <<<"$server_conf"
check "server: AUCUNE ligne ping"        refute_match '^ping' "$server_conf"
check "server: AUCUN retry-timeout"      refute_match '^retry-timeout' "$server_conf"

# --- render_watchdog_conf: rôle inconnu ---
bogus_out="$(render_watchdog_conf bogus '' 2>/dev/null)"; bogus_rc=$?
check "rôle inconnu: code retour non nul" test "$bogus_rc" -ne 0
check "rôle inconnu: aucune config émise" test -z "$bogus_out"

exit "$fail"
