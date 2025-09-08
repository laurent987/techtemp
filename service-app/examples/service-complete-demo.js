/**
 * @file COMPLETE DEMO - TechTemp Service App with IoT Pipeline
 * 
 * ✅ OBJECTIVE: Complete IoT pipeline demonstration
 * 📦 DEMONSTRATED COMPONENTS:
 *    - HTTP API with /health, /api/v1/readings/latest, /api/v1/stats endpoints
 *    - Real MQTT client (test.mosquitto.org) with ingestion pipeline
 *    - SQLite database with automatic migrations and Repository pattern
 *    - Real-time monitoring with structured logs
 * 
 * 🚀 USAGE:
 *    Terminal 1: node examples/service-complete-demo.js
 *    Terminal 2: node examples/device-simulator.js
 * 
 * 📡 API ENDPOINTS:
 *    GET /health              → Service status
 *    GET /api/v1/readings/latest → Latest sensor readings
 *    GET /api/v1/stats        → Database statistics
 */

import { createMqttClient } from '../src/mqtt/client.js';
import { initDb } from '../src/db/index.js';
import { createRepository } from '../src/repositories/index.js';
import { promises as fs } from 'fs';
import http from 'http';
import url from 'url';

const MQTT_BROKER = 'mqtt://test.mosquitto.org:1883';  // Broker MQTT public
const HTTP_PORT = 13000;  // Port HTTP pour la démo
const DB_PATH = './examples/db-example/demo-techtemp.db';  // Database in dedicated folder
const DEMO_HOME_ID = 'demo-home-001';  // ID home pour la démo

class TechTempServiceDemo {
  constructor() {
    this.mqttClient = null;
    this.httpServer = null;
    this.db = null;
    this.repository = null;
    this.receivedMessages = 0;
  }

