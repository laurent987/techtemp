#!/bin/bash
# Script pour avoir un aperçu général de la base de données
# Usage: ./scripts/db-overview.sh

echo "📊 Vue d'ensemble de la base de données TechTemp"
echo "==============================================="

echo ""
echo "📋 Nombre d'enregistrements par table:"
echo "--------------------------------------"
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

echo ""
echo "🏠 Rooms avec devices actifs:"
echo "----------------------------"
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    r.uid,
    r.name,
    COUNT(drp.device_id) as active_devices
  FROM rooms r
  LEFT JOIN device_room_placements drp ON r.id = drp.room_id AND drp.to_ts IS NULL
  GROUP BY r.id, r.uid, r.name
  ORDER BY active_devices DESC, r.name
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"

echo ""
echo "📱 Devices actifs par room:"
echo "-------------------------"
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid as device_uid,
    d.label,
    r.name as current_room,
    d.last_seen_at
  FROM devices d
  LEFT JOIN device_room_placements drp ON d.id = drp.device_id AND drp.to_ts IS NULL
  LEFT JOIN rooms r ON drp.room_id = r.id
  ORDER BY r.name, d.uid
\`);
const rows = stmt.all();
console.table(rows);
db.close();
"

echo ""
echo "🔧 Taille des fichiers de base:"
echo "-----------------------------"
docker exec -it techtemp-service ls -lh /app/data/techtemp.db*
