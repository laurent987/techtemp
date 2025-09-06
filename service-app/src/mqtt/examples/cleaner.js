#!/usr/bin/env node

/**
 * Cleaner - Supprime les messages retained
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = 'mqtt://test.mosquitto.org:1883';

console.log('🧹 Nettoyage des messages retained...');

async function cleanRetainedMessages() {
  const { publish, close } = createMqttClient({ url: BROKER_URL });

  // Pour supprimer un message retained, publier payload vide avec retain: true
  const topicsToClean = [
    'techtemp/demo/sensors/temperature',
    'techtemp/demo/sensors/humidity'
  ];

  for (const topic of topicsToClean) {
    console.log(`🗑️  Suppression retained sur: ${topic}`);
    await publish(topic, '', { retain: true }); // Payload vide = suppression
  }

  await close();
  console.log('✅ Nettoyage terminé');
}

cleanRetainedMessages();
