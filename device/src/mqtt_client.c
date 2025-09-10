/**
 * @file mqtt_client.c
 * @brief MQTT Client Implementation for TechTemp Device
 * @author TechTemp Project
 * @date 2025-09-10
 */

#define _DEFAULT_SOURCE  // Pour usleep()
#include "mqtt_client.h"
#include <signal.h>
#include <errno.h>
#include <stdlib.h>
#include <stdarg.h>
#include <unistd.h>  // Pour usleep()
#ifdef SIMULATION_MODE
    // Simulation mode - no real MQTT
    typedef struct { int dummy; } mosquitto;
    #define MOSQ_ERR_SUCCESS 0
    #define MOSQ_ERR_NO_CONN 1
    #define MOSQ_ERR_EAGAIN 2
    static int sim_mosquitto_lib_init(void) { return 0; }
    static struct mosquitto* sim_mosquitto_new(const char* id, bool clean, void* obj) { (void)id; (void)clean; (void)obj; return (struct mosquitto*)malloc(sizeof(int)); }
    static void sim_mosquitto_lib_cleanup(void) {}
    static void sim_mosquitto_destroy(struct mosquitto* mosq) { if(mosq) free(mosq); }
    static int sim_mosquitto_username_pw_set(struct mosquitto* mosq, const char* user, const char* pass) { (void)mosq; (void)user; (void)pass; return 0; }
    static int sim_mosquitto_tls_set(struct mosquitto* mosq, const char* ca, const char* cert, const char* key, const char* pwd, int (*verify)(int, void*)) { (void)mosq; (void)ca; (void)cert; (void)key; (void)pwd; (void)verify; return 0; }
    static int sim_mosquitto_tls_opts_set(struct mosquitto* mosq, int verify, const char* version, const char* ciphers) { (void)mosq; (void)verify; (void)version; (void)ciphers; return 0; }
    static void sim_mosquitto_connect_callback_set(struct mosquitto* mosq, void (*cb)(struct mosquitto*, void*, int)) { (void)mosq; (void)cb; }
    static void sim_mosquitto_disconnect_callback_set(struct mosquitto* mosq, void (*cb)(struct mosquitto*, void*, int)) { (void)mosq; (void)cb; }
    static void sim_mosquitto_publish_callback_set(struct mosquitto* mosq, void (*cb)(struct mosquitto*, void*, int)) { (void)mosq; (void)cb; }
    static void sim_mosquitto_log_callback_set(struct mosquitto* mosq, void (*cb)(struct mosquitto*, void*, int, const char*)) { (void)mosq; (void)cb; }
    static int sim_mosquitto_opts_set(struct mosquitto* mosq, int opt, void* val) { (void)mosq; (void)opt; (void)val; return 0; }
    static int sim_mosquitto_connect_async(struct mosquitto* mosq, const char* host, int port, int keepalive) { (void)mosq; (void)host; (void)port; (void)keepalive; return 0; }
    static int sim_mosquitto_loop_start(struct mosquitto* mosq) { (void)mosq; return 0; }
    static int sim_mosquitto_loop_misc(struct mosquitto* mosq) { (void)mosq; return 0; }
    static int sim_mosquitto_disconnect(struct mosquitto* mosq) { (void)mosq; return 0; }
    static void sim_mosquitto_loop_stop(struct mosquitto* mosq, bool force) { (void)mosq; (void)force; }
    static int sim_mosquitto_publish(struct mosquitto* mosq, int* mid, const char* topic, int payloadlen, const void* payload, int qos, bool retain) { (void)mosq; (void)topic; (void)payloadlen; (void)payload; (void)qos; (void)retain; if(mid) *mid = 1; return 0; }
    static int sim_mosquitto_loop(struct mosquitto* mosq, int timeout, int max_packets) { (void)mosq; (void)timeout; (void)max_packets; return 0; }
    static const char* sim_mosquitto_strerror(int mosq_errno) { (void)mosq_errno; return "Simulation mode"; }

    // Map function names
    #define mosquitto_lib_init sim_mosquitto_lib_init
    #define mosquitto_new sim_mosquitto_new
    #define mosquitto_lib_cleanup sim_mosquitto_lib_cleanup
    #define mosquitto_destroy sim_mosquitto_destroy
    #define mosquitto_username_pw_set sim_mosquitto_username_pw_set
    #define mosquitto_tls_set sim_mosquitto_tls_set
    #define mosquitto_tls_opts_set sim_mosquitto_tls_opts_set
    #define mosquitto_connect_callback_set sim_mosquitto_connect_callback_set
    #define mosquitto_disconnect_callback_set sim_mosquitto_disconnect_callback_set
    #define mosquitto_publish_callback_set sim_mosquitto_publish_callback_set
    #define mosquitto_log_callback_set sim_mosquitto_log_callback_set
    #define mosquitto_opts_set sim_mosquitto_opts_set
    #define mosquitto_connect_async sim_mosquitto_connect_async
    #define mosquitto_loop_start sim_mosquitto_loop_start
    #define mosquitto_loop_misc sim_mosquitto_loop_misc
    #define mosquitto_disconnect sim_mosquitto_disconnect
    #define mosquitto_loop_stop sim_mosquitto_loop_stop
    #define mosquitto_publish sim_mosquitto_publish
    #define mosquitto_loop sim_mosquitto_loop
    #define mosquitto_strerror sim_mosquitto_strerror
    
    // Some missing constants
    #define MOSQ_OPT_PROTOCOL_VERSION 1
    #define MQTT_PROTOCOL_V311 4
    #define MOSQ_LOG_ERR 1
    #define MOSQ_LOG_WARNING 2
    #define MOSQ_LOG_NOTICE 3
    #define MOSQ_LOG_INFO 4
    #define MOSQ_LOG_DEBUG 5
