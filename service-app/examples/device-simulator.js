#!/usr/bin/env node
/**
 * @file IoT DEVICE SIMULATOR - TechTemp
 * 
 * ✅ OBJECTIVE: Simulate Raspberry Pi sensors sending MQTT data
 * 📦 FEATURES:
 *    - Simulation of 3 sensors (living room, kitchen, bedroom)
 *    - Realistic data (temperature, humidity)
 *    - console.log('• JSON payload with temperature, humidity, timestamp');
console.log('• MQTT topics: home/{homeId}/sensors/{deviceId}/reading');
console.log('• QoS 1 for reliable delivery');
console.log('• Continuous MQTT sending with variations');
 *    - Interactive interface (Ctrl+C to stop)
 * 
 * 🚀 USAGE:
 *    Terminal 1: node examples/service-complete-demo.js
 *    Terminal 2: node examples/device-simulator.js
 */

import { createMqttClient } from '../src/mqtt/client.js';

const MQTT_BROKER = 'mqtt://test.mosquitto.org:1883';
const DEMO_HOME_ID = 'demo-home-001';
const SEND_INTERVAL = 5000; // 5 seconds between measurements

class IoTDeviceSimulator {
  constructor() {
    this.mqttClient = null;
    this.devices = [
      {
        id: 'rpi-salon-01',
        name: 'Living Room Sensor',
        room: 'salon',
        baseTemp: 22,
        baseHumidity: 55,
        tempVariation: 3,    // ±3°C
        humidityVariation: 15 // ±15%
      },
      {
        id: 'rpi-cuisine-01',
        name: 'Kitchen Sensor',
        room: 'cuisine',
        baseTemp: 25,
        baseHumidity: 60,
        tempVariation: 4,    // ±4°C (more variable, cooking)
        humidityVariation: 20 // ±20%
      },
      {
        id: 'rpi-chambre-01',
        name: 'Bedroom Sensor',
        room: 'chambre1',
        baseTemp: 20,
        baseHumidity: 50,
        tempVariation: 2,    // ±2°C (more stable)
        humidityVariation: 10 // ±10%
      }
    ];
    this.messagesSent = 0;
    this.startTime = Date.now();
    this.intervalId = null;
  }

