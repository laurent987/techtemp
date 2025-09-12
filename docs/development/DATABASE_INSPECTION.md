# 🔍 Database Inspection Guide

Guide pratique pour inspecter et déboguer la base de données SQLite TechTemp dans l'environnement Docker.

## 📋 Vue d'ensemble

La base de données SQLite est stockée dans le container Docker `techtemp-service` dans le répertoire `/app/data/techtemp.db`. Cette documentation fournit des commandes prêtes à utiliser pour inspecter les données.

## 🛠️ Commande de base

### Structure générale
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`VOTRE_REQUETE_SQL\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

## 📊 Requêtes courantes

### 1. Lister toutes les tables
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('SELECT name FROM sqlite_master WHERE type=\"table\"');
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### 2. Structure d'une table
```bash
# Remplacez 'devices' par le nom de la table souhaitée
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('PRAGMA table_info(devices)');
const rows = stmt.all();
console.table(rows);
db.close();
"
```

## 🏠 Inspection des Rooms

### Toutes les rooms
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('SELECT * FROM rooms ORDER BY id');
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Rooms avec nombre de devices
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    r.id,
    r.uid,
    r.name,
    COUNT(drp.device_id) as device_count
  FROM rooms r
  LEFT JOIN device_room_placements drp ON r.id = drp.room_id AND drp.to_ts IS NULL
  GROUP BY r.id, r.uid, r.name
  ORDER BY r.id
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

## 📱 Inspection des Devices

### Tous les devices
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('SELECT * FROM devices ORDER BY created_at DESC');
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Devices avec leur room actuelle
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.id,
    d.uid,
    d.label,
    r.name as current_room,
    d.created_at,
    d.last_seen_at
  FROM devices d
  LEFT JOIN device_room_placements drp ON d.id = drp.device_id AND drp.to_ts IS NULL
  LEFT JOIN rooms r ON drp.room_id = r.id
  ORDER BY d.created_at DESC
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Device spécifique
```bash
# Remplacez 'aht20-f49c53' par l'UID du device souhaité
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('SELECT * FROM devices WHERE uid = ?');
const rows = stmt.all('aht20-f49c53');
console.table(rows);
db.close();
"
```

## 📍 Inspection des Placements (device_room_placements)

### Historique complet d'un device
```bash
# Remplacez 'aht20-f49c53' par l'UID du device souhaité
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    drp.device_id,
    d.uid as device_uid,
    drp.room_id,
    r.name as room_name,
    drp.from_ts,
    drp.to_ts,
    CASE WHEN drp.to_ts IS NULL THEN 'ACTIF' ELSE 'FERMÉ' END as status
  FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id  
  JOIN rooms r ON drp.room_id = r.id
  WHERE d.uid = 'aht20-f49c53'
  ORDER BY drp.from_ts
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Tous les placements actifs
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid as device_uid,
    d.label,
    r.name as room_name,
    drp.from_ts
  FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id  
  JOIN rooms r ON drp.room_id = r.id
  WHERE drp.to_ts IS NULL
  ORDER BY drp.from_ts DESC
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Historique des déplacements (tous devices)
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid as device_uid,
    r.name as room_name,
    drp.from_ts,
    drp.to_ts,
    CASE WHEN drp.to_ts IS NULL THEN 'ACTIF' ELSE 'FERMÉ' END as status
  FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id  
  JOIN rooms r ON drp.room_id = r.id
  ORDER BY drp.from_ts DESC
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

## 📊 Inspection des Readings

