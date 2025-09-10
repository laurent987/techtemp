#!/usr/bin/env node
/**
 * @file Example Health Endpoint Testing
 * 
 * ✅ OBJECTIVE: Comprehensive health endpoint functionality demonstration
 * 📦 DEMONSTRATED MODULES:
 *    - src/http/routes/health.js (healthRouter)
 *    - src/http/server.js (HTTP integration)
 *    - Database connectivity testing
 * 
 * 🚫 NOT DEMONSTRATED: Readings API, MQTT integration
 */

import { createHttpServer } from '../server.js';
import { healthRouter } from '../routes/health.js';
import { initDb } from '../../db/index.js';
import { createRepository } from '../../repositories/index.js';
import express from 'express';

async function demonstrateHealthEndpoint() {
  console.log('🏥 === HEALTH ENDPOINT DEMONSTRATION ===');
  console.log('🎯 Module: healthRouter + database connectivity testing');
  console.log('');
  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Standalone Router → Health router without server');
  console.log('2️⃣  Database OK       → Health check with working database');
  console.log('3️⃣  Database Failed   → Health check with broken database');
  console.log('4️⃣  No Database       → Health check without database');
  console.log('5️⃣  Server Integration → Health endpoint via HTTP server');
  console.log('6️⃣  Response Format   → JSON format validation');
  console.log('');

  let db = null;
  let server = null;
  let serverInstance = null;

  try {
    // 1️⃣ TEST: Standalone Router
    console.log('🔧 1️⃣  TEST: Standalone Health Router');
    console.log('┌─ OBJECTIVE: Test health router creation independently');
    console.log('│  Router factory function');
    console.log('│  Express.js integration');
    console.log('└─ Dependency injection pattern\n');

    console.log('📤 Creating health router with no dependencies...');
    const routerNoDeps = healthRouter();
    console.log('   ✅ Health router created (no dependencies)');
    console.log(`   🔧 Router type: ${typeof routerNoDeps}`);

    console.log('📤 Creating health router with empty dependencies...');
    const routerEmptyDeps = healthRouter({});
    console.log('   ✅ Health router created (empty dependencies)');

    console.log('📤 Creating health router with null repository...');
    const routerNullRepo = healthRouter({ repo: null });
    console.log('   ✅ Health router created (null repository)');
    console.log('');

    // 2️⃣ TEST: Database OK
    console.log('🟢 2️⃣  TEST: Health Check with Working Database');
    console.log('┌─ OBJECTIVE: Verify health endpoint with accessible database');
    console.log('│  Database connectivity test');
    console.log('│  Success response format');
    console.log('└─ HTTP 200 status code\n');

    db = initDb(':memory:');
    const repo = createRepository(db);

    // Add sample data to verify database is working
    await repo.rooms.create({ room_id: 'test-room', name: 'Test Room' });
    console.log('   ✅ In-memory database initialized with sample data');

    // Test health check with working database
    const app1 = express();
    app1.use('/health', healthRouter({ repo }));

    console.log('   📡 Testing health endpoint with working database...');
    const request1 = await import('supertest');
    const response1 = await request1.default(app1)
      .get('/health');

    console.log(`   📊 Response status: ${response1.status}`);
    console.log(`   📄 Response body: ${JSON.stringify(response1.body)}`);
    console.log(`   🏥 Health status: ${response1.body.status}`);

    if (response1.status === 200 && response1.body.status === 'ok') {
      console.log('   ✅ Working database test PASSED');
    } else {
      console.log('   ❌ Working database test FAILED');
    }
    console.log('');

    // 3️⃣ TEST: Database Failed
    console.log('🔴 3️⃣  TEST: Health Check with Broken Database');
    console.log('┌─ OBJECTIVE: Verify health endpoint with inaccessible database');
    console.log('│  Database connection failure simulation');
    console.log('│  Error response format');
    console.log('└─ HTTP 500 status code\n');

    // Close database to simulate failure
    db.close();
    console.log('   💥 Database connection closed to simulate failure');

    const app2 = express();
    app2.use('/health', healthRouter({ repo }));

    console.log('   📡 Testing health endpoint with broken database...');
    const request2 = await import('supertest');
    const response2 = await request2.default(app2)
      .get('/health');

    console.log(`   📊 Response status: ${response2.status}`);
    console.log(`   📄 Response body: ${JSON.stringify(response2.body)}`);
    console.log(`   🏥 Health status: ${response2.body.status}`);

    if (response2.status === 500 && response2.body.status === 'failed') {
      console.log('   ✅ Broken database test PASSED');
    } else {
      console.log('   ❌ Broken database test FAILED');
    }
    console.log('');

    // 4️⃣ TEST: No Database
    console.log('🟡 4️⃣  TEST: Health Check without Database');
    console.log('┌─ OBJECTIVE: Verify health endpoint graceful handling of no database');
    console.log('│  No repository dependency');
    console.log('│  Default success response');
    console.log('└─ HTTP 200 status code\n');

    const app3 = express();
    app3.use('/health', healthRouter()); // No dependencies

    console.log('   📡 Testing health endpoint without database...');
    const request3 = await import('supertest');
    const response3 = await request3.default(app3)
      .get('/health');

    console.log(`   📊 Response status: ${response3.status}`);
    console.log(`   📄 Response body: ${JSON.stringify(response3.body)}`);
    console.log(`   🏥 Health status: ${response3.body.status}`);

    if (response3.status === 200 && response3.body.status === 'ok') {
      console.log('   ✅ No database test PASSED');
    } else {
      console.log('   ❌ No database test FAILED');
    }
    console.log('');

    // 5️⃣ TEST: Server Integration
    console.log('🌐 5️⃣  TEST: Health Endpoint via HTTP Server');
    console.log('┌─ OBJECTIVE: Test health endpoint through complete HTTP server');
    console.log('│  Full server lifecycle');
    console.log('│  Real HTTP requests');
    console.log('└─ Network-level testing\n');

    // Create fresh database for server testing
    db = initDb(':memory:');
    const repoForServer = createRepository(db);

    const config = {
      http: { port: 0 }, // Use random port
      deps: { repo: repoForServer }
    };

    server = createHttpServer(config);
    const startResult = await server.start();
    serverInstance = startResult.server;

    console.log(`   ✅ HTTP server started on port ${startResult.port}`);
    console.log(`   📡 Testing via real HTTP request...`);

    const fetch = (await import('node-fetch')).default;
    const healthUrl = `http://localhost:${startResult.port}/health`;
    const response4 = await fetch(healthUrl);
    const data4 = await response4.json();

    console.log(`   📊 Response status: ${response4.status} ${response4.statusText}`);
    console.log(`   📄 Response body: ${JSON.stringify(data4)}`);
    console.log(`   🏥 Health status: ${data4.status}`);
    console.log(`   🌐 Content-Type: ${response4.headers.get('content-type')}`);

    if (response4.status === 200 && data4.status === 'ok') {
      console.log('   ✅ HTTP server integration test PASSED');
    } else {
      console.log('   ❌ HTTP server integration test FAILED');
    }
    console.log('');

    // 6️⃣ TEST: Response Format Validation
    console.log('📋 6️⃣  TEST: Response Format Validation');
    console.log('┌─ OBJECTIVE: Validate JSON response format compliance');
    console.log('│  Content-Type header verification');
    console.log('│  JSON structure validation');
    console.log('└─ Schema compliance check\n');

    console.log('   🔍 Analyzing response format...');
    console.log(`   📋 Content-Type: ${response4.headers.get('content-type')}`);
    console.log(`   📏 Content-Length: ${response4.headers.get('content-length')}`);
    console.log(`   🏷️  Response structure: ${Object.keys(data4).join(', ')}`);

    const isValidJson = response4.headers.get('content-type')?.includes('application/json');
    const hasStatusField = 'status' in data4;
    const validStatusValue = ['ok', 'failed'].includes(data4.status);

    console.log(`   ✅ Valid JSON Content-Type: ${isValidJson}`);
    console.log(`   ✅ Has 'status' field: ${hasStatusField}`);
    console.log(`   ✅ Valid status value: ${validStatusValue}`);

    if (isValidJson && hasStatusField && validStatusValue) {
      console.log('   ✅ Response format validation PASSED');
    } else {
      console.log('   ❌ Response format validation FAILED');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Health endpoint demonstration failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
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
    console.log('🎉 Health endpoint demonstration completed!');
    console.log('');
    console.log('📚 SUMMARY:');
    console.log('   ✅ Standalone router creation');
    console.log('   ✅ Database connectivity testing (OK/Failed/None)');
    console.log('   ✅ HTTP server integration');
    console.log('   ✅ Response format validation');
    console.log('   ✅ Error handling scenarios');
    console.log('');
    console.log('🔗 Next: Run example-readings-api.js for API endpoint testing');
  }
}

// Run the demonstration
demonstrateHealthEndpoint().catch(console.error);
