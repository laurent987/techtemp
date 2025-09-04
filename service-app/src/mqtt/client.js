/**
 * @file MQTT wrapper (connect/subscribe/publish/close) with minimal auto-retry.
 */

import mqtt from 'mqtt';

/** @typedef {(topic: string, payload: Buffer, packet: import('mqtt').Packet) => void} MqttMessageHandler */

/**
 * Create a connected MQTT client.
 * @param {{ url: string, username?: string, password?: string }} opts
 * @returns {{
 *  client: import('mqtt').MqttClient,
 *  subscribe: (topic: string) => Promise<void>,
 *  publish: (topic: string, msg: string|Buffer, opts?: import('mqtt').IClientPublishOptions) => Promise<void>,
 *  onMessage: (handler: MqttMessageHandler) => void,
 *  close: () => Promise<void>
 * }}
 * @pre opts.url is valid
 * @post client connected (or explicit failure)
 * @throws {Error} if connection cannot be established
 */
export function createMqttClient(opts) {
  throw new Error('NotImplemented');
}
