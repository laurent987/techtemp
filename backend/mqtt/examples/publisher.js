#!/usr/bin/env node
/**
 * @file MQTT Publisher Example
 * 
 *    console.log('📤 2️⃣  TEST: MQTT message publishing');
    console.log('┌─ OBJECTIVE: Send different types of messages with varied QoS');
    console.log('│  QoS 0: Fire and forget (no guarantee)');
    console.log('│  QoS 1: At least once (with acknowledgment)');
    console.log('│  QoS 2: Exactly once (with double handshake)');
    console.log('└─ Formats: Structured JSON + simple text messages\n');

    if (MESSAGE) {
      // Single message mode
      console.log('📤 Test 2.1: Single message (argument mode)');
      console.log(`   📍 Topic: "${TOPIC}"`);
      console.log(`   📋 Message: "${MESSAGE}"`);
      console.log(`   ⚙️  Options: QoS 1, Retain false`);

      await publish(TOPIC, MESSAGE, { qos: 1, retain: false });
      console.log('   ✅ Message published successfully');

    } else {
      // Demo mode with different message types
      console.log('🎭 Demo mode: Multiple messages with different QoS\n');trate MQTT message sending with different QoS
 * 📦 DEMONSTRATED MODULES:
 *    - src/mqtt/client.js (createMqttClient, publish)
 * 
 * 🚫 NOT DEMONSTRATED: MQTT Subscriber (see subscriber.js)
 * 
 * Usage: 
 *   node publisher.js                              # Demo mode
 *   node publisher.js [broker] [topic] [message]  # Single message
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'techtemp/demo/sensors';
const MESSAGE = process.argv[4];

async function demonstrateMqttPublisher() {
  console.log('📤 === MQTT PUBLISHER EXAMPLE ===');
  console.log('🎯 Module: createMqttClient + publish\n');

  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Connection     → Establish connection to MQTT broker');
  console.log('2️⃣  Publishing     → Send messages with different QoS');
  console.log('3️⃣  Disconnection  → Clean connection closure\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   📝 Topic: ${TOPIC}`);
  console.log(`   🆔 Client ID: publisher_${Date.now()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: Connexion au broker MQTT
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: MQTT broker connection');
    console.log('┌─ OBJECTIVE: Establish secure connection to broker');
    console.log('│  Configuration: unique client ID, connection options');
    console.log('│  Validation: successful connection without error');
    console.log('└─ Preparation: ready for message publishing\n');

    console.log('📤 Test 1.1: Publisher client creation');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "publisher_${Date.now()}"`);

    const { publish, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `publisher_${Date.now()}`
    });

    console.log('   ✅ Publisher client created successfully');
    console.log('   ✅ Broker connection established');
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
          topic: 'home/home-001/sensors/temp001/reading',
          payload: JSON.stringify({
            temperature_c: 23.5,
            humidity_pct: 65.2,
            ts: Date.now()
          }),
          options: { qos: 1, retain: false },
          description: 'Sensor data (QoS 1)'
        },
        {
          topic: 'home/home-001/sensors/temp002/reading',
          payload: JSON.stringify({
            temperature_c: 22.1,
            humidity_pct: 58.7,
            ts: Date.now() + 1000 // Slightly different timestamp
          }),
          options: { qos: 1, retain: false },
          description: 'Sensor data (QoS 1)'
        },
        {
          topic: 'system/status',
          payload: 'Publisher online',
          options: { qos: 0, retain: false },
          description: 'System status (QoS 0)'
        },
        {
          topic: 'alerts/critical',
          payload: JSON.stringify({
            level: 'critical',
            message: 'Test critical alert',
            ts: Date.now() + 2000
          }),
          options: { qos: 2, retain: false },
          description: 'Critical alert (QoS 2)'
        }
      ];

      for (let i = 0; i < demoMessages.length; i++) {
        const { topic, payload, options, description } = demoMessages[i];

        console.log(`📤 Test 2.${i + 1}: ${description}`);
        console.log(`   📍 Topic: "${topic}"`);
        console.log(`   📋 Payload:`, typeof payload === 'string' ? `"${payload}"` : JSON.stringify(JSON.parse(payload), null, 2).replace(/\n/g, '\n           '));
        console.log(`   ⚙️  Options: QoS ${options.qos}, Retain ${options.retain}`);

        await publish(topic, payload, options);
        console.log('   ✅ Message published successfully');

        if (i < demoMessages.length - 1) {
          console.log('   ⏱️  Waiting 2 seconds...\n');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    console.log('\n✅ All messages published successfully');
    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Clean broker disconnection
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔚 3️⃣  TEST: Clean broker disconnection');
    console.log('┌─ OBJECTIVE: Close MQTT connection cleanly');
    console.log('│  Disconnection: send disconnect message to broker');
    console.log('│  Cleanup: release network resources');
    console.log('└─ Validation: no disconnection error\n');

    console.log('📤 Test 3.1: Connection closure');
    await close();
    console.log('   ✅ Connection closed cleanly');
    console.log('   ✅ Resources released');

    console.log('\n✅ === MQTT PUBLISHER EXAMPLE COMPLETED ===');
    console.log('🎯 Module demonstrated successfully:');
    console.log('   • createMqttClient (broker connection)');
    console.log('   • publish (message sending with QoS)');
    console.log('   • close (clean disconnection)');
    console.log('📁 Messages sent to:', BROKER_URL);

  } catch (error) {
    console.error('\n💥 Publisher failed:', error);
    console.error('📋 Detailed error:', error.message);
    console.error('🔧 Check that the MQTT broker is accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📤 MQTT Publisher Example');
  console.log('=========================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 🔗 Connection to MQTT broker');
  console.log('• 📤 Publishing messages with different QoS');
  console.log('• 📋 JSON and text formats');
  console.log('• 🔚 Clean disconnection');
  console.log('');
  console.log('Usage:');
  console.log('  node publisher.js                              # Demo mode');
  console.log('  node publisher.js [broker] [topic] [message]  # Single message');
  console.log('');
  console.log('Examples:');
  console.log('  node publisher.js');
  console.log('  node publisher.js mqtt://test.mosquitto.org sensors/temp "Hello MQTT"');
  console.log('');
  console.log('Files used:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttPublisher().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
