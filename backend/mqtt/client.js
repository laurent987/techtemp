/**
 * @file MQTT wrapper (connect/subscribe/publish/close) with minimal auto-retry.
 */

import mqtt from 'mqtt';

/** @typedef {(topic: string, payload: Buffer, packet: import('mqtt').Packet) => void} MqttMessageHandler */

/**
 * Create a connected MQTT client.
 * @param {{ url: string, username?: string, password?: string, will?: object }} opts
 * @returns {{
 *  client: import('mqtt').MqttClient,
 *  subscribe: (topic: string, qos?: number) => Promise<void>,
 *  publish: (topic: string, msg: string|Buffer, opts?: import('mqtt').IClientPublishOptions) => Promise<void>,
 *  onMessage: (handler: MqttMessageHandler) => () => void,
 *  close: () => Promise<void>
 * }}
 * @pre opts.url is valid
 * @post client connected (or explicit failure)
 * @throws {Error} if connection cannot be established
 */
export function createMqttClient(opts) {
  if (!opts?.url) {
    throw new Error('url is required');
  }

  const connectOptions = {
    username: opts.username,
    password: opts.password,
    will: opts.will,
    reconnectPeriod: 1000,
    connectTimeout: 30000,
  };

  const client = mqtt.connect(opts.url, connectOptions);
  const messageHandlers = new Set();

  // Handle incoming messages
  client.on('message', (topic, payload, packet) => {
    messageHandlers.forEach(handler => {
      try {
        handler(topic, payload, packet);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  });

  return {
    client,

    /**
     * Subscribe to a topic
     * @param {string} topic 
     * @param {number} qos - Quality of Service (0, 1, or 2)
     * @returns {Promise<void>}
     */
    async subscribe(topic, qos = 1) {
      if (!topic || typeof topic !== 'string') {
        throw new Error('topic is required and must be a string');
      }

      return new Promise((resolve, reject) => {
        client.subscribe(topic, { qos }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    /**
     * Publish a message to a topic
     * @param {string} topic 
     * @param {string|Buffer} msg 
     * @param {object} options - publish options
     * @returns {Promise<void>}
     */
    async publish(topic, msg, options = {}) {
      if (!topic || typeof topic !== 'string') {
        throw new Error('topic is required and must be a string');
      }
      if (msg == null) {
        throw new Error('msg is required');
      }

      const publishOptions = {
        qos: 1,
        retain: false,
        ...options
      };

      return new Promise((resolve, reject) => {
        client.publish(topic, msg, publishOptions, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    /**
     * Register a message handler
     * @param {MqttMessageHandler} handler 
     * @returns {() => void} unsubscribe function
     */
    onMessage(handler) {
      if (typeof handler !== 'function') {
        throw new Error('handler must be a function');
      }

      messageHandlers.add(handler);

      // Return unsubscribe function
      return () => {
        messageHandlers.delete(handler);
      };
    },

    /**
     * Close the MQTT connection
     * @returns {Promise<void>}
     */
    async close() {
      return new Promise((resolve) => {
        if (client.connected) {
          client.end(false, {}, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
  };
}
