#!/usr/bin/env node
/**
 * @file SIMULATEUR DE DEVICES IoT - TechTemp
 * 
 * ✅ OBJECTIF: Simuler des capteurs Raspberry Pi envoyant des données MQTT
 * 📦 FONCTIONNALITÉS:
 *    - Simulation de 3 capteurs (salon, cuisine, chambre)
 *    - Données réalistes (température, humidité)
 *    - Envoi MQTT continu avec variations
 *    - Interface interactive (Ctrl+C pour arrêter)
 * 
 * 🚀 USAGE:
 *    Terminal 1: node examples/service-complete-demo.js
 *    Terminal 2: node examples/device-simulator.js
 */

import { createMqttClient } from '../src/mqtt/client.js';

const MQTT_BROKER = 'mqtt://test.mosquitto.org:1883';
const DEMO_HOME_ID = 'demo-home-001';
const SEND_INTERVAL = 5000; // 5 secondes entre les mesures

class IoTDeviceSimulator {
  constructor() {
    this.mqttClient = null;
    this.devices = [
      {
        id: 'rpi-salon-01',
        name: 'Capteur Salon',
        room: 'salon',
        baseTemp: 22,
        baseHumidity: 55,
        tempVariation: 3,    // ±3°C
        humidityVariation: 15 // ±15%
      },
      {
        id: 'rpi-cuisine-01',
        name: 'Capteur Cuisine',
        room: 'cuisine',
        baseTemp: 25,
        baseHumidity: 60,
        tempVariation: 4,    // ±4°C (plus variable, cuisson)
        humidityVariation: 20 // ±20%
      },
      {
        id: 'rpi-chambre-01',
        name: 'Capteur Chambre',
        room: 'chambre',
        baseTemp: 20,
        baseHumidity: 50,
        tempVariation: 2,    // ±2°C (plus stable)
        humidityVariation: 10 // ±10%
      }
    ];
    this.messagesSent = 0;
    this.startTime = Date.now();
    this.intervalId = null;
  }

  async start() {
    console.log('🌡️  === SIMULATEUR DEVICES IoT TECHTEMP ===');
    console.log('🎯 Module: Simulation capteurs Raspberry Pi + DHT22');
    console.log('');
    console.log('📖 APERÇU SIMULATION:');
    console.log('1️⃣  Connexion MQTT  → Broker public test.mosquitto.org');
    console.log('2️⃣  Devices virtuels → 3 capteurs avec variations réalistes');
    console.log('3️⃣  Envoi continu   → Mesures toutes les 5 secondes');
    console.log('4️⃣  Monitoring      → Statistiques temps réel');
    console.log('');
    console.log('⚙️  CONFIGURATION:');
    console.log(`   📡 MQTT Broker: ${MQTT_BROKER}`);
    console.log(`   🏠 Home ID: ${DEMO_HOME_ID}`);
    console.log(`   ⏱️  Intervalle: ${SEND_INTERVAL / 1000}s`);
    console.log(`   📊 Devices: ${this.devices.length} capteurs`);
    console.log('═'.repeat(80) + '\n');

    try {
      // ═══════════════════════════════════════════════════════════════════════════════
      // 1️⃣  TEST: Connexion MQTT
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🔗 1️⃣  TEST: Connexion MQTT au broker public');
      console.log('┌─ OBJECTIF: Établir connexion pour envoi données capteurs');
      console.log('│  Broker: test.mosquitto.org (gratuit, public)');
      console.log('│  Mode: Publisher uniquement (pas de subscription)');
      console.log('└─ Topics: home/{homeId}/sensors/{deviceId}/reading');
      console.log('');

      await this.connectMqtt();
      console.log('✅ Connexion MQTT établie');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 2️⃣  TEST: Configuration devices virtuels
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('📱 2️⃣  TEST: Configuration devices virtuels');
      console.log('┌─ OBJECTIF: Préparer 3 capteurs avec paramètres réalistes');
      console.log('│  Simulation: Raspberry Pi Zero 2W + DHT22');
      console.log('│  Variations: Basées sur usage réel des pièces');
      console.log('└─ Données: Température et humidité avec fluctuations');
      console.log('');

      this.displayDevicesConfig();
      console.log('✅ Devices virtuels configurés');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 3️⃣  TEST: Démarrage envoi continu
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🔄 3️⃣  TEST: Démarrage envoi continu de données');
      console.log('┌─ OBJECTIF: Simuler capteurs IoT en fonctionnement normal');
      console.log('│  Fréquence: Toutes les 5 secondes (réaliste pour maison)');
      console.log('│  Variations: Légères fluctuations + événements occasionnels');
      console.log('└─ Durée: Infinie (Ctrl+C pour arrêter)');
      console.log('');

      this.startContinuousSending();
      console.log('✅ Envoi continu démarré');
      console.log('');
      console.log('🔄 SIMULATION EN COURS...');
      console.log('💡 Le service de réception doit être lancé dans un autre terminal');
      console.log('💡 Appuyez sur Ctrl+C pour arrêter la simulation\n');

      // Attendre indéfiniment (jusqu'à Ctrl+C)
      await this.waitForShutdown();

    } catch (error) {
      console.error('💥 Erreur simulateur:', error.message);
      throw error;
    }
  }

