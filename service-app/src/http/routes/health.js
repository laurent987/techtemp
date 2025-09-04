/**
 * @file /health route – liveness & readiness.
 */

import { Router } from 'express';

/**
 * Health router.
 * GET /health
 * 200 OK: { status: 'ok', uptime_s: number }
 * 503     if a critical dependency isn't ready (future extension)
 * @returns {import('express').Router}
 */
export function healthRouter() {
  throw new Error('NotImplemented');
}
