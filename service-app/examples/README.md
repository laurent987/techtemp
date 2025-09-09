# serv### 1. 🎬 `service-complete-demo.js` - Service IoT complet avec Express.js API (MODERNIZED)
```bash
node service-complete-demo.js
```

Service production-ready qui démontre un pipeline IoT complet **avec l'API Express.js du Journal #005** :
- 🌐 **Express.js API** : Endpoints REST modernes (`/health`, `/api/v1/readings/latest`) selon Contract 001
- 📡 **Ingestion MQTT** : Temps réel depuis broker public (`test.mosquitto.org`)
- 💾 **Persistance SQLite** : Repository pattern avec migrations automatiques
- 📊 **Monitoring** : Statistiques en temps réel et logs explicites
- 🔄 **Pipeline complet** : MQTT → Validation → Database → API Express.js

**Fonctionnalités modernisées (Journal #005) :**
- ✅ **Express.js server** : Serveur HTTP moderne avec lifecycle management
- ✅ **Contract 001 API** : Format `{device_id, room_id, ts, temperature, humidity}`
- ✅ **Production-ready** : Graceful shutdown et gestion d'erreurs robuste
- ✅ **Architecture unifiée** : Utilise tous les composants du Journal #005
- ✅ **API testable** : Endpoints conformes aux spécifications
- ✅ **Monitoring temps réel** : Statistiques automatiques toutes les 30s
- ✅ **Pipeline validé** : Architecture end-to-end complètement testéellection d'exemples pratiques pour démontrer le pipeline IoT complet du Journal #004.

## 🎯 Exemples disponibles

### 1. 🎬 `service-complete-demo.js` - Service IoT complet avec API HTTP
```bash
node service-complete-demo.js
```

Service production-ready qui démontre un pipeline IoT complet :
- 🌐 **API HTTP** : Endpoints REST (`/health`, `/api/v1/readings/latest`, `/api/v1/stats`)
- 📡 **Ingestion MQTT** : Temps réel depuis broker public (`test.mosquitto.org`)
- 💾 **Persistance SQLite** : Repository pattern avec migrations automatiques
- � **Monitoring** : Statistiques en temps réel et logs explicites
- 🔄 **Pipeline complet** : MQTT → Validation → Database → API

**Fonctionnalités :**
- ✅ Connexion MQTT robuste au broker public
- ✅ API HTTP avec CORS et gestion d'erreurs
- ✅ Pipeline d'ingestion avec logs pédagogiques détaillés
- ✅ Création automatique de devices et rooms
- ✅ Déduplication par `msg_id`
- ✅ Monitoring temps réel (stats toutes les 30s)
- ✅ Arrêt gracieux (Ctrl+C)

### 2. 📱 `device-simulator.js` - Simulateur de capteurs IoT réalistes
```bash
node device-simulator.js
```

Simulateur avancé de 3 capteurs IoT (Raspberry Pi + DHT22) :
- 🏠 **3 capteurs** : Salon, Cuisine, Chambre avec variations réalistes
- 📊 **Données réalistes** : Température et humidité avec fluctuations basées sur l'usage des pièces
- ⏱️ **Envoi continu** : Toutes les 5 secondes (réaliste pour maison connectée)
- � **Événements** : Variations occasionnelles (cuisson, ouverture fenêtre, etc.)
- � **Monitoring** : Statistiques d'envoi en temps réel

## 🚀 Démarrage rapide

### Prérequis
```bash
# Aucun prérequis ! Utilise le broker public test.mosquitto.org
# Juste Node.js installé
```

### Architecture multi-terminal (recommandée)
```bash
# Terminal 1 : Démarrer le service IoT complet
cd service-app/examples
node service-complete-demo.js

# Terminal 2 : Simuler les capteurs IoT (dans un autre terminal)
cd service-app/examples  
node device-simulator.js

# Terminal 3 : Tester l'API HTTP (optionnel)
curl http://localhost:13000/health
curl http://localhost:13000/api/v1/readings/latest
curl http://localhost:13000/api/v1/stats
```

### Test simple (un seul terminal)
```bash
# Démarrer le service
node service-complete-demo.js

# Dans un autre terminal, envoyer un message de test
mosquitto_pub -h test.mosquitto.org \
  -t "home/demo-home-001/sensors/rpi-salon-01/reading" \
  -m '{"ts":'$(date +%s000)',"temperature_c":23.5,"humidity_pct":65.2}'
```

## 🏗️ Architecture moderne

### Avantages de la nouvelle architecture
- ✅ **Broker public** : Plus besoin d'installer MQTT localement
- ✅ **API HTTP** : Endpoints REST pour monitoring et intégration
- ✅ **Multi-terminal** : Service et Simulateur séparés pour plus de clarté
- ✅ **Logs explicites** : Pipeline détaillé pour comprendre chaque étape
- ✅ **Temps réel** : Monitoring continu des données avec statistiques
- ✅ **Production-ready** : Architecture extensible et professionnelle

### Pipeline complet validé
```
📱 Device Simulator  →  📡 MQTT Broker Public  →  📥 Service TechTemp
        ↓                      (test.mosquitto.org)           ↓
   3 capteurs IoT                                    🔄 Pipeline Ingestion
   (toutes les 5s)                                           ↓
                                                    💾 SQLite Repository
                                                             ↓
                                                   🌐 API HTTP (port 13000)
                                                      /health, /api/v1/*
```

## 📊 Format des données

### Message MQTT (format contractuel)
```json
{
  "ts": 1757340000000,
  "temperature_c": 23.5,
  "humidity_pct": 65.2
}
```

### Topics MQTT
```
home/{homeId}/sensors/{deviceId}/reading

Exemples:
- home/demo-home-001/sensors/rpi-salon-01/reading
- home/demo-home-001/sensors/rpi-cuisine-01/reading  
- home/demo-home-001/sensors/rpi-chambre-01/reading
```

### Stockage SQLite (après transformation)
```sql
-- Table readings_raw
device_id: "rpi-salon-01"
room_id: "salon" 
ts: "2025-09-08T14:24:23.277Z"
temperature: 23.5  -- (mappé depuis temperature_c)
humidity: 65.2     -- (mappé depuis humidity_pct)
source: "mqtt"
msg_id: "rpi-salon-01-1757340000000"  -- déduplication
```

## 🔍 API HTTP

### Endpoints disponibles

**GET /health** - Health check avec dépendances (Express.js)
```json
{
  "status": "ok"
}
```

**GET /api/v1/readings/latest** - Dernières mesures selon Contract 001
```json
{
  "data": [
    {
      "device_id": "rpi-salon-01",
      "room_id": "salon",
      "ts": "2025-09-08T14:24:23.277Z",
      "temperature": 23.5,
      "humidity": 65.2
    }
  ]
}
```

## 🎉 Validation

Pipeline IoT complet testé et validé avec :
- **Architecture multi-terminal** : Service + Simulateur séparés
- **Logs pédagogiques** : Chaque étape du pipeline expliquée
- **API HTTP fonctionnelle** : Endpoints testés et documentés  
- **Persistance fiable** : SQLite avec Repository pattern
- **Monitoring temps réel** : Statistiques automatiques toutes les 30s

**Système 100% opérationnel et prêt pour la production !** ✅
