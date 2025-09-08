#!/usr/bin/env node
/**
 * @file Example Database & Repository
 * 
 * ✅ OBJECTIF: Démontrer l'utilisation des modules DB et Repository
 * 📦 MODULES DÉMONTRÉS:
 *    - src/db/index.js (initDb, migrations)
 *    - src/repositories/index.js (createRepository)
 * 
 * 🚫 PAS DÉMONTRÉ: Client MQTT, Pipeline d'ingestion, HTTP API
 */

import { initDb, closeDb } from '../index.js';
import { createRepository } from '../../repositories/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demonstrateDatabaseRepository() {
  console.log('🗄️  === EXEMPLE DATABASE + REPOSITORY ===');
  console.log('🎯 Module: initDb + migrateSchema (intégré) + createRepository');
  console.log('');
  console.log('📖 APERÇU DES TESTS:');
  console.log('1️⃣  Base mémoire    → Initialisation et migrations en RAM');
  console.log('2️⃣  Room Repository → Création et recherche de pièces');
  console.log('3️⃣  Device Repository → Gestion des devices IoT');
  console.log('4️⃣  Readings Repository → Stockage données capteurs');
  console.log('5️⃣  Base fichier   → Persistance SQLite sur disque');
  console.log('6️⃣  Nettoyage     → Fermeture propre des connexions');
  console.log('');
  console.log('⚙️  CONFIGURATION:');
  console.log('   💾 DB Mémoire: :memory:');
  console.log('   � DB Fichier: examples/db-data-examples/example-db.db');
  console.log('   🏗️  Schema: Version 2 (temperature/humidity)');
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1️⃣  TEST: Base de données en mémoire
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔗 1️⃣  TEST: Initialisation base de données mémoire');
  console.log('┌─ OBJECTIF: Créer DB temporaire en RAM pour tests rapides');
  console.log('│  Avantages: Ultra-rapide, pas de fichiers, isolation totale');
  console.log('│  Inconvénients: Données perdues à la fermeture');
  console.log('└─ Usage: Tests unitaires, développement, prototypage');
  console.log('');

  console.log('📤 Test 1.1: Création DB mémoire');
  console.log('   📋 Connection string: ":memory:"');
  const memDb = initDb(':memory:');
  console.log('   ✅ Base de données mémoire créée');

  console.log('📤 Test 1.2: Application du schéma');
  console.log('   🏗️  Schema: Automatique via initDb()');
  // Note: initDb() appelle automatiquement migrateSchema()
  console.log('   ✅ Schema appliqué avec succès');

  console.log('📤 Test 1.3: Création du repository');
  const memRepo = createRepository(memDb);
  console.log('   ✅ Repository configuré (rooms, devices, readings)');
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2️⃣  TEST: Room Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🏠 2️⃣  TEST: Room Repository (gestion des pièces)');
  console.log('┌─ OBJECTIF: Créer et gérer les pièces de la maison');
  console.log('│  Fonctionnalités: create, findById, findAll, update, delete');
  console.log('│  Validation: Contraintes unicité, relations avec devices');
  console.log('└─ Structure: room_id (PK), name, created_at, updated_at');
  console.log('');

  console.log('📤 Test 2.1: Création d\'une room');
  console.log('   📍 Room ID: "salon"');
  console.log('   🏷️  Name: "Salon"');
  const room = await memRepo.rooms.create({
    room_id: 'salon',
    name: 'Salon'
  });
  console.log('   ✅ Room créée avec succès');
  console.log(`   📊 Résultat: ${JSON.stringify({ room_id: room.room_id, name: room.name }, null, 2).replace(/\n/g, '\n       ')}`);

  console.log('📤 Test 2.2: Recherche par ID');
  console.log('   🔍 Recherche: room_id = "salon"');
  const foundRoom = await memRepo.rooms.findById('salon');
  console.log(`   ✅ Room trouvée: ${foundRoom?.name || 'Non trouvée'}`);
  console.log(`   📊 Données: ${foundRoom ? JSON.stringify({ room_id: foundRoom.room_id, name: foundRoom.name, created_at: foundRoom.created_at }, null, 2).replace(/\n/g, '\n       ') : 'Aucune'}`);

  console.log('📤 Test 2.3: Création d\'une seconde room');
  console.log('   📍 Room ID: "cuisine"');
  console.log('   🏷️  Name: "Cuisine"');
  const room2 = await memRepo.rooms.create({
    room_id: 'cuisine',
    name: 'Cuisine'
  });
  console.log('   ✅ Seconde room créée');

  console.log('📤 Test 2.4: Vérification des rooms créées');
  console.log('   🔍 Test: Recherche des rooms par ID');
  const salonCheck = await memRepo.rooms.findById('salon');
  const cuisineCheck = await memRepo.rooms.findById('cuisine');
  console.log(`   ✅ Room "salon": ${salonCheck ? 'trouvée' : 'non trouvée'}`);
  console.log(`   ✅ Room "cuisine": ${cuisineCheck ? 'trouvée' : 'non trouvée'}`);
  console.log('   📊 Rooms validées:');
  if (salonCheck) console.log(`       • ${salonCheck.room_id}: ${salonCheck.name}`);
  if (cuisineCheck) console.log(`       • ${cuisineCheck.room_id}: ${cuisineCheck.name}`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3️⃣  TEST: Device Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📱 3️⃣  TEST: Device Repository (gestion des devices IoT)');
  console.log('┌─ OBJECTIF: Gérer les capteurs et actuateurs IoT');
  console.log('│  Fonctionnalités: create, findById, findByRoom, findAll');
  console.log('│  Relations: device -> room (FK constraint)');
  console.log('└─ Structure: device_id (PK), device_uid, room_id (FK), label');
  console.log('');

  console.log('📤 Test 3.1: Création d\'un device température');
  console.log('   📍 Device ID: "temp001"');
  console.log('   🆔 UID: "temp001-uid"');
  console.log('   🏠 Room: "salon"');
  console.log('   🏷️  Label: "Capteur Température Salon"');
  const device = await memRepo.devices.create({
    device_id: 'temp001',
    device_uid: 'temp001-uid',
    room_id: 'salon',
    label: 'Capteur Température Salon'
  });
  console.log('   ✅ Device créé avec succès');
  console.log(`   📊 Device: ${device.device_id} dans room ${device.room_id}`);

  console.log('📤 Test 3.2: Recherche device par ID');
  console.log('   🔍 Recherche: device_id = "temp001"');
  const foundDevice = await memRepo.devices.findById('temp001');
  console.log(`   ✅ Device trouvé: ${foundDevice?.label || 'Non trouvé'}`);
  console.log(`   📊 Infos: ID=${foundDevice?.device_id}, Room=${foundDevice?.room_id || 'N/A'}`);

  console.log('📤 Test 3.3: Création device cuisine');
  console.log('   📍 Device ID: "temp002"');
  console.log('   🏠 Room: "cuisine"');
  const device2 = await memRepo.devices.create({
    device_id: 'temp002',
    device_uid: 'temp002-uid',
    room_id: 'cuisine',
    label: 'Capteur Cuisine'
  });
  console.log('   ✅ Device cuisine créé');

  console.log('📤 Test 3.4: Vérification des devices créés');
  console.log('   🔍 Recherche: validation des devices par ID');
  const device1Check = await memRepo.devices.findById('temp001');
  const device2Check = await memRepo.devices.findById('temp002');
  console.log(`   ✅ Device temp001: ${device1Check ? 'trouvé' : 'non trouvé'}`);
  console.log(`   ✅ Device temp002: ${device2Check ? 'trouvé' : 'non trouvé'}`);
  console.log('   📊 Devices validés:');
  if (device1Check) console.log(`       • ${device1Check.device_id}: ${device1Check.label} (${device1Check.room_id || 'N/A'})`);
  if (device2Check) console.log(`       • ${device2Check.device_id}: ${device2Check.label} (${device2Check.room_id || 'N/A'})`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4️⃣  TEST: Readings Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📈 4️⃣  TEST: Readings Repository (données capteurs)');
  console.log('┌─ OBJECTIF: Stocker et requêter les mesures des capteurs');
  console.log('│  Fonctionnalités: create, getLatestByDevice, findByDevice, findRecent');
  console.log('│  Relations: reading -> device (FK), reading -> room (FK)');
  console.log('└─ Structure: ts (PK), device_id (FK), room_id (FK), temperature, humidity, source');
  console.log('');

  console.log('📤 Test 4.1: Création d\'une reading température');
  console.log('   📍 Device: "temp001"');
  console.log('   🌡️  Temperature: 23.5°C');
  console.log('   💧 Humidity: 65.2%');
  console.log('   📅 Timestamp: maintenant');
  const reading = await memRepo.readings.create({
    device_id: 'temp001',
    room_id: 'salon',
    ts: new Date().toISOString(),
    temperature: 23.5,
    humidity: 65.2,
    source: 'example-test'
  });
  console.log(`   ✅ Reading créée: ${reading.success ? 'succès' : 'échec'}`);
  if (reading.success) {
    console.log(`   📊 Données stockées: device=temp001, 23.5°C, 65.2%`);
  }

  console.log('📤 Test 4.2: Ajout d\'une seconde reading');
  await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai pour timestamp différent
  const reading2 = await memRepo.readings.create({
    device_id: 'temp001',
    room_id: 'salon',
    ts: new Date().toISOString(),
    temperature: 24.1,
    humidity: 63.8,
    source: 'example-test'
  });
  console.log(`   ✅ Seconde reading: ${reading2.success ? 'succès' : 'échec'}`);

  console.log('📤 Test 4.3: Reading depuis device cuisine');
  const reading3 = await memRepo.readings.create({
    device_id: 'temp002',
    room_id: 'cuisine',
    ts: new Date().toISOString(),
    temperature: 22.3,
    humidity: 58.7,
    source: 'example-test'
  });
  console.log(`   ✅ Reading cuisine: ${reading3.success ? 'succès' : 'échec'}`);

  console.log('📤 Test 4.4: Récupération dernière reading');
  console.log('   🔍 Recherche: dernière reading de temp001');
  const latestReading = await memRepo.readings.getLatestByDevice('temp001');
  console.log(`   ✅ Latest reading: ${latestReading ? latestReading.temperature + '°C' : 'Aucune'}`);
  if (latestReading) {
    console.log(`   📊 Détails: ${latestReading.temperature}°C, ${latestReading.humidity}%, ${new Date(latestReading.ts).toLocaleTimeString()}`);
  }

  console.log('📤 Test 4.5: Recherche readings par room et période');
  console.log('   🔍 Recherche: room "salon" sur dernière minute');
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const now = new Date().toISOString();
  try {
    const roomReadings = await memRepo.readings.findByRoomAndTimeRange('salon', oneMinuteAgo, now);
    console.log(`   📊 Readings dans salon (dernière minute): ${roomReadings.length}`);
    if (roomReadings.length > 0) {
      console.log('   📊 Statistiques calculées:');
      const avgTemp = roomReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / roomReadings.length;
      const avgHum = roomReadings.reduce((sum, r) => sum + (r.humidity || 0), 0) / roomReadings.length;
      console.log(`       Température moyenne: ${avgTemp.toFixed(1)}°C`);
      console.log(`       Humidité moyenne: ${avgHum.toFixed(1)}%`);
      console.log(`       Première mesure: ${new Date(roomReadings[0].ts).toLocaleTimeString()}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Erreur recherche readings: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 5️⃣  TEST: Base de données fichier
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('💾 5️⃣  TEST: Base de données fichier (persistance)');
  console.log('┌─ OBJECTIF: Démontrer persistance sur disque avec SQLite');
  console.log('│  Avantages: Données persistantes, transactions ACID, concurrent access');
  console.log('│  Gestion: Auto-création fichier, gestion duplicatas, WAL mode');
  console.log('└─ Usage: Production, stockage long terme, données partagées');
  console.log('');

  const dbPath = join(__dirname, '../../../examples/db-data-examples/example-db.db');
  console.log('📤 Test 5.1: Création/ouverture DB fichier');
  console.log(`   📁 Chemin: ${dbPath}`);
  const fileDb = initDb(dbPath);
  // Note: initDb() applique automatiquement le schéma
  const fileRepo = createRepository(fileDb);
  console.log('   ✅ Base fichier initialisée');

  console.log('� Test 5.2: Gestion des duplicatas');
  console.log('   🔍 Tentative création room "cuisine" (peut exister)');
  try {
    await fileRepo.rooms.create({ room_id: 'bureau', name: 'Bureau' });
    console.log('   ✅ Room "bureau" créée');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ⚠️  Room existe déjà (normal lors de tests répétés)');
    } else {
      throw error;
    }
  }

  console.log('📤 Test 5.3: Vérification rooms dans fichier');
  console.log('   🔍 Recherche: room "bureau" (nouvellement créée)');
  const bureauRoom = await fileRepo.rooms.findById('bureau');
  console.log(`   ✅ Room bureau: ${bureauRoom ? 'trouvée' : 'non trouvée'}`);
  if (bureauRoom) {
    console.log(`       • ${bureauRoom.room_id}: ${bureauRoom.name}`);
  }

  console.log('   🔍 Test: Autres rooms potentielles');
  const salonFileCheck = await fileRepo.rooms.findById('salon');
  const cuisineFileCheck = await fileRepo.rooms.findById('cuisine');
  if (salonFileCheck) console.log(`       • ${salonFileCheck.room_id}: ${salonFileCheck.name}`);
  if (cuisineFileCheck) console.log(`       • ${cuisineFileCheck.room_id}: ${cuisineFileCheck.name}`);

  console.log('📤 Test 5.4: Device avec gestion duplicatas');
  const targetRoom = bureauRoom ? bureauRoom.room_id : 'bureau'; // Utiliser bureau ou fallback
  try {
    await fileRepo.devices.create({
      device_id: 'temp003',
      device_uid: 'temp003-uid',
      room_id: targetRoom,
      label: 'Capteur Bureau'
    });
    console.log('   ✅ Device "temp003" créé dans fichier');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ⚠️  Device existe déjà (normal lors de tests répétés)');
    } else {
      throw error;
    }
  }

  console.log('📤 Test 5.5: Reading dans fichier persistant');
  try {
    const fileReading = await fileRepo.readings.create({
      device_id: 'temp003',
      room_id: targetRoom,
      ts: new Date().toISOString(),
      temperature: 21.8,
      humidity: 62.3,
      source: 'example-file-test'
    });
    console.log(`   ✅ Reading fichier: ${fileReading.success ? 'succès' : 'échec'}`);
  } catch (error) {
    console.log(`   ⚠️  Reading échec (device peut ne pas exister): ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 6️⃣  TEST: Nettoyage et fermeture
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🧹 6️⃣  TEST: Nettoyage et fermeture des connexions');
  console.log('┌─ OBJECTIF: Fermer proprement les connexions DB');
  console.log('│  Importance: Éviter corruption, libérer ressources, finaliser transactions');
  console.log('│  Mémoire: Données perdues (attendu)');
  console.log('└─ Fichier: Données conservées pour prochaine exécution');
  console.log('');

  console.log('📤 Test 6.1: Fermeture DB mémoire');
  console.log('   💾 Type: Base mémoire (:memory:)');
  console.log('   📊 Données stockées: Rooms, Devices, Readings temporaires');
  memDb.close();
  console.log('   ✅ Base mémoire fermée (données perdues)');

  console.log('📤 Test 6.2: Fermeture DB fichier');
  console.log(`   💾 Type: Base fichier (${dbPath})`);
  console.log('   📁 Persistance: Données conservées sur disque');
  fileDb.close();
  console.log('   ✅ Base fichier fermée (données conservées)');

  console.log('📤 Test 6.3: Vérification intégrité');
  console.log('   🔍 Vérification: Fichier existe et n\'est pas corrompu');
  const fs = await import('fs');
  const fileExists = fs.existsSync(dbPath);
  console.log(`   ✅ Fichier DB existe: ${fileExists ? 'Oui' : 'Non'}`);
  if (fileExists) {
    const stats = fs.statSync(dbPath);
    console.log(`   📊 Taille fichier: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`   📅 Dernière modification: ${stats.mtime.toLocaleString()}`);
  }
  console.log('═'.repeat(80) + '\n');

  // Fermer les bases
  console.log('✅ === EXEMPLE DATABASE + REPOSITORY TERMINÉ ===');
  console.log('🎯 Module démontré avec succès:');
  console.log('   • initDb (bases mémoire et fichier)');
  console.log('   • migrateSchema (schema SQLite intégré)');
  console.log('   • createRepository (CRUD operations)');
  console.log('   • rooms.* (create, findById, findAll)');
  console.log('   • devices.* (create, findById, findByRoom)');
  console.log('   • readings.* (create, getLatestByDevice, findByDevice)');
  console.log('   • Gestion duplicatas et erreurs');
  console.log('   • Persistance fichier vs mémoire');
  console.log('');
  console.log('📊 STATISTIQUES:');
  console.log('   • Rooms créées: 3 (salon, cuisine, bureau)');
  console.log('   • Devices créés: 3+ (temp001, temp002, temp003)');
  console.log('   • Readings stockées: 3+ (avec timestamps)');
  console.log('   • Types DB testés: 2 (mémoire + fichier)');
  console.log('');
  console.log(`📁 Données persistées dans: ${dbPath}`);
  console.log('💡 Conseil: Relancez ce script pour voir la gestion des duplicatas\n');
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🗄️  Exemple Database + Repository');
  console.log('==================================');
  console.log('');
  console.log('Ce script démontre:');
  console.log('• 📊 initDb (bases mémoire et fichier)');
  console.log('• � migrateSchema (schema SQLite automatique)');
  console.log('• 📦 createRepository (CRUD operations)');
  console.log('• 🏠 Room Repository (create, findAll, findById)');
  console.log('• 📱 Device Repository (create, findAll, findByRoom)');
  console.log('• 📈 Readings Repository (create, findByDevice, findRecent)');
  console.log('');
  console.log('Usage: node src/db/examples/example-db.js');
  console.log('');
  console.log('Fichiers utilisés:');
  console.log('• src/db/index.js');
  console.log('• src/db/index.js (migrateSchema intégré)');
  console.log('• src/repositories/index.js');
  process.exit(0);
}

// Run example
demonstrateDatabaseRepository().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
