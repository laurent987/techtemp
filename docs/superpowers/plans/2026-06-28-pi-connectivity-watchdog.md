# Watchdog connectivité & gel OS — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner aux Pi une couche de récupération indépendante de l'appli : reboot propre quand le lien local est cassé (capteurs) + reboot matériel sur gel OS total (tous les Pi), via le daemon `watchdog` standard.

**Architecture:** Une bibliothèque shell `scripts/admin/lib/setup-watchdog.sh` factorise (a) des fonctions **pures** testables localement (génération de `/etc/watchdog.conf`, helpers idempotents) et (b) un orchestrateur **distant** qui installe/configure le daemon sur un Pi par SSH. Deux points de greffe l'appellent : `deployment/bootstrap-pi.sh` (rôle capteur, avec `ping` = box) et `scripts/admin/deploy-robust-pi.sh` (rôle serveur, watchdog matériel seul).

**Tech Stack:** Bash, SSH/scp, daemon `watchdog` (paquet Debian/Raspbian), watchdog matériel BCM283x (`/dev/watchdog`, module `bcm2835_wdt`), systemd.

## Global Constraints

- **Cible du ping (capteur)** = passerelle/box, valeur : `192.168.0.1`. **Jamais le serveur** (anti-boot-loop).
- **Patience capteur avant reboot** : `retry-timeout = 600` (~10 min de ping en échec), `interval = 10` (s).
- **Serveur** : `watchdog-device = /dev/watchdog` **sans** ligne `ping` (reboot uniquement sur gel OS total). Pas de reboot-sur-ping.
- **Watchdog matériel** : `watchdog-device = /dev/watchdog` sur tous les rôles ; module chargé via `modprobe bcm2835_wdt` (effet immédiat, sans reboot) + `dtparam=watchdog=on` dans le `config.txt` de boot (persistance).
- **`interval` (10 s) < timeout matériel (~15 s)** pour que le daemon « nourrisse » le watchdog HW à temps.
- **Idempotence** : toutes les étapes distantes doivent pouvoir être relancées sans casse.
- **Base SQLite serveur déjà en WAL** (`backend/db/index.js:29`) — aucun changement requis, à vérifier seulement.
- **Chemin `config.txt`** détecté à l'exécution : `/boot/firmware/config.txt` (Raspberry Pi OS Bookworm+) sinon `/boot/config.txt`.

---

### Task 1: Bibliothèque de fonctions pures (génération conf + helpers) + tests

**Files:**
- Create: `scripts/admin/lib/setup-watchdog.sh`
- Test: `scripts/admin/lib/setup-watchdog.test.sh`

**Interfaces:**
- Produces:
  - `render_watchdog_conf <role> <gateway>` → écrit la config `/etc/watchdog.conf` sur **stdout**. `role` ∈ {`sensor`, `server`}. `gateway` ignoré si `server`.
  - `ensure_line_in_file <line> <file>` → ajoute `line` à `file` seulement si absente (match exact). Idempotent.
  - `pick_existing_path <path...>` → imprime le premier chemin existant (fichier régulier) parmi les arguments, code retour 0 ; sinon code retour 1, rien imprimé.

- [ ] **Step 1: Écrire les tests qui échouent**

Create `scripts/admin/lib/setup-watchdog.test.sh`:

```bash
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
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `bash scripts/admin/lib/setup-watchdog.test.sh`
Expected: FAIL — `setup-watchdog.sh: No such file or directory` (le fichier source n'existe pas encore).

- [ ] **Step 3: Écrire l'implémentation minimale**

Create `scripts/admin/lib/setup-watchdog.sh`:

```bash
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
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `bash scripts/admin/lib/setup-watchdog.test.sh`
Expected: toutes les lignes `ok   - ...`, code retour `0` (vérifier avec `echo $?`).

- [ ] **Step 5: Vérifier la syntaxe (et shellcheck si disponible)**

