/**
 * @file DEMO COMPLÈTE - TechTemp Service App avec MQ    try {
      // ═══════════════════════════════════════════════════════════════════════════════
      // 1️⃣  TEST: Initialisation base de données
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🔗 1️⃣  TEST: Initialisation base de données SQLite');
      console.log('┌─ OBJECTIF: Créer base persistante avec schema IoT complet');
      console.log('│  Migrations: Automatiques vers version 2 (temperature/humidity)');
      console.log('│  Tables: rooms, devices, readings_raw');
      console.log('└─ Nettoyage: Suppression ancienne base pour démo propre');
      console.log('');
      await this.initializeDatabase();
      console.log('✅ Base de données prête et migrée');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 2️⃣  TEST: Données de base (rooms & devices)
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🏠 2️⃣  TEST: Création données de base (maison type)');
      console.log('┌─ OBJECTIF: Simuler une vraie maison avec capteurs IoT');
      console.log('│  Rooms: Salon, Cuisine, Chambre (avec étages et orientations)');
      console.log('│  Devices: Raspberry Pi Zero 2W avec capteurs DHT22');
      console.log('└─ Mapping: device_id → room_id pour ingestion');
      console.log('');
      await this.setupBaseData();
      console.log('✅ Maison virtuelle créée avec capteurs');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 3️⃣  TEST: Serveur HTTP avec API
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('🌐 3️⃣  TEST: Serveur HTTP avec endpoints API');
      console.log('┌─ OBJECTIF: Serveur HTTP pour monitoring et health checks');
      console.log('│  Endpoints: /health, /api/v1/readings/latest, /api/v1/stats');
      console.log('│  Features: CORS, JSON responses, error handling');
      console.log('└─ Monitoring: Accessible via curl ou navigateur');
      console.log('');
      await this.startHttpServer();
      console.log(`✅ API HTTP active sur http://localhost:${HTTP_PORT}`);
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 4️⃣  TEST: Connexion MQTT réelle
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('📡 4️⃣  TEST: Connexion MQTT au broker public');
      console.log('┌─ OBJECTIF: Établir connexion MQTT pour ingestion temps réel');
      console.log('│  Broker: test.mosquitto.org (public, gratuit)');
      console.log('│  Topics: home/{homeId}/sensors/{deviceId}/reading');
      console.log('└─ Handler: Pipeline automatique MQTT → Repository → SQLite');
      console.log('');
      await this.connectMqtt();
      console.log('✅ Pipeline ingestion MQTT → Database opérationnel');
      console.log('═'.repeat(80) + '\n'); ✅ OBJECTIF: Démonstration complète du pipeline IoT
 * 📦 COMPOSANTS DÉMONTRÉS:
 *    - API HTTP avec endpoint /health
 *    - Client MQTT réel (test.mosquitto.org)
 *    - Pipeline ingestion MQTT → Database
 *    - Repository pattern avec SQLite
 *    - Simulation capteurs réalistes
 * 
 * 🚀 USAGE:
 *    Terminal 1: node examples/service-complete-demo.js
 *    Terminal 2: node examples/device-simulator.js (à créer)
 */

import { createMqttClient } from '../src/mqtt/client.js';
import { initDb } from '../src/db/index.js';
import { createRepository } from '../src/repositories/index.js';
import { promises as fs } from 'fs';
import http from 'http';
import url from 'url';

