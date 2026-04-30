/**
 * @file rooms.js – Room routes – /api/v1/rooms
 */

import { Router } from 'express';

/**
 * Create the rooms router.
 * GET /api/v1/rooms
 * 200: { data: Array<{uid, name, floor, side}> }
 * @param {{ repo: import('../../../repositories/index.js').Repository }} deps
 * @returns {import('express').Router}
 */
export function roomsRouter(deps = {}) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      if (!deps.repo) {
        return res.status(500).json({
          error: 'Repository not configured'
        });
      }

      const rooms = await deps.repo.rooms.findAll();
      const data = rooms.map(({ uid, name, floor, side }) => ({
        uid,
        name,
        floor: floor || null,
        side: side || null
      }));

      res.status(200).json({ data });
    } catch (error) {
      console.error('Rooms API error:', error.message);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  return router;
}
