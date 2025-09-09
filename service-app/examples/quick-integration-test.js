#!/usr/bin/env node

/**
 * Quick Integration Test - Manual Testing Helper
 * Quick setup for manual testing of the complete pipeline
 */

import { initDb, closeDb } from '../src/db/index.js';
import { createServer } from '../src/http/server.js';
import { ingestMessage } from '../src/ingestion/index.js';

const PORT = 3000;
const DB_PATH = './quick-test.db';

console.log('🚀 Quick Integration Test Setup\n');

async function setupAndRun() {
  // Initialize database
  console.log('📊 Setting up database...');
  const database = initDb(DB_PATH);

  // Add sample data
  console.log('📡 Adding sample data...');
  const sampleMessages = [
    {
      topic: 'temperature/bedroom',
      payload: JSON.stringify({
        device_id: 'sensor-001',
        timestamp: new Date().toISOString(),
        temperature: 22.5,
        humidity: 65.0
      })
    },
    {
      topic: 'temperature/living_room',
      payload: JSON.stringify({
        device_id: 'sensor-002',
        timestamp: new Date().toISOString(),
        temperature: 24.0,
        humidity: 58.0
      })
    },
    {
      topic: 'temperature/kitchen',
      payload: JSON.stringify({
        device_id: 'sensor-003',
        timestamp: new Date().toISOString(),
        temperature: 26.5,
        humidity: 72.0
      })
    }
  ];

  for (const msg of sampleMessages) {
    await ingestMessage(database, msg.topic, msg.payload);
  }
  console.log(`✅ Added ${sampleMessages.length} sample readings\n`);

  // Start HTTP server
  console.log('🌐 Starting HTTP server...');
  const server = createServer(database);

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}\n`);

    console.log('🧪 Test these endpoints:');
    console.log(`   Health: curl http://localhost:${PORT}/health`);
    console.log(`   All readings: curl http://localhost:${PORT}/api/v1/readings/latest`);
    console.log(`   Filtered: curl "http://localhost:${PORT}/api/v1/readings/latest?deviceId=sensor-001"`);
    console.log('\n⏹️  Press Ctrl+C to stop');
  });

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    server.close();
    await closeDb();
    console.log('✅ Cleanup completed');
    process.exit(0);
  });
}

setupAndRun().catch(console.error);
