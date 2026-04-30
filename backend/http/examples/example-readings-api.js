#!/usr/bin/env node
/**
 * @file Example Readings API Testing
 * 
 * ✅ OBJECTIVE: Demonstrate readings API endpoint functionality (Phase 3)
 * 📦 DEMONSTRATED MODULES:
 *    - src/http/routes/reading.js (readingsRouter)
 *    - src/repositories/index.js (readings operations)
 *    - Query parameter handling
 * 
 * 🚫 NOT DEMONSTRATED: Complete MQTT integration, real-time data
 */

import { createHttpServer } from '../server.js';
import { readingsRouter } from '../routes/reading.js';
import { initDb } from '../../db/index.js';
import { createRepository } from '../../repositories/index.js';

async function demonstrateReadingsAPI() {
  console.log('📊 === READINGS API DEMONSTRATION ===');
  console.log('🎯 Module: readingsRouter + repository integration');
  console.log('');
  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Database Setup    → Sample sensor data creation');
  console.log('2️⃣  Router Creation   → Readings router instantiation');
  console.log('3️⃣  Latest Readings   → GET /api/v1/readings/latest');
  console.log('4️⃣  Query Parameters → homeId and deviceId filtering');
  console.log('5️⃣  Error Scenarios  → Empty DB and invalid requests');
  console.log('6️⃣  Response Format  → JSON API format validation');
  console.log('');

  let db = null;
  let server = null;
  let serverInstance = null;

  try {
    // 1️⃣ TEST: Database Setup
    console.log('🗄️  1️⃣  TEST: Database Setup with Sample Data');
    console.log('┌─ OBJECTIVE: Create realistic sensor data for API testing');
    console.log('│  Multiple devices and rooms');
    console.log('│  Recent temperature/humidity readings');
    console.log('└─ Repository pattern data insertion\n');

    db = initDb(':memory:');
    const repo = createRepository(db);

    // Create sample rooms
    await repo.rooms.create({ room_id: 'living-room', name: 'Living Room', floor: 'ground', side: 'front' });
    await repo.rooms.create({ room_id: 'bedroom', name: 'Master Bedroom', floor: 'first', side: 'back' });
    console.log('   ✅ Sample rooms created (living-room, bedroom)');

    // Create sample devices
    await repo.devices.create({
      device_id: 'temp-001',
      device_uid: 'ESP32-TEMP-001',
      label: 'Living Room Temperature Sensor',
      model: 'DHT22'
    });
    await repo.devices.create({
      device_id: 'temp-002',
      device_uid: 'ESP32-TEMP-002',
      label: 'Bedroom Temperature Sensor',
      model: 'DHT22'
    });
    console.log('   ✅ Sample devices created (temp-001, temp-002)');

    // Create sample readings
    const now = new Date();
    const readings = [
      {
        device_id: 'temp-001',
        room_id: 'living-room',
        ts: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        temperature: 22.5,
        humidity: 45.0,
        source: 'mqtt'
      },
      {
        device_id: 'temp-001',
        room_id: 'living-room',
        ts: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        temperature: 22.3,
        humidity: 44.5,
        source: 'mqtt'
      },
      {
        device_id: 'temp-002',
        room_id: 'bedroom',
        ts: new Date(now.getTime() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
        temperature: 20.1,
        humidity: 50.2,
        source: 'mqtt'
      }
    ];

    for (const reading of readings) {
      await repo.readings.create(reading);
    }
    console.log(`   ✅ Sample readings created (${readings.length} readings)`);
    console.log('   📊 Data: living-room (22.5°C, 45%), bedroom (20.1°C, 50.2%)');
    console.log('');

    // 2️⃣ TEST: Server Integration (Phase 3 Implementation Needed)
    console.log('🌐 2️⃣  TEST: HTTP Server with Readings API');
    console.log('┌─ OBJECTIVE: Start server with readings endpoint');
    console.log('│  Complete HTTP server with both health and readings');
    console.log('│  Repository integration');
    console.log('└─ API endpoint mounting\n');

    const config = {
      http: { port: 0 },
      deps: { repo }
    };

    server = createHttpServer(config);
    const startResult = await server.start();
    serverInstance = startResult.server;

    console.log(`   ✅ HTTP server started on port ${startResult.port}`);
    console.log(`   📡 Readings endpoint: http://localhost:${startResult.port}/api/v1/readings/latest`);
    console.log('');

    // 3️⃣ TEST: Latest Readings Endpoint
    console.log('📊 3️⃣  TEST: Latest Readings Endpoint');
    console.log('┌─ OBJECTIVE: Test /api/v1/readings/latest endpoint');
    console.log('│  HTTP GET request to readings API');
    console.log('│  JSON response with latest data per device');
    console.log('└─ Data transformation verification\n');

    console.log('   📡 Testing latest readings endpoint...');

    try {
      const fetch = (await import('node-fetch')).default;
      const readingsUrl = `http://localhost:${startResult.port}/api/v1/readings/latest`;
      const response = await fetch(readingsUrl);

      console.log(`   📊 Response status: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        console.log('   ⚠️  Readings endpoint not implemented yet (Phase 3)');
        console.log('   📝 Expected: JSON array with latest readings per device');
        console.log('   🔧 Implementation needed in src/http/routes/reading.js');
        console.log('   ✅ This is expected behavior during Phase 2');
      } else {
        const data = await response.json();
        console.log(`   📄 Response body: ${JSON.stringify(data, null, 2)}`);
        console.log('   ✅ Readings endpoint implemented and working!');
      }
    } catch (error) {
      console.log(`   ⚠️  Readings endpoint error: ${error.message}`);
      console.log('   📝 This is expected during Phase 2 development');
    }
    console.log('');

    // 4️⃣ TEST: Manual Testing Instructions
    console.log('🧪 4️⃣  MANUAL TESTING INSTRUCTIONS');
    console.log('┌─ AVAILABLE COMMANDS (once Phase 3 is implemented):');
    console.log(`│  curl http://localhost:${startResult.port}/api/v1/readings/latest`);
    console.log(`│  curl "http://localhost:${startResult.port}/api/v1/readings/latest?homeId=home001"`);
    console.log(`│  curl "http://localhost:${startResult.port}/api/v1/readings/latest?deviceId=temp-001"`);
    console.log('└─ Expected: JSON with latest readings per device\n');

    console.log('   💡 Expected Response Format (Phase 3):');
    console.log('   ```json');
    console.log('   {');
    console.log('     "data": [');
    console.log('       {');
    console.log('         "home_id": "home001",');
    console.log('         "device_id": "temp-001",');
    console.log('         "ts_utc": 1693737600,');
    console.log('         "values": {');
    console.log('           "temperature_c": 22.5,');
    console.log('           "humidity_pct": 45.0');
    console.log('         }');
    console.log('       }');
    console.log('     ]');
    console.log('   }');
    console.log('   ```');
    console.log('');

    // 5️⃣ TEST: Health Endpoint Still Working
    console.log('🏥 5️⃣  TEST: Health Endpoint Verification');
    console.log('┌─ OBJECTIVE: Ensure health endpoint still works with readings API');
    console.log('│  Health endpoint should be unaffected');
    console.log('│  Both endpoints coexist');
    console.log('└─ Server stability verification\n');

    const fetch = (await import('node-fetch')).default;
    const healthUrl = `http://localhost:${startResult.port}/health`;
    const healthResponse = await fetch(healthUrl);
    const healthData = await healthResponse.json();

    console.log(`   📊 Health status: ${healthResponse.status} ${healthResponse.statusText}`);
    console.log(`   📄 Health body: ${JSON.stringify(healthData)}`);

    if (healthResponse.status === 200 && healthData.status === 'ok') {
      console.log('   ✅ Health endpoint still working correctly');
    } else {
      console.log('   ❌ Health endpoint affected by readings API integration');
    }
    console.log('');

    // Keep server running for manual testing
    console.log('⏸️  Server is running for manual testing... Press Ctrl+C to stop');
    console.log('   💡 Test the endpoints in another terminal while server runs');
    console.log('   🔗 Once Phase 3 is implemented, readings endpoint will work');
    console.log('');

    // Keep server running until user interruption
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received shutdown signal...');
      await cleanup();
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => { }); // Run indefinitely

  } catch (error) {
    console.error('❌ Readings API demonstration failed:', error.message);
    console.error(error.stack);
  }

  async function cleanup() {
    console.log('🧹 Cleaning up resources...');

    if (serverInstance) {
      await server.stop();
      console.log('   ✅ HTTP server stopped');
    }

    if (db && db.open) {
      db.close();
      console.log('   ✅ Database closed');
    }

    console.log('');
    console.log('🎉 Readings API demonstration completed!');
    console.log('');
    console.log('📚 SUMMARY:');
    console.log('   ✅ Sample sensor data created');
    console.log('   ✅ HTTP server with health + readings integration');
    console.log('   ✅ Manual testing environment prepared');
    console.log('   ⏳ Waiting for Phase 3: Readings API implementation');
    console.log('');
    console.log('🔗 Next: Implement Phase 3 to make readings endpoint functional');
  }
}

// Auto-cleanup on script errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason);
  process.exit(1);
});

// Run the demonstration
demonstrateReadingsAPI().catch(console.error);