const MQTT_BROKER = 'mqtt://test.mosquitto.org:1883';  // Broker MQTT public
const HTTP_PORT = 13000;  // Port HTTP pour la démo
const DB_PATH = './examples/db-example/demo-techtemp.db';  // Base de données dans dossier dédié
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
    console.log('🚀 === DEMO COMPLÈTE TECHTEMP SERVICE ===');
    console.log('🎯 Module: Pipeline IoT complet avec API HTTP');
    console.log('');
    console.log('📖 APERÇU DES COMPOSANTS:');
    console.log('1️⃣  Database     → SQLite avec migrations automatiques');
    console.log('2️⃣  Rooms/Devices → Données de base (maison type)');
    console.log('3️⃣  API HTTP     → Serveur avec /health endpoint');
    console.log('4️⃣  MQTT Client  → Connexion broker public');
    console.log('5️⃣  Ingestion    → Pipeline MQTT → Database');
    console.log('6️⃣  Monitoring   → Consultation données temps réel');
    console.log('');
    console.log('⚙️  CONFIGURATION:');
    console.log(`   🌐 API HTTP: http://localhost:${HTTP_PORT}`);
    console.log(`   📡 MQTT Broker: ${MQTT_BROKER}`);
    console.log(`   💾 Database: ${DB_PATH}`);
    console.log(`   🏠 Home ID: ${DEMO_HOME_ID}`);
    console.log('═'.repeat(80) + '\n');

    try {
      // 1. Initialiser la base de données
      console.log('📊 1. Initialisation de la base de données...');
      await this.initializeDatabase();
      console.log('✅ Base de données prête\n');

      // 2. Créer des données de base
      console.log('🏠 2. Création des données de base...');
      await this.setupBaseData();
      console.log('✅ Rooms et devices créés\n');

      // 3. Démarrer le serveur HTTP (simulation)
      console.log('🌐 3. Démarrage du serveur HTTP...');
      await this.startHttpServer();
      console.log(`✅ API HTTP (simulée) sur http://localhost:${HTTP_PORT}\n`);

      // 4. Connecter le client MQTT RÉEL
      console.log('📡 4. Connexion MQTT RÉELLE...');
      await this.connectMqtt();
      console.log('✅ Client MQTT connecté au broker public\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 5️⃣  TEST: Attente messages devices (mode production)
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('⏳ 5️⃣  TEST: Attente messages devices IoT');
      console.log('┌─ OBJECTIF: Recevoir données de capteurs réels ou simulés');
      console.log('│  Mode Production: Raspberry Pi + DHT22 envoient via MQTT');
      console.log('│  Mode Démo: Lancez device-simulator.js dans autre terminal');
      console.log('└─ Pipeline: Ingestion automatique MQTT → Repository → SQLite');
      console.log('');
      console.log('📤 Test 5.1: Service en attente');
      console.log('   🔄 Pipeline ingestion actif et opérationnel');
      console.log('   📡 Écoute MQTT: home/demo-home-001/sensors/+/reading');
      console.log('   💾 Base de données: prête pour stockage');
      console.log('   🌐 API HTTP: endpoints /health et /api/v1/* disponibles');
      console.log('');
      console.log('📤 Test 5.2: Instructions pour envoi de données');
      console.log('   💡 Option A - Simulateur automatique:');
      console.log('       Terminal 2: node examples/device-simulator.js');
      console.log('   💡 Option B - Test manuel:');
      console.log('       mosquitto_pub -h test.mosquitto.org -t "home/demo-home-001/sensors/rpi-salon-01/reading" \\');
      console.log('                     -m \'{"ts":' + Date.now() + ',"temperature_c":23.5,"humidity_pct":65.2}\'');
      console.log('   💡 Option C - Production:');
      console.log('       Capteurs Raspberry Pi configurés avec ce contrat MQTT');
      console.log('');
      console.log('✅ Service prêt à recevoir données capteurs');
      console.log('═'.repeat(80) + '\n');

      // ═══════════════════════════════════════════════════════════════════════════════
      // 6️⃣  TEST: Service en fonctionnement continu
      // ═══════════════════════════════════════════════════════════════════════════════
      console.log('� 6️⃣  TEST: Service en fonctionnement continu');
      console.log('┌─ OBJECTIF: Démontrer service complet opérationnel');
      console.log('│  Composants: API HTTP + Ingestion MQTT + Database');
      console.log('│  Monitoring: Statistiques temps réel');
      console.log('└─ Durée: Infinie (Ctrl+C pour arrêter)');
      console.log('');

      // Afficher l'état initial
      await this.displayServiceStatus();
      console.log('✅ Service opérationnel');
      console.log('═'.repeat(80) + '\n');

      console.log('🎉 === SERVICE TECHTEMP OPÉRATIONNEL ===');
      console.log('');
      console.log('📊 COMPOSANTS ACTIFS:');
      console.log('   ✅ API HTTP      → http://localhost:13000/health');
      console.log('   ✅ Ingestion MQTT → Temps réel depuis test.mosquitto.org');
      console.log('   ✅ Database SQLite → Persistance automatique');
      console.log('   ✅ Repository    → Business logic layer');
      console.log('');
      console.log('🌡️  CAPTEURS ATTENDUS:');
      console.log('   • rpi-salon-01   → Salon');
      console.log('   • rpi-cuisine-01 → Cuisine');
      console.log('   • rpi-chambre-01 → Chambre');
      console.log('');
      console.log('💡 ACTIONS DISPONIBLES:');
      console.log('   • Testez API: curl http://localhost:13000/health');
      console.log('   • Simulez capteurs: node examples/device-simulator.js (autre terminal)');
      console.log('   • Consultez DB: sqlite3 ./examples/db-example/demo-techtemp.db');
      console.log('');
      console.log('⏳ Service en attente de données... (Ctrl+C pour arrêter)');

      // Démarrer monitoring temps réel
      this.startRealTimeMonitoring();

      // Attendre indéfiniment
      await this.waitForShutdown();

    } catch (error) {
      console.error('💥 Erreur pendant la démo:', error.message);
      throw error;
    }
  }

  async initializeDatabase() {
    // Créer le dossier de destination s'il n'existe pas
    const dbDir = DB_PATH.substring(0, DB_PATH.lastIndexOf('/'));
    try {
      await fs.mkdir(dbDir, { recursive: true });
    } catch (e) {
      // Dossier existe déjà
    }

    // Supprimer l'ancienne base si elle existe
    try {
      await fs.unlink(DB_PATH);
      console.log('📤 Test 1.1: Nettoyage ancienne base');
      console.log('   🗑️  Ancien fichier supprimé pour démo propre');
    } catch (e) {
      console.log('📤 Test 1.1: Nouvelle installation');
      console.log('   ✨ Aucun fichier existant (première fois)');
    }

    console.log('📤 Test 1.2: Création base SQLite');
    console.log(`   📁 Chemin: ${DB_PATH}`);
    console.log(`   📂 Dossier: ${dbDir}`);
    // Créer la nouvelle base avec le vrai schéma
    this.db = initDb(DB_PATH);
    console.log('   ✅ Base SQLite créée');

    console.log('📤 Test 1.3: Application migrations');
    console.log('   🏗️  Target: Schema version 2');
    console.log('   ✅ Migrations appliquées (tables: rooms, devices, readings_raw)');

    console.log('📤 Test 1.4: Création Repository');
    this.repository = createRepository(this.db);
    console.log('   ✅ Repository pattern configuré (business logic layer)');
  }

  async setupBaseData() {
    console.log('📤 Test 2.1: Création des rooms (pièces maison)');
    // Créer des rooms
    const rooms = [
      { room_id: 'salon', name: 'Salon' },
      { room_id: 'cuisine', name: 'Cuisine' },
      { room_id: 'chambre1', name: 'Chambre 1' }
    ];

    for (const room of rooms) {
      await this.repository.rooms.create(room);
      console.log(`   🏠 Room créée: ${room.name} (ID: ${room.room_id})`);
    }

    console.log('📤 Test 2.2: Création des devices IoT');
    // Créer des devices
    const devices = [
      {
        device_id: 'rpi-salon-01',
        device_uid: 'rpi-salon-01',
        room_id: 'salon',
        label: 'Capteur Salon Principal'
      },
      {
        device_id: 'rpi-cuisine-01',
        device_uid: 'rpi-cuisine-01',
        room_id: 'cuisine',
        label: 'Capteur Cuisine'
      },
      {
        device_id: 'rpi-chambre-01',
        device_uid: 'rpi-chambre-01',
        room_id: 'chambre1',
        label: 'Capteur Chambre 1'
      }
    ];

    for (const device of devices) {
      await this.repository.devices.create(device);
      console.log(`   📱 Device créé: ${device.label} → room_id: ${device.room_id}`);
    }

    console.log('📤 Test 2.3: Mapping devices → rooms');
    console.log('   📊 Associations:');
    devices.forEach(d => {
      console.log(`       ${d.device_id} → ${d.room_id}`);
    });
  }

  async startHttpServer() {
    console.log('📤 Test 3.1: Création serveur HTTP');
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
          console.log('       GET /api/v1/readings/latest     → Dernières mesures');
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
    console.log('📤 Test 4.1: Création client MQTT');
    console.log(`   📡 Broker: ${MQTT_BROKER}`);

    // Utiliser notre vrai client MQTT
    this.mqttClient = createMqttClient({
      url: MQTT_BROKER,
      clientId: `techtemp-demo-${Date.now()}`
    });
    console.log('   ✅ Client MQTT créé');

    console.log('📤 Test 4.2: Configuration handler ingestion');
    // Setup des handlers pour recevoir les messages
    this.mqttClient.onMessage((topic, payload) => {
      this.handleMqttMessage(topic, payload);
    });
    console.log('   ✅ Pipeline MQTT → Repository configuré');

    console.log('📤 Test 4.3: Abonnement aux topics capteurs');
    // S'abonner aux topics selon le contrat
    const topic = `home/${DEMO_HOME_ID}/sensors/+/reading`;
    await this.mqttClient.subscribe(topic);
    console.log(`   📝 Pattern abonné: ${topic}`);
    console.log('   � Topics couverts:');
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-salon-01/reading`);
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-cuisine-01/reading`);
    console.log(`       home/${DEMO_HOME_ID}/sensors/rpi-chambre-01/reading`);
    console.log('   ✅ Ingestion temps réel opérationnelle');
  }

  async simulateSensorsViaMqtt() {
    console.log('📤 Test 5.1: Préparation simulation capteurs');
    const sensors = [
      { deviceId: 'rpi-salon-01', roomId: 'salon', name: 'Salon', baseTemp: 22 },
      { deviceId: 'rpi-cuisine-01', roomId: 'cuisine', name: 'Cuisine', baseTemp: 25 },
      { deviceId: 'rpi-chambre-01', roomId: 'chambre1', name: 'Chambre', baseTemp: 20 }
    ];

    console.log('   📡 Mode: Messages MQTT via broker public');
    console.log('   🌐 Broker: test.mosquitto.org');
    console.log('   📊 Capteurs simulés:');
    sensors.forEach(s => {
      console.log(`       ${s.deviceId} → ${s.name} (${s.baseTemp}°C nominal)`);
    });

    console.log('📤 Test 5.2: Génération données réalistes');
    console.log('   🔄 Envoi de 2 cycles de mesures par capteur...');

    for (let cycle = 1; cycle <= 2; cycle++) {
      console.log(`   📊 Cycle ${cycle}/2:`);

      for (const sensor of sensors) {
        // Générer des données selon le contrat MQTT avec variations réalistes
        const tempVariation = (Math.random() - 0.5) * 4; // ±2°C
        const temperature_c = sensor.baseTemp + tempVariation;
        const humidity_pct = 45 + Math.random() * 25; // 45-70%

        const mqttPayload = {
          ts: Date.now(),  // epoch ms UTC selon contrat
          temperature_c: Math.round(temperature_c * 10) / 10,
          humidity_pct: Math.round(humidity_pct * 10) / 10
        };

        const topic = `home/${DEMO_HOME_ID}/sensors/${sensor.deviceId}/reading`;

        // Publier via notre vrai client MQTT
        await this.mqttClient.publish(topic, JSON.stringify(mqttPayload));

        console.log(`       📤 ${sensor.name}: ${mqttPayload.temperature_c}°C, ${mqttPayload.humidity_pct}%`);

        // Petite pause pour voir l'ordre des messages
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (cycle < 2) {
        console.log('       ⏱️  Pause 1s entre cycles...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('📤 Test 5.3: Attente réception messages');
    console.log('   ⏳ Délai pour traitement asynchrone MQTT...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`   ✅ Messages simulés envoyés (${sensors.length * 2} au total)`);
  }

  async displayServiceStatus() {
    console.log('📤 Test 6.1: État des composants');
    console.log('   🌐 API HTTP: Active');
    console.log(`   📡 MQTT: ${this.mqttClient ? 'Connecté' : 'Déconnecté'}`);
    console.log(`   💾 Database: ${this.db ? 'Prête' : 'Non initialisée'}`);
    console.log(`   📊 Messages reçus: ${this.receivedMessages}`);

    console.log('📤 Test 6.2: Test endpoints API');
    try {
      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_readings,
          COUNT(DISTINCT device_id) as total_devices,
          MAX(ts) as last_reading
        FROM readings_raw
      `).get();

      console.log(`   📊 Total mesures en base: ${stats.total_readings}`);
      console.log(`   📱 Devices actifs: ${stats.total_devices}`);
      console.log(`   🕐 Dernière mesure: ${stats.last_reading || 'Aucune'}`);
    } catch (error) {
      console.log(`   ⚠️  Erreur lecture base: ${error.message}`);
    }
  }

  startRealTimeMonitoring() {
    let lastMessageCount = this.receivedMessages;

    // Afficher les stats toutes les 30 secondes
    this.monitoringInterval = setInterval(() => {
      const newMessages = this.receivedMessages - lastMessageCount;

      if (newMessages > 0) {
        console.log(`\n📊 [${new Date().toLocaleTimeString()}] Activité détectée:`);
        console.log(`   📥 +${newMessages} nouveaux messages MQTT`);
        console.log(`   📈 Total reçus: ${this.receivedMessages}`);

        // Afficher dernières mesures
        try {
          const latest = this.db.prepare(`
            SELECT device_id, temperature, humidity, ts 
            FROM readings_raw 
            ORDER BY ts DESC 
            LIMIT 3
          `).all();

          if (latest.length > 0) {
            console.log('   📋 Dernières mesures:');
            latest.forEach(r => {
              const time = new Date(r.ts).toLocaleTimeString();
              console.log(`       ${r.device_id}: ${r.temperature}°C, ${r.humidity}% (${time})`);
            });
          }
        } catch (e) {
          console.log('   ⚠️  Erreur lecture dernières mesures');
        }

        lastMessageCount = this.receivedMessages;
      }
    }, 30000); // 30 secondes
  }

  async waitForShutdown() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Arrêt du service demandé...');
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
      console.log(`� ════════════ INGESTION MESSAGE #${messageNum} ════════════`);
      console.log(`📡 MQTT Topic reçu: ${topic}`);

      // Parser le topic selon le contrat : home/{homeId}/sensors/{deviceId}/reading
      const topicParts = topic.split('/');
      if (topicParts.length !== 5 || topicParts[0] !== 'home' || topicParts[2] !== 'sensors' || topicParts[4] !== 'reading') {
        console.log(`❌ Topic invalide (format attendu: home/{homeId}/sensors/{deviceId}/reading)`);
        console.log(`   Topic reçu: ${topic}`);
        return;
      }

      const homeId = topicParts[1];
      const deviceId = topicParts[3];

      console.log(`🏠 Home ID: ${homeId}`);
      console.log(`📱 Device ID: ${deviceId}`);

      // Parser le payload JSON
      let data;
      try {
        data = JSON.parse(payload.toString());
        console.log(`📄 Payload brut: ${JSON.stringify(data)}`);
      } catch (e) {
        console.log(`❌ ERREUR: Payload JSON invalide`);
        console.log(`   Payload reçu: ${payload}`);
        return;
      }

      // Valider les champs requis selon le contrat
      if (!data.ts || typeof data.temperature_c !== 'number' || typeof data.humidity_pct !== 'number') {
        console.log(`❌ ERREUR: Champs requis manquants`);
        console.log(`   Attendu: {ts: number, temperature_c: number, humidity_pct: number}`);
        console.log(`   Reçu: ${JSON.stringify(data)}`);
        return;
      }

      // Résoudre la room_id depuis les devices créés
      let roomId = null;
      if (deviceId === 'rpi-salon-01') roomId = 'salon';
      if (deviceId === 'rpi-cuisine-01') roomId = 'cuisine';
      if (deviceId === 'rpi-chambre-01') roomId = 'chambre1';

      if (!roomId) {
        console.log(`❌ ERREUR: Device inconnu dans la configuration`);
        console.log(`   Device ID: ${deviceId}`);
        console.log(`   Devices configurés: rpi-salon-01, rpi-cuisine-01, rpi-chambre-01`);
        return;
      }

      console.log(`🎯 Mapping: ${deviceId} → room "${roomId}"`);

      // Afficher les transformations de données
      console.log(`🔄 Transformation des données:`);
      console.log(`   Timestamp: ${data.ts} → ${new Date(data.ts).toISOString()}`);
      console.log(`   Température: temperature_c=${data.temperature_c} → temperature=${data.temperature_c}`);
      console.log(`   Humidité: humidity_pct=${data.humidity_pct} → humidity=${data.humidity_pct}`);

      // Transformer selon le contrat : temperature_c → temperature, humidity_pct → humidity
      const reading = {
        device_id: deviceId,
        room_id: roomId,
        ts: new Date(data.ts).toISOString(),  // Convertir epoch ms → ISO string
        temperature: data.temperature_c,       // Mapping selon contrat
        humidity: data.humidity_pct,          // Mapping selon contrat
        source: 'mqtt',
        msg_id: `${deviceId}-${data.ts}`      // ID unique pour déduplication
      };

      console.log(`💾 Objet pour SQLite:`);
      console.log(`   device_id: "${reading.device_id}"`);
      console.log(`   room_id: "${reading.room_id}"`);
      console.log(`   ts: "${reading.ts}"`);
      console.log(`   temperature: ${reading.temperature}°C`);
      console.log(`   humidity: ${reading.humidity}%`);
      console.log(`   source: "${reading.source}"`);
      console.log(`   msg_id: "${reading.msg_id}"`);

      // Sauvegarder via Repository
      console.log(`📤 Sauvegarde via Repository...`);
      const result = await this.repository.readings.create(reading);

      if (result.success) {
        console.log(`✅ SUCCESS: Données sauvegardées en SQLite`);
        console.log(`   📊 ${deviceId} (${roomId}): ${reading.temperature}°C, ${reading.humidity}%`);
        console.log(`   � Horodatage: ${reading.ts}`);
        console.log(`   📈 Total messages traités: ${messageNum}`);
      } else {
        console.log(`❌ ERREUR: Échec sauvegarde SQLite`);
        console.log(`   Device: ${deviceId}`);
        console.log(`   Erreur: ${result.error || 'Unknown error'}`);
      }

      console.log(`═════════════════════════════════════════════════`);

    } catch (error) {
      console.log(`💥 ERREUR CRITIQUE: ${error.message}`);
      console.log(`📍 Context:`);
      console.log(`   Topic: ${topic}`);
      console.log(`   Payload: ${payload}`);
      console.log(`   Stack: ${error.stack}`);
      console.log(`═════════════════════════════════════════════════`);
    }
  }

  async demonstrateApi() {
    // Attendre un peu que tous les messages MQTT soient traités
    console.log('   ⏳ Attente que tous les messages MQTT soient traités...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simuler les appels API qu'on ferait normalement via HTTP
    console.log('   📈 Dernières mesures par device :');

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
      console.log('      ⚠️  Aucune donnée reçue via MQTT (vérifiez la connexion internet)');
      return;
    }

    // Simuler une requête par room et plage de temps
    console.log('\n   📊 Historique salon (dernières 5 minutes) :');
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
    console.log('\n🔍 === EXPLORATION DIRECTE DE LA BASE DE DONNÉES ===');
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
      console.log(`   • Dernière mesure : ${stats.last_reading}`);

      // 2. Données par device
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

      // 3. Toutes les données brutes (dernières 10)
      console.log('\n📋 Dernières mesures (chronologique) :');
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
      console.error('❌ Erreur lors de l\'exploration:', error.message);
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

    // Fermer base de données
    if (this.db) {
      this.db.close();
      console.log('✅ Base de données fermée');
    }

    // Statistiques finales
    console.log('');
    console.log('📊 STATISTIQUES FINALES:');
    console.log(`   📥 Messages MQTT traités: ${this.receivedMessages}`);
    console.log(`   💾 Base de données: ${DB_PATH}`);
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
