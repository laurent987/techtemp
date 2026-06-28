# Design — Watchdog connectivité & gel OS sur les Pi

**Date :** 2026-06-28
**Statut :** Validé (brainstorming), prêt pour plan d'implémentation
**Auteur :** laurent987 + Claude

## Problème

Le 2026-06-28, le Pi capteur du bureau (`techtemp-pi-02`) a disparu totalement du réseau
(absent de l'ARP et du mDNS). Cause réelle : coupure d'alimentation volontaire (orage +
interrupteur général de la pièce coupé, Pi oublié) — donc pas une panne logicielle.

Mais l'incident a révélé une lacune : la résilience actuelle ne couvre que deux cas :

- **Appli (`device/src/main.c`)** : après 5 échecs MQTT, le process quitte volontairement
  (« exiting for systemd restart », ligne 159).
- **systemd** (`deployment/bootstrap-pi.sh`) : service `techtemp-device` avec
  `Restart=always`, `RestartSec=10` → relance le process s'il meurt.

Ces mécanismes ne font **rien** dans les cas suivants :

1. **Lien Wi-Fi mort / non rétabli** (power-save Wi-Fi, driver figé, box rebootée) :
   l'appli boucle en redémarrant sans jamais joindre le serveur.
2. **Gel OS total** (kernel/driver, carte SD) : plus rien ne reboote.
3. **Coupure d'alimentation** : aucun logiciel ne peut réveiller le Pi (hors scope ici —
   seule une alerte aiderait, voir « Hors scope »).

## Objectif

Ajouter une couche de récupération **indépendante de l'appli** sur les Pi, qui :

- reboote le Pi quand son **lien réseau local** est cassé trop longtemps (récupération
  réseau = un simple reboot propre, puisque tous les services redémarrent déjà
  automatiquement) ;
- reboote le Pi quand l'**OS entier se fige** (watchdog matériel).

## Principe directeur retenu

**Simplicité + outil éprouvé.** Plutôt qu'un script bash custom d'escalade graduée
(reconfig Wi-Fi → restart réseau → reboot), on utilise le **daemon `watchdog`** standard
(paquet Debian/Raspbian), qui couvre les **deux** besoins d'un seul outil battle-tested :

- il **ping** un hôte et **reboote proprement** s'il est injoignable trop longtemps ;
- il **pilote le watchdog matériel** `/dev/watchdog` → si l'OS se fige (même le daemon ne
  répond plus), le hardware reboote tout seul.

Justification : les Pi capteurs sont *stateless* (ils ne font que publier des mesures),
donc un reboot est rapide, sans risque, et garantit un état réseau propre.

## Décision clé — anti-boot-loop : pinger la box, pas le serveur

Le watchdog des Pi capteurs ping la **passerelle (box)**, jamais le serveur `.42`.

- Si la **box répond mais pas le serveur** → **pas de reboot**. Rebooter le Pi n'y
  changerait rien (le problème est côté serveur), et ça évite que *tous* les capteurs
  rebootent en boucle quand c'est le serveur qui est tombé.
- Si la **box est injoignable** (Wi-Fi mort, lien local cassé) → reboot → relance propre de
  la stack réseau.

### Cas « la box elle-même est morte »

On ne peut jamais réparer une box morte depuis un Pi. Conséquence assumée :

- Box brièvement absente (< patience) → pas de reboot, reconnexion normale.
- Box morte longtemps → chaque Pi reboote périodiquement (~ toutes les 10-15 min) sans que
  ça aide, **mais c'est inoffensif** (Pi stateless, se reconnecte dès que la box revient ;
  seule conséquence = usure SD négligeable sur une panne longue et rare).
- Backoff (espacer les reboots pendant une panne box longue) : **option future**, pas par
  défaut (YAGNI).

## Portée

| Hôte | Watchdog matériel (gel OS) | Reboot sur échec de ping |
|------|----------------------------|--------------------------|
| Pi capteurs (`techtemp-pi-0x`) | ✅ oui | ✅ oui — `ping = box` |
| Serveur (`techtemp-server`, `.42`) | ✅ oui | ❌ non |

