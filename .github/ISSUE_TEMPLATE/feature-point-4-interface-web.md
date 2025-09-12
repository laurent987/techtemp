---
name: 🌐 Point 4 - Interface Web Dashboard
about: Développement interface web pour visualisation des données TechTemp
title: '[FEATURE] Point 4 - Interface Web Dashboard'
labels: ['enhancement', 'web', 'mvp-lot-1', 'point-4']
assignees: ''
---

## 📋 Contexte

**Référence**: Journal #009 (2025-09-12) - Consolidation MVP Lot 1
**Status infrastructure**: Points 1-3 VALIDÉS ✅
- Backend IoT opérationnel (Docker sur Pi 192.168.0.42)
- Device physique connecté (AHT20 sur Pi 192.168.0.134) 
- Déploiement production robuste

## 🎯 Objectif Point 4

Développer une **interface web moderne** pour visualiser et contrôler le système TechTemp.

## 📊 État actuel de l'infrastructure

### APIs disponibles
- `GET /health` → Status système
- `GET /api/v1/devices` → Liste devices actifs  
- `GET /api/v1/readings/latest?deviceId=X` → Lectures récentes
- Base SQLite avec 52+ lectures accumulées

### Données disponibles  
- **Device**: `aht20-f49c53` (actif)
- **Room**: `eetkamer` (placement tracking)
- **Métriques**: Température + Humidité (fréquence 5min)

## 🛠️ Spécifications Interface Web

### Fonctionnalités Core
- [ ] **Dashboard principal**
  - Vue temps réel des devices connectés
  - Status système (uptime, connectivity)
  - Dernières lectures par room

- [ ] **Visualisation données**
  - Graphiques temps réel (température/humidité)
  - Historique sur 24h/7j/30j
  - Statistiques (min/max/moyenne)

- [ ] **Gestion devices**
  - Liste devices avec status
  - Configuration placement rooms
  - Historique mouvements

### Stack technique suggérée
- **Frontend**: React/Vue.js + Chart.js/D3.js
- **Styling**: Tailwind CSS/Material-UI
- **API**: Client REST vers backend Pi
- **Build**: Vite/Webpack
- **Deploy**: Nginx sur Pi serveur

## 📱 Maquettes/Wireframes

### Page principale
```
┌─────────────────────────────────────┐
│ TechTemp Dashboard          Status  │
├─────────────────────────────────────┤
│ 🏠 Rooms Overview               ⚡  │
│ ├─ eetkamer: 22.3°C 45% RH         │
│ └─ Device: aht20-f49c53 (actif)    │
├─────────────────────────────────────┤
│ 📊 Graphiques temps réel            │
│ [Chart température 24h]             │
│ [Chart humidité 24h]                │
├─────────────────────────────────────┤
│ 📋 Devices                          │
│ • aht20-f49c53 | eetkamer | 🟢     │
└─────────────────────────────────────┘
```

## 🔧 Points techniques

### Intégration backend
- Base URL: `http://192.168.0.42:3000`
- CORS à configurer pour frontend
- WebSocket optionnel pour temps réel

### Responsive design
- Desktop primary
- Mobile/tablet compatible
- Progressive Web App (PWA) potentiel

### Performance
- Polling API intelligent (5s-30s selon page)
- Cache local des données
- Lazy loading graphiques

## ✅ Critères d'acceptation

- [ ] Dashboard fonctionnel affichant données temps réel
- [ ] Graphiques température/humidité sur 24h
- [ ] Liste devices avec status connectivity
- [ ] Interface responsive (desktop + mobile)
- [ ] Déploiement sur Pi serveur accessible via web
- [ ] Documentation utilisateur

## 🚀 Étapes de développement

### Phase 1: Setup + Dashboard minimal
- [ ] Init projet frontend (React/Vue)
- [ ] Configuration API client
- [ ] Page principale avec status système
- [ ] Première version graphiques

### Phase 2: Enrichissement
- [ ] Historique multi-périodes (24h/7j/30j)
- [ ] Gestion devices/rooms
- [ ] Responsive design

### Phase 3: Production
- [ ] Build optimisé
- [ ] Déploiement Pi avec Nginx
- [ ] Tests utilisateur final

## 📚 Ressources

- **Backend APIs**: Voir `docs/api/README.md`
- **Infrastructure**: Journal #009 pour setup technique
- **Database schema**: `docs/development/DATABASE_INSPECTION.md`

## 🔗 Liens connexes

- Journal #009: `/docs/archive/journaux/journal#009_2025-09-12.md`
- Scripts déploiement: `/scripts/deploy-robust-pi.sh`
- API docs: `/docs/api/`

---

**Priorité**: 🔥 Haute (Point 4 MVP Lot 1)
**Estimation**: 2-3 semaines de développement  
**Dependencies**: Backend Points 1-3 (✅ DONE)
