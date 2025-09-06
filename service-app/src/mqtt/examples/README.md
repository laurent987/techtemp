# 📡 MQTT Client Examples

Exemples pratiques d'utilisation du client MQTT.

## 🚀 Scripts disponibles

### 👂 Subscriber - `subscriber.js`
Écoute les messages sur un topic pattern.

```bash
# Écouter tous les messages techtemp/demo/*
node subscriber.js

# Avec broker et topic personnalisés
node subscriber.js mqtt://localhost:1883 "sensors/+/temperature"
```

### 📤 Publisher - `publisher.js`
Publie des messages sur des topics.

```bash
# Mode démo (4 messages d'exemple)
node publisher.js

# Message personnalisé
node publisher.js mqtt://localhost:1883 "sensors/room1/temp" "23.5"

# Avec broker personnalisé
node publisher.js mqtt://test.mosquitto.org:1883
```

### 🧹 Cleaner - `cleaner.js`
Supprime les messages retained du broker.

```bash
node cleaner.js
```

## 🧪 Test en temps réel

### Terminal 1 - Subscriber
```bash
cd service-app/src/mqtt/examples
node subscriber.js
```

### Terminal 2 - Publisher  
```bash
cd service-app/src/mqtt/examples
node publisher.js
```

## 📋 Messages d'exemple

Le publisher en mode démo envoie :

- **Temperature** : `techtemp/demo/sensors/temperature` (QoS 1, non-retained)
- **Humidity** : `techtemp/demo/sensors/humidity` (QoS 1, non-retained)  
- **Status** : `techtemp/demo/status` (QoS 0, non-retained)
- **Alert** : `techtemp/demo/alerts` (QoS 2, non-retained)

## 🔧 Configuration

### Brokers testés
- `mqtt://test.mosquitto.org:1883` (défaut)
- `mqtt://broker.hivemq.com:1883`
- `mqtt://localhost:1883` (broker local)

### Topics pattern
- `techtemp/demo/#` - Tous les sous-topics démo
- `sensors/+/temperature` - Température de tous capteurs
- `alerts/critical` - Alertes critiques uniquement

## 🎯 Cas d'usage

### Monitoring de capteurs
```bash
# Terminal 1: Écouter les capteurs
node subscriber.js mqtt://localhost:1883 "sensors/+/+"

# Terminal 2: Simuler capteur température
node publisher.js mqtt://localhost:1883 "sensors/room1/temperature" "22.1"

# Terminal 3: Simuler capteur humidité  
node publisher.js mqtt://localhost:1883 "sensors/room1/humidity" "65.2"
```

### Debug et développement
```bash
# Écouter TOUS les messages (attention: verbeux)
node subscriber.js mqtt://test.mosquitto.org:1883 "#"

# Envoyer message de test
node publisher.js mqtt://test.mosquitto.org:1883 "debug/test" "Hello world"
```
