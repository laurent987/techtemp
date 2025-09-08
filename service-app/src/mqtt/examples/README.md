# 📡 Exemples MQTT

Ce dossier contient des exemples structurés et pédagogiques pour démontrer l'utilisation du client MQTT.

## � Structure

```
src/mqtt/examples/
├── publisher.js      # ✈️ Envoi de messages MQTT
├── subscriber.js     # 📥 Écoute de messages MQTT  
├── cleaner.js        # 🧹 Nettoyage messages retained
└── README.md         # 📚 Ce guide
```

## 🎯 Objectifs pédagogiques

### **publisher.js** - Envoi de messages
✅ **Fonctionnalités démontrées :**
- Connexion au broker MQTT
- Publication avec différents QoS (0, 1, 2)
- Formats JSON et texte
- Gestion des options (retain, qos)
- Déconnexion propre

### **subscriber.js** - Réception de messages  
✅ **Fonctionnalités démontrées :**
- Connexion au broker MQTT
- Abonnement avec patterns/wildcards (`+`, `#`)
- Analyse automatique JSON vs texte
- Métadonnées des messages (QoS, retain, taille)
- Statistiques en temps réel
- Arrêt propre avec Ctrl+C

### **cleaner.js** - Nettoyage retained
✅ **Fonctionnalités démontrées :**
- Suppression de messages retained
- Statistiques de nettoyage
- Gestion d'erreurs
- Validation des opérations

## 🚀 Utilisation

### **Test complet en 3 terminaux**

#### Terminal 1 - Subscriber (écoute)
```bash
cd service-app
node src/mqtt/examples/subscriber.js
```

#### Terminal 2 - Publisher (envoi)
```bash
cd service-app  
node src/mqtt/examples/publisher.js
```

#### Terminal 3 - Cleaner (nettoyage)
```bash
cd service-app
node src/mqtt/examples/cleaner.js
```

### **Options personnalisées**

```bash
# Broker personnalisé
node publisher.js mqtt://localhost:1883

# Topic personnalisé
node subscriber.js mqtt://test.mosquitto.org "sensors/#"

# Message unique
node publisher.js mqtt://test.mosquitto.org sensors/temp001 "Hello MQTT"
```

### **Aide intégrée**

```bash
node publisher.js --help
node subscriber.js --help  
node cleaner.js --help
```

## 📋 Patterns MQTT utiles

| Pattern | Description | Exemples |
|---------|-------------|----------|
| `sensors/+/readings` | Un seul niveau | `sensors/temp001/readings`, `sensors/temp002/readings` |
| `sensors/#` | Tous niveaux | `sensors/temp001/readings`, `sensors/alerts/critical` |
| `+/status` | Tous devices status | `temp001/status`, `humidity001/status` |
| `sensors/temp001/+` | Tous sous-topics | `sensors/temp001/readings`, `sensors/temp001/status` |

## 🔧 Brokers MQTT de test

| Broker | URL | Description |
|--------|-----|-------------|
| Eclipse Mosquitto | `mqtt://test.mosquitto.org:1883` | Broker public de test |
| HiveMQ | `mqtt://broker.hivemq.com:1883` | Broker public de test |
| Local | `mqtt://localhost:1883` | Broker local (si installé) |

## 💡 Conseils d'utilisation

### **Démarrage recommandé :**
1. Lancez `subscriber.js` en premier (pour voir les messages)
2. Lancez `publisher.js` (pour envoyer des messages)
3. Observez les messages dans le terminal subscriber
4. Utilisez `cleaner.js` si besoin de nettoyer

### **QoS (Quality of Service) :**
- **QoS 0** : Fire and forget (aucune garantie)
- **QoS 1** : Au moins une fois (avec acknowledgment)  
- **QoS 2** : Exactement une fois (avec double handshake)

### **Messages Retained :**
- Stockés par le broker
- Envoyés automatiquement aux nouveaux subscribers
- Supprimés avec payload vide + retain=true

## 🐛 Dépannage

### **Erreur de connexion**
```
💥 Publisher failed: Error: Connection refused
```
**Solution :** Vérifiez que le broker est accessible et l'URL correcte.

### **Aucun message reçu**
**Vérifiez :**
- Le subscriber est lancé avant le publisher
- Les topics correspondent (attention aux wildcards)
- Le broker fonctionne correctement

### **Messages dupliqués**
**Causes possibles :**
- QoS 1 avec retransmission
- Plusieurs publishers sur le même topic
- Messages retained qui se répètent

## 📚 Liens utiles

- [Documentation MQTT](https://mqtt.org/)
- [MQTT.js (bibliothèque utilisée)](https://github.com/mqttjs/MQTT.js)
- [Test brokers publics](https://github.com/mqtt/mqtt.github.io/wiki/public_brokers)
