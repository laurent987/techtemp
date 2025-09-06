/**
 * @file Tests for SQLite database initialization according to contract 001
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDb, closeDb } from '../src/db/index.js';
import path from 'path';
import fs from 'fs';

describe('SQLite Database Initialization', () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    // Créer un nouveau chemin de base de données pour chaque test
    testDbPath = path.join(process.cwd(), `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  });

  afterEach(async () => {
    // Nettoyer : fermer la DB et supprimer le fichier
    if (db && db.open) {
      await closeDb();
    }
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Database Connection', () => {
    it('should create database file when it does not exist', async () => {
      // Act
      db = initDb(testDbPath);

      // Assert
      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Cleanup
      await closeDb();
    });

    it('should open existing database file', async () => {
      // Arrange - créer la DB une première fois
      const db1 = initDb(testDbPath);
      await closeDb();

      // Act - rouvrir la même DB
      db = initDb(testDbPath);

      // Assert
      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Cleanup
      await closeDb();
    });

    it('should throw error for invalid database path', () => {
      const invalidPath = '/invalid/path/that/does/not/exist/db.sqlite';
      expect(() => initDb(invalidPath)).toThrow(/Failed to initialize database|Cannot open database/);
    });
  });

  describe('Database Schema Migration', () => {
    it('should create all required tables according to contract 001', async () => {
      // Act
      db = initDb(testDbPath);

      // Assert - vérifier que toutes les tables existent
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toEqual(['device_room_placements', 'devices', 'readings_raw', 'rooms']);
    });

    it('should support in-memory database for testing', async () => {
      // Act - utiliser :memory: comme path
      db = initDb(':memory:');

      // Assert
      expect(db).toBeDefined();

      // Vérifier que les tables sont créées même en mémoire
      const tables = db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `).get();

      expect(tables.count).toBe(4);
    });

    it('should enforce foreign key constraints', async () => {
      // Arrange
      db = initDb(':memory:');

      // Act & Assert - essayer d'insérer avec FK invalide
      expect(() => {
        db.prepare('INSERT INTO readings_raw (device_id, ts, t) VALUES (?, ?, ?)').run('nonexistent-device', new Date().toISOString(), 20.5);
      }).toThrow(); // Doit échouer à cause de la contrainte FK
    });

    it('should create required indexes for performance', async () => {
      // Arrange
      db = initDb(':memory:');

      // Act - récupérer tous les index
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      // Assert - vérifier que les index critiques existent
      const indexNames = indexes.map(i => i.name);
      expect(indexNames).toContain('idx_places_room');
      expect(indexNames).toContain('idx_places_device');
      expect(indexNames).toContain('idx_raw_room_ts');
      expect(indexNames).toContain('idx_raw_msg');
    });

    it('should create utility view v_room_last', async () => {
      // Arrange
      db = initDb(':memory:');

      // Act - vérifier que la vue existe et fonctionne
      const views = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'view' AND name = 'v_room_last'
      `).all();

      // Assert
      expect(views).toHaveLength(1);
      expect(views[0].name).toBe('v_room_last');

      // Vérifier qu'on peut requêter la vue (même vide)
      const result = db.prepare('SELECT * FROM v_room_last LIMIT 1').all();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

function cleanupTestDatabase(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}
