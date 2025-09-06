#!/usr/bin/env node

/**
 * MQTT Publisher - Envoie des messages sur un topic
 * Usage: node publisher.js [broker-url] [topic] [message]
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'techtemp/demo/sensors';
const MESSAGE = process.argv[4];

console.log('📤 MQTT Publisher démarré');
console.log('📡 Broker:', BROKER_URL);
console.log('📝 Topic:', TOPIC);
console.log('---');

async function startPublisher() {
  try {
    // Créer le client publisher
    const { publish, close } = createMqttClient({
      url: BROKER_URL,
      // Identifier unique pour le publisher
      clientId: `publisher_${Date.now()}`
    });

    console.log('✅ Client publisher connecté');

    if (MESSAGE) {
      // Mode message unique
      console.log(`📤 Publication: "${MESSAGE}"`);
      await publish(TOPIC, MESSAGE, { qos: 1, retain: false });
      console.log('✅ Message publié');
    } else {
      // Mode démonstration avec plusieurs messages
      console.log('🔄 Mode démo - Publication de messages de test...');

      const demoMessages = [
        {
          topic: 'techtemp/demo/sensors/temperature',
          payload: JSON.stringify({
            sensor: 'DHT22',
            temperature: 23.5,
            unit: '°C',
            timestamp: new Date().toISOString()
          }),
          options: { qos: 1, retain: false }
        },
        {
          topic: 'techtemp/demo/sensors/humidity',
          payload: JSON.stringify({
            sensor: 'DHT22',
            humidity: 65.2,
            unit: '%',
            timestamp: new Date().toISOString()
          }),
          options: { qos: 1, retain: false }
        },
        {
          topic: 'techtemp/demo/status',
          payload: 'Publisher online',
          options: { qos: 0, retain: false }
        },
        {
          topic: 'techtemp/demo/alerts',
          payload: JSON.stringify({
            level: 'info',
            message: 'Test alert from publisher',
            timestamp: new Date().toISOString()
          }),
          options: { qos: 2, retain: false }
        }
      ];

      for (let i = 0; i < demoMessages.length; i++) {
        const { topic, payload, options } = demoMessages[i];
        console.log(`📤 [${i + 1}/${demoMessages.length}] Publication sur ${topic}...`);
        console.log(`   QoS: ${options.qos}, Retain: ${options.retain}`);

        await publish(topic, payload, options);
        console.log('   ✅ Publié');

        // Délai entre messages
        if (i < demoMessages.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log('\n🎉 Tous les messages de démo publiés !');
    }

    // Fermer la connexion
    await close();
    console.log('✅ Connexion fermée proprement');

  } catch (error) {
    console.error('❌ Erreur publisher:', error.message);
    process.exit(1);
  }
}

startPublisher();
