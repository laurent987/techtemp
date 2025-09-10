/**
 * @file Structured logging with winston for production-ready logs.
 * Supports console (dev) and file rotation (prod).
 */

import winston from 'winston';

/**
 * Create a logger instance based on environment.
 * @param {string} [nodeEnv='development'] - NODE_ENV value
 * @returns {winston.Logger}
 */
export function createLogger(nodeEnv = 'development') {
  const isDev = nodeEnv === 'development';

  const formats = [
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ];

  // In development, add colorized console output with pretty JSON
  if (isDev) {
    formats.push(
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ?
          '\n' + JSON.stringify(meta, null, 2) : '';
        const serviceStr = service ? `[${service}]` : '';
        return `${timestamp} ${level.toUpperCase()} ${serviceStr} ${message}${metaStr}`;
      })
    );
  }

  const transports = [];

  // Console transport (always)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(...formats),
      level: isDev ? 'debug' : 'info'
    })
  );

  // File transport (production only)
  if (!isDev) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(...formats)
      }),
      new winston.transports.File({
        filename: 'logs/app.log',
        format: winston.format.combine(...formats)
      })
    );
  }

  return winston.createLogger({
    level: isDev ? 'debug' : 'info',
    format: winston.format.combine(...formats),
    transports,
    defaultMeta: { service: 'iot-service' }
  });
}

/** Global logger instance */
export const logger = createLogger(process.env.NODE_ENV);