Run: `bash -n scripts/admin/lib/setup-watchdog.sh && echo SYNTAX_OK`
Expected: `SYNTAX_OK`
Run (si présent) : `command -v shellcheck >/dev/null && shellcheck scripts/admin/lib/setup-watchdog.sh || echo "shellcheck absent — ignoré"`
Expected: aucun warning bloquant, ou `shellcheck absent — ignoré`.

- [ ] **Step 6: Commit**

```bash
git add scripts/admin/lib/setup-watchdog.sh scripts/admin/lib/setup-watchdog.test.sh
git commit -m "feat(watchdog): lib pure de génération de watchdog.conf + tests"
```

---

### Task 2: Orchestrateur d'installation distante (SSH)

**Files:**
- Modify: `scripts/admin/lib/setup-watchdog.sh` (ajouter `remote_install_watchdog`)

**Interfaces:**
- Consumes: `render_watchdog_conf` (Task 1).
- Produces:
  - `remote_install_watchdog <ssh_host> <role> <gateway>` → installe et configure le daemon `watchdog` sur le Pi `<ssh_host>` (ex. `pi@192.168.0.42`). `role` ∈ {`sensor`,`server`}. Idempotent. Renvoie le code retour SSH.

- [ ] **Step 1: Ajouter la fonction `remote_install_watchdog`**

Append à la fin de `scripts/admin/lib/setup-watchdog.sh`:

```bash
# remote_install_watchdog <ssh_host> <role> <gateway>
# Installe + configure le daemon watchdog sur un Pi distant, de façon idempotente.
# Effets : apt install watchdog, charge le module HW (immédiat) + le persiste,
#          écrit /etc/watchdog.conf selon le rôle, active le service.
remote_install_watchdog() {
  local host="$1" role="$2" gateway="${3:-}"
  local tmpconf
  tmpconf="$(mktemp)"
  render_watchdog_conf "$role" "$gateway" > "$tmpconf"

  scp "$tmpconf" "${host}:/tmp/techtemp-watchdog.conf" || { rm -f "$tmpconf"; return 1; }
  rm -f "$tmpconf"

  # Le heredoc est entre quotes ('REMOTE') => exécuté tel quel sur le Pi.
  ssh "$host" 'bash -s' <<'REMOTE'
set -e
sudo apt-get update -qq
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
```

- [ ] **Step 2: Vérifier la syntaxe du script**

Run: `bash -n scripts/admin/lib/setup-watchdog.sh && echo SYNTAX_OK`
Expected: `SYNTAX_OK`

- [ ] **Step 3: Vérifier que les fonctions pures passent toujours**