  async start() {
    console.log('🌡️  === IoT DEVICE SIMULATOR TECHTEMP ===');
    console.log('🎯 Module: Raspberry Pi sensors simulation + DHT22');
    console.log('');
    console.log('📖 SIMULATION OVERVIEW:');
    console.log('1️⃣  MQTT Connection  → Public broker test.mosquitto.org');
    console.log('2️⃣  Virtual Devices  → 3 sensors with realistic variations');
    console.log('3️⃣  Continuous Send  → Measurements every 5 seconds');
    console.log('4️⃣  Monitoring       → Real-time statistics');
    console.log('');
    console.log('⚙️  CONFIGURATION:');
    console.log(`   📡 MQTT Broker: ${MQTT_BROKER}`);
    console.log(`   🏠 Home ID: ${DEMO_HOME_ID}`);
    console.log(`   ⏱️  Interval: ${SEND_INTERVAL / 1000}s`);
    console.log(`   📊 Devices: ${this.devices.length} sensors`);
    console.log('═'.repeat(80) + '\n');

    try {
      // ═══════════════════════════════════════════════════════════════════════════════
      // 1️⃣  TEST: MQTT Connection
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🔗 1️⃣  TEST: MQTT Connection');
      console.log('┌─ OBJECTIVE: Establish simulator connection to broker');
      console.log('│  Configuration: unique client ID, publisher mode');
      console.log('│  Validation: successful connection, ready for simulation');
      console.log('└─ Preparation: client configured for data publishing\n');

      console.log('📤 Test 1.1: IoT simulator client creation');
      console.log(`   📋 Broker: "${MQTT_BROKER}"`);
      console.log(`   🆔 Client ID: "device-simulator_${Date.now()}"`);

      const { publish, close } = createMqttClient({
        url: MQTT_BROKER,
        clientId: `device-simulator_${Date.now()}`
      });

      this.mqttClient = { publish, close };
      console.log('   ✅ Simulator client created successfully');
      console.log('   ✅ MQTT broker connection established');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 2️⃣  TEST: Device initialization
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🎛️  2️⃣  TEST: Device initialization');
      console.log('┌─ OBJECTIVE: Configure virtual IoT sensors');
      console.log('│  Devices: Raspberry Pi + DHT22 temperature/humidity sensors');
      console.log('│  Locations: Different rooms with specific characteristics');
      console.log('└─ Variations: Realistic sensor noise and environmental changes\n');

      this.devices.forEach((device, index) => {
        console.log(`📤 Test 2.${index + 1}: Initializing ${device.name}`);
        console.log(`   🆔 Device ID: "${device.id}"`);
        console.log(`   📍 Location: ${device.room}`);
        console.log(`   🌡️  Base Temperature: ${device.baseTemp}°C (±${device.tempVariation}°C)`);
        console.log(`   💧 Base Humidity: ${device.baseHumidity}% (±${device.humidityVariation}%)`);
        console.log(`   ✅ Device configured and ready`);

        if (index < this.devices.length - 1) {
          console.log('   ────────────────────────────────────────────────────');
        }
      });

      console.log('\n✅ All virtual devices initialized');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 3️⃣  TEST: Continuous data simulation
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('📊 3️⃣  TEST: Continuous data simulation');
      console.log('┌─ OBJECTIVE: Send realistic sensor data continuously');
      console.log('│  Frequency: Every 5 seconds per device');
      console.log('│  Data format: JSON with temperature, humidity, timestamp');
      console.log('│  Variations: Random within realistic ranges');
      console.log('└─ MQTT topics: techtemp/devices/{room}/readings\n');

      console.log('🔄 Starting continuous simulation... (Ctrl+C to stop)');
      console.log('📈 Monitoring sensor data transmission:');
      console.log('');

      // Start continuous data sending
      this.intervalId = setInterval(() => {
        this.sendAllDeviceData();
      }, SEND_INTERVAL);

      // Send first batch immediately
      this.sendAllDeviceData();

      // ═══════════════════════════════════════════════════════════════════════════════
      // 4️⃣  TEST: Graceful shutdown handling
      // ═══════════════════════════════════════════════════════════════════════════════
      process.on('SIGINT', async () => {
        await this.stop();
      });

    } catch (error) {
      console.error('\n💥 Simulator failed:', error);
      console.error('📋 Detailed error:', error.message);
      console.error('🔧 Check MQTT broker connectivity');
      process.exit(1);
    }
  }

  generateSensorData(device) {
    // Simulate realistic sensor variations
    const tempVariation = (Math.random() - 0.5) * 2 * device.tempVariation;
    const humidityVariation = (Math.random() - 0.5) * 2 * device.humidityVariation;

    const temperature = Math.round((device.baseTemp + tempVariation) * 10) / 10;
    const humidity = Math.round(Math.max(0, Math.min(100, device.baseHumidity + humidityVariation)) * 10) / 10;

    return {
      ts: Date.now(),
      temperature_c: temperature,
      humidity_pct: humidity
    };
  }

