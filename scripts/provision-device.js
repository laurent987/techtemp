#!/usr/bin/env node
/**
 * @file Device Provisioning Script
 * Utilise l'architecture Repository pour provisionner devices et placements
 * Compatible avec Journal #009 MVP consolidation
 */

import { initDb } from '../backend/db/index.js';
import { createRepository } from '../backend/repositories/index.js';
import { createDataAccess } from '../backend/db/dataAccess.js';

/**
 * Generate room_uid from room name
 * @param {string} roomName - Human readable room name
 * @returns {string} - Generated room_uid
 */
function generateRoomUid(roomName) {
  return roomName
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dash
    .replace(/-+/g, '-')         // Replace multiple dashes with single
    .replace(/^-|-$/g, '');      // Remove leading/trailing dashes
}

/**
 * Provision a device and optionally place it in a room
 * @param {string} deviceUid - Unique device identifier
 * @param {string} label - Human-readable device label
 * @param {string} model - Device model (optional)
 * @param {string} roomName - Room name for placement (optional, auto-generates room_uid)
 * @param {string} dbPath - Database path
 */
async function provisionDevice({
  deviceUid,
  label,
  model = 'AHT20',
  roomName = null,
  dbPath = './iot.db'
}) {
  console.log('🚀 Starting device provisioning...');
  console.log(`📱 Device UID: ${deviceUid}`);
  console.log(`🏷️  Label: ${label}`);
  console.log(`📦 Model: ${model}`);
  if (roomName) {
    console.log(`🏠 Room: ${roomName}`);
  }

  let db;
  let roomUid = null;

  // Generate room_uid from roomName if provided
  if (roomName) {
    roomUid = generateRoomUid(roomName);
    console.log(`🔧 Generated room_uid: ${roomUid}`);
  }
  try {
    // Initialize database and repository
    db = initDb(dbPath);
    const repository = createRepository(db);

    // 1. Create room if specified and doesn't exist
    if (roomUid && roomName) {
      console.log(`🏠 Checking room: ${roomUid}`);

      const existingRoom = await repository.rooms.findByUid(roomUid);
      if (!existingRoom) {
        console.log(`🏗️  Creating room: ${roomName} (${roomUid})`);
        await repository.rooms.create({
          uid: roomUid,
          name: roomName
        });
        console.log('✅ Room created');
      } else {
        console.log(`✅ Room '${existingRoom.name}' already exists`);
      }
    }

    // 2. Create device (or update if exists)
    console.log(`📱 Checking device: ${deviceUid}`);

    const existingDevice = await repository.devices.findByUid(deviceUid);
    if (!existingDevice) {
      console.log(`🔧 Creating device: ${label}`);
      await repository.devices.create({
        uid: deviceUid,
        label: label,
        model: model,
        last_seen_at: new Date().toISOString()
      });
      console.log('✅ Device created');
    } else {
      console.log('✅ Device already exists');
    }

    // 3. Create device placement if room specified
    if (roomUid) {
      console.log(`🔗 Setting up device placement in room: ${roomUid}`);

      // Get the room record to get the numeric ID
      const roomRecord = await repository.rooms.findByUid(roomUid);
      if (!roomRecord) {
        throw new Error(`Room ${roomUid} not found`);
      }

      // For now, we'll create the placement record manually
      // TODO: Add placement management to Repository when needed
      const dataAccess = repository._dataAccess || createDataAccess(db);
      const deviceRecord = await repository.devices.findByUid(deviceUid);

      try {
        await dataAccess.insertDevicePlacement({
          device_id: deviceRecord.id,
          room_id: roomRecord.id,  // Use numeric room ID
          from_ts: new Date().toISOString(),
          to_ts: null
        });
        console.log('✅ Device placement created');
      } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
          console.log('✅ Device placement already exists');
        } else {
          throw error;
        }
      }
    }

    console.log('');
    console.log('🎉 Device provisioning completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Device UID: ${deviceUid}`);
    console.log(`   Label: ${label}`);
    console.log(`   Model: ${model}`);
    if (roomName) {
      console.log(`   Room: ${roomName} (${roomUid})`);
    }
    console.log('');
    console.log('🧪 Test with:');
    console.log(`   curl 'http://localhost:3000/api/v1/readings/latest?deviceId=${deviceUid}'`);

  } catch (error) {
    console.error('❌ Provisioning failed:', error.message);
    process.exit(1);
  } finally {
    if (db && db.open) {
      db.close();
    }
  }
}

// CLI interface
function printUsage() {
  console.log('Usage: node provision-device.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --uid <string>       Device UID (required)');
  console.log('  --label <string>     Device label (required)');
  console.log('  --model <string>     Device model (default: AHT20)');
  console.log('  --room-name <string> Room name for placement (auto-generates room_uid)');
  console.log('  --db-path <string>   Database path (default: ./iot.db)');
  console.log('  --help              Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  # Simple device provisioning');
  console.log('  node provision-device.js --uid "aht20-abc123" --label "Capteur Salon"');
  console.log('');
  console.log('  # Device with room placement (room created automatically)');
  console.log('  node provision-device.js \\');
  console.log('    --uid "aht20-abc123" \\');
  console.log('    --label "Capteur Salon" \\');
  console.log('    --room-name "Salon"');
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--uid':
        config.deviceUid = args[++i];
        break;
      case '--label':
        config.label = args[++i];
        break;
      case '--model':
        config.model = args[++i];
        break;
      case '--room-name':
        config.roomName = args[++i];
        break;
      case '--room-id':
        console.warn('⚠️  --room-id is deprecated. Use --room-name instead.');
        config.roomName = args[++i]; // Treat as roomName for compatibility
        break;
      case '--db-path':
        config.dbPath = args[++i];
        break;
      case '--help':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  // Validate required fields
  if (!config.deviceUid || !config.label) {
    console.error('❌ Error: --uid and --label are required');
    printUsage();
    process.exit(1);
  }

  return config;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = parseArgs();
  provisionDevice(config);
}

export { provisionDevice };