#else
    #include <mosquitto.h>
#endif

// Internal state
static struct mosquitto* mosq = NULL;
static bool connected = false;
static bool initialized = false;
static char last_error[512] = "";
static mqtt_config_t current_config;
static volatile bool connection_in_progress = false;

// Internal helper functions
static void on_connect(struct mosquitto* mosq, void* obj, int result);
static void on_disconnect(struct mosquitto* mosq, void* obj, int result);
static void on_publish(struct mosquitto* mosq, void* obj, int mid);
static void on_log(struct mosquitto* mosq, void* obj, int level, const char* str);
static void set_error(const char* format, ...);
static const char* connection_result_to_string(int result);
static int validate_config(const mqtt_config_t* config);

/**
 * Initialize MQTT client
 */
int mqtt_init(const mqtt_config_t* config) {
    if (!config) {
        set_error("Configuration pointer is null");
        return TECHTEMP_ERROR;
    }
    
    int result = validate_config(config);
    if (result != TECHTEMP_OK) {
        return result;
    }
    
    LOG_DEBUG_F("Initializing MQTT client");
    LOG_DEBUG_F("Broker: %s:%d", config->host, config->port);
    LOG_DEBUG_F("Client ID: %s", config->client_id);
    LOG_DEBUG_F("Topic: %s", config->topic);
    
    // Initialize Mosquitto library
    int lib_result = mosquitto_lib_init();
    if (lib_result != MOSQ_ERR_SUCCESS) {
        set_error("Failed to initialize Mosquitto library: %s", mosquitto_strerror(lib_result));
        return TECHTEMP_ERROR;
    }
    
    // Create mosquitto client instance
    mosq = mosquitto_new(config->client_id, true, NULL);
    if (!mosq) {
        set_error("Failed to create Mosquitto client instance");
        mosquitto_lib_cleanup();
        return TECHTEMP_ERROR;
    }
    
    // Store configuration
    memcpy(&current_config, config, sizeof(mqtt_config_t));
    
    // Set authentication if provided
    if (strlen(config->username) > 0) {
        LOG_DEBUG_F("Setting MQTT authentication for user: %s", config->username);
        lib_result = mosquitto_username_pw_set(mosq, config->username, config->password);
        if (lib_result != MOSQ_ERR_SUCCESS) {
            set_error("Failed to set MQTT credentials: %s", mosquitto_strerror(lib_result));
            mqtt_cleanup();
            return TECHTEMP_ERROR;
        }
    }
    
    // Set TLS if enabled
    if (config->use_tls) {
        LOG_DEBUG_F("Enabling TLS for MQTT connection");
        lib_result = mosquitto_tls_set(mosq, config->ca_cert_path, NULL, NULL, NULL, NULL);
        if (lib_result != MOSQ_ERR_SUCCESS) {
            set_error("Failed to configure TLS: %s", mosquitto_strerror(lib_result));
            mqtt_cleanup();
            return TECHTEMP_ERROR;
        }
        
        // Set TLS options
        lib_result = mosquitto_tls_opts_set(mosq, 1, "tlsv1.2", NULL);
        if (lib_result != MOSQ_ERR_SUCCESS) {
            set_error("Failed to set TLS options: %s", mosquitto_strerror(lib_result));
            mqtt_cleanup();
            return TECHTEMP_ERROR;
        }
    }
    
    // Set callbacks
    mosquitto_connect_callback_set(mosq, on_connect);
    mosquitto_disconnect_callback_set(mosq, on_disconnect);
    mosquitto_publish_callback_set(mosq, on_publish);
    mosquitto_log_callback_set(mosq, on_log);
    
    // Set connection options
    mosquitto_opts_set(mosq, MOSQ_OPT_PROTOCOL_VERSION, &(int){MQTT_PROTOCOL_V311});
    
    initialized = true;
    LOG_INFO_F("MQTT client initialized successfully");
    return TECHTEMP_OK;
}

