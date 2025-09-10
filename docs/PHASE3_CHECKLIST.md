# ✅ TechTemp Device - Checklist Phase 3

**Journal #008 - Phase 3 : Tests Hardware**  
**Date :** 10 septembre 2025

---

## 🎯 **Objectifs Phase 3**
- [x] Créer guide de déploiement complet
- [x] Créer script d'installation automatique  
- [x] Créer script de test hardware
- [ ] Tests sur Raspberry Pi réel avec capteur AHT20
- [ ] Validation flux end-to-end (capteur → backend → API)
- [ ] Documentation des résultats

---

## 📋 **Checklist Prérequis Hardware**

### **Raspberry Pi**
- [ ] Raspberry Pi 3B+ ou 4 opérationnel
- [ ] Raspberry Pi OS installé et à jour
- [ ] Connectivité réseau (Wi-Fi ou Ethernet)
- [ ] Accès SSH configuré (si déploiement distant)

### **Capteur AHT20**
- [ ] Capteur AHT20 en bon état
- [ ] Câblage I2C correct (VCC, GND, SDA, SCL)
- [ ] Alimentation 3.3V ou 5V connectée
- [ ] Pas de conflit d'adresse I2C

### **Configuration Système**
- [ ] I2C activé via `raspi-config`
- [ ] Module i2c_bcm2835 chargé  
- [ ] Interface /dev/i2c-1 disponible
- [ ] Utilisateur ajouté au groupe i2c

---

## 🔧 **Checklist Installation**

### **Dépendances Système**
- [ ] `build-essential` installé
- [ ] `i2c-tools` installé  
- [ ] `git` installé
- [ ] `wiringpi` installé et fonctionnel
- [ ] `libmosquitto-dev` installé
- [ ] `mosquitto-clients` installé

### **Repository et Compilation**
- [ ] Repository TechTemp cloné
- [ ] Branche `feature/journal-008-premier-capteur-physique` active
- [ ] Compilation réussie : `make` sans erreurs
- [ ] Exécutable `build/techtemp-device` créé
- [ ] Permissions d'exécution correctes

### **Configuration**
- [ ] Fichier `device.conf` créé
- [ ] Device UID configuré (basé sur Pi serial)
- [ ] Paramètres MQTT configurés (host, port)
- [ ] Paramètres I2C configurés (bus 1, adresse 0x38)
- [ ] Niveau de log configuré (INFO ou DEBUG)

---

## 🧪 **Checklist Tests Hardware**

### **Test I2C et Capteur**
- [ ] `sudo i2cdetect -y 1` montre périphérique à 0x38
- [ ] Pas d'autres périphériques conflictuels
- [ ] Capteur répond aux commandes I2C
- [ ] Lectures stables (pas de valeurs aberrantes)

### **Test Application Standalone**
- [ ] `./build/techtemp-device device.conf` démarre sans erreur
- [ ] Logs montrent initialisation AHT20 réussie
- [ ] Logs montrent initialisation MQTT réussie  
- [ ] Lectures capteur affichées toutes les N secondes
- [ ] Valeurs température cohérentes (15-30°C typique)
- [ ] Valeurs humidité cohérentes (30-70% typique)
- [ ] Arrêt propre avec Ctrl+C (SIGINT)

---

## 📡 **Checklist Tests MQTT**

### **Connectivité MQTT**
- [ ] Backend TechTemp opérationnel sur le réseau
- [ ] Broker MQTT accessible depuis le Pi
- [ ] `mosquitto_pub -h HOST -t test -m hello` fonctionne
- [ ] Pas de firewall bloquant port 1883

### **Publication Messages**
- [ ] Application publie sur topic correct
- [ ] Format JSON valide : `{"device_uid":"...", "timestamp":..., "temperature":..., "humidity":...}`
- [ ] Messages reçus par broker
- [ ] `mosquitto_sub -h HOST -t "home/+/sensors/+/reading"` affiche messages

### **Ingestion Backend**
- [ ] Messages MQTT traités par backend
- [ ] Device auto-créé en base si nouveau
- [ ] Readings stockés en table SQLite
- [ ] Pas d'erreurs dans logs backend

