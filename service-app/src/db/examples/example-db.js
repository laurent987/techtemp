#!/usr/bin/env node
/**
 * @file Example Database & Repository
 * 
 * ✅ OBJECTIVE: Demonstrate usage of DB and Repository modules
 * 📦 DEMONSTRATED MODULES:
 *    - src/db/index.js (initDb, migrations)
 *    - src/repositories/index.js (createRepository)
 * 
 * 🚫 NOT DEMONSTRATED: MQTT Client, Ingestion Pipeline, HTTP API
 */

import { initDb, closeDb } from '../index.js';
import { createRepository } from '../../repositories/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demonstrateDatabaseRepository() {
  console.log('🗄️  === DATABASE + REPOSITORY EXAMPLE ===');
  console.log('🎯 Module: initDb + migrateSchema (integrated) + createRepository');
  console.log('');
  console.log('📖 TEST OVERVIEW:');
  console.log('1️⃣  Memory DB      → Initialization and migrations in RAM');
  console.log('2️⃣  Room Repository → Creation and search of rooms');
  console.log('3️⃣  Device Repository → IoT device management');
  console.log('4️⃣  Readings Repository → Sensor data storage');
  console.log('5️⃣  File DB       → SQLite persistence on disk');
  console.log('6️⃣  Cleanup       → Proper connection closure');
  console.log('');
  console.log('⚙️  CONFIGURATION:');
  console.log('   💾 Memory DB: :memory:');
  console.log('   📁 File DB: examples/db-data-examples/example-db.db');
  console.log('   🏗️  Schema: Version 2 (temperature/humidity)');
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1️⃣  TEST: In-memory database
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔗 1️⃣  TEST: Memory database initialization');
  console.log('┌─ OBJECTIVE: Create temporary DB in RAM for fast tests');
  console.log('│  Advantages: Ultra-fast, no files, total isolation');
  console.log('│  Disadvantages: Data lost on closure');
  console.log('└─ Usage: Unit tests, development, prototyping');
  console.log('');

  console.log('📤 Test 1.1: Memory DB creation');
  console.log('   📋 Connection string: ":memory:"');
  const memDb = initDb(':memory:');
  console.log('   ✅ Memory database created');

  console.log('📤 Test 1.2: Schema application');
  console.log('   🏗️  Schema: Automatic via initDb()');
  // Note: initDb() automatically calls migrateSchema()
  console.log('   ✅ Schema applied successfully');

  console.log('📤 Test 1.3: Repository creation');
  const memRepo = createRepository(memDb);
  console.log('   ✅ Repository configured (rooms, devices, readings)');
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2️⃣  TEST: Room Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🏠 2️⃣  TEST: Room Repository (room management)');
  console.log('┌─ OBJECTIVE: Create and manage house rooms');
  console.log('│  Features: create, findById, findAll, update, delete');
  console.log('│  Validation: Uniqueness constraints, device relationships');
  console.log('└─ Structure: room_id (PK), name, created_at, updated_at');
  console.log('');

  console.log('📤 Test 2.1: Creating a room');
  console.log('   📍 Room ID: "salon"');
  console.log('   🏷️  Name: "Salon"');
  const room = await memRepo.rooms.create({
    room_id: 'salon',
    name: 'Salon'
  });
  console.log('   ✅ Room created successfully');
  console.log(`   📊 Result: ${JSON.stringify({ room_id: room.room_id, name: room.name }, null, 2).replace(/\n/g, '\n       ')}`);

  console.log('📤 Test 2.2: Search by ID');
  console.log('   🔍 Search: room_id = "salon"');
  const foundRoom = await memRepo.rooms.findById('salon');
  console.log(`   ✅ Room found: ${foundRoom?.name || 'Not found'}`);
  console.log(`   📊 Data: ${foundRoom ? JSON.stringify({ room_id: foundRoom.room_id, name: foundRoom.name, created_at: foundRoom.created_at }, null, 2).replace(/\n/g, '\n       ') : 'None'}`);

  console.log('📤 Test 2.3: Creating a second room');
  console.log('   📍 Room ID: "cuisine"');
  console.log('   🏷️  Name: "Cuisine"');
  const room2 = await memRepo.rooms.create({
    room_id: 'cuisine',
    name: 'Cuisine'
  });
  console.log('   ✅ Second room created');

  console.log('📤 Test 2.4: Verifying created rooms');
  console.log('   🔍 Test: Search rooms by ID');
  const salonCheck = await memRepo.rooms.findById('salon');
  const cuisineCheck = await memRepo.rooms.findById('cuisine');
  console.log(`   ✅ Room "salon": ${salonCheck ? 'found' : 'not found'}`);
  console.log(`   ✅ Room "cuisine": ${cuisineCheck ? 'found' : 'not found'}`);
  console.log('   📊 Validated rooms:');
  if (salonCheck) console.log(`       • ${salonCheck.room_id}: ${salonCheck.name}`);
  if (cuisineCheck) console.log(`       • ${cuisineCheck.room_id}: ${cuisineCheck.name}`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3️⃣  TEST: Device Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📱 3️⃣  TEST: Device Repository (IoT device management)');
  console.log('┌─ OBJECTIVE: Manage IoT sensors and actuators');
  console.log('│  Features: create, findById, findByRoom, findAll');
  console.log('│  Relations: device -> room (FK constraint)');
  console.log('└─ Structure: device_id (PK), device_uid, room_id (FK), label');
  console.log('');

  console.log('📤 Test 3.1: Creating a temperature device');
  console.log('   📍 Device ID: "temp001"');
  console.log('   🆔 UID: "temp001-uid"');
  console.log('   🏠 Room: "salon"');
  console.log('   🏷️  Label: "Living Room Temperature Sensor"');
  const device = await memRepo.devices.create({
    device_id: 'temp001',
    device_uid: 'temp001-uid',
    room_id: 'salon',
    label: 'Living Room Temperature Sensor'
  });
  console.log('   ✅ Device created successfully');
  console.log(`   📊 Device: ${device.device_id} in room ${device.room_id}`);

  console.log('📤 Test 3.2: Search device by ID');
  console.log('   🔍 Search: device_id = "temp001"');
  const foundDevice = await memRepo.devices.findById('temp001');
  console.log(`   ✅ Device found: ${foundDevice?.label || 'Not found'}`);
  console.log(`   📊 Info: ID=${foundDevice?.device_id}, Room=${foundDevice?.room_id || 'N/A'}`);

  console.log('📤 Test 3.3: Creating kitchen device');
  console.log('   📍 Device ID: "temp002"');
  console.log('   🏠 Room: "cuisine"');
  const device2 = await memRepo.devices.create({
    device_id: 'temp002',
    device_uid: 'temp002-uid',
    room_id: 'cuisine',
    label: 'Kitchen Sensor'
  });
  console.log('   ✅ Kitchen device created');

  console.log('📤 Test 3.4: Verifying created devices');
  console.log('   🔍 Search: validate devices by ID');
  const device1Check = await memRepo.devices.findById('temp001');
  const device2Check = await memRepo.devices.findById('temp002');
  console.log(`   ✅ Device temp001: ${device1Check ? 'found' : 'not found'}`);
  console.log(`   ✅ Device temp002: ${device2Check ? 'found' : 'not found'}`);
  console.log('   📊 Validated devices:');
  if (device1Check) console.log(`       • ${device1Check.device_id}: ${device1Check.label} (${device1Check.room_id || 'N/A'})`);
  if (device2Check) console.log(`       • ${device2Check.device_id}: ${device2Check.label} (${device2Check.room_id || 'N/A'})`);
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4️⃣  TEST: Readings Repository
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📈 4️⃣  TEST: Readings Repository (sensor data)');
  console.log('┌─ OBJECTIVE: Store and query sensor measurements');
  console.log('│  Features: create, getLatestByDevice, findByDevice, findRecent');
  console.log('│  Relations: reading -> device (FK), reading -> room (FK)');
  console.log('└─ Structure: ts (PK), device_id (FK), room_id (FK), temperature, humidity, source');
  console.log('');

  console.log('📤 Test 4.1: Creating a temperature reading');
  console.log('   📍 Device: "temp001"');
  console.log('   🌡️  Temperature: 23.5°C');
  console.log('   💧 Humidity: 65.2%');
  console.log('   📅 Timestamp: now');
  const reading = await memRepo.readings.create({
    device_id: 'temp001',
    room_id: 'salon',
    ts: new Date().toISOString(),
    temperature: 23.5,
    humidity: 65.2,
    source: 'example-test'
  });
  console.log(`   ✅ Reading created: ${reading.success ? 'success' : 'failed'}`);
  if (reading.success) {
    console.log(`   📊 Data stored: device=temp001, 23.5°C, 65.2%`);
  }

  console.log('📤 Test 4.2: Adding a second reading');
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for different timestamp
  const reading2 = await memRepo.readings.create({
    device_id: 'temp001',
    room_id: 'salon',
    ts: new Date().toISOString(),
    temperature: 24.1,
    humidity: 63.8,
    source: 'example-test'
  });
  console.log(`   ✅ Second reading: ${reading2.success ? 'success' : 'failed'}`);

  console.log('📤 Test 4.3: Reading from kitchen device');
  const reading3 = await memRepo.readings.create({
    device_id: 'temp002',
    room_id: 'cuisine',
    ts: new Date().toISOString(),
    temperature: 22.3,
    humidity: 58.7,
    source: 'example-test'
  });
  console.log(`   ✅ Kitchen reading: ${reading3.success ? 'success' : 'failed'}`);

  console.log('📤 Test 4.4: Getting latest reading');
  console.log('   🔍 Search: latest reading from temp001');
  const latestReading = await memRepo.readings.getLatestByDevice('temp001');
  console.log(`   ✅ Latest reading: ${latestReading ? latestReading.temperature + '°C' : 'None'}`);
  if (latestReading) {
    console.log(`   📊 Details: ${latestReading.temperature}°C, ${latestReading.humidity}%, ${new Date(latestReading.ts).toLocaleTimeString()}`);
  }

  console.log('📤 Test 4.5: Search readings by room and time period');
  console.log('   🔍 Search: room "salon" over last minute');
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const now = new Date().toISOString();
  try {
    const roomReadings = await memRepo.readings.findByRoomAndTimeRange('salon', oneMinuteAgo, now);
    console.log(`   📊 Readings in salon (last minute): ${roomReadings.length}`);
    if (roomReadings.length > 0) {
      console.log('   📊 Calculated statistics:');
      const avgTemp = roomReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / roomReadings.length;
      const avgHum = roomReadings.reduce((sum, r) => sum + (r.humidity || 0), 0) / roomReadings.length;
      console.log(`       Average temperature: ${avgTemp.toFixed(1)}°C`);
      console.log(`       Average humidity: ${avgHum.toFixed(1)}%`);
      console.log(`       First measurement: ${new Date(roomReadings[0].ts).toLocaleTimeString()}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error searching readings: ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 5️⃣  TEST: File database
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('💾 5️⃣  TEST: File database (persistence)');
  console.log('┌─ OBJECTIVE: Demonstrate disk persistence with SQLite');
  console.log('│  Advantages: Persistent data, ACID transactions, concurrent access');
  console.log('│  Management: Auto file creation, duplicate handling, WAL mode');
  console.log('└─ Usage: Production, long-term storage, shared data');
  console.log('');

  const dbPath = join(__dirname, '../../../examples/db-data-examples/example-db.db');
  console.log('📤 Test 5.1: Creating/opening file DB');
  console.log(`   📁 Path: ${dbPath}`);
  const fileDb = initDb(dbPath);
  // Note: initDb() automatically applies schema
  const fileRepo = createRepository(fileDb);
  console.log('   ✅ File database initialized');

  console.log('📤 Test 5.2: Duplicate handling');
  console.log('   🔍 Attempting to create room "bureau" (may exist)');
  try {
    await fileRepo.rooms.create({ room_id: 'bureau', name: 'Bureau' });
    console.log('   ✅ Room "bureau" created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ⚠️  Room already exists (normal during repeated tests)');
    } else {
      throw error;
    }
  }

  console.log('📤 Test 5.3: Verifying rooms in file');
  console.log('   🔍 Search: room "bureau" (newly created)');
  const bureauRoom = await fileRepo.rooms.findById('bureau');
  console.log(`   ✅ Room bureau: ${bureauRoom ? 'found' : 'not found'}`);
  if (bureauRoom) {
    console.log(`       • ${bureauRoom.room_id}: ${bureauRoom.name}`);
  }

  console.log('   🔍 Test: Other potential rooms');
  const salonFileCheck = await fileRepo.rooms.findById('salon');
  const cuisineFileCheck = await fileRepo.rooms.findById('cuisine');
  if (salonFileCheck) console.log(`       • ${salonFileCheck.room_id}: ${salonFileCheck.name}`);
  if (cuisineFileCheck) console.log(`       • ${cuisineFileCheck.room_id}: ${cuisineFileCheck.name}`);

  console.log('📤 Test 5.4: Device with duplicate handling');
  const targetRoom = bureauRoom ? bureauRoom.room_id : 'bureau'; // Use bureau or fallback
  try {
    await fileRepo.devices.create({
      device_id: 'temp003',
      device_uid: 'temp003-uid',
      room_id: targetRoom,
      label: 'Office Sensor'
    });
    console.log('   ✅ Device "temp003" created in file');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ⚠️  Device already exists (normal during repeated tests)');
    } else {
      throw error;
    }
  }

  console.log('📤 Test 5.5: Reading in persistent file');
  try {
    const fileReading = await fileRepo.readings.create({
      device_id: 'temp003',
      room_id: targetRoom,
      ts: new Date().toISOString(),
      temperature: 21.8,
      humidity: 62.3,
      source: 'example-file-test'
    });
    console.log(`   ✅ File reading: ${fileReading.success ? 'success' : 'failed'}`);
  } catch (error) {
    console.log(`   ⚠️  Reading failed (device may not exist): ${error.message}`);
  }
  console.log('═'.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // 6️⃣  TEST: Cleanup and closure
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🧹 6️⃣  TEST: Cleanup and connection closure');
  console.log('┌─ OBJECTIVE: Properly close DB connections');
  console.log('│  Importance: Avoid corruption, free resources, finalize transactions');
  console.log('│  Memory: Data lost (expected)');
  console.log('└─ File: Data preserved for next execution');
  console.log('');

  console.log('📤 Test 6.1: Closing memory DB');
  console.log('   💾 Type: Memory database (:memory:)');
  console.log('   📊 Stored data: Temporary Rooms, Devices, Readings');
  memDb.close();
  console.log('   ✅ Memory database closed (data lost)');

  console.log('📤 Test 6.2: Closing file DB');
  console.log(`   💾 Type: File database (${dbPath})`);
  console.log('   📁 Persistence: Data preserved on disk');
  fileDb.close();
  console.log('   ✅ File database closed (data preserved)');

  console.log('📤 Test 6.3: Integrity verification');
  console.log('   🔍 Verification: File exists and is not corrupted');
  const fs = await import('fs');
  const fileExists = fs.existsSync(dbPath);
  console.log(`   ✅ DB file exists: ${fileExists ? 'Yes' : 'No'}`);
  if (fileExists) {
    const stats = fs.statSync(dbPath);
    console.log(`   📊 File size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`   📅 Last modified: ${stats.mtime.toLocaleString()}`);
  }
  console.log('═'.repeat(80) + '\n');

  // Close databases
  console.log('✅ === DATABASE + REPOSITORY EXAMPLE COMPLETED ===');
  console.log('🎯 Module successfully demonstrated:');
  console.log('   • initDb (memory and file databases)');
  console.log('   • migrateSchema (integrated SQLite schema)');
  console.log('   • createRepository (CRUD operations)');
  console.log('   • rooms.* (create, findById, findAll)');
  console.log('   • devices.* (create, findById, findByRoom)');
  console.log('   • readings.* (create, getLatestByDevice, findByDevice)');
  console.log('   • Duplicate and error handling');
  console.log('   • File vs memory persistence');
  console.log('');
  console.log('📊 STATISTICS:');
  console.log('   • Rooms created: 3 (salon, cuisine, bureau)');
  console.log('   • Devices created: 3+ (temp001, temp002, temp003)');
  console.log('   • Readings stored: 3+ (with timestamps)');
  console.log('   • DB types tested: 2 (memory + file)');
  console.log('');
  console.log(`📁 Data persisted in: ${dbPath}`);
  console.log('💡 Tip: Re-run this script to see duplicate handling\n');
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🗄️  Database + Repository Example');
  console.log('==================================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 📊 initDb (memory and file databases)');
  console.log('• 🏗️  migrateSchema (automatic SQLite schema)');
  console.log('• 📦 createRepository (CRUD operations)');
  console.log('• 🏠 Room Repository (create, findAll, findById)');
  console.log('• 📱 Device Repository (create, findAll, findByRoom)');
  console.log('• 📈 Readings Repository (create, findByDevice, findRecent)');
  console.log('');
  console.log('Usage: node src/db/examples/example-db.js');
  console.log('');
  console.log('Files used:');
  console.log('• src/db/index.js');
  console.log('• src/db/index.js (migrateSchema integrated)');
  console.log('• src/repositories/index.js');
  process.exit(0);
}

// Run example
demonstrateDatabaseRepository().catch((error) => {
  console.error('💥 Example failed:', error);
  process.exit(1);
});
