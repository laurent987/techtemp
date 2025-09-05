/**
 * @file Express server creation + routes wiring.
 */

import express from 'express';
import { healthRouter } from './routes/health.js';
import { readingsRouter } from './routes/readings.js';

/**
 * Create and start an HTTP server.
 * @param {{ port: number, deps: RouteDeps }} opts
 * @returns {{ app: import('express').Express, server: import('http').Server, stop: () => Promise<void> }}
 * @typedef {Object} RouteDeps
 * @property {import('../../db/index.js').DbRepo} repo
 */
export function createHttpServer(opts) {
  throw new Error('NotImplemented');
}
