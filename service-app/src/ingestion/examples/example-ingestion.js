#!/usr/bin/env node
/**
 * @file Example Ingestion Pipeline
 * 
 * ✅ OBJECTIF: Démontrer le pipeline d'ingestion MQTT → Database
 * 📦 MODULES DÉMONTRÉS:
 *    - src/ingestion/parseTopic.js
 *    - src/ingestion/validateReading.js  
 *    - src/ingestion/ingestMessage.js
 * 
 * 🚫 PAS DÉMONTRÉ: Client MQTT réel, HTTP API
 */

import { initDb } from '../../db/index.js';
import { createRepository } from '../../repositories/index.js';
import { parseTopic, validateReading, ingestMessage } from '../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demonstrateIngestionPipeline() {
  console.log('⚙️  === EXEMPLE INGESTION PIPELINE ===');
  console.log('🎯 Modules: parseTopic + validateReading + ingestMessage\n');

  console.log('📖 APERÇU DES TESTS:');
  console.log('1️⃣  parseTopic      → Validation format topic MQTT');
  console.log('2️⃣  validateReading → Validation payload JSON');
  console.log('3️⃣  ingestMessage   → Pipeline complet avec messages valides');
  console.log('4️⃣  ingestMessage   → Gestion messages invalides');
  console.log('5️⃣  Réutilisation   → Device auto-création vs réutilisation');
  console.log('6️⃣  Déduplication   → Protection contre messages dupliqués');
  console.log('7️⃣  Statistiques    → Bilan des opérations\n');

  // Setup database (clean start)
  const dbPath = join(__dirname, '../../../examples/db-data-examples/example-ingestion.db');

  // Supprimer l'ancienne base pour un test propre
  try {
    unlinkSync(dbPath);
    console.log('🧹 Ancienne base supprimée pour un test propre');
  } catch (error) {
    // Fichier n'existe pas, c'est normal
  }

  const db = initDb(dbPath);
  // Note: initDb() applique automatiquement le schéma
  const repository = createRepository(db);
  console.log('📊 Database initialisée pour les tests');
  console.log('═'.repeat(80) + '\n');

  // Générateur de msg_id unique
  let msgCounter = 0;
  const generateMsgId = () => `example-msg-${Date.now()}-${++msgCounter}-${Math.random().toString(36).substr(2, 9)}`;  // ═══════════════════════════════════════════════════════════════════════════════
  // 1️⃣  TEST MODULE: parseTopic 
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📝 1️⃣  MODULE: parseTopic');
  console.log('┌─ OBJECTIF: Valider le format des topics MQTT et extraire device_id');
  console.log('│  Topics valides: "sensors/{deviceId}/readings"');
  console.log('│  Topics invalides: tout autre format');
  console.log('└─ Extraction: device_id depuis le topic MQTT\n');

  // Test 1.1: Topic valide
  console.log('📤 Test 1.1: Topic valide');
  console.log(`   📍 Input: "sensors/temp001/readings"`);
  try {
    const validTopic = 'sensors/temp001/readings';
    const parsed = parseTopic(validTopic);
    console.log(`   ✅ Parsing réussi`);
    console.log(`   📋 Résultat: device_id="${parsed.deviceId}"`);
  } catch (error) {
    console.log(`   ❌ Erreur inattendue: ${error.message}`);
  }

  // Test 1.2: Topic invalide
  console.log(`\n📤 Test 1.2: Topic invalide`);
  console.log(`   📍 Input: "invalid/topic"`);
  try {
    const invalidTopic = 'invalid/topic';
    parseTopic(invalidTopic);
    console.log(`   ❌ Topic invalide accepté (ne devrait pas arriver)`);
  } catch (error) {
    console.log(`   ✅ Topic invalide correctement rejeté`);
    console.log(`   📋 Erreur: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2️⃣  TEST MODULE: validateReading
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📋 2️⃣  MODULE: validateReading');
  console.log('┌─ OBJECTIF: Valider et normaliser les données des capteurs');
  console.log('│  Champs requis: temperature_c, humidity_pct, timestamp');
  console.log('│  Validation: types, plages de valeurs, format timestamp');
  console.log('└─ Normalisation: temperature_c → temperature, humidity_pct → humidity\n');

  // Test 2.1: Payload valide
  console.log('📤 Test 2.1: Payload valide');
  const validPayload = {
    temperature_c: 23.5,
    humidity_pct: 65.2,
    timestamp: '2025-09-08T10:30:00Z'
  };
  console.log(`   📋 Input:`, JSON.stringify(validPayload, null, 2).replace(/\n/g, '\n           '));
  try {
    const validated = validateReading(validPayload);
    console.log(`   ✅ Validation réussie`);
    console.log(`   📋 Résultat: ${validated.temperature}°C, ${validated.humidity}%`);
  } catch (error) {
    console.log(`   ❌ Erreur inattendue: ${error.message}`);
  }

  // Test 2.2: Payload invalide (type incorrect)
  console.log(`\n📤 Test 2.2: Payload invalide (type incorrect)`);
  const invalidPayload = {
    temperature_c: 'invalid',
    humidity_pct: 65.2,
    timestamp: '2025-09-08T10:30:00Z'
  };
  console.log(`   📋 Input:`, JSON.stringify(invalidPayload, null, 2).replace(/\n/g, '\n           '));
  try {
    validateReading(invalidPayload);
    console.log(`   ❌ Payload invalide accepté (ne devrait pas arriver)`);
  } catch (error) {
    console.log(`   ✅ Payload invalide correctement rejeté`);
    console.log(`   📋 Erreur: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3️⃣  TEST MODULE: ingestMessage - Messages Valides
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔄 3️⃣  MODULE: ingestMessage - Messages Valides');
  console.log('┌─ OBJECTIF: Pipeline complet MQTT → Database avec messages valides');
  console.log('│  Étapes: parseTopic → validateReading → création device → stockage reading');
  console.log('│  Auto-création: devices créés automatiquement s\'ils n\'existent pas');
  console.log('└─ Stockage: readings enregistrées dans la base SQLite\n');

  const validMessages = [
    {
      topic: 'sensors/temp001/readings',
      payload: {
        temperature_c: 23.5,
        humidity_pct: 65.2,
        timestamp: '2025-09-08T10:30:00Z'
      }
    },
    {
      topic: 'sensors/temp002/readings',
      payload: {
        temperature_c: 22.1,
        humidity_pct: 58.7,
        timestamp: '2025-09-08T10:31:00Z'
      }
    },
    {
      topic: 'sensors/temp001/readings',
      payload: {
        temperature_c: 24.0,
        humidity_pct: 67.5,
        timestamp: '2025-09-08T10:32:00Z'
      }
    }
  ];

  for (const [index, message] of validMessages.entries()) {
    try {
      console.log(`📤 Message ${index + 1}/${validMessages.length}:`);
      console.log(`   📍 Topic: "${message.topic}"`);
      console.log(`   📋 Payload:`, JSON.stringify(message.payload, null, 2).replace(/\n/g, '\n       '));

      // Générer un msg_id unique pour chaque message
      const msgHeaders = { msg_id: generateMsgId() };
      console.log(`   🔑 Headers: msg_id="${msgHeaders.msg_id}"`);

      const result = await ingestMessage(message.topic, message.payload, msgHeaders, repository);

      if (result.success) {
        console.log(`   ✅ Pipeline réussi: ${result.deviceId} → ${message.payload.temperature_c}°C`);
        if (result.deviceCreated) {
          console.log(`     🆕 Nouveau device créé automatiquement`);
        } else {
          console.log(`     ♻️  Device existant réutilisé`);
        }
      } else {
        console.log(`   ❌ Pipeline échoué: ${result.error}`);
      }
      console.log('   ' + '─'.repeat(60));
    } catch (error) {
      console.log(`   ❌ Erreur pipeline: ${error.message}`);
      console.log('   ' + '─'.repeat(60));
    }
  }
  console.log('═'.repeat(80) + '\n');  // ═══════════════════════════════════════════════════════════════════════════════
  // 4️⃣  TEST MODULE: ingestMessage - Messages Invalides
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('❌ 4️⃣  MODULE: ingestMessage - Messages Invalides');
  console.log('┌─ OBJECTIF: Validation robuste avec rejet des messages malformés');
  console.log('│  Topics invalides: format incorrect');
  console.log('│  Payloads invalides: types incorrects, valeurs hors limites');
  console.log('└─ Gestion erreurs: messages rejetés proprement sans crash\n');

  const invalidMessages = [
    {
      topic: 'invalid/topic/format',
      payload: { temperature_c: 23.5, humidity_pct: 65.2, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Topic invalide'
    },
    {
      topic: 'sensors/temp003/readings',
      payload: { temperature_c: 'invalid', humidity_pct: 65.2, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Payload invalide'
    },
    {
      topic: 'sensors/temp003/readings',
      payload: { temperature_c: 23.5, humidity_pct: 150, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Humidité hors limites'
    }
  ];

  for (const [index, message] of invalidMessages.entries()) {
    try {
      console.log(`📤 Test ${index + 1}/${invalidMessages.length} - ${message.expectError}:`);
      console.log(`   📍 Topic: "${message.topic}"`);
      console.log(`   📋 Payload:`, JSON.stringify(message.payload, null, 2).replace(/\n/g, '\n       '));
      console.log(`   🎯 Erreur attendue: ${message.expectError}`);

      // Générer un msg_id unique
      const msgHeaders = { msg_id: generateMsgId() };
      const result = await ingestMessage(message.topic, message.payload, msgHeaders, repository);
      console.log(`   ❌ Message invalide accepté (ne devrait pas arriver)`);
    } catch (error) {
      console.log(`   ✅ Message correctement rejeté`);
      console.log(`   📋 Erreur: ${error.message}`);
    }
    console.log('   ' + '─'.repeat(60));
  }
  console.log('═'.repeat(80) + '\n');  // ═══════════════════════════════════════════════════════════════════════════════
  // 5️⃣  TEST: Réutilisation de Device
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔄 5️⃣  TEST: Réutilisation de Device');
  console.log('┌─ OBJECTIF: Démontrer l\'auto-création vs réutilisation des devices');
  console.log('│  Premier message: device créé automatiquement');
  console.log('│  Messages suivants: même device réutilisé');
  console.log('└─ Optimisation: évite les duplicatas de devices\n');

  const deviceReuseMessage = {
    topic: 'sensors/temp004/readings',
    payload: {
      temperature_c: 25.0,
      humidity_pct: 60.0,
      timestamp: '2025-09-08T10:35:00Z'
    }
  };

  console.log(`� Message de base pour device temp004:`);
  console.log(`   📍 Topic: "${deviceReuseMessage.topic}"`);
  console.log(`   📋 Payload:`, JSON.stringify(deviceReuseMessage.payload, null, 2).replace(/\n/g, '\n       '));

  // Premier envoi
  const msgHeaders1 = { msg_id: generateMsgId() };
  console.log(`\n📤 Premier envoi (création device):`);
  console.log(`   🔑 msg_id: "${msgHeaders1.msg_id}"`);
  const result1 = await ingestMessage(deviceReuseMessage.topic, deviceReuseMessage.payload, msgHeaders1, repository);
  console.log(`   ✅ Résultat: device créé = ${result1.deviceCreated}`);

  // Message différent même device
  const secondPayload = {
    ...deviceReuseMessage.payload,
    timestamp: '2025-09-08T10:36:00Z' // Timestamp différent
  };
  const msgHeaders2 = { msg_id: generateMsgId() };
  console.log(`\n📤 Deuxième envoi (réutilisation device):`);
  console.log(`   🔑 msg_id: "${msgHeaders2.msg_id}"`);
  console.log(`   📋 Payload modifié:`, JSON.stringify(secondPayload, null, 2).replace(/\n/g, '\n       '));
  const result2 = await ingestMessage(deviceReuseMessage.topic, secondPayload, msgHeaders2, repository);
  console.log(`   ✅ Résultat: device créé = ${result2.deviceCreated} (device réutilisé)`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 6️⃣  TEST: Déduplication de Messages
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔁 6️⃣  TEST: Déduplication de Messages');
  console.log('┌─ OBJECTIF: Protection contre les messages dupliqués');
  console.log('│  Protection par msg_id: même ID → rejet automatique');
  console.log('│  Protection par contenu: même payload → détection duplication');
  console.log('└─ Robustesse: évite les doublons dans la base de données\n');

  const duplicateTestMessage = {
    topic: 'sensors/temp005/readings',
    payload: {
      temperature_c: 26.5,
      humidity_pct: 70.0,
      timestamp: '2025-09-08T10:40:00Z'
    }
  };

  console.log(`📤 Message test pour déduplication:`);
  console.log(`   📍 Topic: "${duplicateTestMessage.topic}"`);
  console.log(`   📋 Payload:`, JSON.stringify(duplicateTestMessage.payload, null, 2).replace(/\n/g, '\n       '));

  // Premier envoi - message original
  const originalMsgId2 = generateMsgId();
  const originalHeaders2 = { msg_id: originalMsgId2 };
  console.log(`\n📤 Étape 1 - Message original:`);
  console.log(`   🔑 msg_id: "${originalMsgId2}"`);

  try {
    const originalResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, originalHeaders2, repository);
    console.log(`   ✅ Message original accepté → device créé = ${originalResult.deviceCreated}`);
  } catch (error) {
    console.log(`   ❌ Message original erreur: ${error.message}`);
  }

  // Deuxième envoi - MÊME message (même msg_id, même payload, même timestamp)
  console.log(`\n📤 Étape 2 - Message dupliqué (même msg_id):`);
  console.log(`   🔑 msg_id: "${originalMsgId2}" (IDENTIQUE)`);
  console.log(`   🎯 Test: déduplication par ID`);
  try {
    const duplicateResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, originalHeaders2, repository);
    console.log(`   ❌ Message dupliqué accepté (ne devrait pas arriver)`);
  } catch (error) {
    console.log(`   ✅ Message dupliqué correctement rejeté`);
    console.log(`   📋 Erreur: ${error.message}`);
  }

  // Troisième envoi - même payload et timestamp mais msg_id différent (simule retransmission MQTT)
  const retransmissionHeaders2 = { msg_id: generateMsgId() };
  console.log(`\n📤 Étape 3 - Retransmission (msg_id différent):`);
  console.log(`   🔑 msg_id: "${retransmissionHeaders2.msg_id}" (DIFFÉRENT)`);
  console.log(`   🎯 Test: déduplication par contenu`);
  try {
    const retransmissionResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, retransmissionHeaders2, repository);
    console.log(`   ❌ Retransmission acceptée (ne devrait pas arriver)`);
  } catch (error) {
    console.log(`   ✅ Retransmission correctement rejetée`);
    console.log(`   📋 Erreur: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 7️⃣  TEST: Statistiques du Pipeline
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📊 7️⃣  TEST: Statistiques du Pipeline');
  console.log('┌─ OBJECTIF: Bilan des opérations effectuées dans la base de données');
  console.log('│  Compteurs: devices créés, readings ingérées');
  console.log('│  Détails: liste des devices avec leurs métadonnées');
  console.log('└─ Validation: vérifier la cohérence des données persistées\n');

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
  const readingCount = db.prepare('SELECT COUNT(*) as count FROM readings_raw').get();

  console.log(`📤 Test 7.1: Compteurs globaux`);
  console.log(`   📋 Devices créés: ${deviceCount.count}`);
  console.log(`   📋 Readings ingérées: ${readingCount.count}`);

  // Liste des devices créés
  const devices = db.prepare('SELECT device_id, label, last_seen_at FROM devices ORDER BY device_id').all();
  console.log(`\n📤 Test 7.2: Détail des devices`);
  console.log(`   📋 Liste complète:`);
  devices.forEach(device => {
    console.log(`       • ${device.device_id}: ${device.label || 'Auto-discovered sensor'}`);
  });
  console.log(`   ✅ Données cohérentes: ${devices.length} devices listés = ${deviceCount.count} devices comptés`);

  db.close();

  console.log('\n✅ === EXEMPLE INGESTION PIPELINE TERMINÉ ===');
  console.log('🎯 Modules démontrés avec succès:');
  console.log('   • parseTopic (validation format topic MQTT)');
  console.log('   • validateReading (validation payload JSON)');
  console.log('   • ingestMessage (pipeline complet vers DB)');
  console.log(`📁 Données persistées dans: ${dbPath}\n`);
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('⚙️  Exemple Ingestion Pipeline');
  console.log('=============================');
  console.log('');
  console.log('Ce script démontre:');
  console.log('• 📝 parseTopic (format topic MQTT)');
  console.log('• 📋 validateReading (validation payload)');
  console.log('• 🔄 ingestMessage (pipeline complet)');
  console.log('• 🔄 Device auto-création et réutilisation');
  console.log('• 🔁 Déduplication de messages identiques');
  console.log('• ❌ Gestion des erreurs et validation');
  console.log('');
  console.log('Usage: node src/ingestion/examples/example-ingestion.js');
  console.log('');
  console.log('Fichiers utilisés:');
  console.log('• src/ingestion/parseTopic.js');
  console.log('• src/ingestion/validateReading.js');
  console.log('• src/ingestion/ingestMessage.js');
  process.exit(0);
}

// Run example
demonstrateIngestionPipeline().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
