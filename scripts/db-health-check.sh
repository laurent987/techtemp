#!/bin/bash
# Script pour vérifier la santé de la base de données
# Usage: ./scripts/db-health-check.sh

echo "🏥 Vérification de la santé de la base de données"
echo "==============================================="

echo ""
echo "🔍 Vérification des foreign keys:"
echo "--------------------------------"
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

echo ""
echo "📊 Devices sans placement actuel:"
echo "--------------------------------"
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT d.uid, d.label, d.created_at
  FROM devices d
  LEFT JOIN device_room_placements drp ON d.id = drp.device_id AND drp.to_ts IS NULL
  WHERE drp.device_id IS NULL
\`);
const rows = stmt.all();
if (rows.length === 0) {
  console.log('✅ Tous les devices ont un placement actif');
} else {
  console.log('⚠️ Devices sans placement:');
  console.table(rows);
}
db.close();
"

echo ""
echo "🔄 Placements en conflit (plusieurs actifs pour un device):"
echo "----------------------------------------------------------"
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid,
    COUNT(*) as active_placements
  FROM device_room_placements drp
  JOIN devices d ON drp.device_id = d.id
  WHERE drp.to_ts IS NULL
  GROUP BY d.id, d.uid
  HAVING COUNT(*) > 1
\`);
const rows = stmt.all();
if (rows.length === 0) {
  console.log('✅ Aucun conflit de placement détecté');
} else {
  console.log('⚠️ Devices avec plusieurs placements actifs:');
  console.table(rows);
}
db.close();
"

echo ""
echo "⏱️ Devices inactifs (pas de lecture récente):"
echo "--------------------------------------------"
docker exec -it techtemp-service node -e "
import Database from 'better-sqlite3';
const db = new Database('/app/data/techtemp.db');
const stmt = db.prepare(\`
  SELECT 
    d.uid,
    d.label,
    d.last_seen_at,
    julianday('now') - julianday(d.last_seen_at) as days_inactive
  FROM devices d
  WHERE d.last_seen_at IS NOT NULL
    AND julianday('now') - julianday(d.last_seen_at) > 1
  ORDER BY days_inactive DESC
\`);
const rows = stmt.all();
if (rows.length === 0) {
  console.log('✅ Tous les devices sont actifs (< 1 jour d\\'inactivité)');
} else {
  console.log('⚠️ Devices inactifs:');
  console.table(rows);
}
db.close();
"
