/**
 * @file DEMO COMPLÈTE - TechTemp Service App avec VRAI MQTT
 * 
 * Cette démo montre comment utiliser l'ensemble du service-app :
 * 1. Connexion à un broker MQTT public 
 * 2. Envoi de données via MQTT (simulation capteurs)
 * 3. Réception et traitement des données MQTT → Base de données
 * 4. Consultation des données via Repository (future API HTTP)
 */

import { createMqttClient } from '../src/mqtt/client.js';
import { initDb } from '../src/db/index.js';
import { createRepository } from '../src/repositories/index.js';
import { promises as fs } from 'fs';

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
    console.log('🚀 === DÉMO COMPLÈTE TECHTEMP SERVICE avec VRAI MQTT ===\n');

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

      // 5. Simuler des capteurs avec VRAI MQTT
      console.log('🌡️  5. Simulation de capteurs avec vrai MQTT...');
      await this.simulateSensorsViaMqtt();

      // 6. Consulter les données reçues
      console.log('📈 6. Consultation des données reçues...');
      await this.demonstrateApi();

      // 7. Explorer la base de données directement
      await this.exploreDatabase();

      console.log('\n🎉 DÉMO TERMINÉE AVEC SUCCÈS !');
      console.log('\n📋 État du projet :');
      console.log('   ✅ Database Schema (colonnes explicites)');
      console.log('   ✅ Repository Pattern (business logic)');
      console.log('   ✅ Data Access Layer (SQL operations)');
      console.log('   ✅ Client MQTT RÉEL (connecté à test.mosquitto.org)');
      console.log('   ✅ Intégration MQTT → Repository');
      console.log('   🚧 HTTP API (prochaine phase)');

      console.log('\n💡 Ce que vous pouvez faire :');
      console.log(`   • Examiner la base : sqlite3 ${DB_PATH} "SELECT * FROM readings_raw;"`);
      console.log('   • Messages reçus via MQTT :', this.receivedMessages);
      console.log('   • Broker utilisé : test.mosquitto.org (public)');
      console.log('   📁 Base dans examples/db-example/ (pas de pollution racine)');

    } catch (error) {
      console.error('❌ Erreur pendant la démo:', error.message);
      throw error;
    }
  }

  async initializeDatabase() {
    // Supprimer l'ancienne base si elle existe
    try {
      await fs.unlink(DB_PATH);
    } catch (e) {
      // Fichier n'existe pas, c'est normal
    }

    // Créer la nouvelle base avec le vrai schéma
    this.db = initDb(DB_PATH);
    this.repository = createRepository(this.db);

    console.log(`   📁 Base créée : ${DB_PATH}`);
  }

  async setupBaseData() {
    // Créer des rooms
    const rooms = [
      { room_id: 'salon', name: 'Salon', floor: 'rdc', side: 'jardin' },
      { room_id: 'cuisine', name: 'Cuisine', floor: 'rdc', side: 'rue' },
      { room_id: 'chambre1', name: 'Chambre 1', floor: 'etage', side: 'jardin' }
    ];

    for (const room of rooms) {
      await this.repository.rooms.create(room);
      console.log(`   🏠 Room créée : ${room.name} (${room.room_id})`);
    }

    // Créer des devices
    const devices = [
      {
        device_id: 'rpi-salon-01',
        device_uid: 'rpi-salon-01',
        label: 'Capteur Salon Principal',
        model: 'rpi-zero-2w'
      },
      {
        device_id: 'rpi-cuisine-01',
        device_uid: 'rpi-cuisine-01',
        label: 'Capteur Cuisine',
        model: 'rpi-zero-2w'
      }
    ];

    for (const device of devices) {
      await this.repository.devices.create(device);
      console.log(`   📱 Device créé : ${device.label} (${device.device_id})`);
    }
  }

  async startHttpServer() {
    // Note: Le serveur HTTP n'est pas encore implémenté dans cette phase
    console.log(`   🌐 [SIMULATION] Serveur HTTP sur port ${HTTP_PORT}`);
    console.log('   📋 Routes qui seront disponibles :');
    console.log('      GET /health                      # Health check');
    console.log('      GET /api/v1/readings/latest      # Dernières mesures');
    console.log('   💡 Phase actuelle: Repository + MQTT (✅)');
    console.log('   🚧 Phase suivante: API HTTP');
  }

  async connectMqtt() {
    console.log(`   📡 Connexion au broker MQTT public : ${MQTT_BROKER}`);

    // Utiliser notre vrai client MQTT
    this.mqttClient = createMqttClient({
      url: MQTT_BROKER,
      clientId: `techtemp-demo-${Date.now()}`
    });

    // Setup des handlers pour recevoir les messages
    this.mqttClient.onMessage((topic, payload) => {
      this.handleMqttMessage(topic, payload);
    });

    // S'abonner aux topics selon le contrat
    const topic = `home/${DEMO_HOME_ID}/sensors/+/reading`;
    await this.mqttClient.subscribe(topic);

    console.log(`   📝 Abonné au topic : ${topic}`);
    console.log('   💡 Le client MQTT écoute maintenant les vrais messages !');
  }

  async simulateSensorsViaMqtt() {
    const sensors = [
      { deviceId: 'rpi-salon-01', roomId: 'salon', name: 'Salon' },
      { deviceId: 'rpi-cuisine-01', roomId: 'cuisine', name: 'Cuisine' }
    ];

    console.log('   📡 Envoi de vraies données MQTT via le broker public...');
    console.log('   🌐 Utilisation du broker : test.mosquitto.org');

    for (let i = 0; i < 3; i++) {  // 3 readings par capteur
      for (const sensor of sensors) {
        // Générer des données selon le contrat MQTT
        const temperature_c = 20 + Math.random() * 8; // 20-28°C
        const humidity_pct = 40 + Math.random() * 30;   // 40-70%

        const mqttPayload = {
          ts: Date.now(),  // epoch ms UTC selon contrat
          temperature_c: Math.round(temperature_c * 10) / 10,
          humidity_pct: Math.round(humidity_pct * 10) / 10
        };

        const topic = `home/${DEMO_HOME_ID}/sensors/${sensor.deviceId}/reading`;

        // Publier via notre vrai client MQTT
        await this.mqttClient.publish(topic, JSON.stringify(mqttPayload));

        console.log(`   📊 [ENVOYÉ] ${sensor.name}: ${mqttPayload.temperature_c}°C, ${mqttPayload.humidity_pct}%`);

        // Petite pause pour voir l'ordre des messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('   ✅ Données MQTT envoyées ! Le client devrait les recevoir...');
  }

  // Handler pour les messages MQTT reçus
  async handleMqttMessage(topic, payload) {
    try {
      this.receivedMessages++;
      console.log(`   📥 [REÇU #${this.receivedMessages}] Topic: ${topic}`);

      // Parser le topic selon le contrat : home/{homeId}/sensors/{deviceId}/reading
      const topicParts = topic.split('/');
      if (topicParts.length !== 5 || topicParts[0] !== 'home' || topicParts[2] !== 'sensors' || topicParts[4] !== 'reading') {
        console.log(`   ⚠️  Topic invalide ignoré: ${topic}`);
        return;
      }

      const homeId = topicParts[1];
      const deviceId = topicParts[3];

      // Parser le payload JSON
      let data;
      try {
        data = JSON.parse(payload.toString());
      } catch (e) {
        console.log(`   ❌ Payload JSON invalide: ${payload}`);
        return;
      }

      // Valider les champs requis selon le contrat
      if (!data.ts || typeof data.temperature_c !== 'number' || typeof data.humidity_pct !== 'number') {
        console.log(`   ❌ Champs requis manquants dans: ${payload}`);
        return;
      }

      // Résoudre la room_id (pour cette démo, on map directement depuis les devices créés)
      let roomId = null;
      if (deviceId === 'rpi-salon-01') roomId = 'salon';
      if (deviceId === 'rpi-cuisine-01') roomId = 'cuisine';

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

      // Sauvegarder via Repository
      await this.repository.readings.create(reading);

      console.log(`   ✅ [SAUVÉ] ${deviceId}: ${reading.temperature}°C, ${reading.humidity}% dans ${roomId || 'unknown room'}`);

    } catch (error) {
      console.log(`   ❌ Erreur traitement MQTT: ${error.message}`);
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
    console.log('\n🛑 Arrêt de la démo...');

    if (this.mqttClient) {
      await this.mqttClient.close();
      console.log('✅ Client MQTT fermé');
    }

    if (this.db) {
      this.db.close();
      console.log('✅ Base de données fermée');
    }
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