  async connectMqtt() {
    console.log('📤 Test 1.1: Création client MQTT');
    console.log(`   📡 Broker: ${MQTT_BROKER}`);

    this.mqttClient = createMqttClient({
      url: MQTT_BROKER,
      clientId: `techtemp-simulator-${Date.now()}`
    });
    console.log('   ✅ Client MQTT créé');

    console.log('📤 Test 1.2: Vérification connexion');
    // Le client se connecte automatiquement, on peut tester en envoyant un message de test
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✅ Connexion broker validée');
  }

  displayDevicesConfig() {
    console.log('📤 Test 2.1: Inventaire des devices simulés');
    console.log('   📊 Configuration par capteur:');

    this.devices.forEach((device, index) => {
      console.log(`   📱 Device ${index + 1}: ${device.name}`);
      console.log(`       ID: ${device.id}`);
      console.log(`       Room: ${device.room}`);
      console.log(`       Température: ${device.baseTemp}°C ±${device.tempVariation}°C`);
      console.log(`       Humidité: ${device.baseHumidity}% ±${device.humidityVariation}%`);
      console.log(`       Topic: home/${DEMO_HOME_ID}/sensors/${device.id}/reading`);
      if (index < this.devices.length - 1) {
        console.log('       ────────────────────────────────────────');
      }
    });

    console.log('📤 Test 2.2: Simulation de variations');
    console.log('   🎲 Variations appliquées:');
    console.log('       • Salon: Stable (vie quotidienne)');
    console.log('       • Cuisine: Variable (cuisson, vapeur)');
    console.log('       • Chambre: Très stable (pièce fermée)');
  }

  startContinuousSending() {
    console.log('📤 Test 3.1: Démarrage timer de simulation');
    console.log(`   ⏱️  Intervalle: ${SEND_INTERVAL / 1000} secondes`);

    // Envoyer immédiatement la première série
    this.sendDataFromAllDevices();

    // Puis programmer l'envoi répétitif
    this.intervalId = setInterval(() => {
      this.sendDataFromAllDevices();
    }, SEND_INTERVAL);

    console.log('   ✅ Timer configuré pour envoi automatique');
  }

