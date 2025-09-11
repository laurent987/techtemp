#!/bin/bash
# Script pour voir les dernières lectures de capteurs
# Usage: ./scripts/db-latest-readings.sh [LIMIT]

LIMIT=${1:-10}

echo "📊 Dernières $LIMIT lectures de capteurs"
echo "======================================="

docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid as device_uid,
    d.label,
    r.name as room_name,
    rr.ts,
    rr.temperature,
    rr.humidity,
    rr.source
  FROM readings_raw rr
  JOIN devices d ON rr.device_id = d.id
  LEFT JOIN rooms r ON rr.room_id = r.id
  ORDER BY rr.ts DESC
  LIMIT $LIMIT
\`);
const rows = stmt.all();
if (rows.length === 0) {
  console.log('❌ Aucune lecture trouvée');
} else {
  console.table(rows);
}
db.close();
"
