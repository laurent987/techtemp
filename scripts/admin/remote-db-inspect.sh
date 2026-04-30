#!/bin/bash
# Script pour inspecter la base de données TechTemp sur un Pi distant
# Usage: ./scripts/remote-db-inspect.sh [PI_IP]

PI_IP=${1:-"192.168.0.42"}

echo "🔍 Inspection de la base TechTemp sur $PI_IP"
echo "============================================="

# Fonction pour exécuter une commande Node.js dans le conteneur
exec_db_query() {
    ssh pi@$PI_IP "cd /home/pi/techtemp && docker compose exec -T techtemp node -e \"$1\""
}

echo "📊 Vue d'ensemble des tables:"
echo "-----------------------------"
exec_db_query "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');

const tables = ['devices', 'rooms', 'device_room_placements', 'readings_raw'];
tables.forEach(table => {
  const stmt = db.prepare(\`SELECT COUNT(*) as count FROM \${table}\`);
  const result = stmt.get();
  console.log(\`📋 \${table}: \${result.count} enregistrements\`);
});
db.close();
"

echo ""
echo "🏠 Rooms détaillées:"
echo "-------------------"
exec_db_query "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');

const rooms = db.prepare('SELECT * FROM rooms ORDER BY id').all();
if (rooms.length === 0) {
  console.log('❌ Aucune room trouvée');
} else {
  rooms.forEach(r => {
    console.log(\`🏠 ID: \${r.id} | UID: \${r.uid} | Name: \${r.name} | Floor: \${r.floor || 'N/A'}\`);
  });
}
db.close();
"

echo ""
echo "📱 Devices détaillés:"
echo "--------------------"
exec_db_query "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');

const devices = db.prepare('SELECT * FROM devices ORDER BY id').all();
if (devices.length === 0) {
  console.log('❌ Aucun device trouvé');
} else {
  devices.forEach(d => {
    console.log(\`📱 ID: \${d.id} | UID: \${d.uid} | Label: \${d.label || 'N/A'}\`);
    console.log(\`   Created: \${d.created_at} | Last seen: \${d.last_seen_at || 'Never'}\`);
  });
}
db.close();
"

echo ""
echo "🔗 Device Room Placements:"
echo "-------------------------"
exec_db_query "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');

const placements = db.prepare(\`
  SELECT 
    p.device_id, p.room_id, p.from_ts, p.to_ts,
    d.uid as device_uid, d.label as device_label,
    r.uid as room_uid, r.name as room_name
  FROM device_room_placements p
  LEFT JOIN devices d ON p.device_id = d.id  
  LEFT JOIN rooms r ON p.room_id = r.id
  ORDER BY p.from_ts DESC
\`).all();

if (placements.length === 0) {
  console.log('❌ Aucun placement trouvé');
} else {
  placements.forEach(p => {
    const status = p.to_ts ? 'INACTIF' : 'ACTIF';
    console.log(\`🔗 \${p.device_uid} (\${p.device_label || 'No label'}) → \${p.room_name} (\${p.room_uid}) [\${status}]\`);
    console.log(\`   Du: \${p.from_ts} | Au: \${p.to_ts || 'En cours'}\`);
  });
}
db.close();
"

echo ""
echo "📊 Dernières lectures (5 plus récentes):"
echo "========================================="
exec_db_query "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');

const readings = db.prepare(\`
  SELECT 
    r.device_id, r.ts, r.temperature, r.humidity,
    d.uid as device_uid, d.label as device_label
  FROM readings_raw r
  LEFT JOIN devices d ON r.device_id = d.id
  ORDER BY r.ts DESC 
  LIMIT 5
\`).all();

if (readings.length === 0) {
  console.log('❌ Aucune lecture trouvée');
} else {
  readings.forEach(r => {
    console.log(\`📊 \${r.device_uid}: \${r.temperature}°C, \${r.humidity}% @ \${r.ts}\`);
  });
}
db.close();
"
