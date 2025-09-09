#!/usr/bin/env node

/**
 * Complete Service Demo - Phase 4 Integration
 * Demonstrates the complete pipeline: MQTT → Database → HTTP API
 */

import { config } from '../src/config.js';
import { initDb, closeDb } from '../src/db/index.js';
import { createServer } from '../src/http/server.js';
import { ingestMessage } from '../src/ingestion/index.js';

console.log('🚀 Starting Complete Service Demo - Phase 4 Integration\n');

// Demo configuration
const DEMO_CONFIG = {
  database: {
    path: './demo-complete-integration.db'
  },
  http: {
    port: 3000
  },
  demo: {
    duration: 30000, // 30 seconds
    intervalMs: 2000 // New reading every 2 seconds
  }
};

// Sample sensor devices and rooms
const DEMO_DEVICES = [
  { id: 'sensor-001', room: 'bedroom' },
  { id: 'sensor-002', room: 'living_room' },
  { id: 'sensor-003', room: 'kitchen' },
  { id: 'sensor-004', room: 'bathroom' },
  { id: 'sensor-005', room: 'office' }
];

class CompleteServiceDemo {
  constructor() {
    this.database = null;
    this.server = null;
    this.demoInterval = null;
    this.readingCounter = 0;
  }

  async initialize() {
    console.log('📊 Initializing database...');
    this.database = initDb(DEMO_CONFIG.database.path);
    console.log('✅ Database ready\n');

    console.log('🌐 Starting HTTP server...');
    this.server = createServer(this.database);

    await new Promise((resolve, reject) => {
      this.server.listen(DEMO_CONFIG.http.port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`✅ HTTP Server listening on port ${DEMO_CONFIG.http.port}`);
    console.log(`   Health: http://localhost:${DEMO_CONFIG.http.port}/health`);
    console.log(`   API: http://localhost:${DEMO_CONFIG.http.port}/api/v1/readings/latest\n`);
  }

  generateRandomReading(device) {
    const baseTemp = {
      'bedroom': 22,
      'living_room': 24,
      'kitchen': 26,
      'bathroom': 23,
      'office': 21
    };

    const baseHumidity = {
      'bedroom': 65,
      'living_room': 58,
      'kitchen': 72,
      'bathroom': 78,
      'office': 55
    };

    return {
      device_id: device.id,
      timestamp: new Date().toISOString(),
      temperature: baseTemp[device.room] + (Math.random() - 0.5) * 4, // ±2°C variation
      humidity: baseHumidity[device.room] + (Math.random() - 0.5) * 10 // ±5% variation
    };
  }

  async simulateMqttMessage(device) {
    const reading = this.generateRandomReading(device);
    const topic = `temperature/${device.room}`;
    const payload = JSON.stringify(reading);

    console.log(`📡 MQTT → DB: ${topic} | ${device.id} | ${reading.temperature.toFixed(1)}°C | ${reading.humidity.toFixed(1)}%`);

    try {
      await ingestMessage(this.database, topic, payload);
      this.readingCounter++;
    } catch (error) {
      console.error(`❌ Ingestion failed: ${error.message}`);
    }
  }

  async startDataGeneration() {
    console.log('🔄 Starting continuous data generation...\n');

    this.demoInterval = setInterval(async () => {
      // Select random device
      const device = DEMO_DEVICES[Math.floor(Math.random() * DEMO_DEVICES.length)];
      await this.simulateMqttMessage(device);
    }, DEMO_CONFIG.demo.intervalMs);

    // Generate initial data immediately
    for (const device of DEMO_DEVICES) {
      await this.simulateMqttMessage(device);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
  }

  async demonstrateHttpApi() {
    console.log('\n🌐 Demonstrating HTTP API...\n');

    try {
      // Test health endpoint
      console.log('🏥 Testing health endpoint...');
      const healthResponse = await fetch(`http://localhost:${DEMO_CONFIG.http.port}/health`);
      const healthData = await healthResponse.json();
      console.log(`   Status: ${healthResponse.status} | Response: ${JSON.stringify(healthData)}`);

      // Test readings endpoint
      console.log('\n📊 Testing readings endpoint...');
      const readingsResponse = await fetch(`http://localhost:${DEMO_CONFIG.http.port}/api/v1/readings/latest`);
      const readingsData = await readingsResponse.json();
      console.log(`   Status: ${readingsResponse.status} | Found ${readingsData.data.length} devices`);

      readingsData.data.forEach(reading => {
        console.log(`     ${reading.device} (${reading.room}): ${reading.temperature.toFixed(1)}°C, ${reading.humidity.toFixed(1)}% at ${reading.timestamp}`);
      });

      // Test device filtering
      console.log('\n🔍 Testing device filtering...');
      const filteredResponse = await fetch(`http://localhost:${DEMO_CONFIG.http.port}/api/v1/readings/latest?deviceId=sensor-001`);
      const filteredData = await filteredResponse.json();
      console.log(`   Filtered results: ${filteredData.data.length} reading(s) for sensor-001`);

    } catch (error) {
      console.error(`❌ HTTP API test failed: ${error.message}`);
    }
  }

  async showStatistics() {
    console.log('\n📈 Current Statistics:');
    console.log(`   Total readings ingested: ${this.readingCounter}`);
    console.log(`   Active devices: ${DEMO_DEVICES.length}`);
    console.log(`   Data generation interval: ${DEMO_CONFIG.demo.intervalMs}ms`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      console.log('✅ Stopped data generation');
    }

    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      console.log('✅ HTTP server stopped');
    }

    if (this.database) {
      await closeDb();
      console.log('✅ Database closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.startDataGeneration();

      // Initial API demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.demonstrateHttpApi();

      // Show periodic updates
      const updateInterval = setInterval(async () => {
        await this.showStatistics();
        await this.demonstrateHttpApi();
      }, 5000);

      // Run for demo duration
      console.log(`\n⏰ Demo will run for ${DEMO_CONFIG.demo.duration / 1000} seconds...`);
      console.log('   🌐 You can test the API manually:');
      console.log(`   curl http://localhost:${DEMO_CONFIG.http.port}/health`);
      console.log(`   curl http://localhost:${DEMO_CONFIG.http.port}/api/v1/readings/latest`);
      console.log(`   curl "http://localhost:${DEMO_CONFIG.http.port}/api/v1/readings/latest?deviceId=sensor-001"`);

      await new Promise(resolve => setTimeout(resolve, DEMO_CONFIG.demo.duration));

      clearInterval(updateInterval);
      await this.showStatistics();

      console.log('\n🎉 Demo completed successfully!');

    } catch (error) {
      console.error(`💥 Demo failed: ${error.message}`);
      console.error(error.stack);
    } finally {
      await this.cleanup();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the demo
const demo = new CompleteServiceDemo();
demo.run().then(() => {
  console.log('\n👋 Demo finished');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Demo crashed:', error.message);
  process.exit(1);
});
