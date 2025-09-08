# Structure des Exemples - Service App

## 📁 Organisation Modulaire

La nouvelle organisation sépare clairement les **exemples unitaires** (par module) des **exemples d'intégration** (service complet).

### 🏗️ Modules avec Exemples Unitaires

```
src/
├── db/examples/              # 🗄️ Base de données
│   └── example-db.js         # Démontre: initDb, migrations, repositories
├── ingestion/examples/       # ⚙️ Pipeline d'ingestion  
│   └── example-ingestion.js  # Démontre: parseTopic, validateReading, ingestMessage
└── mqtt/examples/            # 📡 Client MQTT (existant)
    ├── example-publisher.js
    └── example-subscriber.js
```

### 🔗 Exemples d'Intégration

```
examples/
├── service-complete-demo.js  # 🎯 Démo complète: MQTT + Ingestion + DB
├── complete-demo.js          # 🚀 Alternative: Service complet
└── db-data-examples/         # 📊 Données pour les tests
```

## 🎯 Usage

### Exemples Unitaires (par module)

```bash
# Test Database & Repository uniquement
node src/db/examples/example-db.js

# Test Pipeline d'Ingestion uniquement  
node src/ingestion/examples/example-ingestion.js

# Test Client MQTT uniquement
node src/mqtt/examples/example-publisher.js
node src/mqtt/examples/example-subscriber.js
```

### Exemples d'Intégration

```bash
# Démo service complet (MQTT + Ingestion + Database)
node examples/service-complete-demo.js
```

## 📦 Modules Disponibles

| Module | Exemples | Description |
|--------|----------|-------------|
| `src/db/` | `example-db.js` | Base de données SQLite, migrations, repositories |
| `src/ingestion/` | `example-ingestion.js` | Pipeline MQTT → Database (parseTopic, validateReading, ingestMessage) |
| `src/mqtt/` | `example-*.js` | Client MQTT (publisher/subscriber) |
| `examples/` | `service-complete-demo.js` | Intégration complète de tous les modules |

## 🔍 Avantages de cette Structure

- ✅ **Séparation claire** : Exemples unitaires vs intégration
- ✅ **Pas de confusion** : "example-*" (pas "test-*") 
- ✅ **Modularité** : Chaque module a ses propres exemples
- ✅ **Réutilisabilité** : Les modules peuvent être testés indépendamment
- ✅ **Clarté** : Documentation et usage évidents

## 📝 Conventions

- `src/{module}/examples/example-{module}.js` : Exemples unitaires
- `examples/` : Exemples d'intégration et démos complètes
- Préfixe `example-` (jamais `test-`) pour éviter la confusion avec les vrais tests unitaires
