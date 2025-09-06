#!/usr/bin/env node

/**
 * MQTT Subscriber - Écoute les messages sur un topic
 * Usage: node subscriber.js [broker-url] [topic]
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'techtemp/demo/#'; // Wildcard pour tous les sous-topics

console.log('👂 MQTT Subscriber démarré');
console.log('📡 Broker:', BROKER_URL);
console.log('📝 Topic pattern:', TOPIC);
console.log('🔄 En attente de messages... (Ctrl+C pour arrêter)');
console.log('---');

async function startSubscriber() {
  try {
    // Créer le client subscriber
    const { subscribe, onMessage, close } = createMqttClient({
      url: BROKER_URL,
      // Identifier unique pour le subscriber
      clientId: `subscriber_${Date.now()}`
    });

    console.log('✅ Client subscriber connecté');

    let messageCount = 0;

    // Écouter tous les messages
    const unsubscribe = onMessage((topic, payload, packet) => {
      messageCount++;
      const timestamp = new Date().toLocaleTimeString();

      console.log(`\n📨 [${timestamp}] Message #${messageCount}:`);
      console.log(`   📍 Topic: ${topic}`);
      console.log(`   📄 Payload: ${payload.toString()}`);
      console.log(`   🔧 QoS: ${packet.qos}`);
      console.log(`   🔄 Retain: ${packet.retain ? 'Yes' : 'No'}`);
    });

    // S'abonner au topic pattern
    await subscribe(TOPIC, 1); // QoS 1
    console.log(`✅ Abonné au topic pattern: ${TOPIC}`);

    // Gestion propre de l'arrêt
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Arrêt du subscriber...');
      console.log(`📊 Total messages reçus: ${messageCount}`);
      unsubscribe();
      await close();
      console.log('✅ Connexion fermée proprement');
      process.exit(0);
    });

    // Garder le script en vie
    setInterval(() => {
      // Heartbeat silencieux
    }, 1000);

  } catch (error) {
    console.error('❌ Erreur subscriber:', error.message);
    process.exit(1);
  }
}

startSubscriber();