**Pourquoi pas de reboot-sur-ping sur le serveur :** il est (probablement) câblé en
Ethernet et n'a pas besoin du réseau pour fonctionner (c'est lui le broker MQTT, les
capteurs viennent à lui). Le watchdog matériel (relancer un OS figé) est ce qui a de la
valeur côté serveur.

**Sécurité données serveur :** le watchdog matériel reboote brutalement sur gel total
(comme un arrachage de prise) → risque théorique de corruption SQLite. Atténué car :
(a) la base est **déjà en mode WAL** (`backend/db/index.js:29`), qui survit à la
quasi-totalité des coupures brutales ; (b) seul un gel *total* (rare) déclenche le reset
brutal — il n'y a pas de reboot-sur-ping côté serveur.

## Configuration cible

### Watchdog matériel (tous les Pi)

- Activer le device : `dtparam=watchdog=on` dans le `config.txt` de boot.
  - Chemin selon l'OS : `/boot/firmware/config.txt` (Raspberry Pi OS Bookworm+) ou
    `/boot/config.txt` (anciennes versions). L'implémentation doit détecter le bon chemin.
- Le module `bcm2835_wdt` expose `/dev/watchdog` (timeout matériel max ~15 s sur BCM283x).

### `/etc/watchdog.conf` — Pi capteurs

```
watchdog-device = /dev/watchdog       # gel OS total → reset matériel
ping            = 192.168.0.1         # passerelle (box) — santé du lien local
interval        = 10                  # secondes entre deux vérifs (pet du HW watchdog)
retry-timeout   = 600                 # ~10 min d'échec ping consécutif avant reboot
realtime        = yes
priority        = 1
```

> Calage de la patience : `retry-timeout` ≈ 5-10 min (valeur retenue : **600 s**).
> `interval` (10 s) doit rester < timeout matériel (~15 s) pour que le daemon « nourrisse »
> le watchdog HW à temps.

### `/etc/watchdog.conf` — serveur

Identique mais **sans** la ligne `ping` (watchdog matériel seul).

### Activation (tous les Pi)

```
sudo systemctl enable --now watchdog
```

## Déploiement

Les deux types d'hôtes passent par des scripts de déploiement différents — il faut donc
deux points de greffe, partageant une **fonction commune** d'installation du watchdog
(idéalement factorisée, ex. `scripts/admin/lib/setup-watchdog.sh`) :

- **Pi capteurs** → `deployment/bootstrap-pi.sh`, juste après la section « 10. Installation
  du service systemd » (même motif : génération de fichier local → `scp` → `ssh sudo mv` →
  `systemctl`). Rôle = capteur (avec `ping = box`).
- **Serveur `.42`** → `scripts/admin/deploy-robust-pi.sh` (qui déploie le serveur via
  Docker), ou un petit step idempotent dédié. Rôle = serveur (watchdog matériel seul, pas
  de `ping`).

Étapes idempotentes communes (paramétrées par le rôle et l'IP passerelle) :

1. `apt-get install -y watchdog`
2. Activer `dtparam=watchdog=on` dans le bon `config.txt` (si absent).
3. Pousser `/etc/watchdog.conf` adapté au rôle (capteur = avec `ping`, serveur = sans).
4. `systemctl enable --now watchdog`.

## Tests / validation

- **Ping fail → reboot propre** : configurer temporairement `ping` vers une IP injoignable,
  vérifier le reboot après `retry-timeout`, et le retour automatique des services.
- **Gel OS → reset matériel** : simuler un blocage du daemon (`kill -STOP` du process
  watchdog, ou charge bloquante) et vérifier le reset matériel.
- **Anti-boot-loop serveur down** : couper le serveur `.42` avec box OK → vérifier
  qu'**aucun** Pi capteur ne reboote.
- **Idempotence** : relancer `bootstrap-pi.sh` deux fois ne casse rien.

## Hors scope (briques futures séparées)

- **Alerte « capteur silencieux »** côté serveur (notifier quand un capteur n'a rien émis
  depuis X min). C'est la seule chose qui aurait informé pour la coupure d'alim du bureau,
  mais l'utilisateur sait souvent lui-même quand il coupe le jus. À ajouter plus tard.
- **Backoff des reboots** pendant une panne box longue.
- Escalade graduée Wi-Fi (reconfig avant reboot) : écartée volontairement (complexité
  inutile, un reboot fait le même travail).
