/**
 * @file Demo - Repository API avec noms explicites
 * Démontre l'utilisation de l'API Repository avec des noms de propriétés explicites
 */

import { createRepository } from '../src/repositories/index.js';
import Database from 'better-sqlite3';

// Création d'une base de données en mémoire pour la démo
const db = new Database(':memory:');

// Créer les tables (simplifié pour la démo)
db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    device_uid TEXT UNIQUE NOT NULL,
    label TEXT,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME,
    offset_t REAL DEFAULT 0,
    offset_h REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    floor TEXT,
    side TEXT
  );

  CREATE TABLE IF NOT EXISTS readings_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    room_id TEXT,
    ts DATETIME NOT NULL,
    t REAL,
    h REAL,
    source TEXT,
    msg_id TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(device_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
  );
`);

const repository = createRepository(db);

async function demo() {
  console.log('=== DEMO Repository API avec noms explicites ===\n');

  try {
    // 1. Créer un device
    console.log('1. Création d\'un device...');
    const device = await repository.devices.create({
      device_id: 'sensor001',
      device_uid: 'uid-sensor001',
      label: 'Capteur Temperature Salon'
    });
    console.log('✅ Device créé:', device.device_id);

    // 2. Créer une reading avec les NOUVEAUX noms explicites
    console.log('\n2. Création d\'une reading avec noms explicites...');
    const reading1 = await repository.readings.create({
      device_id: 'sensor001',
      ts: new Date().toISOString(),
      temperature: 22.5,  // ← Nom explicite !
      humidity: 65        // ← Nom explicite !
    });
    console.log('✅ Reading créée avec noms explicites:', {
      success: reading1.success,
      temperature: '22.5°C',
      humidity: '65%'
    });

    // 3. Créer une reading avec les ANCIENS noms (rétrocompatibilité)
    console.log('\n3. Création d\'une reading avec anciens noms (compatibilité)...');
    const reading2 = await repository.readings.create({
      device_id: 'sensor001',
      ts: new Date(Date.now() + 1000).toISOString(),
      t: 23.1,  // ← Ancien nom encore supporté
      h: 68     // ← Ancien nom encore supporté
    });
    console.log('✅ Reading créée avec anciens noms:', {
      success: reading2.success,
      temperature: '23.1°C',
      humidity: '68%'
    });

    // 4. Récupérer la dernière reading (avec transformation des noms)
    console.log('\n4. Récupération de la dernière reading...');
    const latest = await repository.readings.getLatestByDevice('sensor001');
    console.log('✅ Dernière reading avec noms explicites:');
    console.log(`   • Temperature: ${latest.temperature}°C (au lieu de 't': ${latest.t})`);
    console.log(`   • Humidity: ${latest.humidity}% (au lieu de 'h': ${latest.h})`);
    console.log(`   • Timestamp: ${latest.ts}`);

    // 5. Test de validation avec noms explicites
    console.log('\n5. Test de validation avec température invalide...');
    try {
      await repository.readings.create({
        device_id: 'sensor001',
        ts: new Date().toISOString(),
        temperature: 150  // ← Température invalide
      });
    } catch (error) {
      console.log('✅ Validation fonctionne:', error.message);
    }

    console.log('\n🎉 DEMO terminée avec succès !');
    console.log('\n📋 RÉSUMÉ des améliorations:');
    console.log('   • API Repository supporte maintenant "temperature" et "humidity"');
    console.log('   • Rétrocompatibilité avec "t" et "h" préservée');
    console.log('   • Toutes les méthodes de lecture transforment automatiquement les noms');
    console.log('   • Code plus lisible et explicite');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    db.close();
  }
}

demo();
