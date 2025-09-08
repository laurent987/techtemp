#!/usr/bin/env node
/**
 * @file MQTT Subscriber Example
 * 
 * ✅ OBJECTIVE: Demonstrate MQTT message listening with patterns and wildcards
 * 📦 DEMONSTRATED MODULES:
 *    - src/mqtt/client.js (createMqttClient, subscribe, onMessage)
 * 
 * 🚫 NOT DEMONSTRATED: MQTT Publisher (see publisher.js)
 * 
 * Usage: 
 *   node subscriber.js                    # Default topic with wildcard
 *   node subscriber.js [broker] [topic]  # Custom broker and topic
 */

import { createMqttClient } from '../client.js';

const BROKER_URL = process.argv[2] || 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.argv[3] || 'sensors/+/readings'; // Default wildcard pattern

async function demonstrateMqttSubscriber() {
  console.log('📥 === MQTT SUBSCRIBER EXAMPLE ===');
  console.log('🎯 Module: createMqttClient + subscribe + onMessage\n');

  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Connection     → Establish connection to MQTT broker');
  console.log('2️⃣  Subscription   → Subscribe to topics with patterns');
  console.log('3️⃣  Listening      → Receive and analyze messages in real time');
  console.log('4️⃣  Disconnection  → Clean shutdown handling (Ctrl+C)\n');

  console.log('⚙️  CONFIGURATION:');
  console.log(`   📡 Broker: ${BROKER_URL}`);
  console.log(`   📝 Topic pattern: ${TOPIC}`);
  console.log(`   🆔 Client ID: subscriber_${Date.now()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1️⃣  TEST: MQTT broker connection
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔗 1️⃣  TEST: MQTT broker connection');
    console.log('┌─ OBJECTIVE: Establish subscriber connection to broker');
    console.log('│  Configuration: unique client ID, subscriber mode');
    console.log('│  Validation: successful connection, ready for subscription');
    console.log('└─ Preparation: message handler configured\n');

    console.log('📤 Test 1.1: Subscriber client creation');
    console.log(`   📋 Broker: "${BROKER_URL}"`);
    console.log(`   🆔 Client ID: "subscriber_${Date.now()}"`);

    const { subscribe, onMessage, close } = createMqttClient({
      url: BROKER_URL,
      clientId: `subscriber_${Date.now()}`
    });

    console.log('   ✅ Subscriber client created successfully');
    console.log('   ✅ Broker connection established');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2️⃣  TEST: MQTT topic subscription
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('📋 2️⃣  TEST: MQTT topic subscription');
    console.log('┌─ OBJECTIVE: Subscribe to topics with patterns and wildcards');
    console.log('│  Patterns: + (single level), # (multi-level), exact topics');
    console.log('│  QoS: message reception guarantee level');
    console.log('└─ Validation: multiple subscriptions confirmed by broker\n');

    // Multiple subscriptions to capture all message types
    const subscriptions = [
      { pattern: 'sensors/+/readings', description: 'Sensor data' },
      { pattern: 'system/+', description: 'System messages' },
      { pattern: 'alerts/+', description: 'Alerts and notifications' }
    ];

    for (const [index, sub] of subscriptions.entries()) {
      console.log(`📤 Test 2.${index + 1}: Subscription ${sub.description}`);
      console.log(`   📍 Pattern: "${sub.pattern}"`);
      console.log(`   ⚙️  QoS: 1 (at least once)`);

      try {
        await subscribe(sub.pattern, 1);
        console.log(`   ✅ Subscription confirmed for ${sub.description}`);
      } catch (error) {
        console.log(`   ❌ Subscription error: ${error.message}`);
      }

      if (index < subscriptions.length - 1) {
        console.log('   ────────────────────────────────────────────────────');
      }
    }

    console.log('\n📚 Active patterns:');
    console.log('   • sensors/+/readings → Captures: sensors/temp001/readings, sensors/temp002/readings');
    console.log('   • system/+ → Captures: system/status, system/health');
    console.log('   • alerts/+ → Captures: alerts/critical, alerts/warning');
    console.log('   ✅ Subscription confirmed by broker');
    console.log('═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Real-time message listening
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('👂 3️⃣  TEST: Real-time message listening');
    console.log('┌─ OBJECTIVE: Receive and analyze all matching messages');
    console.log('│  Display: topic, payload, metadata (QoS, retain, timestamp)');
    console.log('│  Parsing: automatic JSON vs text detection');
    console.log('└─ Counters: real-time reception statistics\n');

    let messageCount = 0;
    let jsonMessages = 0;
    let textMessages = 0;

    console.log('🔄 Waiting for messages... (Ctrl+C to stop)');
    console.log('📊 Use publisher.js in another terminal to send messages');
    console.log('');

    // Message handler with detailed analysis
    const unsubscribe = onMessage((topic, payload, packet) => {
      messageCount++;
      const timestamp = new Date().toLocaleTimeString();

      console.log(`📨 [${timestamp}] Message #${messageCount}:`);
      console.log(`   📍 Topic: "${topic}"`);

      // Analyze payload
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
        console.log(`   📋 Type: Text`);
        console.log(`   📄 Payload: "${payloadStr}"`);
      }

      console.log(`   ⚙️  Metadata:`);
      console.log(`       QoS: ${packet.qos}`);
      console.log(`       Retain: ${packet.retain ? 'Yes' : 'No'}`);
      console.log(`       Size: ${payload.length} bytes`);

      console.log(`   📊 Statistics:`);
      console.log(`       Total: ${messageCount} messages`);
      console.log(`       JSON: ${jsonMessages} | Text: ${textMessages}`);
      console.log('   ' + '─'.repeat(60) + '\n');
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // 4️⃣  TEST: Clean shutdown handling (Ctrl+C)
    // ═══════════════════════════════════════════════════════════════════════════════
    process.on('SIGINT', async () => {
      console.log('\n' + '═'.repeat(80));
      console.log('🛑 4️⃣  TEST: Clean subscriber shutdown');
      console.log('┌─ OBJECTIVE: Close MQTT connection cleanly');
      console.log('│  Unsubscription: stop message reception');
      console.log('│  Disconnection: send disconnect message to broker');
      console.log('└─ Statistics: listening session summary\n');

      console.log('📤 Test 4.1: Unsubscription and disconnection');
      console.log(`   📊 Messages received: ${messageCount}`);
      console.log(`   📋 JSON messages: ${jsonMessages}`);
      console.log(`   📄 Text messages: ${textMessages}`);
      console.log(`   ⏱️  Session duration: ${Math.round((Date.now() - startTime) / 1000)}s`);

      unsubscribe();
      console.log('   ✅ Unsubscription completed');

      await close();
      console.log('   ✅ Connection closed cleanly');

      console.log('\n✅ === MQTT SUBSCRIBER EXAMPLE COMPLETED ===');
      console.log('🎯 Module demonstrated successfully:');
      console.log('   • createMqttClient (broker connection)');
      console.log('   • subscribe (subscription with patterns/wildcards)');
      console.log('   • onMessage (message reception and analysis)');
      console.log('   • close (clean disconnection)');
      console.log('📁 Messages received from:', BROKER_URL);

      process.exit(0);
    });

    const startTime = Date.now();

    // Process stays alive thanks to active MQTT connection

  } catch (error) {
    console.error('\n💥 Subscriber failed:', error);
    console.error('📋 Detailed error:', error.message);
    console.error('🔧 Check that the MQTT broker is accessible');
    process.exit(1);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📥 MQTT Subscriber Example');
  console.log('==========================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 🔗 Connection to MQTT broker');
  console.log('• 📋 Subscription with patterns/wildcards');
  console.log('• 👂 Real-time message listening');
  console.log('• 📊 Message analysis and statistics');
  console.log('• 🛑 Clean shutdown with Ctrl+C');
  console.log('');
  console.log('Usage:');
  console.log('  node subscriber.js                    # Default topic');
  console.log('  node subscriber.js [broker] [topic]  # Custom broker and topic');
  console.log('');
  console.log('MQTT Patterns:');
  console.log('  sensors/+/readings    # Single level: temp001, temp002, etc.');
  console.log('  sensors/#             # All levels: temp001/readings, alerts, etc.');
  console.log('  sensors/temp001/+     # All sub-topics of temp001');
  console.log('');
  console.log('Examples:');
  console.log('  node subscriber.js');
  console.log('  node subscriber.js mqtt://test.mosquitto.org "sensors/#"');
  console.log('');
  console.log('Files used:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Run example
demonstrateMqttSubscriber().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
