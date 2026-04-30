#!/usr/bin/env node
/**
 * @file Example HTTP Server Foundation
 * 
 * ✅ OBJECTIVE: Demonstrate HTTP server creation and lifecycle management
 * 📦 DEMONSTRATED MODULES:
 *    - src/http/server.js (createHttpServer)
 *    - src/db/index.js (database integration)
 *    - src/repositories/index.js (repository pattern)
 * 
 * 🚫 NOT DEMONSTRATED: MQTT Client, Complete ingestion pipeline
 */

import { createHttpServer } from '../server.js';
import { initDb } from '../../db/index.js';
import { createRepository } from '../../repositories/index.js';

async function demonstrateHttpServer() {
  console.log('🌐 === HTTP SERVER FOUNDATION EXAMPLE ===');
  console.log('🎯 Module: createHttpServer + Express.js integration');
  console.log('');
  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Server Creation → HTTP server instance with Express.js');
  console.log('2️⃣  Database Setup  → In-memory SQLite for health checks');
  console.log('3️⃣  Server Startup  → Graceful startup with port assignment');
  console.log('4️⃣  Health Testing  → Manual endpoint verification');
  console.log('5️⃣  Server Shutdown → Clean lifecycle management');
  console.log('6️⃣  Cleanup        → Proper resource disposal');
  console.log('');

  let server = null;
  let serverInstance = null;
  let db = null;

  try {
    // 1️⃣ TEST: Server Creation
    console.log('🔧 1️⃣  TEST: Server Creation');
    console.log('┌─ OBJECTIVE: Create HTTP server with configuration');
    console.log('│  Express.js integration with middleware');
    console.log('│  Health route mounting');
    console.log('└─ Configuration flexibility\n');

    console.log('📤 Creating HTTP server configuration...');
    const config = {
      http: {
        port: 3001 // Fixed port for testing
      },
      deps: {} // Will add database later
    };

    server = createHttpServer(config);
    console.log('   ✅ HTTP server instance created');
    console.log(`   📋 Configuration: port=${config.http.port}`);
    console.log(`   🔧 Server methods: start, stop, getApp`);
    console.log('');

    // 2️⃣ TEST: Database Setup
    console.log('🗄️  2️⃣  TEST: Database Setup');
    console.log('┌─ OBJECTIVE: Initialize database for health checks');
    console.log('│  In-memory SQLite with migrations');
    console.log('│  Repository pattern for data access');
    console.log('└─ Health endpoint dependency\n');

    db = initDb(':memory:');
    const repo = createRepository(db);

    // Update server config with database
    config.deps = { repo };
    server = createHttpServer(config);

    console.log('   ✅ In-memory database initialized');
    console.log('   📊 Repository created (devices, rooms, readings)');
    console.log('   🔗 Server configuration updated with database');
    console.log('');

    // 3️⃣ TEST: Server Startup
    console.log('🚀 3️⃣  TEST: Server Startup');
    console.log('┌─ OBJECTIVE: Start HTTP server and verify functionality');
    console.log('│  Port binding and Express.js routing');
    console.log('│  Health endpoint activation');
    console.log('└─ Server readiness confirmation\n');

    const startResult = await server.start();
    serverInstance = startResult.server;

    console.log('   ✅ HTTP server started successfully');
    console.log(`   🌐 Server URL: http://localhost:${startResult.port}`);
    console.log(`   📡 Health endpoint: http://localhost:${startResult.port}/health`);
    console.log(`   🔄 Server instance type: ${typeof serverInstance}`);
    console.log('');

    // 4️⃣ TEST: Health Testing  
    console.log('🏥 4️⃣  TEST: Health Endpoint Verification');
    console.log('┌─ OBJECTIVE: Verify health endpoint functionality');
    console.log('│  HTTP request to /health endpoint');
    console.log('│  Database connectivity validation');
    console.log('└─ JSON response verification\n');

    console.log('   📡 Making HTTP request to health endpoint...');

    try {
      const fetch = (await import('node-fetch')).default;
      const healthUrl = `http://localhost:${startResult.port}/health`;
      const response = await fetch(healthUrl);
      const data = await response.json();

      console.log(`   📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`   📄 Response body: ${JSON.stringify(data)}`);
      console.log(`   🏥 Health status: ${data.status}`);

      if (response.status === 200 && data.status === 'ok') {
        console.log('   ✅ Health endpoint working correctly');
      } else {
        console.log('   ❌ Health endpoint returned unexpected response');
      }
    } catch (error) {
      console.log(`   ❌ Health endpoint test failed: ${error.message}`);
    }
    console.log('');

    // 5️⃣ TEST: Manual Testing Instructions
    console.log('🧪 5️⃣  MANUAL TESTING READY');
    console.log('┌─ AVAILABLE COMMANDS:');
    console.log(`│  curl http://localhost:${startResult.port}/health`);
    console.log(`│  curl -v http://localhost:${startResult.port}/health`);
    console.log(`│  curl http://localhost:${startResult.port}/api/v1/readings/latest`);
    console.log('└─ Use Ctrl+C to stop the server when done\n');

    console.log('⏸️  Server is running... Press Ctrl+C to stop');
    console.log('   💡 Test the endpoints manually in another terminal');
    console.log('   📝 Check server logs in this terminal');
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
    console.error('❌ HTTP server demonstration failed:', error.message);
    console.error(error.stack);
  }

  async function cleanup() {
    // 6️⃣ TEST: Server Shutdown
    console.log('🧹 6️⃣  TEST: Server Shutdown & Cleanup');
    console.log('┌─ OBJECTIVE: Graceful server shutdown');
    console.log('│  Close HTTP server connections');
    console.log('│  Close database connections');
    console.log('└─ Clean resource disposal\n');

    if (serverInstance) {
      console.log('   🔌 Stopping HTTP server...');
      const stopResult = await server.stop();
      console.log(`   ✅ Server stopped: ${stopResult.success}`);
      serverInstance = null;
    }

    if (db && db.open) {
      console.log('   🗄️  Closing database connection...');
      db.close();
      console.log('   ✅ Database closed');
    }

    console.log('');
    console.log('🎉 HTTP Server demonstration completed successfully!');
    console.log('');
    console.log('📚 SUMMARY:');
    console.log('   ✅ Server creation with Express.js');
    console.log('   ✅ Database integration for health checks');
    console.log('   ✅ Graceful startup and shutdown');
    console.log('   ✅ Health endpoint functionality');
    console.log('   ✅ Manual testing capabilities');
    console.log('');
    console.log('🔗 Next: Run example-health.js for detailed health testing');
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
demonstrateHttpServer().catch(console.error);
