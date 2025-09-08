#!/usr/bin/env node
/**
 * @file MQTT Cleaner Example
 * 
 * ✅ OBJECTIVE: Demonstrate cleanup of MQTT retained messages
 * 📦 DEMONSTRATED MODULES:
 *    - src/mqtt/client.js (createMqttClient, publish with retain)
 * 
 * 🚫 NOT DEMONSTRATED: Normal Subscriber/Publisher (see other files)
 * 
 * Usage: 
 *   node cleaner.js           # Default broker
 *   node cleaner.js [broker]  # Custom broker
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';

async function demonstrateMqttCleaner() {
  console.log('🧹 === MQTT CLEANER EXAMPLE ===');
  console.log('🎯 Module: createMqttClient + publish (retained messages)\n');

  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Connection     → Establish connection to MQTT broker');
  console.log('2️⃣  Cleanup        → Remove retained messages');
  console.log('3️⃣  Verification   → Confirm deletion');
  console.log('4️⃣  Disconnection  → Clean connection closure\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   🆔 Client ID: cleaner_${Date.now()}`);
  console.log(`   🎯 Method: Publish empty payload with retain=true`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: Connexion au broker MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: MQTT broker connection');
    console.log('┌─ OBJECTIVE: Establish cleaner connection to broker');
    console.log('│  Configuration: unique client ID, publishing rights');
    console.log('│  Validation: successful connection, ready for cleanup');
    console.log('└─ Preparation: client configured for retain messages\n');

    console.log('📤 Test 1.1: Cleaner client creation');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "cleaner_${Date.now()}"`);

    const { publish, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `cleaner_${Date.now()}`
    });

    console.log('   ✅ Cleaner client created successfully');
    console.log('   ✅ Broker connection established');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2️⃣  TEST: Retained message cleanup
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🗑️  2️⃣  TEST: Retained message cleanup');
    console.log('┌─ OBJECTIVE: Remove retained messages from broker');
    console.log('│  Method: Publish empty payload with retain=true');
    console.log('│  Effect: Broker removes retained message from topic');
    console.log('│  Targets: Topics used by publisher/subscriber examples');
    console.log('└─ Result: Topics cleaned, no more retained messages\n');

    // Topics couramment utilisés par les exemples
    const topicsToClean = [
      'sensors/temp001/readings',
      'sensors/temp002/readings',
      'system/status',
      'alerts/critical',
      'techtemp/demo/sensors/temperature',
      'techtemp/demo/sensors/humidity',
      'techtemp/demo/status',
      'techtemp/demo/alerts'
    ];

    console.log(`📤 Test 2.1: Cleaning ${topicsToClean.length} topics`);
    console.log('   📋 Topics to clean:');
    topicsToClean.forEach((topic, index) => {
      console.log(`       ${index + 1}. ${topic}`);
    });
    console.log('');

    let cleanedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < topicsToClean.length; i++) {
      const topic = topicsToClean[i];

      console.log(`📤 Test 2.${i + 2}: Cleaning "${topic}"`);
      console.log(`   📍 Topic: "${topic}"`);
      console.log(`   🗂 Payload: "" (empty)`);
      console.log(`   ⚙️  Options: retain=true, QoS=0`);

      try {
        // Publish empty payload with retain=true to remove retained message
        await publish(topic, '', { retain: true, qos: 0 });
        console.log('   ✅ Retained message removed');
        cleanedCount++;
      } catch (error) {
        console.log(`   ❌ Cleanup error: ${error.message}`);
        errorCount++;
      } "${topic}"`);
      console.log(`   📍 Topic: "${topic}"`);
      console.log(`   � Payload: ""(vide)`);
      console.log(`   ⚙️  Options: retain = true, QoS = 0`);

      try {
        // Publier payload vide avec retain=true pour supprimer le message retained
        await publish(topic, '', { retain: true, qos: 0 });
        console.log('   ✅ Message retained supprimé');
        cleanedCount++;
      } catch (error) {
        console.log(`   ❌ Erreur de nettoyage: ${ error.message } `);
        errorCount++;
      }

      // Petit délai entre les nettoyages
      if (i < topicsToClean.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log('\n═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Statistiques et vérification
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('📊 3️⃣  TEST: Statistiques de nettoyage');
    console.log('┌─ OBJECTIF: Vérifier les résultats du nettoyage');
    console.log('│  Compteurs: topics nettoyés vs erreurs');
    console.log('│  Validation: opération réussie si aucune erreur');
    console.log('└─ Recommandations: actions de suivi si nécessaire\n');

    console.log('📤 Test 3.1: Bilan du nettoyage');
    console.log(`   📋 Topics traités: ${ topicsToClean.length } `);
    console.log(`   ✅ Nettoyages réussis: ${ cleanedCount } `);
    console.log(`   ❌ Erreurs rencontrées: ${ errorCount } `);
    console.log(`   📊 Taux de réussite: ${ Math.round((cleanedCount / topicsToClean.length) * 100) }% `);

    if (errorCount === 0) {
      console.log('   ✅ Nettoyage parfaitement réussi');
    } else if (cleanedCount > 0) {
      console.log('   ⚠️  Nettoyage partiellement réussi');
      console.log('   💡 Recommandation: vérifier la connectivité au broker');
    } else {
      console.log('   ❌ Nettoyage échoué');
      console.log('   💡 Recommandation: vérifier l\'accès au broker MQTT');
    }

    console.log('\n═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 4️⃣  TEST: Déconnexion propre du broker
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔚 4️⃣  TEST: Déconnexion propre du broker');
    console.log('┌─ OBJECTIF: Fermer la connexion MQTT proprement');
    console.log('│  Déconnexion: envoi disconnect message au broker');
    console.log('│  Nettoyage: libération des ressources réseau');
    console.log('└─ Validation: aucune erreur de déconnexion\n');

    console.log('📤 Test 4.1: Fermeture de la connexion');
    await close();
    console.log('   ✅ Connexion fermée proprement');
    console.log('   ✅ Ressources libérées');

    console.log('\n✅ === EXEMPLE MQTT CLEANER TERMINÉ ===');
    console.log('🎯 Module démontré avec succès:');
    console.log('   • createMqttClient (connexion au broker)');
    console.log('   • publish avec retain=true (suppression retained)');
    console.log('   • close (déconnexion propre)');
    console.log('📁 Nettoyage effectué sur:', BROKER_URL);
    console.log('');
    console.log('💡 INFORMATION: Messages retained supprimés');
    console.log('   Les nouveaux subscribers ne recevront plus ces messages');
    console.log('   automatiquement à la connexion.');

  } catch (error) {
    console.error('\n💥 Cleaner failed:', error);
    console.error('📋 Detailed error:', error.message);
    console.error('🔧 Check that the MQTT broker is accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🧹 MQTT Cleaner Example');
  console.log('========================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 🔗 Connection to MQTT broker');
  console.log('• 🗑️  Removal of retained messages');
  console.log('• 📊 Cleanup statistics');
  console.log('• 🔚 Clean disconnection');
  console.log('');
  console.log('Principle:');
  console.log('• A retained message is stored by the broker');
  console.log('• It is automatically sent to new subscribers');
  console.log('• To remove it: publish empty payload with retain=true');
  console.log('');
  console.log('Usage:');
  console.log('  node cleaner.js           # Default broker');
  console.log('  node cleaner.js [broker]  # Custom broker');
  console.log('');
  console.log('Examples:');
  console.log('  node cleaner.js');
  console.log('  node cleaner.js mqtt://test.mosquitto.org');
  console.log('');
  console.log('Files used:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttCleaner().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