Run: `bash scripts/admin/lib/setup-watchdog.test.sh; echo "exit=$?"`
Expected: toutes `ok`, `exit=0` (l'ajout ne casse pas les fonctions pures).

- [ ] **Step 4: Vérifier le rendu effectif des deux rôles (inspection visuelle)**

Run:
```bash
bash -c '. scripts/admin/lib/setup-watchdog.sh; echo "=== SENSOR ==="; render_watchdog_conf sensor 192.168.0.1; echo "=== SERVER ==="; render_watchdog_conf server ""'
```
Expected: bloc SENSOR avec `ping = 192.168.0.1` et `retry-timeout = 600` ; bloc SERVER **sans** aucune ligne `ping`/`retry-timeout`.

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/lib/setup-watchdog.sh
git commit -m "feat(watchdog): orchestrateur d'installation distante par SSH (idempotent)"
```

---

### Task 3: Greffe dans `bootstrap-pi.sh` (rôle capteur)

**Files:**
- Modify: `deployment/bootstrap-pi.sh`

**Interfaces:**
- Consumes: `remote_install_watchdog` (Task 2), variable `PI_IP` déjà définie dans le script.

**Context:** `bootstrap-pi.sh` configure un Pi **capteur** : il pousse le service systemd `techtemp-device` via `scp`/`ssh` dans une section « 10. Installation du service systemd » (autour des lignes 589-613). On ajoute une section 11 juste après.

- [ ] **Step 1: Déclarer la passerelle et sourcer la bibliothèque**

En haut de `deployment/bootstrap-pi.sh`, après la définition de `PI_IP` (et avant la première utilisation), ajouter :

```bash
# Passerelle (box) que les capteurs pingueront pour détecter une perte de lien local.
GATEWAY_IP="${GATEWAY_IP:-192.168.0.1}"

# Bibliothèque watchdog (fonctions partagées).
# shellcheck source=/dev/null
. "$(dirname "$0")/../scripts/admin/lib/setup-watchdog.sh"
```

- [ ] **Step 2: Ajouter la section 11 (watchdog) après l'installation du service systemd**

Repérer la fin de la section « 10. Installation du service systemd » (après le `rm /tmp/techtemp-device.service`, autour de la ligne 613). Insérer juste après :

```bash
# 11. Installation du watchdog (récupération réseau + gel OS)
echo -e "${BLUE}🐶 Installation du watchdog (ping passerelle ${GATEWAY_IP})...${NC}"
remote_install_watchdog "pi@$PI_IP" sensor "$GATEWAY_IP"
echo -e "${GREEN}✅ Watchdog capteur installé${NC}"
```

> Note : `${BLUE}`, `${GREEN}`, `${NC}` sont des variables de couleur déjà définies plus haut dans `bootstrap-pi.sh` ; les réutiliser telles quelles.

- [ ] **Step 3: Vérifier la syntaxe**

Run: `bash -n deployment/bootstrap-pi.sh && echo SYNTAX_OK`
Expected: `SYNTAX_OK`

- [ ] **Step 4: Vérifier que la bibliothèque est trouvable depuis le script**

Run:
```bash
bash -c 'cd deployment && . ../scripts/admin/lib/setup-watchdog.sh && type remote_install_watchdog >/dev/null && echo LIB_OK'
```
Expected: `LIB_OK` (le chemin relatif `../scripts/admin/lib/...` résout bien depuis `deployment/`).

- [ ] **Step 5: Commit**

```bash
git add deployment/bootstrap-pi.sh
git commit -m "feat(watchdog): installer le watchdog capteur depuis bootstrap-pi.sh"
```

---

### Task 4: Greffe dans `deploy-robust-pi.sh` (rôle serveur, HW seul)

**Files:**
- Modify: `scripts/admin/deploy-robust-pi.sh`

**Interfaces:**
- Consumes: `remote_install_watchdog` (Task 2), variable `PI_IP` déjà définie.

**Context:** `deploy-robust-pi.sh` déploie le **serveur** (`.42`) en Docker. La fonction `deploy_techtemp` (lignes ~265-330) fait le rsync + `docker compose up`. L'exécution principale appelle ensuite `test_api`. On installe le watchdog **serveur** (HW seul) après le déploiement.

- [ ] **Step 1: Sourcer la bibliothèque watchdog**

En haut de `scripts/admin/deploy-robust-pi.sh`, après le parsing des arguments (après le bloc `for arg in "$@"; do ... done`, vers la ligne 24) et avant `PROJECT_DIR=...`, ajouter :

```bash
# Bibliothèque watchdog (fonctions partagées).
# shellcheck source=/dev/null
. "$(dirname "$0")/lib/setup-watchdog.sh"
```

- [ ] **Step 2: Ajouter une fonction d'installation watchdog serveur**

Juste avant la section `# === EXECUTION PRINCIPALE ===` (vers la ligne 363), ajouter :

```bash
# Installe le watchdog matériel sur le serveur (gel OS total -> reboot).
# Pas de ping/reboot-réseau : le serveur est la cible, pas un client du réseau.
install_server_watchdog() {
    info "Installation du watchdog matériel sur le serveur..."
    if remote_install_watchdog "pi@$PI_IP" server "" >>"$LOG_FILE" 2>&1; then
        success "Watchdog serveur (HW) installé"
    else
        warning "Échec installation watchdog serveur (voir $LOG_FILE) — déploiement non bloqué"
    fi
}
```

> `info`, `success`, `warning`, `LOG_FILE` sont déjà définis en haut de `deploy-robust-pi.sh`. On n'utilise **pas** `error` ici : un échec watchdog ne doit pas faire échouer un déploiement serveur par ailleurs réussi.

- [ ] **Step 3: Appeler la fonction après le déploiement**

Dans la section « EXECUTION PRINCIPALE », repérer la séquence d'étapes :

```bash
check_disk_space
install_docker
handle_port_conflicts
prepare_web_dir
deploy_techtemp

# Tests finaux
test_api
```

La remplacer par (ajout d'une ligne `install_server_watchdog` entre `deploy_techtemp` et `test_api`) :

```bash
check_disk_space
install_docker
handle_port_conflicts
prepare_web_dir
deploy_techtemp
install_server_watchdog

# Tests finaux
test_api
```

- [ ] **Step 4: Vérifier la syntaxe**

Run: `bash -n scripts/admin/deploy-robust-pi.sh && echo SYNTAX_OK`
Expected: `SYNTAX_OK`

- [ ] **Step 5: Vérifier que la lib est trouvable et que le rendu serveur n'a pas de ping**

Run:
```bash
bash -c 'cd scripts/admin && . ./lib/setup-watchdog.sh && render_watchdog_conf server "" | grep -q "^ping" && echo "BUG: ping présent" || echo "SERVER_OK (pas de ping)"'
```
Expected: `SERVER_OK (pas de ping)`

- [ ] **Step 6: Commit**

```bash
git add scripts/admin/deploy-robust-pi.sh
git commit -m "feat(watchdog): installer le watchdog matériel serveur depuis deploy-robust-pi.sh"
```

---

### Task 5: Validation sur matériel réel + note opérateur

**Files:**
- Modify: `docs/INTERNAL/deployment/PI_MIGRATION.md` (ajout d'une courte section watchdog)

**Context:** Les effets de bord distants (apt, modprobe, systemd, reboot) ne sont validables que sur un vrai Pi. Cette tâche est une **checklist manuelle** + une note de doc. À exécuter par l'opérateur (réseau LAN + clés SSH requis). Cibles : `techtemp-pi-01` (192.168.0.134, capteur) et `techtemp-server` (192.168.0.42, serveur).

- [ ] **Step 1: Vérifier le prérequis WAL côté serveur (lecture seule)**

Run: `grep -n "journal_mode = WAL" backend/db/index.js`
Expected: une ligne (≈ `29: db.pragma('journal_mode = WAL');`). Si absente, **stop** et signaler — le spec suppose WAL.

- [ ] **Step 2: Installer le watchdog capteur sur pi-01**

Run (depuis la machine de déploiement, avec accès SSH) :
```bash
bash -c '. scripts/admin/lib/setup-watchdog.sh; remote_install_watchdog pi@192.168.0.134 sensor 192.168.0.1'
```
Expected: pas d'erreur ; les 5 dernières lignes du `systemctl status watchdog` montrent `active (running)`.

- [ ] **Step 3: Vérifier l'état du watchdog capteur**

Run:
```bash
ssh pi@192.168.0.134 'systemctl is-active watchdog; ls -l /dev/watchdog; grep -E "^(ping|watchdog-device|retry-timeout|interval)" /etc/watchdog.conf'
```
Expected: `active` ; `/dev/watchdog` présent ; `ping = 192.168.0.1`, `watchdog-device = /dev/watchdog`, `retry-timeout = 600`, `interval = 10`.

- [ ] **Step 4: Test anti-boot-loop (serveur down, box OK) — vérification logique**

Sans rien casser, confirmer que la conf capteur **ne pingue pas** le serveur :
Run: `ssh pi@192.168.0.134 'grep -c "192.168.0.42" /etc/watchdog.conf'`
Expected: `0` (le serveur n'apparaît nulle part → un serveur down ne fera pas rebooter pi-01).

- [ ] **Step 5 (optionnel, fenêtre de maintenance) : test reboot sur perte de lien**

⚠️ Provoque un **vrai reboot** de pi-01 (~10 min). À faire seulement si tu peux te permettre l'indisponibilité.
```bash
# Pointer temporairement le ping vers une IP injoignable, attendre le reboot, puis remettre.
ssh pi@192.168.0.134 "sudo sed -i 's/^ping .*/ping            = 10.255.255.1/' /etc/watchdog.conf && sudo systemctl restart watchdog"
# Attendre ~10-11 min : pi-01 doit rebooter, puis revenir (ping de nouveau OK).
# Au retour, restaurer la passerelle :
ssh pi@192.168.0.134 "sudo sed -i 's/^ping .*/ping            = 192.168.0.1/' /etc/watchdog.conf && sudo systemctl restart watchdog"
```
Expected: pi-01 devient injoignable ~30-60 s puis revient ; `uptime` montre un redémarrage récent.

- [ ] **Step 6: Installer le watchdog serveur (HW seul)**

Run:
```bash
bash -c '. scripts/admin/lib/setup-watchdog.sh; remote_install_watchdog pi@192.168.0.42 server ""'
ssh pi@192.168.0.42 'systemctl is-active watchdog; ls -l /dev/watchdog; ! grep -q "^ping" /etc/watchdog.conf && echo "SERVER_OK (pas de ping)"'
```
Expected: `active` ; `/dev/watchdog` présent ; `SERVER_OK (pas de ping)`.

- [ ] **Step 7: Documenter dans PI_MIGRATION.md**

Ajouter à la fin de `docs/INTERNAL/deployment/PI_MIGRATION.md` :

```markdown
## Watchdog (récupération auto)

Chaque Pi tourne le daemon `watchdog` :

- **Capteurs** : pingue la box (`192.168.0.1`) ; après ~10 min sans réponse → reboot
  propre (relance la stack réseau). Ne pingue **jamais** le serveur (anti-boot-loop).
- **Serveur** : watchdog matériel seul → reboot si l'OS se fige totalement. Pas de
  reboot sur réseau (le serveur est la cible, pas un client).
- **Tous** : `/dev/watchdog` (module `bcm2835_wdt`) reboote en cas de gel OS complet.

Config : `/etc/watchdog.conf`. Réinstallation : `remote_install_watchdog <host> <role> <gw>`
(voir `scripts/admin/lib/setup-watchdog.sh`). Déploiement automatique via
`bootstrap-pi.sh` (capteurs) et `deploy-robust-pi.sh` (serveur).
```

- [ ] **Step 8: Commit**

```bash
git add docs/INTERNAL/deployment/PI_MIGRATION.md
git commit -m "docs(watchdog): note opérateur dans PI_MIGRATION + validation matériel"
```

---

## Self-Review

**Spec coverage :**
- Watchdog matériel tous Pi → Task 2 (`modprobe` + `dtparam` + `watchdog-device`), vérifié Tasks 3/5/6. ✅
- Reboot capteur sur perte lien, ping box ~10 min → Task 1 (`render_watchdog_conf sensor`) + Task 3, vérifié Task 5. ✅
- Serveur HW seul, pas de ping → Task 1 (rôle `server`) + Task 4, vérifié Task 4 Step 5 / Task 5 Step 6. ✅
- Anti-boot-loop (ping box, jamais serveur) → Global Constraints + tests Task 1 + vérif Task 5 Step 4. ✅
- Deux chemins de déploiement (bootstrap capteurs / deploy-robust serveur) → Tasks 3 & 4. ✅
- Idempotence → `ensure_line_in_file`/`grep -qxF` + `enable --now` réexécutables ; couvert Task 1 test + design des steps distants. ✅
- WAL serveur déjà actif → vérif lecture seule Task 5 Step 1. ✅
- Détection chemin `config.txt` → boucle `for f in /boot/firmware/config.txt /boot/config.txt` (Task 2) ; helper `pick_existing_path` testé (Task 1). ✅
- Hors scope (alerte capteur silencieux, backoff, escalade Wi-Fi graduée) → non implémentés, conforme au spec. ✅

**Placeholder scan :** aucun TBD/TODO ; chaque step contient le code/commande réel. ✅

**Type/nom consistency :** `render_watchdog_conf`, `ensure_line_in_file`, `pick_existing_path`, `remote_install_watchdog`, `install_server_watchdog` — noms cohérents entre définition (Tasks 1-2) et usages (Tasks 3-5). ✅
