# Rapport de Migration de Schéma de Base de Données

**Date :** 6 septembre 2025  
**Projet :** TechTemp - Service App  
**Sujet :** Migration des colonnes `t` et `h` vers `temperature` et `humidity`

---

## 1. Contexte et Objectif

### Problème initial
Le schéma de base de données utilisait des noms de colonnes peu explicites :
- `t` pour température
- `h` pour humidité
- `offset_t` et `offset_h` pour les offsets de calibration

Ces noms posaient des problèmes de lisibilité et de maintenance du code. L'objectif était de les remplacer par des noms explicites (`temperature`, `humidity`, `offset_temperature`, `offset_humidity`) tout en préservant la compatibilité avec les données existantes.

### Contraintes
- **Rétrocompatibilité** : Ne pas casser les données existantes
- **Migration transparente** : Permettre la migration automatique des bases existantes
- **Tests existants** : Maintenir le fonctionnement des 26 tests du Repository Pattern
- **API flexible** : Supporter les deux formats (ancien et nouveau) pendant la transition

---

## 2. Approche Technique Adoptée

### 2.1 Architecture en Couches
La solution a été implémentée sur trois niveaux :

1. **Repository Layer** : API métier avec transformation automatique des noms
2. **Data Access Layer** : Adaptation aux nouveaux noms de colonnes
3. **Database Schema** : Migration versionnée des structures

### 2.2 Stratégie de Migration
- **Système de versioning** : Table `schema_version` pour tracer les migrations
- **Migrations incrémentales** : v0 → v1 → v2
- **Detection automatique** : Identification des bases legacy vs nouvelles

---

## 3. Implémentation et Problèmes Rencontrés

### 3.1 Phase 1 : Amélioration du Repository Layer

**Objectif :** Permettre l'utilisation de noms explicites dans l'API Repository.

**Implémentation :**
```javascript
// Support des deux formats en entrée
const temperature = reading.temperature || reading.t;
const humidity = reading.humidity || reading.h;

// Validation avec noms explicites
if (temperature !== undefined && (temperature < -50 || temperature > 100)) {
  throw new Error('Temperature must be between -50°C and 100°C');
}
```

**Problème rencontré :** Les tests utilisaient encore les anciens noms `t` et `h`.

**Solution :** Implémentation d'une compatibilité bidirectionnelle permettant l'utilisation des deux formats.

**Résultat :** ✅ Les 26 tests continuent de passer, l'API supporte les deux formats.

### 3.2 Phase 2 : Système de Migration de Schéma

**Objectif :** Créer un système de migration automatique pour les bases existantes.

**Problèmes rencontrés :**

#### Problème 1 : Conflit de Vue
```
Error: error in view v_room_last: no such table: main.readings_raw
```

**Cause :** La vue `v_room_last` était créée avant la migration des tables, référençant des tables qui n'existaient plus.

**Solution :** Séparation de la création des vues après toutes les migrations de tables.

#### Problème 2 : Détection de Version Incorrecte
Le système détectait une version 2 sur des bases legacy qui auraient dû être version 0.

**Cause :** Le fichier de test était réutilisé entre les exécutions avec une version déjà migrée.

**Solution :** 
- Amélioration de la logique de détection de version
- Nettoyage explicite des fichiers de test entre les exécutions

#### Problème 3 : Schémas Conflictuels
La migration v0→v1 créait un nouveau schéma complet, mais les bases legacy avaient une structure différente.

**Cause :** Confusion entre migration de bases vides (nouveau schéma) et migration de bases existantes (transformation en place).

**Solution :** Logique conditionnelle dans les migrations :
```javascript
function migrateV0ToV1(db) {
  const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  if (existingTables.length === 0) {
    // Base vide : créer nouveau schéma
    createNewSchema(db);
  } else {
    // Base existante : skip, sera migrée en v1→v2
    console.log('⏭️  Skipping v0→v1: existing legacy database detected');
  }
  setVersion(db, 1);
}
```

### 3.3 Phase 3 : Migration des Colonnes

**Objectif :** Renommer `t` → `temperature` et `h` → `humidity` dans les bases existantes.

**Problèmes rencontrés :**

#### Problème 4 : Limitations SQLite
SQLite ne supporte pas `ALTER TABLE ... RENAME COLUMN` dans les anciennes versions.

