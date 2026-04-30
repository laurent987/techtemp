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
#ifdef SIMULATION_MODE
    // Forward declaration for simulation
    struct mosquitto;
#else
    #include <mosquitto.h>
#endif

// MQTT configuration structure
typedef struct {
    char host[256];
    int port;
    char client_id[256];
    char username[256];
    char password[256];
    char topic[512];
    int qos;
    int keepalive;
    int connect_timeout_ms;
    bool use_tls;
    char ca_cert_path[256];
} mqtt_config_t;

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
 * @param config MQTT configuration
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_init(const mqtt_config_t* config);

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
 * @param device_uid Device unique identifier
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_publish_reading(const sensor_reading_t* reading, const char* device_uid);

/**
 * Process MQTT events (call regularly in main loop)
 * @param timeout_ms Timeout for processing in milliseconds
 * @return TECHTEMP_OK on success, error code on failure
 */
int mqtt_loop(int timeout_ms);

/**
 * Check if MQTT client is connected
 * @return true if connected, false otherwise
 */
bool mqtt_is_connected(void);

/**
 * Get last error message from MQTT operations
 * @return Pointer to error string
 */
const char* mqtt_get_error(void);

/**
 * Cleanup MQTT client and free resources
 */
void mqtt_cleanup(void);

#endif // MQTT_CLIENT_H
