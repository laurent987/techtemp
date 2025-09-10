# Guide Bootstrap TechTemp Device

## 🎯 Objectif

Le script `bootstrap-pi.sh` permet de configurer automatiquement un nouveau Raspberry Pi avec un capteur TechTemp en **une seule commande**.

## 🚀 Utilisation

### Mode interactif (recommandé)

```bash
./deployment/bootstrap-pi.sh <IP_DU_PI>
```

**Exemple :**
```bash
./deployment/bootstrap-pi.sh 192.168.1.100
```

Le script vous posera des questions guidées :

1. **🏠 Identifiant de votre maison**
   - Exemple : `home-001`, `maison-dupont`
   - Permet de grouper les devices par maison

2. **🏠 Nom de la pièce** 
   - Exemple : `Salon`, `Cuisine`, `Bureau`
   - Le script génère automatiquement un ID : `Salon` → `salon`

3. **🏷️ Nom du capteur**
   - Exemple : `Capteur Salon`
   - Valeur par défaut intelligente basée sur la pièce

4. **🌐 Configuration avancée** (optionnel)
   - Adresse du serveur MQTT
   - Appuyez sur Entrée pour garder les défauts

### Mode automatique

```bash
./deployment/bootstrap-pi.sh <IP_DU_PI> --non-interactive
```

Utilise les valeurs par défaut :
- Home ID : `home-001`
- Room : `Salon`
- Label : `Capteur Salon`

## 🔧 Ce que fait le script

### 1. Vérifications préliminaires
- ✅ Test de connectivité réseau
- ✅ Test de connexion SSH
- ✅ Récupération de l'UID unique (basé sur MAC)

### 2. Configuration système
- 📦 Mise à jour du système
- 🔧 Installation des dépendances
- ⚙️ Activation I2C

### 3. Installation du projet
- 📥 Clone/mise à jour du code TechTemp
- 📝 Génération de la configuration personnalisée
- 🔨 Compilation du code (0 warning !)

### 4. Tests et validation
- 🔍 Détection du capteur AHT20
- 🧪 Test de fonctionnement
- 🌐 Configuration dans l'API backend

### 5. Service système
- ⚙️ Installation du service systemd
- 🎯 Prêt pour le démarrage automatique

## 💡 Avantages

- **🎯 Une seule commande** : Plus besoin de configuration manuelle
- **🔒 Sécurisé** : UID basé sur MAC (6 derniers caractères)
- **🧠 Intelligent** : Génération automatique des IDs
- **✅ Validation** : Tests automatiques à chaque étape
- **📊 Propre** : Compilation sans warnings

## 🏗️ Prérequis

### Sur votre machine
- Accès SSH au Raspberry Pi (clé publique configurée)
- Réseau commun avec le Pi

### Sur le Raspberry Pi
- SSH activé
- Connexion Internet
- Capteur AHT20 branché sur I2C

## 🔌 Câblage AHT20

Voir [../hardware/aht20.md](../hardware/aht20.md) pour le détail du câblage.

## 🚨 Résolution de problèmes

### Erreur SSH
```
❌ Impossible de se connecter en SSH
```
**Solutions :**
- Vérifiez que SSH est activé : `sudo systemctl enable ssh`
- Copiez votre clé publique : `ssh-copy-id pi@IP_DU_PI`

### Capteur non détecté
```
⚠️ Capteur AHT20 non détecté à l'adresse 0x38
```
**Solutions :**
- Vérifiez le câblage (voir guide hardware)
- Testez manuellement : `sudo i2cdetect -y 1`

### API échouée
```
⚠️ Configuration API échouée
```
**Solutions :**
- Vérifiez que le backend TechTemp tourne
- Configurez manuellement avec la commande curl fournie

## 📋 Après l'installation

### Commandes utiles

```bash
# Voir le status du service
ssh pi@IP_DU_PI 'sudo systemctl status techtemp-device'

# Démarrer le service
ssh pi@IP_DU_PI 'sudo systemctl start techtemp-device'

# Arrêter le service
ssh pi@IP_DU_PI 'sudo systemctl stop techtemp-device'

# Redémarrer le service
ssh pi@IP_DU_PI 'sudo systemctl restart techtemp-device'

# Démarrage automatique au boot
ssh pi@IP_DU_PI 'sudo systemctl enable techtemp-device'

# Désactiver le démarrage automatique
ssh pi@IP_DU_PI 'sudo systemctl disable techtemp-device'

# Voir les logs en temps réel
ssh pi@IP_DU_PI 'journalctl -u techtemp-device -f'

# Voir les derniers logs
ssh pi@IP_DU_PI 'journalctl -u techtemp-device -n 50'

# Test manuel (debug)
ssh pi@IP_DU_PI 'cd techtemp/device && sudo ./build/techtemp-device config/device.conf'
```

### Interpréter le status du service

```bash
ssh pi@192.168.0.134 'sudo systemctl status techtemp-device'
```

**✅ Service fonctionnel :**
```
● techtemp-device.service - TechTemp Device Client
   Loaded: loaded (/etc/systemd/system/techtemp-device.service; enabled; vendor preset: enabled)
   Active: active (running) since Tue 2025-09-10 20:30:15 CEST; 5min ago
   Main PID: 1234 (techtemp-device)
```

**❌ Service en erreur :**
```
● techtemp-device.service - TechTemp Device Client
   Loaded: loaded (/etc/systemd/system/techtemp-device.service; enabled; vendor preset: enabled)
   Active: failed (Result: exit-code) since Tue 2025-09-10 20:30:15 CEST; 5min ago
```
→ Voir les logs : `journalctl -u techtemp-device -n 20`

**⚠️ Service arrêté :**
```
● techtemp-device.service - TechTemp Device Client
   Loaded: loaded (/etc/systemd/system/techtemp-device.service; disabled; vendor preset: enabled)
   Active: inactive (dead)
```
→ Démarrer : `sudo systemctl start techtemp-device`

### Vérification des données

```bash
# Dernière lecture via API
curl 'http://localhost:3000/api/v1/readings/latest?deviceId=aht20-XXXXXX'
```

## 🔄 Mise à jour

Pour mettre à jour un device existant :

```bash
./deployment/update-pi.sh
```

## 📚 Voir aussi

- [Configuration manuelle](configuration.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
- [Hardware AHT20](../hardware/aht20.md)
