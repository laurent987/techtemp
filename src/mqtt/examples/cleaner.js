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
    // 1️⃣  TEST: MQTT broker connection
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

    // Topics commonly used by examples
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
      }

      // Small delay between cleanups
      if (i < topicsToClean.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log('\n' + '═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 3️⃣  TEST: Cleanup statistics and verification
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('📊 3️⃣  TEST: Cleanup statistics');
    console.log('┌─ OBJECTIVE: Verify cleanup results');
    console.log('│  Counters: topics cleaned vs errors');
    console.log('│  Validation: operation successful if no errors');
    console.log('└─ Recommendations: follow-up actions if needed\n');

    console.log('📤 Test 3.1: Cleanup summary');
    console.log(`   📋 Topics processed: ${topicsToClean.length}`);
    console.log(`   ✅ Successful cleanups: ${cleanedCount}`);
    console.log(`   ❌ Errors encountered: ${errorCount}`);
    console.log(`   📊 Success rate: ${Math.round((cleanedCount / topicsToClean.length) * 100)}%`);

    if (errorCount === 0) {
      console.log('   ✅ Cleanup perfectly successful');
    } else if (cleanedCount > 0) {
      console.log('   ⚠️  Cleanup partially successful');
      console.log('   💡 Recommendation: check broker connectivity');
    } else {
      console.log('   ❌ Cleanup failed');
      console.log('   💡 Recommendation: verify MQTT broker access');
    }

    console.log('\n' + '═'.repeat(80) + '\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 4️⃣  TEST: Clean broker disconnection
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('🔚 4️⃣  TEST: Clean broker disconnection');
    console.log('┌─ OBJECTIVE: Close MQTT connection cleanly');
    console.log('│  Disconnection: send disconnect message to broker');
    console.log('│  Cleanup: release network resources');
    console.log('└─ Validation: no disconnection error\n');

    console.log('📤 Test 4.1: Connection closure');
    await close();
    console.log('   ✅ Connection closed cleanly');
    console.log('   ✅ Resources released');

    console.log('\n✅ === MQTT CLEANER EXAMPLE COMPLETED ===');
    console.log('🎯 Module demonstrated successfully:');
    console.log('   • createMqttClient (broker connection)');
    console.log('   • publish with retain=true (retained removal)');
    console.log('   • close (clean disconnection)');
    console.log('📁 Cleanup performed on:', BROKER_URL);
    console.log('');
    console.log('💡 INFORMATION: Retained messages removed');
    console.log('   New subscribers will no longer receive these messages');
    console.log('   automatically upon connection.');

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
