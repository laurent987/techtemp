#!/bin/bash
# Script pour inspecter l'historique des placements d'un device
# Usage: ./scripts/db-inspect-device.sh [DEVICE_UID]

DEVICE_UID=${1:-"aht20-f49c53"}

echo "🔍 Historique des placements pour le device: $DEVICE_UID"
echo "=================================================="

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
if (rows.length === 0) {
  console.log('❌ Aucun placement trouvé pour ce device');
} else {
  console.table(rows);
}
db.close();
"