### Dernières lectures par device
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid as device_uid,
    rr.ts,
    rr.temperature,
    rr.humidity,
    r.name as room_name
  FROM readings_raw rr
  JOIN devices d ON rr.device_id = d.id
  LEFT JOIN rooms r ON rr.room_id = r.id
  ORDER BY rr.ts DESC
  LIMIT 10
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Lectures d'un device spécifique
```bash
# Remplacez 'aht20-f49c53' par l'UID du device souhaité
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    rr.ts,
    rr.temperature,
    rr.humidity,
    r.name as room_name,
    rr.source
  FROM readings_raw rr
  JOIN devices d ON rr.device_id = d.id
  LEFT JOIN rooms r ON rr.room_id = r.id
  WHERE d.uid = 'aht20-f49c53'
  ORDER BY rr.ts DESC
  LIMIT 20
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Statistiques par room
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    r.name as room_name,
    COUNT(*) as reading_count,
    AVG(rr.temperature) as avg_temp,
    MIN(rr.temperature) as min_temp,
    MAX(rr.temperature) as max_temp,
    AVG(rr.humidity) as avg_humidity,
    MAX(rr.ts) as last_reading
  FROM readings_raw rr
  JOIN rooms r ON rr.room_id = r.id
  GROUP BY r.id, r.name
  ORDER BY reading_count DESC
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

## 🔧 Requêtes de maintenance

### Compter les enregistrements par table
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const tables = ['devices', 'rooms', 'device_room_placements', 'readings_raw'];
const counts = tables.map(table => {
  const stmt = db.prepare(\`SELECT COUNT(*) as count FROM \${table}\`);
  const result = stmt.get();
  return { table, count: result.count };
});
console.table(counts);
db.close();
"
```

### Vérifier l'intégrité des foreign keys
```bash
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('PRAGMA foreign_key_check');
const rows = stmt.all();
if (rows.length === 0) {
  console.log('✅ Toutes les foreign keys sont valides');
} else {
  console.log('⚠️ Problèmes de foreign keys détectés:');
  console.table(rows);
}
db.close();
"
```

### Taille de la base de données
```bash
docker exec -it techtemp-service ls -lh /app/data/techtemp.db*
```

## 📝 Exemples pratiques

### Debug: Pourquoi un device n'apparaît pas dans une room ?
```bash
# 1. Vérifier que le device existe
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare('SELECT * FROM devices WHERE uid = ?');
const device = stmt.get('UID_DU_DEVICE');
console.log('Device:', device);
db.close();
"

# 2. Vérifier les placements
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT * FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id
  WHERE d.uid = 'UID_DU_DEVICE'
  ORDER BY drp.from_ts DESC
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

### Debug: Lectures manquantes pour un device
```bash
# Vérifier les dernières lectures
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT COUNT(*) as total_readings, MAX(ts) as last_reading
  FROM readings_raw rr
  JOIN devices d ON rr.device_id = d.id
  WHERE d.uid = 'UID_DU_DEVICE'
\`);
const result = stmt.get();
console.log('Statistiques lectures:', result);
db.close();
"
```

## 🚨 Notes importantes

- **Container requis** : Le container `techtemp-service` doit être en cours d'exécution
- **Performance** : Évitez les requêtes lourdes sur les gros datasets en production
- **Read-only** : Ces commandes ne modifient pas les données, seulement consultation
- **Echappement** : Attention aux caractères spéciaux dans les UIDs/noms

## 🔗 Scripts automatisés

Pour créer des scripts réutilisables, vous pouvez sauvegarder ces commandes dans des fichiers `.sh` :

```bash
# Exemple: scripts/db-inspect-device.sh
#!/bin/bash
DEVICE_UID=${1:-"aht20-f49c53"}
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    drp.device_id,
    d.uid as device_uid,
    drp.room_id,
    r.name as room_name,
    drp.from_ts,
    drp.to_ts,
    CASE WHEN drp.to_ts IS NULL THEN 'ACTIF' ELSE 'FERMÉ' END as status
  FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id  
  JOIN rooms r ON drp.room_id = r.id
  WHERE d.uid = '$DEVICE_UID'
  ORDER BY drp.from_ts
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"
```

Usage: `./scripts/db-inspect-device.sh aht20-abc123`