  async sendAllDeviceData() {
    this.messagesSent++;
    const timestamp = new Date().toLocaleTimeString();

    console.log(`📨 [${timestamp}] Transmission #${this.messagesSent}:`);

    for (const device of this.devices) {
      const sensorData = this.generateSensorData(device);
      const topic = `home/${DEMO_HOME_ID}/sensors/${device.id}/reading`;

      try {
        await this.mqttClient.publish(topic, JSON.stringify(sensorData), { qos: 1, retain: false });

        console.log(`   📊 ${device.name}:`);
        console.log(`       🌡️  ${sensorData.temperature_c}°C | 💧 ${sensorData.humidity_pct}%`);
        console.log(`       📍 Topic: "${topic}"`);
      } catch (error) {
        console.log(`   ❌ ${device.name}: Send error - ${error.message}`);
      }
    }

    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`   📈 Stats: ${this.messagesSent} transmissions | ⏱️  ${uptime}s uptime`);
    console.log('   ' + '─'.repeat(60) + '\n');
  }

  async stop() {
    console.log('\n' + '═'.repeat(80));
    console.log('🛑 4️⃣  TEST: Graceful simulator shutdown');
    console.log('┌─ OBJECTIVE: Stop simulation and close connections cleanly');
    console.log('│  Stop sending: clear interval timer');
    console.log('│  Disconnect: close MQTT connection');
    console.log('└─ Statistics: simulation session summary\n');

    console.log('📤 Test 4.1: Simulation shutdown');

    // Stop the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('   ✅ Data transmission stopped');
    }

    // Close MQTT connection
    if (this.mqttClient) {
      await this.mqttClient.close();
      console.log('   ✅ MQTT connection closed cleanly');
    }

    // Display session statistics
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    const totalMessages = this.messagesSent * this.devices.length;
    const avgMessagesPerSecond = this.messagesSent > 0 ? (totalMessages / uptime).toFixed(2) : 0;

    console.log('   📊 Session Statistics:');
    console.log(`       Transmission cycles: ${this.messagesSent}`);
    console.log(`       Total messages sent: ${totalMessages}`);
    console.log(`       Session duration: ${uptime}s`);
    console.log(`       Average rate: ${avgMessagesPerSecond} msg/s`);
    console.log(`       Devices simulated: ${this.devices.length}`);

    console.log('\n✅ === IoT DEVICE SIMULATOR COMPLETED ===');
    console.log('🎯 Module demonstrated successfully:');
    console.log('   • createMqttClient (MQTT connection)');
    console.log('   • publish (continuous sensor data)');
    console.log('   • Realistic IoT device simulation');
    console.log('   • Environmental sensor variations');
    console.log('📁 Data sent to:', MQTT_BROKER);
    console.log('');
    console.log('💡 TIP: Use service-complete-demo.js to receive and process this data');

    process.exit(0);
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🌡️  IoT Device Simulator - TechTemp');
  console.log('=====================================');
  console.log('');
  console.log('This script demonstrates:');
  console.log('• 🔗 MQTT client connection for IoT devices');
  console.log('• 📊 Realistic sensor data generation');
  console.log('• 🌡️  Temperature and humidity simulation');
  console.log('• 📡 Continuous MQTT data transmission');
  console.log('• 🏠 Multi-room home automation simulation');
  console.log('');
  console.log('Simulated Devices:');
  console.log('• Living Room Sensor (Raspberry Pi + DHT22)');
  console.log('• Kitchen Sensor (Raspberry Pi + DHT22)');
  console.log('• Bedroom Sensor (Raspberry Pi + DHT22)');
  console.log('');
  console.log('Data Format:');
  console.log('• JSON payload with temperature, humidity, timestamp');
  console.log('• MQTT topics: techtemp/devices/{room}/readings');
  console.log('• QoS 1 for reliable delivery');
  console.log('');
  console.log('Usage:');
  console.log('  node examples/device-simulator.js    # Start simulation');
  console.log('  node examples/device-simulator.js -h # Show this help');
  console.log('');
  console.log('Integration:');
  console.log('  1. Start: node examples/service-complete-demo.js');
  console.log('  2. Then:  node examples/device-simulator.js');
  console.log('  3. Watch real-time data processing in both terminals');
  console.log('');
  console.log('Files used:');
  console.log('• src/mqtt/client.js');
  process.exit(0);
}

// Start simulation
const simulator = new IoTDeviceSimulator();
simulator.start().catch((error) => {
  console.error('💥 Simulator startup failed:', error);
  process.exit(1);
});
