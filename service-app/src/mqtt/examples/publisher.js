#!/usr/bin/env node
/**
 * @file MQTT Publisher Example
 * 
 * ✅ OBJECTIF: Démontrer l'envoi de messages MQTT avec différents QoS
 * 📦 MODULES DÉMONTRÉS:
 *    - src/mqtt/client.js (createMqttClient, publish)
 * 
 * 🚫 PAS DÉMONTRÉ: Subscriber MQTT (voir subscriber.js)
 * 
 * Usage: 
 *   node publisher.js                              # Mode démo
 *   node publisher.js [broker] [topic] [message]  # Message unique
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'techtemp/demo/sensors';
const MESSAGE = process.argv[4];

async function demonstrateMqttPublisher() {
  console.log('📤 === EXEMPLE MQTT PUBLISHER ===');
  console.log('🎯 Module: createMqttClient + publish\n');

  console.log('📖 APERÇU DES TESTS:');
  console.log('1️⃣  Connexion     → Établir connexion au broker MQTT');
  console.log('2️⃣  Publication   → Envoyer messages avec différents QoS');
  console.log('3️⃣  Déconnexion   → Fermeture propre de la connexion\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   📝 Topic: ${TOPIC}`);
  console.log(`   🆔 Client ID: publisher_${Date.now()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: Connexion au broker MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: Connexion au broker MQTT');
    console.log('┌─ OBJECTIF: Établir connexion sécurisée au broker');
    console.log('│  Configuration: client ID unique, options de connexion');
    console.log('│  Validation: connexion réussie sans erreur');
    console.log('└─ Préparation: prêt pour publication de messages\n');

    console.log('📤 Test 1.1: Création du client publisher');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "publisher_${Date.now()}"`);

    const { publish, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `publisher_${Date.now()}`
    });

    console.log('   ✅ Client publisher créé avec succès');
    console.log('   ✅ Connexion au broker établie');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2️⃣  TEST: Publication de messages MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('📤 2️⃣  TEST: Publication de messages MQTT');
    console.log('┌─ OBJECTIF: Envoyer différents types de messages avec QoS variés');
    console.log('│  QoS 0: Fire and forget (aucune garantie)');
    console.log('│  QoS 1: Au moins une fois (avec acknowledgment)');
    console.log('│  QoS 2: Exactement une fois (avec double handshake)');
    console.log('└─ Formats: JSON structuré + messages texte simples\n');

    if (MESSAGE) {
      // Mode message unique
      console.log('📤 Test 2.1: Message unique (mode argument)');
      console.log(`   📍 Topic: "${TOPIC}"`);
      console.log(`   📋 Message: "${MESSAGE}"`);
      console.log(`   ⚙️  Options: QoS 1, Retain false`);

      await publish(TOPIC, MESSAGE, { qos: 1, retain: false });
      console.log('   ✅ Message publié avec succès');

    } else {
      // Mode démonstration avec différents types de messages
      console.log('� Mode démo: Messages multiples avec différents QoS\n');

      const demoMessages = [
        {
          topic: 'sensors/temp001/readings',
          payload: JSON.stringify({
            temperature_c: 23.5,
            humidity_pct: 65.2,
            timestamp: new Date().toISOString()
          }),
          options: { qos: 1, retain: false },
          description: 'Données capteur (QoS 1)'
        },
        {
          topic: 'sensors/temp002/readings',
          payload: JSON.stringify({
            temperature_c: 22.1,
            humidity_pct: 58.7,
            timestamp: new Date().toISOString()
          }),
          options: { qos: 1, retain: false },
          description: 'Données capteur (QoS 1)'
        },
        {
          topic: 'system/status',
          payload: 'Publisher online',
          options: { qos: 0, retain: false },
          description: 'Status système (QoS 0)'
        },
        {
          topic: 'alerts/critical',
          payload: JSON.stringify({
            level: 'critical',
            message: 'Test critical alert',
            timestamp: new Date().toISOString()
          }),
          options: { qos: 2, retain: false },
          description: 'Alerte critique (QoS 2)'
        }
      ];

      for (let i = 0; i < demoMessages.length; i++) {
        const { topic, payload, options, description } = demoMessages[i];

        console.log(`📤 Test 2.${i + 1}: ${description}`);
        console.log(`   📍 Topic: "${topic}"`);
        console.log(`   📋 Payload:`, typeof payload === 'string' ? `"${payload}"` : JSON.stringify(JSON.parse(payload), null, 2).replace(/\n/g, '\n           '));
        console.log(`   ⚙️  Options: QoS ${options.qos}, Retain ${options.retain}`);

        await publish(topic, payload, options);
        console.log('   ✅ Message publié avec succès');

        if (i < demoMessages.length - 1) {
          console.log('   ⏱️  Attente 2 secondes...\n');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    console.log('\n✅ Tous les messages publiés avec succès');
    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Déconnexion propre du broker
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔚 3️⃣  TEST: Déconnexion propre du broker');
    console.log('┌─ OBJECTIF: Fermer la connexion MQTT proprement');
    console.log('│  Déconnexion: envoi disconnect message au broker');
    console.log('│  Nettoyage: libération des ressources réseau');
    console.log('└─ Validation: aucune erreur de déconnexion\n');

    console.log('📤 Test 3.1: Fermeture de la connexion');
    await close();
    console.log('   ✅ Connexion fermée proprement');
    console.log('   ✅ Ressources libérées');

    console.log('\n✅ === EXEMPLE MQTT PUBLISHER TERMINÉ ===');
    console.log('🎯 Module démontré avec succès:');
    console.log('   • createMqttClient (connexion au broker)');
    console.log('   • publish (envoi de messages avec QoS)');
    console.log('   • close (déconnexion propre)');
    console.log('📁 Messages envoyés vers:', BROKER_URL);

  } catch (error) {
    console.error('\n💥 Publisher failed:', error);
    console.error('📋 Erreur détaillée:', error.message);
    console.error('🔧 Vérifiez que le broker MQTT est accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📤 Exemple MQTT Publisher');
  console.log('=========================');
  console.log('');
  console.log('Ce script démontre:');
  console.log('• 🔗 Connexion au broker MQTT');
  console.log('• 📤 Publication de messages avec différents QoS');
  console.log('• 📋 Formats JSON et texte');
  console.log('• 🔚 Déconnexion propre');
  console.log('');
  console.log('Usage:');
  console.log('  node publisher.js                              # Mode démo');
  console.log('  node publisher.js [broker] [topic] [message]  # Message unique');
  console.log('');
  console.log('Exemples:');
  console.log('  node publisher.js');
  console.log('  node publisher.js mqtt://test.mosquitto.org sensors/temp "Hello MQTT"');
  console.log('');
  console.log('Fichiers utilisés:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttPublisher().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
