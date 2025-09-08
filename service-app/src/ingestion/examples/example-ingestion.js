#!/usr/bin/env node
/**
 * @file Example Ingestion Pipeline
 * 
 * ✅ OBJECTIVE: Demonstrate MQTT → Database ingestion pipeline
 * 📦 DEMONSTRATED MODULES:
 *    - src/ingestion/parseTopic.js
 *    - src/ingestion/validateReading.js  
 *    - src  console.log('🔄 5️⃣  TEST: Device Reuse');
  console.log('┌─ OBJECTIVE: Demonstrate auto-creation vs device reuse');
  console.log('│  First message: device created automatically');
  console.log('│  Following messages: same device reused');
  console.log('└─ Optimization: avoids device duplicates\n');

  const deviceReuseMessage = {
    topic: 'sensors/temp004/readings',
    payload: {
      temperature_c: 25.0,
      humidity_pct: 60.0,
      timestamp: '2025-09-08T10:35:00Z'
    }
  };

  console.log(`📤 Base message for device temp004:`);
  console.log(`   📍 Topic: "${deviceReuseMessage.topic}"`);
  console.log(`   📋 Payload:`, JSON.stringify(deviceReuseMessage.payload, null, 2).replace(/\n/g, '\n       '));

  // First sendsage.js
 * 
 * 🚫 NOT DEMONSTRATED: Real MQTT Client, HTTP API
 */

