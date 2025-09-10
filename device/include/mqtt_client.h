/**
 * @file mqtt_client.h
 * @brief MQTT Client for TechTemp Device Communication
 * @author TechTemp Project
 * @date 2025-09-10
 * 
 * MQTT client for publishing sensor readings to TechTemp backend
 * Uses libmosquitto for MQTT communication
 */

#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include "common.h"
#include <mosquitto.h>

// MQTT client constants
#define MQTT_CLIENT_ID_PREFIX   "techtemp-device-"
#define MQTT_TOPIC_TEMPLATE     "home/%s/sensors/%s/reading"
#define MQTT_PAYLOAD_TEMPLATE   "{\"temperature_c\":%.2f,\"humidity_pct\":%.2f,\"ts\":%llu}"

// Connection states
typedef enum {
    MQTT_DISCONNECTED = 0,
    MQTT_CONNECTING,
    MQTT_CONNECTED,
    MQTT_ERROR
} mqtt_state_t;

// MQTT client context
typedef struct {
    struct mosquitto* client;
    mqtt_state_t state;
    char client_id[MAX_STRING_LEN];
    char topic[MAX_TOPIC_LEN];
    bool session_present;
    int last_error;
} mqtt_client_t;

/**
 * Initialize MQTT client
 * @param config Device configuration containing MQTT settings
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_init(const device_config_t* config);

/**
 * Connect to MQTT broker
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_connect(void);

/**
 * Disconnect from MQTT broker
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_disconnect(void);

/**
 * Publish sensor reading to MQTT broker
 * @param reading Sensor reading data to publish
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_publish_reading(const sensor_reading_t* reading);

/**
 * Process MQTT events (call regularly in main loop)
 * @param timeout_ms Timeout for processing in milliseconds
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_loop(int timeout_ms);

/**
 * Check MQTT connection status
 * @return Current MQTT state
 */
mqtt_state_t mqtt_get_state(void);

/**
 * Get MQTT connection statistics
 * @param connected Pointer to bool for connection status
 * @param messages_sent Pointer to counter for sent messages
 * @param last_error Pointer to last error code
 */
void mqtt_get_stats(bool* connected, int* messages_sent, int* last_error);

/**
 * Cleanup MQTT client and free resources
 */
void mqtt_cleanup(void);

/**
 * Get last error message from MQTT operations
 * @return Pointer to error string
 */
const char* mqtt_get_error(void);

// MQTT callback functions (internal use)
void on_connect_callback(struct mosquitto* mosq, void* userdata, int result);
void on_disconnect_callback(struct mosquitto* mosq, void* userdata, int result);
void on_publish_callback(struct mosquitto* mosq, void* userdata, int mid);
void on_log_callback(struct mosquitto* mosq, void* userdata, int level, const char* str);

#endif // MQTT_CLIENT_H
