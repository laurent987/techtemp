# 🛠️ Scripts TechTemp

Collection de scripts utilitaires pour l'administration et le debugging de TechTemp.

## 📊 Scripts de base de données

### `db-overview.sh`
Vue d'ensemble complète de la base de données
```bash
./scripts/db-overview.sh
```

### `db-inspect-device.sh`
Historique des placements d'un device spécifique
```bash
./scripts/db-inspect-device.sh [DEVICE_UID]
# Exemple:
./scripts/db-inspect-device.sh aht20-f49c53
```

### `db-latest-readings.sh`
Dernières lectures de capteurs
```bash
./scripts/db-latest-readings.sh [LIMIT]
# Exemple:
./scripts/db-latest-readings.sh 20
```

### `db-health-check.sh`
Vérification de la santé de la base de données
```bash
./scripts/db-health-check.sh
```

## 📋 Prérequis

- Docker et docker-compose en cours d'exécution
- Container `techtemp-service` démarré
- Permissions d'exécution sur les scripts (`chmod +x scripts/*.sh`)

## 🔗 Documentation complète

Voir [DATABASE_INSPECTION.md](../docs/development/DATABASE_INSPECTION.md) pour une documentation complète des commandes et requêtes disponibles.

## 💡 Exemples d'usage

```bash
# Vue d'ensemble rapide
./scripts/db-overview.sh

# Vérifier un device spécifique
./scripts/db-inspect-device.sh aht20-abc123

# Voir les 50 dernières lectures
./scripts/db-latest-readings.sh 50

# Contrôle de santé quotidien
./scripts/db-health-check.sh
```