/**
 * Connect to MQTT broker
 */
int mqtt_connect(void) {
    if (!initialized) {
        set_error("MQTT client not initialized");
        return TECHTEMP_ERROR;
    }
    
    if (connected) {
        LOG_DEBUG_F("MQTT already connected");
        return TECHTEMP_OK;
    }
    
    if (connection_in_progress) {
        set_error("Connection already in progress");
        return TECHTEMP_ERROR;
    }
    
    LOG_INFO_F("Connecting to MQTT broker %s:%d", current_config.host, current_config.port);
    connection_in_progress = true;
    
    int result = mosquitto_connect_async(mosq, current_config.host, current_config.port, current_config.keepalive);
    if (result != MOSQ_ERR_SUCCESS) {
        connection_in_progress = false;
        set_error("Failed to connect to MQTT broker: %s", mosquitto_strerror(result));
        return TECHTEMP_ERROR;
    }
    
    // Start network loop
    result = mosquitto_loop_start(mosq);
    if (result != MOSQ_ERR_SUCCESS) {
        connection_in_progress = false;
        set_error("Failed to start MQTT network loop: %s", mosquitto_strerror(result));
        return TECHTEMP_ERROR;
    }
    
    // Wait for connection to complete
    int timeout = current_config.connect_timeout_ms / 100; // 100ms intervals
    while (timeout-- > 0 && connection_in_progress) {
        usleep(100000); // 100ms
        mosquitto_loop_misc(mosq);
    }
    
    if (connection_in_progress) {
        connection_in_progress = false;
        set_error("Timeout connecting to MQTT broker");
        return TECHTEMP_TIMEOUT;
    }
    
    if (!connected) {
        set_error("Failed to establish MQTT connection");
        return TECHTEMP_ERROR;
    }
    
    LOG_INFO_F("Connected to MQTT broker successfully");
    return TECHTEMP_OK;
}

/**
 * Disconnect from MQTT broker
 */
int mqtt_disconnect(void) {
    if (!initialized) {
        return TECHTEMP_OK;
    }
    
    if (!connected) {
        LOG_DEBUG_F("MQTT already disconnected");
        return TECHTEMP_OK;
    }
    
    LOG_INFO_F("Disconnecting from MQTT broker");
    
    int result = mosquitto_disconnect(mosq);
    if (result != MOSQ_ERR_SUCCESS) {
        set_error("Failed to disconnect from MQTT broker: %s", mosquitto_strerror(result));
        return TECHTEMP_ERROR;
    }
    
    // Stop network loop
    mosquitto_loop_stop(mosq, true);
    
    connected = false;
    return TECHTEMP_OK;
}

/**
 * Publish sensor reading to MQTT
 */