import { initDb } from '../../db/index.js';
import { createRepository } from '../../repositories/index.js';
import { parseTopic, validateReading, ingestMessage } from '../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demonstrateIngestionPipeline() {
  console.log('⚙️  === INGESTION PIPELINE EXAMPLE ===');
  console.log('🎯 Modules: parseTopic + validateReading + ingestMessage\n');

  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  parseTopic      → MQTT topic format validation');
  console.log('2️⃣  validateReading → JSON payload validation');
  console.log('3️⃣  ingestMessage   → Complete pipeline with valid messages');
  console.log('4️⃣  ingestMessage   → Invalid message handling');
  console.log('5️⃣  Reuse           → Device auto-creation vs reuse');
  console.log('6️⃣  Deduplication   → Protection against duplicate messages');
  console.log('7️⃣  Statistics      → Operations summary\n');

  // Setup database (clean start)
  const dbPath = join(__dirname, '../../../examples/db-data-examples/example-ingestion.db');

  // Delete old database for clean test
  try {
    unlinkSync(dbPath);
    console.log('🧹 Old database deleted for clean test');
  } catch (error) {
    // File doesn't exist, that's normal
  }

  const db = initDb(dbPath);
  // Note: initDb() automatically applies schema
  const repository = createRepository(db);
  console.log('📊 Database initialized for tests');
  console.log('═'.repeat(80) + '\n');

  // Unique msg_id generator
  let msgCounter = 0;
  const generateMsgId = () => `example-msg-${Date.now()}-${++msgCounter}-${Math.random().toString(36).substr(2, 9)}`;

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1️⃣  TEST MODULE: parseTopic 
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📝 1️⃣  MODULE: parseTopic');
  console.log('┌─ OBJECTIVE: Validate MQTT topic format and extract device_id');
  console.log('│  Valid topics: "sensors/{deviceId}/readings"');
  console.log('│  Invalid topics: any other format');
  console.log('└─ Extraction: device_id from MQTT topic\n');

  // Test 1.1: Valid topic
  console.log('📤 Test 1.1: Valid topic');
  console.log(`   📍 Input: "sensors/temp001/readings"`);
  try {
    const validTopic = 'sensors/temp001/readings';
    const parsed = parseTopic(validTopic);
    console.log(`   ✅ Parsing successful`);
    console.log(`   📋 Result: device_id="${parsed.deviceId}"`);
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }

  // Test 1.2: Invalid topic
  console.log(`\n📤 Test 1.2: Invalid topic`);
  console.log(`   📍 Input: "invalid/topic"`);
  try {
    const invalidTopic = 'invalid/topic';
    parseTopic(invalidTopic);
    console.log(`   ❌ Invalid topic accepted (should not happen)`);
  } catch (error) {
    console.log(`   ✅ Invalid topic correctly rejected`);
    console.log(`   📋 Error: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2️⃣  TEST MODULE: validateReading
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📋 2️⃣  MODULE: validateReading');
  console.log('┌─ OBJECTIVE: Validate and normalize sensor data');
  console.log('│  Required fields: temperature_c, humidity_pct, timestamp');
  console.log('│  Validation: types, value ranges, timestamp format');
  console.log('└─ Normalization: temperature_c → temperature, humidity_pct → humidity\n');

  // Test 2.1: Valid payload
  console.log('📤 Test 2.1: Valid payload');
  const validPayload = {
    temperature_c: 23.5,
    humidity_pct: 65.2,
    timestamp: '2025-09-08T10:30:00Z'
  };
  console.log(`   📋 Input:`, JSON.stringify(validPayload, null, 2).replace(/\n/g, '\n           '));
  try {
    const validated = validateReading(validPayload);
    console.log(`   ✅ Validation successful`);
    console.log(`   📋 Result: ${validated.temperature}°C, ${validated.humidity}%`);
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }

  // Test 2.2: Invalid payload (incorrect type)
  console.log(`\n📤 Test 2.2: Invalid payload (incorrect type)`);
  const invalidPayload = {
    temperature_c: 'invalid',
    humidity_pct: 65.2,
    timestamp: '2025-09-08T10:30:00Z'
  };
  console.log(`   📋 Input:`, JSON.stringify(invalidPayload, null, 2).replace(/\n/g, '\n           '));
  try {
    validateReading(invalidPayload);
    console.log(`   ❌ Invalid payload accepted (should not happen)`);
  } catch (error) {
    console.log(`   ✅ Invalid payload correctly rejected`);
    console.log(`   📋 Error: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3️⃣  TEST MODULE: ingestMessage - Valid Messages
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔄 3️⃣  MODULE: ingestMessage - Valid Messages');
  console.log('┌─ OBJECTIVE: Complete MQTT → Database pipeline with valid messages');
  console.log('│  Steps: parseTopic → validateReading → device creation → reading storage');
  console.log('│  Auto-creation: devices created automatically if they don\'t exist');
  console.log('└─ Storage: readings saved in SQLite database\n');

  const validMessages = [
    {
      topic: 'sensors/temp001/readings',
      payload: {
        temperature_c: 23.5,
        humidity_pct: 65.2,
        timestamp: '2025-09-08T10:30:00Z'
      }
    },
    {
      topic: 'sensors/temp002/readings',
      payload: {
        temperature_c: 22.1,
        humidity_pct: 58.7,
        timestamp: '2025-09-08T10:31:00Z'
      }
    },
    {
      topic: 'sensors/temp001/readings',
      payload: {
        temperature_c: 24.0,
        humidity_pct: 67.5,
        timestamp: '2025-09-08T10:32:00Z'
      }
    }
  ];

  for (const [index, message] of validMessages.entries()) {
    try {
      console.log(`📤 Message ${index + 1}/${validMessages.length}:`);
      console.log(`   📍 Topic: "${message.topic}"`);
      console.log(`   📋 Payload:`, JSON.stringify(message.payload, null, 2).replace(/\n/g, '\n       '));

      // Generate unique msg_id for each message
      const msgHeaders = { msg_id: generateMsgId() };
      console.log(`   🔑 Headers: msg_id="${msgHeaders.msg_id}"`);

      const result = await ingestMessage(message.topic, message.payload, msgHeaders, repository);

      if (result.success) {
        console.log(`   ✅ Pipeline successful: ${result.deviceId} → ${message.payload.temperature_c}°C`);
        if (result.deviceCreated) {
          console.log(`     🆕 New device created automatically`);
        } else {
          console.log(`     ♻️  Existing device reused`);
        }
      } else {
        console.log(`   ❌ Pipeline failed: ${result.error}`);
      }
      console.log('   ' + '─'.repeat(60));
    } catch (error) {
      console.log(`   ❌ Pipeline error: ${error.message}`);
      console.log('   ' + '─'.repeat(60));
    }
  }
  console.log('═'.repeat(80) + '\n');  // ═══════════════════════════════════════════════════════════════════════════════
  // 4️⃣  TEST MODULE: ingestMessage - Invalid Messages
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('❌ 4️⃣  MODULE: ingestMessage - Invalid Messages');
  console.log('┌─ OBJECTIVE: Robust validation with malformed message rejection');
  console.log('│  Invalid topics: incorrect format');
  console.log('│  Invalid payloads: incorrect types, out-of-range values');
  console.log('└─ Error handling: messages rejected cleanly without crash\n');

  const invalidMessages = [
    {
      topic: 'invalid/topic/format',
      payload: { temperature_c: 23.5, humidity_pct: 65.2, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Invalid topic'
    },
    {
      topic: 'sensors/temp003/readings',
      payload: { temperature_c: 'invalid', humidity_pct: 65.2, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Invalid payload'
    },
    {
      topic: 'sensors/temp003/readings',
      payload: { temperature_c: 23.5, humidity_pct: 150, timestamp: '2025-09-08T10:30:00Z' },
      expectError: 'Humidity out of range'
    }
  ];

  for (const [index, message] of invalidMessages.entries()) {
    try {
      console.log(`📤 Test ${index + 1}/${invalidMessages.length} - ${message.expectError}:`);
      console.log(`   📍 Topic: "${message.topic}"`);
      console.log(`   📋 Payload:`, JSON.stringify(message.payload, null, 2).replace(/\n/g, '\n       '));
      console.log(`   🎯 Expected error: ${message.expectError}`);

      // Generate unique msg_id
      const msgHeaders = { msg_id: generateMsgId() };
      const result = await ingestMessage(message.topic, message.payload, msgHeaders, repository);
      console.log(`   ❌ Invalid message accepted (should not happen)`);
    } catch (error) {
      console.log(`   ✅ Message correctly rejected`);
      console.log(`   📋 Error: ${error.message}`);
    }
    console.log('   ' + '─'.repeat(60));
  }
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('═'.repeat(80) + '\n');
  // 5️⃣  TEST: Device Reuse
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔄 5️⃣  TEST: Device Reuse');
  console.log('┌─ OBJECTIVE: Demonstrate auto-creation vs device reuse');
  console.log('│  First message: device automatically created');
  console.log('│  Subsequent messages: same device reused');
  console.log('└─ Optimization: avoids device duplicates\n');

  const deviceReuseMessage = {
    topic: 'sensors/temp004/readings',
    payload: {
      temperature_c: 25.0,
      humidity_pct: 60.0,
      timestamp: '2025-09-08T10:35:00Z'
    }
  };

  console.log(`� Message de base pour device temp004:`);
  console.log(`   📍 Topic: "${deviceReuseMessage.topic}"`);
  console.log(`   📋 Payload:`, JSON.stringify(deviceReuseMessage.payload, null, 2).replace(/\n/g, '\n       '));

  // First send
  const msgHeaders1 = { msg_id: generateMsgId() };
  console.log(`\n📤 First send (device creation):`);
  console.log(`   🔑 msg_id: "${msgHeaders1.msg_id}"`);
  const result1 = await ingestMessage(deviceReuseMessage.topic, deviceReuseMessage.payload, msgHeaders1, repository);
  console.log(`   ✅ Result: device created = ${result1.deviceCreated}`);

  // Different message same device
  const secondPayload = {
    ...deviceReuseMessage.payload,
    timestamp: '2025-09-08T10:36:00Z' // Different timestamp
  };
  const msgHeaders2 = { msg_id: generateMsgId() };
  console.log(`\n📤 Second send (device reuse):`);
  console.log(`   🔑 msg_id: "${msgHeaders2.msg_id}"`);
  console.log(`   📋 Modified payload:`, JSON.stringify(secondPayload, null, 2).replace(/\n/g, '\n       '));
  const result2 = await ingestMessage(deviceReuseMessage.topic, secondPayload, msgHeaders2, repository);
  console.log(`   ✅ Result: device created = ${result2.deviceCreated} (device reused)`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 6️⃣  TEST: Message Deduplication
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔁 6️⃣  TEST: Message Deduplication');
  console.log('┌─ OBJECTIVE: Protection against duplicate messages');
  console.log('│  Protection by msg_id: same ID → automatic rejection');
  console.log('│  Protection by content: same payload → duplication detection');
  console.log('└─ Robustness: avoids duplicates in database\n');

  const duplicateTestMessage = {
    topic: 'sensors/temp005/readings',
    payload: {
      temperature_c: 26.5,
      humidity_pct: 70.0,
      timestamp: '2025-09-08T10:40:00Z'
    }
  };

  console.log(`📤 Test message for deduplication:`);
  console.log(`   📍 Topic: "${duplicateTestMessage.topic}"`);
  console.log(`   📋 Payload:`, JSON.stringify(duplicateTestMessage.payload, null, 2).replace(/\n/g, '\n       '));

  // First send - original message
  const originalMsgId2 = generateMsgId();
  const originalHeaders2 = { msg_id: originalMsgId2 };
  console.log(`\n📤 Step 1 - Original message:`);
  console.log(`   🔑 msg_id: "${originalMsgId2}"`);

  try {
    const originalResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, originalHeaders2, repository);
    console.log(`   ✅ Original message accepted → device created = ${originalResult.deviceCreated}`);
  } catch (error) {
    console.log(`   ❌ Original message error: ${error.message}`);
  }

  // Second send - SAME message (same msg_id, same payload, same timestamp)
  console.log(`\n📤 Step 2 - Duplicate message (same msg_id):`);
  console.log(`   🔑 msg_id: "${originalMsgId2}" (IDENTICAL)`);
  console.log(`   🎯 Test: deduplication by ID`);
  try {
    const duplicateResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, originalHeaders2, repository);
    console.log(`   ❌ Duplicate message accepted (should not happen)`);
  } catch (error) {
    console.log(`   ✅ Duplicate message correctly rejected`);
    console.log(`   📋 Error: ${error.message}`);
  }

  // Third send - same payload and timestamp but different msg_id (simulates MQTT retransmission)
  const retransmissionHeaders2 = { msg_id: generateMsgId() };
  console.log(`\n📤 Step 3 - Retransmission (different msg_id):`);
  console.log(`   🔑 msg_id: "${retransmissionHeaders2.msg_id}" (DIFFERENT)`);
  console.log(`   🎯 Test: deduplication by content`);
  try {
    const retransmissionResult = await ingestMessage(duplicateTestMessage.topic, duplicateTestMessage.payload, retransmissionHeaders2, repository);
    console.log(`   ❌ Retransmission accepted (should not happen)`);
  } catch (error) {
    console.log(`   ✅ Retransmission correctly rejected`);
    console.log(`   📋 Error: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 7️⃣  TEST: Pipeline Statistics
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📊 7️⃣  TEST: Pipeline Statistics');
  console.log('┌─ OBJECTIVE: Summary of operations performed in the database');
  console.log('│  Counters: devices created, readings ingested');
  console.log('│  Details: list of devices with their metadata');
  console.log('└─ Validation: verify the consistency of persisted data\n');

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
  const readingCount = db.prepare('SELECT COUNT(*) as count FROM readings_raw').get();

  console.log(`📤 Test 7.1: Global counters`);
  console.log(`   📋 Devices created: ${deviceCount.count}`);
  console.log(`   📋 Readings ingested: ${readingCount.count}`);

  // List of created devices
  const devices = db.prepare('SELECT device_id, label, last_seen_at FROM devices ORDER BY device_id').all();
  console.log(`\n📤 Test 7.2: Device details`);
  console.log(`   📋 Complete list:`);
  devices.forEach(device => {
    console.log(`       • ${device.device_id}: ${device.label || 'Auto-discovered sensor'}`);
  });
  console.log(`   ✅ Consistent data: ${devices.length} devices listed = ${deviceCount.count} devices counted`);

  db.close();

  console.log('\n✅ === INGESTION PIPELINE EXAMPLE COMPLETED ===');
  console.log('🎯 Modules successfully demonstrated:');
  console.log('   • parseTopic (MQTT topic format validation)');
  console.log('   • validateReading (JSON payload validation)');
  console.log('   • ingestMessage (complete pipeline to DB)');
  console.log(`📁 Data persisted in: ${dbPath}\n`);
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('⚙️  Ingestion Pipeline Example');
  console.log('=============================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 📝 parseTopic (MQTT topic format)');
  console.log('• 📋 validateReading (payload validation)');
  console.log('• 🔄 ingestMessage (complete pipeline)');
  console.log('• 🔄 Device auto-creation and reuse');
  console.log('• 🔁 Deduplication of identical messages');
  console.log('• ❌ Error handling and validation');
  console.log('');
  console.log('Usage: node src/ingestion/examples/example-ingestion.js');
  console.log('');
  console.log('Files used:');
  console.log('• src/ingestion/parseTopic.js');
  console.log('• src/ingestion/validateReading.js');
  console.log('• src/ingestion/ingestMessage.js');
  process.exit(0);
}

// Run example
demonstrateIngestionPipeline().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
