/**
 * @file /health route – liveness & readiness.
 */

import { Router } from 'express';

/**
 * Health router.
 * GET /health
 * 200 OK: { status: 'ok' } if database is accessible
 * 500: { status: 'failed' } if database test fails
 * @param {{ repo?: import('../../../repositories/index.js').Repository }} deps
 * @returns {import('express').Router}
 */
export function healthRouter(deps = {}) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      // Test database connectivity
      if (deps.repo) {
        // Try a simple database operation to test connectivity
        // We'll use a basic query that should work if the database is accessible
        await testDatabaseConnectivity(deps.repo);
      }

      // Database is accessible or no repo provided
      res.status(200).json({
        status: 'ok'
      });
    } catch (error) {
      // Database test failed
      console.error('Health check failed:', error.message);
      res.status(500).json({
        status: 'failed'
      });
    }
  });

  return router;
}

/**
 * Test database connectivity by running a simple query
 * @param {Object} repo - Repository instance
 * @throws {Error} If database is not accessible
 */
async function testDatabaseConnectivity(repo) {
  // Try to access a basic database operation
  // We'll try to find a non-existent device, which should return null but not throw
  // if the database is accessible
  try {
    await repo.devices.findById('__health_check__');
  } catch (error) {
    // If this throws, it means the database connection is broken
    throw new Error('Database connectivity test failed: ' + error.message);
  }
}