  async start() {
    console.log('🚀 === COMPLETE TECHTEMP SERVICE DEMO ===');
    console.log('🎯 Module: Complete IoT pipeline with HTTP API');
    console.log('');
    console.log('📖 COMPONENT OVERVIEW:');
    console.log('1️⃣  Database     → SQLite with automatic migrations');
    console.log('2️⃣  Rooms/Devices → Base data (typical house setup)');
    console.log('3️⃣  HTTP API     → Server with /health endpoint');
    console.log('4️⃣  MQTT Client  → Public broker connection');
    console.log('5️⃣  Ingestion    → MQTT → Database pipeline');
    console.log('6️⃣  Monitoring   → Real-time data consultation');
    console.log('');
    console.log('⚙️  CONFIGURATION:');
    console.log(`   🌐 API HTTP: http://localhost:${HTTP_PORT}`);
    console.log(`   📡 MQTT Broker: ${MQTT_BROKER}`);
    console.log(`   💾 Database: ${DB_PATH}`);
    console.log(`   🏠 Home ID: ${DEMO_HOME_ID}`);
    console.log('═'.repeat(80) + '\n');

    try {
      // 1. Initialize database
      console.log('📊 1. Database initialization...');
      await this.initializeDatabase();
      console.log('✅ Database ready\n');

      // 2. Create base data
      console.log('🏠 2. Creating base data...');
      await this.setupBaseData();
      console.log('✅ Rooms and devices created\n');

      // 3. Start HTTP server (simulation)
      console.log('🌐 3. Starting HTTP server...');
      await this.startHttpServer();
      console.log(`✅ HTTP API (simulated) on http://localhost:${HTTP_PORT}\n`);

      // 4. Connect real MQTT client
      console.log('📡 4. REAL MQTT connection...');
      await this.connectMqtt();
      console.log('✅ MQTT client connected to public broker\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 5️⃣  TEST: Waiting for device messages (production mode)
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('⏳ 5️⃣  TEST: Waiting for IoT device messages');
      console.log('┌─ OBJECTIVE: Receive data from real or simulated sensors');
      console.log('│  Production Mode: Raspberry Pi + DHT22 send via MQTT');
      console.log('│  Demo Mode: Launch device-simulator.js in another terminal');
      console.log('└─ Pipeline: Automatic ingestion MQTT → Repository → SQLite');
      console.log('');
      console.log('📤 Test 5.1: Service waiting');
      console.log('   🔄 Ingestion pipeline active and operational');
      console.log('   📡 MQTT listening: home/demo-home-001/sensors/+/reading');
      console.log('   💾 Database: ready for storage');
      console.log('   🌐 HTTP API: /health and /api/v1/* endpoints available');
      console.log('');
      console.log('📤 Test 5.2: Instructions for sending data');
      console.log('   💡 Option A - Automatic simulator:');
      console.log('       Terminal 2: node examples/device-simulator.js');
      console.log('   💡 Option B - Manual test:');
      console.log('       mosquitto_pub -h test.mosquitto.org -t "home/demo-home-001/sensors/rpi-salon-01/reading" \\');
      console.log('                     -m \'{"ts":' + Date.now() + ',"temperature_c":23.5,"humidity_pct":65.2}\'');
      console.log('   💡 Option C - Production:');
      console.log('       Raspberry Pi sensors configured with this MQTT contract');
      console.log('');
      console.log('✅ Service ready to receive sensor data');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 6️⃣  TEST: Continuous service operation
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🔄 6️⃣  TEST: Continuous service operation');
      console.log('┌─ OBJECTIVE: Demonstrate complete operational service');
      console.log('│  Components: HTTP API + MQTT Ingestion + Database');
      console.log('│  Monitoring: Real-time statistics');
      console.log('└─ Duration: Infinite (Ctrl+C to stop)');
      console.log('');

      // Display initial state
      await this.displayServiceStatus();
      console.log('✅ Service operational');
      console.log('═'.repeat(80) + '\n');

      console.log('🎉 === TECHTEMP SERVICE OPERATIONAL ===');
      console.log('');
      console.log('📊 ACTIVE COMPONENTS:');
      console.log('   ✅ HTTP API      → http://localhost:13000/health');
      console.log('   ✅ MQTT Ingestion → Real-time from test.mosquitto.org');
      console.log('   ✅ SQLite Database → Automatic persistence');
      console.log('   ✅ Repository    → Business logic layer');
      console.log('');
      console.log('🌡️  EXPECTED SENSORS:');
      console.log('   • rpi-salon-01   → Living Room');
      console.log('   • rpi-cuisine-01 → Kitchen');
      console.log('   • rpi-chambre-01 → Bedroom');
      console.log('');
      console.log('💡 AVAILABLE ACTIONS:');
      console.log('   • Test API: curl http://localhost:13000/health');
      console.log('   • Simulate sensors: node examples/device-simulator.js (other terminal)');
      console.log('   • Query DB: sqlite3 ./examples/db-example/demo-techtemp.db');
      console.log('');
      console.log('⏳ Service waiting for data... (Ctrl+C to stop)');

      // Start real-time monitoring
      this.startRealTimeMonitoring();

      // Wait indefinitely
      await this.waitForShutdown();

    } catch (error) {
      console.error('💥 Error during demo:', error.message);
      throw error;
    }
  }

  async initializeDatabase() {
    // Create destination folder if it doesn't exist
    const dbDir = DB_PATH.substring(0, DB_PATH.lastIndexOf('/'));
    try {
      await fs.mkdir(dbDir, { recursive: true });
    } catch (e) {
      // Folder already exists
    }

    // Delete old database if it exists
    try {
      await fs.unlink(DB_PATH);
      console.log('📤 Test 1.1: Cleaning old database');
      console.log('   🗑️  Old file deleted for clean demo');
    } catch (e) {
      console.log('📤 Test 1.1: Fresh installation');
      console.log('   ✨ No existing file (first time)');
    }

    console.log('📤 Test 1.2: Creating SQLite database');
    console.log(`   📁 Path: ${DB_PATH}`);
    console.log(`   📂 Directory: ${dbDir}`);
    // Create new database with real schema
    this.db = initDb(DB_PATH);
    console.log('   ✅ SQLite database created');

    console.log('📤 Test 1.3: Applying migrations');
    console.log('   🏗️  Target: Schema version 2');
    console.log('   ✅ Migrations applied (tables: rooms, devices, readings_raw)');

    console.log('📤 Test 1.4: Creating Repository');
    this.repository = createRepository(this.db);
    console.log('   ✅ Repository pattern configured (business logic layer)');
  }

  async setupBaseData() {
    console.log('📤 Test 2.1: Creating rooms (house rooms)');
    // Create rooms
    const rooms = [
      { room_id: 'salon', name: 'Salon' },
      { room_id: 'cuisine', name: 'Cuisine' },
      { room_id: 'chambre1', name: 'Chambre 1' }
    ];

    for (const room of rooms) {
      await this.repository.rooms.create(room);
      console.log(`   🏠 Room created: ${room.name} (ID: ${room.room_id})`);
    }

    console.log('📤 Test 2.2: Creating IoT devices');
    // Create devices
    const devices = [
      {
        device_id: 'rpi-salon-01',
        device_uid: 'rpi-salon-01',
        room_id: 'salon',
        label: 'Main Living Room Sensor'
      },
      {
        device_id: 'rpi-cuisine-01',
        device_uid: 'rpi-cuisine-01',
        room_id: 'cuisine',
        label: 'Kitchen Sensor'
      },
      {
        device_id: 'rpi-chambre-01',
        device_uid: 'rpi-chambre-01',
        room_id: 'chambre1',
        label: 'Bedroom 1 Sensor'
      }
    ];

    for (const device of devices) {
      await this.repository.devices.create(device);
      console.log(`   📱 Device created: ${device.label} → room_id: ${device.room_id}`);
    }

    console.log('📤 Test 2.3: Mapping devices → rooms');
    console.log('   📊 Associations:');
    devices.forEach(d => {
      console.log(`       ${d.device_id} → ${d.room_id}`);
    });
  }

  async startHttpServer() {
    console.log('📤 Test 3.1: Creating HTTP server');
    console.log(`   🌐 Port: ${HTTP_PORT}`);

    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        try {
          // Route: GET /health
          if (pathname === '/health' && req.method === 'GET') {
            const healthData = {
              status: 'ok',
              timestamp: new Date().toISOString(),
              service: 'techtemp-service',
              version: '1.0.0',
              components: {
                database: this.db ? 'connected' : 'disconnected',
                mqtt: this.mqttClient ? 'connected' : 'disconnected',
                http: 'active'
              },
              stats: {
                receivedMessages: this.receivedMessages,
                uptime: process.uptime()
              }
            };

            res.writeHead(200);
            res.end(JSON.stringify(healthData, null, 2));
            return;
          }

          // Route: GET /api/v1/readings/latest
          if (pathname === '/api/v1/readings/latest' && req.method === 'GET') {
            const devices = ['rpi-salon-01', 'rpi-cuisine-01', 'rpi-chambre-01'];
            const latestReadings = [];

            for (const deviceId of devices) {
              const latest = await this.repository.readings.getLatestByDevice(deviceId);
              if (latest) {
                latestReadings.push({
                  device_id: latest.device_id,
                  room_id: latest.room_id,
                  ts: latest.ts,
                  temperature: latest.temperature,
                  humidity: latest.humidity,
                  source: latest.source
                });
              }
            }

            res.writeHead(200);
            res.end(JSON.stringify({ data: latestReadings }, null, 2));
            return;
          }

          // Route: GET /api/v1/stats
          if (pathname === '/api/v1/stats' && req.method === 'GET') {
            const stats = this.db.prepare(`
              SELECT 
                COUNT(*) as total_readings,
                COUNT(DISTINCT device_id) as total_devices,
                MIN(ts) as first_reading,
                MAX(ts) as last_reading
              FROM readings_raw
            `).get();

            res.writeHead(200);
            res.end(JSON.stringify({ stats }, null, 2));
            return;
          }

          // Route non trouvée
          res.writeHead(404);
          res.end(JSON.stringify({
            error: 'Not Found',
            available_endpoints: ['/health', '/api/v1/readings/latest', '/api/v1/stats']
          }, null, 2));

        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }, null, 2));
        }
      });

      this.httpServer.listen(HTTP_PORT, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('   ✅ Serveur HTTP démarré');
          console.log('� Test 3.2: Configuration endpoints');
          console.log('   📋 Routes disponibles:');
          console.log('       GET /health                     → Health check complet');
          console.log('       GET /api/v1/readings/latest     → Latest measurements');
          console.log('       GET /api/v1/stats               → Statistiques globales');
          console.log('📤 Test 3.3: Test rapide endpoints');
          console.log(`   � Testez: curl http://localhost:${HTTP_PORT}/health`);
          console.log(`   💡 Browser: http://localhost:${HTTP_PORT}/health`);
          resolve();
        }
      });
    });
  }

  async connectMqtt() {
    console.log('📤 Test 4.1: Creating MQTT client');
    console.log(`   📡 Broker: ${MQTT_BROKER}`);

    // Use our real MQTT client
    this.mqttClient = createMqttClient({
      url: MQTT_BROKER,
      clientId: `techtemp-demo-${Date.now()}`
    });
    console.log('   ✅ MQTT client created');

    console.log('📤 Test 4.2: Configuring ingestion handler');
    // Setup handlers to receive messages
    this.mqttClient.onMessage((topic, payload) => {
      this.handleMqttMessage(topic, payload);
    });
    console.log('   ✅ MQTT → Repository pipeline configured');

    console.log('📤 Test 4.3: Subscribing to sensor topics');
    // Subscribe to topics according to contract
    const topic = `home/${DEMO_HOME_ID}/sensors/+/reading`;
    await this.mqttClient.subscribe(topic);
    console.log(`   📝 Subscribed pattern: ${topic}`);
    console.log('   📋 Topics covered:');
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-salon-01/reading`);
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-cuisine-01/reading`);
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-chambre-01/reading`);
    console.log('   ✅ Real-time ingestion operational');
  }

  async simulateSensorsViaMqtt() {
    console.log('📤 Test 5.1: Preparing sensor simulation');
    const sensors = [
      { deviceId: 'rpi-salon-01', roomId: 'salon', name: 'Salon', baseTemp: 22 },
      { deviceId: 'rpi-cuisine-01', roomId: 'cuisine', name: 'Cuisine', baseTemp: 25 },
      { deviceId: 'rpi-chambre-01', roomId: 'chambre1', name: 'Chambre', baseTemp: 20 }
    ];

    console.log('   📡 Mode: MQTT messages via public broker');
    console.log('   🌐 Broker: test.mosquitto.org');
    console.log('   📊 Simulated sensors:');
    sensors.forEach(s => {
      console.log(`       ${s.deviceId} → ${s.name} (${s.baseTemp}°C nominal)`);
    });

    console.log('📤 Test 5.2: Generating realistic data');
    console.log('   🔄 Sending 2 measurement cycles per sensor...');

    for (let cycle = 1; cycle <= 2; cycle++) {
      console.log(`   📊 Cycle ${cycle}/2:`);

      for (const sensor of sensors) {
        // Generate data according to MQTT contract with realistic variations
        const tempVariation = (Math.random() - 0.5) * 4; // ±2°C
        const temperature_c = sensor.baseTemp + tempVariation;
        const humidity_pct = 45 + Math.random() * 25; // 45-70%

        const mqttPayload = {
          ts: Date.now(),  // epoch ms UTC according to contract
          temperature_c: Math.round(temperature_c * 10) / 10,
          humidity_pct: Math.round(humidity_pct * 10) / 10
        };

        const topic = `home/${DEMO_HOME_ID}/sensors/${sensor.deviceId}/reading`;

        // Publier via notre vrai client MQTT
        await this.mqttClient.publish(topic, JSON.stringify(mqttPayload));

        console.log(`       📤 ${sensor.name}: ${mqttPayload.temperature_c}°C, ${mqttPayload.humidity_pct}%`);

        // Small pause to see message order
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (cycle < 2) {
        console.log('       ⏱️  Pause 1s between cycles...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('📤 Test 5.3: Waiting for message reception');
    console.log('   ⏳ Delay for asynchronous MQTT processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`   ✅ Simulated messages sent (${sensors.length * 2} total)`);
  }

  async displayServiceStatus() {
    console.log('📤 Test 6.1: Component status');
    console.log('   🌐 HTTP API: Active');
    console.log(`   📡 MQTT: ${this.mqttClient ? 'Connected' : 'Disconnected'}`);
    console.log(`   💾 Database: ${this.db ? 'Ready' : 'Not initialized'}`);
    console.log(`   📊 Messages received: ${this.receivedMessages}`);

    console.log('📤 Test 6.2: Testing API endpoints');
    try {
      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_readings,
          COUNT(DISTINCT device_id) as total_devices,
          MAX(ts) as last_reading
        FROM readings_raw
      `).get();

      console.log(`   📊 Total measurements in database: ${stats.total_readings}`);
      console.log(`   📱 Active devices: ${stats.total_devices}`);
      console.log(`   🕐 Last measurement: ${stats.last_reading || 'None'}`);
    } catch (error) {
      console.log(`   ⚠️  Database read error: ${error.message}`);
    }
  }

  startRealTimeMonitoring() {
    let lastMessageCount = this.receivedMessages;

    // Display stats every 30 seconds
    this.monitoringInterval = setInterval(() => {
      const newMessages = this.receivedMessages - lastMessageCount;

      if (newMessages > 0) {
        console.log(`\n📊 [${new Date().toLocaleTimeString()}] Activity detected:`);
        console.log(`   📥 +${newMessages} new MQTT messages`);
        console.log(`   📈 Total received: ${this.receivedMessages}`);

        // Display latest measurements
        try {
          const latest = this.db.prepare(`
            SELECT device_id, temperature, humidity, ts 
            FROM readings_raw 
            ORDER BY ts DESC 
            LIMIT 3
          `).all();

          if (latest.length > 0) {
            console.log('   📋 Latest measurements:');
            latest.forEach(r => {
              const time = new Date(r.ts).toLocaleTimeString();
              console.log(`       ${r.device_id}: ${r.temperature}°C, ${r.humidity}% (${time})`);
            });
          }
        } catch (e) {
          console.log('   ⚠️  Error reading latest measurements');
        }

        lastMessageCount = this.receivedMessages;
      }
    }, 30000); // 30 secondes
  }

  async waitForShutdown() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Service shutdown requested...');
        await this.stop();
        resolve();
      });
    });
  }
  async handleMqttMessage(topic, payload) {
    try {
      this.receivedMessages++;
      const messageNum = this.receivedMessages;

      console.log('');
      console.log(`📨 ════════════ INGESTION MESSAGE #${messageNum} ════════════`);
      console.log(`📡 MQTT Topic received: ${topic}`);

      // Parse topic according to contract: home/{homeId}/sensors/{deviceId}/reading
      const topicParts = topic.split('/');
      if (topicParts.length !== 5 || topicParts[0] !== 'home' || topicParts[2] !== 'sensors' || topicParts[4] !== 'reading') {
        console.log(`❌ Invalid topic (expected format: home/{homeId}/sensors/{deviceId}/reading)`);
        console.log(`   Received topic: ${topic}`);
        return;
      }

      const homeId = topicParts[1];
      const deviceId = topicParts[3];

      console.log(`🏠 Home ID: ${homeId}`);
      console.log(`📱 Device ID: ${deviceId}`);

      // Parse JSON payload
      let data;
      try {
        data = JSON.parse(payload.toString());
        console.log(`📄 Raw payload: ${JSON.stringify(data)}`);
      } catch (e) {
        console.log(`❌ ERROR: Invalid JSON payload`);
        console.log(`   Received payload: ${payload}`);
        return;
      }

      // Validate required fields according to contract
      if (!data.ts || typeof data.temperature_c !== 'number' || typeof data.humidity_pct !== 'number') {
        console.log(`❌ ERROR: Missing required fields`);
        console.log(`   Expected: {ts: number, temperature_c: number, humidity_pct: number}`);
        console.log(`   Received: ${JSON.stringify(data)}`);
        return;
      }

      // Resolve room_id from created devices
      let roomId = null;
      if (deviceId === 'rpi-salon-01') roomId = 'salon';
      if (deviceId === 'rpi-cuisine-01') roomId = 'cuisine';
      if (deviceId === 'rpi-chambre-01') roomId = 'chambre1';

      if (!roomId) {
        console.log(`❌ ERROR: Unknown device in configuration`);
        console.log(`   Device ID: ${deviceId}`);
        console.log(`   Configured devices: rpi-salon-01, rpi-cuisine-01, rpi-chambre-01`);
        return;
      }

      console.log(`🎯 Mapping: ${deviceId} → room "${roomId}"`);

      // Display data transformations
      console.log(`🔄 Data transformation:`);
      console.log(`   Timestamp: ${data.ts} → ${new Date(data.ts).toISOString()}`);
      console.log(`   Température: temperature_c=${data.temperature_c} → temperature=${data.temperature_c}`);
      console.log(`   Humidité: humidity_pct=${data.humidity_pct} → humidity=${data.humidity_pct}`);

      // Transform according to contract: temperature_c → temperature, humidity_pct → humidity
      const reading = {
        device_id: deviceId,
        room_id: roomId,
        ts: new Date(data.ts).toISOString(),  // Convert epoch ms → ISO string
        temperature: data.temperature_c,       // Mapping according to contract
        humidity: data.humidity_pct,          // Mapping according to contract
        source: 'mqtt',
        msg_id: `${deviceId}-${data.ts}`      // Unique ID for deduplication
      };

      console.log(`💾 Object for SQLite:`);
      console.log(`   device_id: "${reading.device_id}"`);
      console.log(`   room_id: "${reading.room_id}"`);
      console.log(`   ts: "${reading.ts}"`);
      console.log(`   temperature: ${reading.temperature}°C`);
      console.log(`   humidity: ${reading.humidity}%`);
      console.log(`   source: "${reading.source}"`);
      console.log(`   msg_id: "${reading.msg_id}"`);

      // Save via Repository
      console.log(`📤 Saving via Repository...`);
      const result = await this.repository.readings.create(reading);

      if (result.success) {
        console.log(`✅ SUCCESS: Data saved to SQLite`);
        console.log(`   📊 ${deviceId} (${roomId}): ${reading.temperature}°C, ${reading.humidity}%`);
        console.log(`   🕐 Timestamp: ${reading.ts}`);
        console.log(`   📈 Total messages processed: ${messageNum}`);
      } else {
        console.log(`❌ ERROR: SQLite save failed`);
        console.log(`   Device: ${deviceId}`);
        console.log(`   Error: ${result.error || 'Unknown error'}`);
      }

      console.log(`═════════════════════════════════════════════════`);

    } catch (error) {
      console.log(`💥 CRITICAL ERROR: ${error.message}`);
      console.log(`📍 Context:`);
      console.log(`   Topic: ${topic}`);
      console.log(`   Payload: ${payload}`);
      console.log(`   Stack: ${error.stack}`);
      console.log(`═════════════════════════════════════════════════`);
    }
  }

  async demonstrateApi() {
    // Wait a bit for all MQTT messages to be processed
    console.log('   ⏳ Waiting for all MQTT messages to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate API calls that would normally be made via HTTP
    console.log('   📈 Latest measurements by device:');

    // Simuler GET /api/v1/readings/latest
    const devices = ['rpi-salon-01', 'rpi-cuisine-01'];
    const latestReadings = [];

    for (const deviceId of devices) {
      const latest = await this.repository.readings.getLatestByDevice(deviceId);
      if (latest) {
        latestReadings.push({
          device_id: latest.device_id,
          room_id: latest.room_id,
          ts: latest.ts,
          temperature: latest.temperature,
          humidity: latest.humidity
        });

        console.log(`      📱 ${deviceId}: ${latest.temperature}°C, ${latest.humidity}% (${latest.ts})`);
      }
    }

    if (latestReadings.length === 0) {
      console.log('      ⚠️  No data received via MQTT (check internet connection)');
      return;
    }

    // Simulate a query by room and time range
    console.log('\n   📊 Living room history (last 5 minutes):');
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const salonHistory = await this.repository.readings.findByRoomAndTimeRange(
      'salon',
      fiveMinutesAgo.toISOString(),
      now.toISOString()
    );

    salonHistory.forEach((reading, index) => {
      console.log(`      ${index + 1}. ${reading.temperature}°C, ${reading.humidity}% à ${reading.ts}`);
    });

    // Afficher le format JSON comme une vraie API
    console.log('\n   🔍 Format API JSON (GET /api/v1/readings/latest) :');
    const apiResponse = { data: latestReadings };
    console.log(JSON.stringify(apiResponse, null, 2));
  }

  async exploreDatabase() {
    console.log('\n🔍 === DIRECT DATABASE EXPLORATION ===');
    console.log(`📁 Fichier: ${DB_PATH}\n`);

    try {
      // 1. Statistiques générales
      console.log('📊 Statistiques générales :');
      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_readings,
          COUNT(DISTINCT device_id) as total_devices,
          COUNT(DISTINCT room_id) as total_rooms,
          MIN(ts) as first_reading,
          MAX(ts) as last_reading
        FROM readings_raw
      `).get();

      console.log(`   • Total mesures : ${stats.total_readings}`);
      console.log(`   • Devices actifs : ${stats.total_devices}`);
      console.log(`   • Rooms utilisées : ${stats.total_rooms}`);
      console.log(`   • Première mesure : ${stats.first_reading}`);
      console.log(`   • Last measurement: ${stats.last_reading}`);

      // 2. Data by device
      console.log('\n📱 Mesures par device :');
      const deviceStats = this.db.prepare(`
        SELECT 
          device_id,
          room_id,
          COUNT(*) as count,
          ROUND(AVG(temperature), 1) as avg_temp,
          ROUND(AVG(humidity), 1) as avg_humidity,
          MIN(temperature) as min_temp,
          MAX(temperature) as max_temp
        FROM readings_raw 
        GROUP BY device_id, room_id
        ORDER BY device_id
      `).all();

      deviceStats.forEach(stat => {
        console.log(`   📊 ${stat.device_id} (${stat.room_id}):`);
        console.log(`      • ${stat.count} mesures`);
        console.log(`      • Température: ${stat.avg_temp}°C moyenne (${stat.min_temp}°C - ${stat.max_temp}°C)`);
        console.log(`      • Humidité: ${stat.avg_humidity}% moyenne`);
      });

      // 3. All raw data (last 10)
      console.log('\n📋 Latest measurements (chronological):');
      const recentReadings = this.db.prepare(`
        SELECT device_id, room_id, temperature, humidity, ts, source, msg_id
        FROM readings_raw 
        ORDER BY ts DESC 
        LIMIT 10
      `).all();

      console.log('   ID Device      | Room    | Temp  | Humid | Timestamp                 | Source | Msg ID');
      console.log('   -------------- | ------- | ----- | ----- | ------------------------- | ------ | -----------');
      recentReadings.forEach(reading => {
        const devicePadded = reading.device_id.padEnd(14);
        const roomPadded = (reading.room_id || 'null').padEnd(7);
        const tempPadded = `${reading.temperature}°C`.padEnd(5);
        const humidPadded = `${reading.humidity}%`.padEnd(5);
        const tsPadded = reading.ts.padEnd(25);
        const sourcePadded = reading.source.padEnd(6);
        console.log(`   ${devicePadded} | ${roomPadded} | ${tempPadded} | ${humidPadded} | ${tsPadded} | ${sourcePadded} | ${reading.msg_id}`);
      });

      // 4. Structure des tables
      console.log('\n🏗️  Structure de la base :');
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
      `).all();

      tables.forEach(table => {
        console.log(`\n   📋 Table: ${table.name}`);
        const schema = this.db.prepare(`PRAGMA table_info(${table.name})`).all();
        schema.forEach(col => {
          const nullable = col.notnull ? 'NOT NULL' : 'NULL';
          const pk = col.pk ? ' PRIMARY KEY' : '';
          const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
          console.log(`      • ${col.name}: ${col.type} ${nullable}${pk}${defaultVal}`);
        });
      });

      console.log('\n💡 Vous pouvez aussi utiliser sqlite3 en ligne de commande :');
      console.log(`   sqlite3 ${DB_PATH} "SELECT * FROM readings_raw;"`);

    } catch (error) {
      console.error('❌ Error during exploration:', error.message);
    }
  }

  async stop() {
    console.log('\n🛑 === ARRÊT DU SERVICE TECHTEMP ===');

    // Arrêter le monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      console.log('✅ Monitoring temps réel arrêté');
    }

    // Fermer le serveur HTTP
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          console.log('✅ Serveur HTTP fermé');
          this.closeRemainingConnections().then(resolve);
        });
      });
    } else {
      await this.closeRemainingConnections();
    }
  }

  async closeRemainingConnections() {
    // Fermer MQTT
    if (this.mqttClient) {
      await this.mqttClient.close();
      console.log('✅ Client MQTT fermé');
    }

    // Close database
    if (this.db) {
      this.db.close();
      console.log('✅ Database closed');
    }

    // Statistiques finales
    console.log('');
    console.log('📊 STATISTIQUES FINALES:');
    console.log(`   📥 Messages MQTT traités: ${this.receivedMessages}`);
    console.log(`   💾 Database: ${DB_PATH}`);
    console.log(`   📡 Broker utilisé: ${MQTT_BROKER}`);
    console.log('');
    console.log('👋 Service TechTemp arrêté proprement');
  }
}

// Exécuter la démo
async function main() {
  const demo = new TechTempServiceDemo();

  try {
    await demo.start();

    // Garder la démo ouverte pour exploration
    console.log('\n⏳ Démo active - Appuyez sur Ctrl+C pour arrêter...');

    // Garder le processus ouvert
    process.on('SIGINT', async () => {
      console.log('\n👋 Arrêt demandé...');
      await demo.stop();
      process.exit(0);
    });



  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    await demo.stop();
    process.exit(1);
  }
}

// Démarrer la démo
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TechTempServiceDemo };
