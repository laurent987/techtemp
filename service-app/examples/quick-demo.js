#!/usr/bin/env node
/**
 * @file Quick Demo - Utilisation simple du service TechTemp
 * 
 * Démo rapide qui montre :
 * 1. Comment démarrer le service complet
 * 2. Comment injecter des données 
 * 3. Comment consulter l'API
 */

import { initDb } from '../src/db/index.js';
import { createRepository } from '../src/repositories/index.js';

async function quickDemo() {
  console.log('⚡ === DEMO RAPIDE TECHTEMP ===\n');

  // 1. Initialiser avec une base temporaire
  console.log('📊 Initialisation...');
  const db = initDb(':memory:');
  const repo = createRepository(db);

  // 2. Créer des données de base
  console.log('🏗️  Setup des données...');

  // Room
  await repo.rooms.create({
    room_id: 'salon',
    name: 'Salon',
    floor: 'rdc'
  });

  // Device  
  await repo.devices.create({
    device_id: 'sensor-001',
    device_uid: 'dht22-salon-001',
    label: 'Capteur Salon Principal'
  });

  // 3. Ajouter des readings avec la NOUVELLE API explicite
  console.log('📡 Injection de données avec API explicite...');

  const readings = [
    { temperature: 21.5, humidity: 65.0 },
    { temperature: 22.1, humidity: 62.3 },
    { temperature: 21.8, humidity: 64.1 }
  ];

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    await repo.readings.create({
      device_id: 'sensor-001',
      room_id: 'salon',
      ts: new Date(Date.now() - (readings.length - i) * 60000).toISOString(), // Échelonner dans le temps
      temperature: reading.temperature,  // ✅ Nom explicite !
      humidity: reading.humidity,        // ✅ Nom explicite !
      source: 'mqtt'
    });

    console.log(`   📊 Reading ${i + 1}: ${reading.temperature}°C, ${reading.humidity}%`);
  }

  // 4. Consulter les données (comme le ferait l'API HTTP)
  console.log('\n🔍 Consultation des données...');

  // Dernière mesure
  const latest = await repo.readings.getLatestByDevice('sensor-001');
  console.log('📈 Dernière mesure:');
  console.log(`   🌡️  Température: ${latest.temperature}°C`);
  console.log(`   💧 Humidité: ${latest.humidity}%`);
  console.log(`   ⏰ Timestamp: ${latest.ts}`);

  // Historique par room
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const history = await repo.readings.findByRoomAndTimeRange(
    'salon',
    oneHourAgo.toISOString(),
    now.toISOString()
  );

  console.log(`\n📊 Historique salon (${history.length} mesures):`);
  history.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.temperature}°C, ${r.humidity}% (${new Date(r.ts).toLocaleTimeString()})`);
  });

  // 5. Simuler la réponse API JSON
  console.log('\n🌐 Format API HTTP (GET /api/v1/readings/latest):');
  const apiResponse = {
    data: [{
      device_id: latest.device_id,
      room_id: latest.room_id,
      ts: latest.ts,
      temperature: latest.temperature,
      humidity: latest.humidity
    }]
  };

  console.log(JSON.stringify(apiResponse, null, 2));

  // 6. Fermer
  db.close();
  console.log('\n✅ Demo terminée !');

  console.log('\n💡 Pour utiliser le service complet:');
  console.log('   npm start                    # Démarre MQTT + HTTP');
  console.log('   curl localhost:3000/health   # Health check');
  console.log('   curl localhost:3000/api/v1/readings/latest  # Dernières mesures');
}

// Gestion des erreurs
quickDemo().catch(error => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});
