#!/usr/bin/env node
/**
 * @file MQTT Subscriber Example
 * 
 * ✅ OBJECTIF: Démontrer l'écoute de messages MQTT avec patterns et wildcards
 * 📦 MODULES DÉMONTRÉS:
 *    - src/mqtt/client.js (createMqttClient, subscribe, onMessage)
 * 
 * 🚫 PAS DÉMONTRÉ: Publisher MQTT (voir publisher.js)
 * 
 * Usage: 
 *   node subscriber.js                    # Topic par défaut avec wildcard
 *   node subscriber.js [broker] [topic]  # Broker et topic personnalisés
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'sensors/+/readings'; // Wildcard pattern par défaut

async function demonstrateMqttSubscriber() {
  console.log('📥 === EXEMPLE MQTT SUBSCRIBER ===');
  console.log('🎯 Module: createMqttClient + subscribe + onMessage\n');

  console.log('� APERÇU DES TESTS:');
  console.log('1️⃣  Connexion     → Établir connexion au broker MQTT');
  console.log('2️⃣  Abonnement    → S\'abonner aux topics avec patterns');
  console.log('3️⃣  Écoute        → Recevoir et analyser les messages en temps réel');
  console.log('4️⃣  Déconnexion   → Gestion propre de l\'arrêt (Ctrl+C)\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   📝 Topic pattern: ${TOPIC}`);
  console.log(`   🆔 Client ID: subscriber_${Date.now()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: Connexion au broker MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: Connexion au broker MQTT');
    console.log('┌─ OBJECTIF: Établir connexion subscriber au broker');
    console.log('│  Configuration: client ID unique, mode subscriber');
    console.log('│  Validation: connexion réussie, prêt pour abonnement');
    console.log('└─ Préparation: handler de messages configuré\n');

    console.log('📤 Test 1.1: Création du client subscriber');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "subscriber_${Date.now()}"`);

    const { subscribe, onMessage, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `subscriber_${Date.now()}`
    });

    console.log('   ✅ Client subscriber créé avec succès');
    console.log('   ✅ Connexion au broker établie');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2️⃣  TEST: Abonnement aux topics MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('📋 2️⃣  TEST: Abonnement aux topics MQTT');
    console.log('┌─ OBJECTIF: S\'abonner aux topics avec patterns et wildcards');
    console.log('│  Patterns: + (un niveau), # (multi-niveaux), topics exacts');
    console.log('│  QoS: niveau de garantie de réception des messages');
    console.log('└─ Validation: abonnements multiples confirmés par le broker\n');

    // Abonnements multiples pour capturer tous les types de messages
    const subscriptions = [
      { pattern: 'sensors/+/readings', description: 'Données capteurs' },
      { pattern: 'system/+', description: 'Messages système' },
      { pattern: 'alerts/+', description: 'Alertes et notifications' }
    ];

    for (const [index, sub] of subscriptions.entries()) {
      console.log(`📤 Test 2.${index + 1}: Abonnement ${sub.description}`);
      console.log(`   📍 Pattern: "${sub.pattern}"`);
      console.log(`   ⚙️  QoS: 1 (au moins une fois)`);

      try {
        await subscribe(sub.pattern, 1);
        console.log(`   ✅ Abonnement confirmé pour ${sub.description}`);
      } catch (error) {
        console.log(`   ❌ Erreur abonnement: ${error.message}`);
      }

      if (index < subscriptions.length - 1) {
        console.log('   ────────────────────────────────────────────────────');
      }
    }

    console.log('\n📚 Patterns actifs:');
    console.log('   • sensors/+/readings → Capture: sensors/temp001/readings, sensors/temp002/readings');
    console.log('   • system/+ → Capture: system/status, system/health');
    console.log('   • alerts/+ → Capture: alerts/critical, alerts/warning');
    console.log('   ✅ Abonnement confirmé par le broker');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Écoute et analyse des messages en temps réel
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('👂 3️⃣  TEST: Écoute des messages en temps réel');
    console.log('┌─ OBJECTIF: Recevoir et analyser tous les messages correspondants');
    console.log('│  Affichage: topic, payload, métadonnées (QoS, retain, timestamp)');
    console.log('│  Parsing: détection automatique JSON vs texte');
    console.log('└─ Compteurs: statistiques de réception en temps réel\n');

    let messageCount = 0;
    let jsonMessages = 0;
    let textMessages = 0;

    console.log('🔄 En attente de messages... (Ctrl+C pour arrêter)');
    console.log('📊 Utilisez publisher.js dans un autre terminal pour envoyer des messages');
    console.log('');

    // Handler de messages avec analyse détaillée
    const unsubscribe = onMessage((topic, payload, packet) => {
      messageCount++;
      const timestamp = new Date().toLocaleTimeString();

      console.log(`📨 [${timestamp}] Message #${messageCount}:`);
      console.log(`   📍 Topic: "${topic}"`);

      // Analyser le payload
      const payloadStr = payload.toString();
      let isJson = false;
      let parsedPayload = null;

      try {
        parsedPayload = JSON.parse(payloadStr);
        isJson = true;
        jsonMessages++;
        console.log(`   📋 Type: JSON`);
        console.log(`   📄 Payload:`, JSON.stringify(parsedPayload, null, 2).replace(/\n/g, '\n           '));
      } catch (e) {
        textMessages++;
        console.log(`   📋 Type: Texte`);
        console.log(`   📄 Payload: "${payloadStr}"`);
      }

      console.log(`   ⚙️  Métadonnées:`);
      console.log(`       QoS: ${packet.qos}`);
      console.log(`       Retain: ${packet.retain ? 'Oui' : 'Non'}`);
      console.log(`       Taille: ${payload.length} octets`);

      console.log(`   📊 Statistiques:`);
      console.log(`       Total: ${messageCount} messages`);
      console.log(`       JSON: ${jsonMessages} | Texte: ${textMessages}`);
      console.log('   ' + '─'.repeat(60) + '\n');
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // 4️⃣  TEST: Gestion propre de l'arrêt (Ctrl+C)
    // ═══════════════════════════════════════════════════════════════════════════════
    process.on('SIGINT', async () => {
      console.log('\n' + '═'.repeat(80));
      console.log('🛑 4️⃣  TEST: Arrêt propre du subscriber');
      console.log('┌─ OBJECTIF: Fermer la connexion MQTT proprement');
      console.log('│  Désabonnement: arrêter la réception de messages');
      console.log('│  Déconnexion: envoi disconnect message au broker');
      console.log('└─ Statistiques: bilan de la session d\'écoute\n');

      console.log('� Test 4.1: Désabonnement et déconnexion');
      console.log(`   📊 Messages reçus: ${messageCount}`);
      console.log(`   📋 Messages JSON: ${jsonMessages}`);
      console.log(`   📄 Messages texte: ${textMessages}`);
      console.log(`   ⏱️  Durée de la session: ${Math.round((Date.now() - startTime) / 1000)}s`);

      unsubscribe();
      console.log('   ✅ Désabonnement effectué');

      await close();
      console.log('   ✅ Connexion fermée proprement');

      console.log('\n✅ === EXEMPLE MQTT SUBSCRIBER TERMINÉ ===');
      console.log('🎯 Module démontré avec succès:');
      console.log('   • createMqttClient (connexion au broker)');
      console.log('   • subscribe (abonnement avec patterns/wildcards)');
      console.log('   • onMessage (réception et analyse de messages)');
      console.log('   • close (déconnexion propre)');
      console.log('📁 Messages reçus depuis:', BROKER_URL);

      process.exit(0);
    });

    const startTime = Date.now();

    // Le processus reste en vie grâce à la connexion MQTT active

  } catch (error) {
    console.error('\n💥 Subscriber failed:', error);
    console.error('📋 Erreur détaillée:', error.message);
    console.error('🔧 Vérifiez que le broker MQTT est accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📥 Exemple MQTT Subscriber');
  console.log('==========================');
  console.log('');
  console.log('Ce script démontre:');
  console.log('• 🔗 Connexion au broker MQTT');
  console.log('• 📋 Abonnement avec patterns/wildcards');
  console.log('• 👂 Écoute en temps réel de messages');
  console.log('• 📊 Analyse et statistiques des messages');
  console.log('• 🛑 Arrêt propre avec Ctrl+C');
  console.log('');
  console.log('Usage:');
  console.log('  node subscriber.js                    # Topic par défaut');
  console.log('  node subscriber.js [broker] [topic]  # Broker et topic personnalisés');
  console.log('');
  console.log('Patterns MQTT:');
  console.log('  sensors/+/readings    # Un seul niveau: temp001, temp002, etc.');
  console.log('  sensors/#             # Tous niveaux: temp001/readings, alerts, etc.');
  console.log('  sensors/temp001/+     # Tous sous-topics de temp001');
  console.log('');
  console.log('Exemples:');
  console.log('  node subscriber.js');
  console.log('  node subscriber.js mqtt://test.mosquitto.org "sensors/#"');
  console.log('');
  console.log('Fichiers utilisés:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttSubscriber().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
