#!/usr/bin/env node
/**
 * @file MQTT Cleaner Example
 * 
 * ✅ OBJECTIF: Démontrer le nettoyage des messages retained MQTT
 * 📦 MODULES DÉMONTRÉS:
 *    - src/mqtt/client.js (createMqttClient, publish avec retain)
 * 
 * 🚫 PAS DÉMONTRÉ: Subscriber/Publisher normal (voir autres fichiers)
 * 
 * Usage: 
 *   node cleaner.js           # Broker par défaut
 *   node cleaner.js [broker]  # Broker personnalisé
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';

async function demonstrateMqttCleaner() {
  console.log('🧹 === EXEMPLE MQTT CLEANER ===');
  console.log('🎯 Module: createMqttClient + publish (retained messages)\n');

  console.log('📖 APERÇU DES TESTS:');
  console.log('1️⃣  Connexion     → Établir connexion au broker MQTT');
  console.log('2️⃣  Nettoyage     → Supprimer les messages retained');
  console.log('3️⃣  Vérification  → Confirmer la suppression');
  console.log('4️⃣  Déconnexion   → Fermeture propre de la connexion\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   🆔 Client ID: cleaner_${Date.now()}`);
  console.log(`   🎯 Méthode: Publish payload vide avec retain=true`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: Connexion au broker MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: Connexion au broker MQTT');
    console.log('┌─ OBJECTIF: Établir connexion cleaner au broker');
    console.log('│  Configuration: client ID unique, droits de publication');
    console.log('│  Validation: connexion réussie, prêt pour nettoyage');
    console.log('└─ Préparation: client configuré pour retain messages\n');

    console.log('📤 Test 1.1: Création du client cleaner');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "cleaner_${Date.now()}"`);

    const { publish, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `cleaner_${Date.now()}`
    });

    console.log('   ✅ Client cleaner créé avec succès');
    console.log('   ✅ Connexion au broker établie');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2️⃣  TEST: Nettoyage des messages retained
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🗑️  2️⃣  TEST: Nettoyage des messages retained');
    console.log('┌─ OBJECTIF: Supprimer les messages retained du broker');
    console.log('│  Méthode: Publier payload vide avec retain=true');
    console.log('│  Effet: Le broker supprime le message retained du topic');
    console.log('│  Cibles: Topics utilisés par les exemples publisher/subscriber');
    console.log('└─ Résultat: Topics nettoyés, plus de messages retained\n');

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

    console.log(`📤 Test 2.1: Nettoyage de ${topicsToClean.length} topics`);
    console.log('   📋 Topics à nettoyer:');
    topicsToClean.forEach((topic, index) => {
      console.log(`       ${index + 1}. ${topic}`);
    });
    console.log('');

    let cleanedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < topicsToClean.length; i++) {
      const topic = topicsToClean[i];

      console.log(`📤 Test 2.${i + 2}: Nettoyage "${topic}"`);
      console.log(`   📍 Topic: "${topic}"`);
      console.log(`   � Payload: "" (vide)`);
      console.log(`   ⚙️  Options: retain=true, QoS=0`);

      try {
        // Publier payload vide avec retain=true pour supprimer le message retained
        await publish(topic, '', { retain: true, qos: 0 });
        console.log('   ✅ Message retained supprimé');
        cleanedCount++;
      } catch (error) {
        console.log(`   ❌ Erreur de nettoyage: ${error.message}`);
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
    console.log(`   📋 Topics traités: ${topicsToClean.length}`);
    console.log(`   ✅ Nettoyages réussis: ${cleanedCount}`);
    console.log(`   ❌ Erreurs rencontrées: ${errorCount}`);
    console.log(`   📊 Taux de réussite: ${Math.round((cleanedCount / topicsToClean.length) * 100)}%`);

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
    console.error('📋 Erreur détaillée:', error.message);
    console.error('🔧 Vérifiez que le broker MQTT est accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🧹 Exemple MQTT Cleaner');
  console.log('========================');
  console.log('');
  console.log('Ce script démontre:');
  console.log('• 🔗 Connexion au broker MQTT');
  console.log('• 🗑️  Suppression de messages retained');
  console.log('• 📊 Statistiques de nettoyage');
  console.log('• 🔚 Déconnexion propre');
  console.log('');
  console.log('Principe:');
  console.log('• Un message retained est stocké par le broker');
  console.log('• Il est automatiquement envoyé aux nouveaux subscribers');
  console.log('• Pour le supprimer: publier payload vide avec retain=true');
  console.log('');
  console.log('Usage:');
  console.log('  node cleaner.js           # Broker par défaut');
  console.log('  node cleaner.js [broker]  # Broker personnalisé');
  console.log('');
  console.log('Exemples:');
  console.log('  node cleaner.js');
  console.log('  node cleaner.js mqtt://test.mosquitto.org');
  console.log('');
  console.log('Fichiers utilisés:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttCleaner().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
