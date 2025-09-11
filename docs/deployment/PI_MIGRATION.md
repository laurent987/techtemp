# 🔄 Migration vers Raspberry Pi Server

Guide pour migrer le serveur TechTemp vers votre Raspberry Pi (192.168.0.42).

## 🎯 Vue d'ensemble

Vous avez actuellement :
- ✅ **Serveur TechTemp** qui tourne en local (Docker)
- ✅ **Raspberry Pi 192.168.0.42** avec Mosquitto et ancienne version
- 🎯 **Objectif** : Migrer vers la nouvelle version sur le Pi

## 🚀 Étapes de migration

### 1. Déployer sur le Pi
```bash
# Déployer la nouvelle version
./scripts/deploy-to-pi.sh 192.168.0.42
```

### 2. Vérifier le déploiement
```bash
# Tester l'API
curl http://192.168.0.42:3000/health
curl http://192.168.0.42:3000/api/v1/devices
```

### 3. Migrer les données existantes (si nécessaire)
```bash
# Exporter les données depuis votre serveur local
./scripts/db-overview.sh > export-local.txt

# Après migration, comparer avec le Pi
ssh pi@192.168.0.42 "cd /home/pi/techtemp && curl http://localhost:3000/api/v1/devices"
```

### 4. Mettre à jour les devices existants
```bash
# Pour chaque device existant, le re-bootstrapper vers le nouveau serveur
./deployment/bootstrap-pi.sh 192.168.0.134 --backend-host 192.168.0.42

# Ou juste mettre à jour la configuration manuellement
ssh pi@192.168.0.134 "
cd techtemp/device/config
sed -i 's/backend_host=.*/backend_host=192.168.0.42/' device.conf
sed -i 's/backend_port=.*/backend_port=3000/' device.conf
sudo systemctl restart techtemp-device
"
```

### 5. Arrêter l'ancien serveur local
```bash
# Une fois que tout fonctionne sur le Pi
docker-compose down
```

## ⚙️ Configuration

### Variables d'environnement du Pi
```bash
# Sur le Pi 192.168.0.42
cd /home/pi/techtemp
cat .env
```

### Service systemd
```bash
# Vérifier le service
ssh pi@192.168.0.42 "sudo systemctl status techtemp-backend"

# Logs en temps réel
ssh pi@192.168.0.42 "sudo journalctl -u techtemp-backend -f"
```

## 🔍 Vérifications post-migration

### 1. API accessible
```bash
curl http://192.168.0.42:3000/health
curl http://192.168.0.42:3000/api/v1/devices
```

### 2. MQTT fonctionnel
```bash
# Tester la publication MQTT vers le Pi
mosquitto_pub -h 192.168.0.42 -t "techtemp/devices/test/data" -m '{"temperature":20.5,"humidity":65.2}'
```

### 3. Database accessible
```bash
# Utiliser les scripts de debugging sur le Pi
ssh pi@192.168.0.42 "cd /home/pi/techtemp && ./scripts/db-overview.sh"
```

## 🚨 Rollback si nécessaire

### Retour au serveur local
```bash
# Redémarrer le serveur local
docker-compose up -d

# Reconfigurer les devices vers localhost
./deployment/bootstrap-pi.sh 192.168.0.134 --backend-host localhost
```

## 📋 Checklist de migration

- [ ] Script de déploiement exécuté avec succès
- [ ] Service systemd démarré sur le Pi
- [ ] API répond sur http://192.168.0.42:3000
- [ ] Base de données créée et accessible
- [ ] Devices reconfigurés vers le nouveau serveur
- [ ] Réception des données MQTT fonctionnelle
- [ ] Ancien serveur local arrêté
- [ ] Tests de regression OK

## 🔧 Maintenance

### Logs
```bash
# Logs backend
ssh pi@192.168.0.42 "sudo journalctl -u techtemp-backend -f"

# Logs système
ssh pi@192.168.0.42 "tail -f /home/pi/techtemp/logs/techtemp-backend.log"
```

### Redémarrage
```bash
ssh pi@192.168.0.42 "sudo systemctl restart techtemp-backend"
```

### Mise à jour
```bash
# Re-déployer une nouvelle version
./scripts/deploy-to-pi.sh 192.168.0.42
```