int mqtt_publish_reading(const sensor_reading_t* reading, const char* device_uid) {
    if (!reading || !device_uid) {
        set_error("Reading or device UID pointer is null");
        return TECHTEMP_ERROR;
    }
    
    if (!initialized) {
        set_error("MQTT client not initialized");
        return TECHTEMP_ERROR;
    }
    
    if (!connected) {
        set_error("MQTT client not connected");
        return TECHTEMP_ERROR;
    }
    
    if (!reading->valid) {
        set_error("Sensor reading is not valid");
        return TECHTEMP_ERROR;
    }
    
    // Create JSON payload - Backend expects: temperature_c, humidity_pct, ts
    char payload[512];
    int written = snprintf(payload, sizeof(payload),
        "{"
        "\"temperature_c\":%.2f,"
        "\"humidity_pct\":%.2f,"
        "\"ts\":%lu"
        "}",
        reading->temperature,
        reading->humidity,
        (unsigned long)reading->timestamp
    );
    
    if (written >= (int)sizeof(payload)) {
        set_error("MQTT payload too large");
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("Publishing to topic '%s': %s", current_config.topic, payload);
    
    // Publish message
    int mid;
    int result = mosquitto_publish(mosq, &mid, current_config.topic, written, payload, current_config.qos, false);
    if (result != MOSQ_ERR_SUCCESS) {
        set_error("Failed to publish MQTT message: %s", mosquitto_strerror(result));
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("Message published with ID: %d", mid);
    return TECHTEMP_OK;
}

/**
 * Check if MQTT client is connected
 */
bool mqtt_is_connected(void) {
    return connected;
}

/**
 * Process MQTT network events
 */
int mqtt_loop(int timeout_ms) {
    if (!initialized) {
        return TECHTEMP_ERROR;
    }
    
    int result = mosquitto_loop(mosq, timeout_ms, 1);
    if (result != MOSQ_ERR_SUCCESS) {
        if (result == MOSQ_ERR_NO_CONN) {
            connected = false;
            return TECHTEMP_ERROR;
        }
        // Skip non-critical errors
        if (result != MOSQ_ERR_INVAL) {
            set_error("MQTT loop error: %s", mosquitto_strerror(result));
            return TECHTEMP_ERROR;
        }
    }
    
    return TECHTEMP_OK;
}

/**
 * Cleanup MQTT resources
 */
void mqtt_cleanup(void) {
    if (initialized) {
        LOG_DEBUG_F("Cleaning up MQTT resources");
        
        if (connected) {
            mqtt_disconnect();
        }
        
        if (mosq) {
            mosquitto_destroy(mosq);
            mosq = NULL;
        }
        
        mosquitto_lib_cleanup();
        
        initialized = false;
        connected = false;
        connection_in_progress = false;
    }
}

/**
 * Get last error message
 */
const char* mqtt_get_error(void) {
    return last_error;
}

// Internal callback functions

static void on_connect(struct mosquitto* mosq, void* obj, int result) {
    (void)mosq;
    (void)obj;
    
    connection_in_progress = false;
    
    if (result == 0) {
        connected = true;
        LOG_INFO_F("MQTT connection established");
    } else {
        connected = false;
        LOG_ERROR_F("MQTT connection failed: %s", connection_result_to_string(result));
    }
}

static void on_disconnect(struct mosquitto* mosq, void* obj, int result) {
    (void)mosq;
    (void)obj;
    
    connected = false;
    connection_in_progress = false;
    
    if (result == 0) {
        LOG_INFO_F("MQTT disconnected normally");
    } else {
        LOG_WARN_F("MQTT disconnected unexpectedly: %s", mosquitto_strerror(result));
    }
}

static void on_publish(struct mosquitto* mosq, void* obj, int mid) {
    (void)mosq;
    (void)obj;
    
    LOG_DEBUG_F("MQTT message %d published successfully", mid);
}

static void on_log(struct mosquitto* mosq, void* obj, int level, const char* str) {
    (void)mosq;
    (void)obj;
    
    // Map mosquitto log levels to our log levels
    switch (level) {
        case MOSQ_LOG_ERR:
            LOG_ERROR_F("MQTT: %s", str);
            break;
        case MOSQ_LOG_WARNING:
            LOG_WARN_F("MQTT: %s", str);
            break;
        case MOSQ_LOG_NOTICE:
        case MOSQ_LOG_INFO:
            LOG_INFO_F("MQTT: %s", str);
            break;
        case MOSQ_LOG_DEBUG:
            LOG_DEBUG_F("MQTT: %s", str);
            break;
        default:
            LOG_DEBUG_F("MQTT: %s", str);
            break;
    }
}

// Internal helper functions

static void set_error(const char* format, ...) {
    va_list args;
    va_start(args, format);
    vsnprintf(last_error, sizeof(last_error), format, args);
    va_end(args);
    last_error[sizeof(last_error) - 1] = '\0';
}

static const char* connection_result_to_string(int result) {
    switch (result) {
        case 0: return "Connection accepted";
        case 1: return "Connection refused (unacceptable protocol version)";
        case 2: return "Connection refused (identifier rejected)";
        case 3: return "Connection refused (broker unavailable)";
        case 4: return "Connection refused (bad username or password)";
        case 5: return "Connection refused (not authorized)";
        default: return "Unknown connection error";
    }
}

static int validate_config(const mqtt_config_t* config) {
    if (strlen(config->host) == 0) {
        set_error("MQTT host is required");
        return TECHTEMP_ERROR;
    }
    
    if (config->port <= 0 || config->port > 65535) {
        set_error("Invalid MQTT port: %d", config->port);
        return TECHTEMP_ERROR;
    }
    
    if (strlen(config->client_id) == 0) {
        set_error("MQTT client ID is required");
        return TECHTEMP_ERROR;
    }
    
    if (strlen(config->topic) == 0) {
        set_error("MQTT topic is required");
        return TECHTEMP_ERROR;
    }
    
    if (config->qos < 0 || config->qos > 2) {
        set_error("Invalid MQTT QoS: %d", config->qos);
        return TECHTEMP_ERROR;
    }
    
    if (config->keepalive <= 0) {
        set_error("Invalid MQTT keepalive: %d", config->keepalive);
        return TECHTEMP_ERROR;
    }
    
    if (config->connect_timeout_ms <= 0) {
        set_error("Invalid MQTT connect timeout: %d", config->connect_timeout_ms);
        return TECHTEMP_ERROR;
    }
    
    if (config->use_tls && strlen(config->ca_cert_path) == 0) {
        set_error("TLS enabled but no CA certificate path provided");
        return TECHTEMP_ERROR;
    }
    
    return TECHTEMP_OK;
}