---

## 🌐 **Checklist Tests API**

### **Validation End-to-End**
- [ ] API `/api/v1/devices` liste le nouveau device  
- [ ] API `/api/v1/readings?device_uid=XXX` retourne données
- [ ] Timestamps corrects (UTC)
- [ ] Valeurs numériques dans les ranges attendus
- [ ] Pagination fonctionne si > 100 readings

### **Test Données Temps Réel**
- [ ] Nouvelles données visibles < 60s après lecture capteur
- [ ] Pas de doublons ou données manquantes
- [ ] Performance acceptable (< 500ms response time)

---

## ⚙️ **Checklist Service Système (Optionnel)**

### **Service Systemd**
- [ ] Fichier `/etc/systemd/system/techtemp-device.service` créé
- [ ] `systemctl daemon-reload` exécuté
- [ ] `systemctl start techtemp-device` démarre service
- [ ] `systemctl status techtemp-device` affiche "active (running)"
- [ ] `journalctl -u techtemp-device -f` affiche logs continus

### **Démarrage Automatique**
- [ ] `systemctl enable techtemp-device` configuré
- [ ] Service démarre après reboot Pi
- [ ] Récupération automatique après erreurs
- [ ] Logs système propres (pas d'erreurs critiques)

---

## 📊 **Checklist Monitoring**

### **Stabilité Long Terme**
- [ ] Fonctionnement continu > 1 heure sans erreur
- [ ] Pas de fuite mémoire visible
- [ ] CPU usage raisonnable (< 5% en moyenne)  
- [ ] Reconnexion MQTT automatique si déconnexion réseau
- [ ] Gestion erreurs I2C (capteur déconnecté temporairement)

### **Logs et Debugging**
- [ ] Logs application accessibles `/var/log/techtemp-device.log`
- [ ] Niveau de logs approprié (pas trop verbeux en prod)
- [ ] Rotation logs configurée (logrotate)
- [ ] Monitoring système (htop, iotop, etc.)

---

## 🎯 **Critères de Succès Phase 3**

### **Minimum Viable Product (MVP)**
- [x] Guide déploiement complet créé
- [x] Scripts d'installation automatique créés
- [ ] **Hardware** : Capteur AHT20 détecté et fonctionnel
- [ ] **Application** : Compile et lit données capteur correctement
- [ ] **MQTT** : Messages publiés et reçus
- [ ] **Backend** : Données stockées et accessibles via API

### **Validation Fonctionnelle**
- [ ] **Précision** : Valeurs capteur cohérentes avec environnement
- [ ] **Fiabilité** : Fonctionnement stable > 24h
- [ ] **Performance** : Latence end-to-end < 2 minutes
- [ ] **Récupération** : Résistance aux pannes réseau/capteur

### **Documentation**
- [ ] Guide déploiement testé et validé
- [ ] Scripts installation fonctionnels
- [ ] Procédures de dépannage documentées
- [ ] Résultats tests documentés dans Journal #008

---

## 📝 **Résultats Tests**

### **Configuration Test**
- **Date :** _______________
- **Pi Model :** _______________  
- **OS Version :** _______________
- **Capteur :** AHT20 à l'adresse 0x38

### **Résultats Hardware**
- **I2C Detection :** ⬜ OK / ⬜ KO
- **Compilation :** ⬜ OK / ⬜ KO
- **Lecture Capteur :** ⬜ OK / ⬜ KO
- **Valeurs Cohérentes :** ⬜ OK / ⬜ KO

### **Résultats MQTT/Backend**
- **Connexion MQTT :** ⬜ OK / ⬜ KO
- **Publication Messages :** ⬜ OK / ⬜ KO  
- **Ingestion Backend :** ⬜ OK / ⬜ KO
- **API Responses :** ⬜ OK / ⬜ KO

### **Notes/Problèmes Rencontrés**
```
___________________________________________________
___________________________________________________
___________________________________________________
```

---

## 🚀 **Prochaines Étapes**

Après validation Phase 3 :
- [ ] Merge branche dans `main`
- [ ] Création Journal #009 (Interface Web)
- [ ] Documentation production
- [ ] Guide utilisateur final