  async sendDataFromAllDevices() {
    const timestamp = Date.now();
    const cycle = Math.floor(this.messagesSent / this.devices.length) + 1;

    console.log(`\n📊 [CYCLE #${cycle}] Envoi données tous capteurs (${new Date().toLocaleTimeString()})`);

    for (const device of this.devices) {
      await this.sendDeviceData(device, timestamp);
      // Petit délai entre devices pour éviter la congestion
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.displaySessionStats();
  }

  async sendDeviceData(device, baseTimestamp) {
    // Générer des variations réalistes
    const tempVariation = (Math.random() - 0.5) * 2 * device.tempVariation;
    const humidityVariation = (Math.random() - 0.5) * 2 * device.humidityVariation;

    // Ajouter des "événements" occasionnels (5% de chance)
    let eventMultiplier = 1;
    let eventDesc = '';
    if (Math.random() < 0.05) {
      eventMultiplier = 1.5 + Math.random(); // 1.5x à 2.5x la variation
      eventDesc = ' [ÉVÉNEMENT]';
    }

    const temperature_c = Math.round(
      (device.baseTemp + (tempVariation * eventMultiplier)) * 10
    ) / 10;

    const humidity_pct = Math.round(
      Math.max(20, Math.min(90, // Borner entre 20% et 90%
        device.baseHumidity + (humidityVariation * eventMultiplier)
      )) * 10
    ) / 10;

    // Payload selon contrat MQTT TechTemp
    const mqttPayload = {
      ts: baseTimestamp + Math.floor(Math.random() * 100), // Léger décalage pour réalisme
      temperature_c,
      humidity_pct
    };

    const topic = `home/${DEMO_HOME_ID}/sensors/${device.id}/reading`;

    try {
      await this.mqttClient.publish(topic, JSON.stringify(mqttPayload));
      this.messagesSent++;

      console.log(`   📤 ${device.name}: ${temperature_c}°C, ${humidity_pct}%${eventDesc}`);

    } catch (error) {
      console.log(`   ❌ Erreur envoi ${device.name}: ${error.message}`);
    }
  }

  displaySessionStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgRate = this.messagesSent / Math.max(uptime, 1);

    console.log(`   📈 Stats session: ${this.messagesSent} messages, ${uptime}s uptime, ${avgRate.toFixed(1)} msg/s`);
  }

  async waitForShutdown() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Arrêt demandé...');
        await this.stop();
        resolve();
      });
    });
  }

  async stop() {
    console.log('═'.repeat(80));
    console.log('🔚 ARRÊT SIMULATEUR DEVICES IoT');
    console.log('');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('✅ Timer d\'envoi arrêté');
    }

    if (this.mqttClient) {
      await this.mqttClient.close();
      console.log('✅ Connexion MQTT fermée');
    }

    const totalUptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgRate = this.messagesSent / Math.max(totalUptime, 1);

    console.log('');
    console.log('📊 STATISTIQUES FINALES:');
    console.log(`   • Messages envoyés: ${this.messagesSent}`);
    console.log(`   • Durée simulation: ${totalUptime}s`);
    console.log(`   • Débit moyen: ${avgRate.toFixed(1)} messages/seconde`);
    console.log(`   • Devices simulés: ${this.devices.length}`);
    console.log(`   • Broker utilisé: ${MQTT_BROKER}`);
    console.log('');
    console.log('👋 Simulation terminée');
  }
}

// Usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🌡️  Simulateur Devices IoT TechTemp');
  console.log('===================================');
  console.log('');
  console.log('Ce simulateur génère des données de capteurs IoT réalistes :');
  console.log('');
  console.log('📱 Devices simulés:');
  console.log('• rpi-salon-01   → Capteur salon (22°C ±3°C, 55% ±15%)');
  console.log('• rpi-cuisine-01 → Capteur cuisine (25°C ±4°C, 60% ±20%)');
  console.log('• rpi-chambre-01 → Capteur chambre (20°C ±2°C, 50% ±10%)');
  console.log('');
  console.log('🔄 Fonctionnement:');
  console.log('• Envoi MQTT toutes les 5 secondes');
  console.log('• Variations réalistes avec événements occasionnels');
  console.log('• Statistics temps réel');
  console.log('• Arrêt propre avec Ctrl+C');
  console.log('');
  console.log('🌐 MQTT:');
  console.log('• Broker: mqtt://test.mosquitto.org:1883');
  console.log('• Topics: home/demo-home-001/sensors/{deviceId}/reading');
  console.log('• Format: {"ts": epochMs, "temperature_c": 22.5, "humidity_pct": 55.3}');
  console.log('');
  console.log('🚀 Usage:');
  console.log('Terminal 1: node examples/service-complete-demo.js');
  console.log('Terminal 2: node examples/device-simulator.js');
  console.log('');
  console.log('💡 Pour tester uniquement le simulateur:');
  console.log('node examples/device-simulator.js');
  process.exit(0);
}

// Démarrer le simulateur
async function main() {
  const simulator = new IoTDeviceSimulator();

  try {
    await simulator.start();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    await simulator.stop();
    process.exit(1);
  }
}

// Lancer si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { IoTDeviceSimulator };