**Solution :** Technique de migration par table temporaire :
```sql
CREATE TABLE readings_raw_new (...);
INSERT INTO readings_raw_new SELECT ..., t as temperature, h as humidity FROM readings;
DROP TABLE readings;
ALTER TABLE readings_raw_new RENAME TO readings_raw;
```

#### Problème 5 : Ordre des Opérations
La vue était créée avant la fin de la migration des tables.

**Solution :** Déplacement de la création de vue à la fin de toutes les migrations :
```javascript
// Toutes les migrations de tables d'abord
migrateTables();

// Puis création/mise à jour des vues
createViews();
```

---

## 4. Solutions Finales Implémentées

### 4.1 Système de Migration Robuste

**Fichier :** `src/db/migrations.js`

**Fonctionnalités :**
- Détection automatique de version
- Migrations incrémentales avec rollback
- Support des bases legacy et nouvelles
- Logging détaillé des opérations

### 4.2 API Repository Flexible

**Fonctionnalités :**
- Support simultané des anciens (`t`, `h`) et nouveaux (`temperature`, `humidity`) noms
- Transformation automatique en sortie
- Validation avec messages explicites
- Rétrocompatibilité complète

### 4.3 Tests de Validation

**Résultats :**
- ✅ 26/26 tests Repository passent
- ✅ Migration legacy → moderne validée
- ✅ API bidirectionnelle fonctionnelle
- ✅ Conservation des données garantie

---

## 5. Exemple de Migration Réussie

```
=== TEST MIGRATION LEGACY RÉELLE ===

🗂️  Création base legacy avec colonnes t/h...
✅ Base legacy créée avec 2 lectures

🔄 Test de migration...
📊 Version schéma courante: 0
⏭️  Migration v0 → v1: Base legacy détectée - skip création nouveau schéma
✅ Migration vers version 1 terminée
🔄 Migration v1 → v2: Migration colonnes legacy
  📋 Migration readings: t/h → temperature/humidity
  ✅ Migration readings terminée
  📋 Création vue mise à jour...
  ✅ Vue v_room_last mise à jour
✅ Migration vers version 2 terminée
🎯 Version finale du schéma: 2

📊 Test données après migration...
Latest reading: { temperature: 23.1, humidity: 68, t: 23.1, h: 68 }

🎉 MIGRATION LEGACY RÉUSSIE !
```

---

## 6. Bonnes Pratiques Identifiées

### 6.1 Migration de Schéma
1. **Versioning explicite** : Toujours tracker la version du schéma
2. **Migrations incrémentales** : Petites étapes avec validation
3. **Tests de migration** : Valider avec des données réelles
4. **Rollback possible** : Prévoir la marche arrière

### 6.2 Compatibilité API
1. **Transition graduelle** : Support simultané ancien/nouveau format
2. **Validation cohérente** : Messages d'erreur avec nouveaux termes
3. **Documentation** : Exemples des deux formats
4. **Tests complets** : Couvrir tous les scénarios

### 6.3 Gestion des Erreurs
1. **Logging détaillé** : Tracer chaque étape de migration
2. **Messages explicites** : Indiquer clairement le problème
3. **Cleanup automatique** : Nettoyer en cas d'échec
4. **Validation post-migration** : Vérifier l'intégrité des données

---

## 7. Résultats et Impact

### Améliorations Apportées
- **Lisibilité du code** : Noms de colonnes explicites
- **Maintenabilité** : Code plus clair et documentation naturelle
- **Robustesse** : Système de migration automatique
- **Flexibilité** : API supportant les deux formats

### Métriques de Succès
- **0 régression** : Tous les tests existants passent
- **100% compatibilité** : Données legacy préservées
- **Migration automatique** : Aucune intervention manuelle requise
- **API améliorée** : Noms explicites disponibles

---

## 8. Conclusion

La migration des colonnes `t`/`h` vers `temperature`/`humidity` a été réalisée avec succès en implémentant :

1. **Un système de migration robuste** gérant les bases legacy et nouvelles
2. **Une API Repository flexible** supportant les deux formats
3. **Une rétrocompatibilité complète** préservant tous les tests existants
4. **Une meilleure lisibilité du code** avec des noms explicites

Les principales difficultés rencontrées (conflits de vues, limitations SQLite, détection de version) ont été résolues par une approche méthodique et des tests approfondis.

Le système est maintenant prêt pour la production avec une migration transparente des bases existantes et une API améliorée pour les nouveaux développements.
