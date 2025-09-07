/**
 * @file Validation of sensor reading payload (Joi).
 */

import Joi from 'joi';

/** Public schema (useful for other services/tests). */
export const readingSchema = Joi.object({
  ts: Joi.number().integer().min(0).required(),
  temperature_c: Joi.number().greater(-80).less(100).required(),
  humidity_pct: Joi.number().min(0).max(100).required(),
  extra: Joi.object().unknown(true).optional(),
}).required();

/**
 * Validate and normalize the raw JSON payload.
 * @param {unknown} payload
 * @returns {import('../types.js').ReadingPayload}
 * @throws {Error} if invalid
 */
export function validateReadingPayload(payload) {
  throw new Error('NotImplemented');
}
