#!/usr/bin/env node
/**
 * @file Batch Device Provisioning Script
 * Provision multiple devices from a JSON configuration file
 * Compatible with Journal #009 MVP consolidation
 */

import { readFileSync } from 'fs';
import { provisionDevice } from './provision-device.js';

/**
 * Provision multiple devices from configuration
 * @param {string} configPath - Path to JSON configuration file
 * @param {string} dbPath - Database path
 */
async function batchProvisionDevices(configPath, dbPath = './iot.db') {
  console.log('🚀 Starting batch device provisioning...');
  console.log(`📄 Configuration: ${configPath}`);
  console.log(`🗄️  Database: ${dbPath}`);
  console.log('');

  let config;
  try {
    const configData = readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('❌ Failed to read configuration file:', error.message);
    process.exit(1);
  }

  if (!config.devices || !Array.isArray(config.devices)) {
    console.error('❌ Configuration must contain a "devices" array');
    process.exit(1);
  }

  console.log(`📋 Found ${config.devices.length} devices to provision`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const [index, device] of config.devices.entries()) {
    console.log(`📱 [${index + 1}/${config.devices.length}] Processing device: ${device.uid || 'Unknown'}`);

    try {
      await provisionDevice({
        deviceUid: device.uid,
        label: device.label,
        model: device.model || 'AHT20',
        roomName: device.roomName,
        dbPath: dbPath
      });
      successCount++;
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to provision device ${device.uid}:`, error.message);
      errorCount++;
      console.log('');
    }
  }

  console.log('🎯 Batch provisioning completed!');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${config.devices.length}`);
}

// CLI interface
function printUsage() {
  console.log('Usage: node batch-provision.js <config-file> [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  config-file          Path to JSON configuration file');
  console.log('');
  console.log('Options:');
  console.log('  --db-path <string>   Database path (default: ./iot.db)');
  console.log('  --help              Show this help');
  console.log('');
  console.log('Configuration file format:');
  console.log('{');
  console.log('  "devices": [');
  console.log('    {');
  console.log('      "uid": "aht20-abc123",');
  console.log('      "label": "Capteur Salon",');
  console.log('      "model": "AHT20",');
  console.log('      "roomName": "Salon"');
  console.log('    },');
  console.log('    {');
  console.log('      "uid": "aht20-def456",');
  console.log('      "label": "Capteur Cuisine",');
  console.log('      "roomName": "Cuisine"');
  console.log('    }');
  console.log('  ]');
  console.log('}');
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const configFile = args[0];
  let dbPath = './iot.db';

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--db-path':
        dbPath = args[++i];
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  return { configFile, dbPath };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const { configFile, dbPath } = parseArgs();
  batchProvisionDevices(configFile, dbPath);
}

export { batchProvisionDevices };
