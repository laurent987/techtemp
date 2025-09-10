/**
 * @file main.c
 * @brief TechTemp Device Client - Main Entry Point
 * @author TechTemp Project
 * @date 2025-09-10
 * 
 * Main application for Raspberry Pi AHT20 sensor client
 * Reads temperature/humidity and publishes to MQTT broker
 */

#define _DEFAULT_SOURCE  // Pour usleep()
#include "common.h"
#include "config.h"
#include "aht20.h"
#include "mqtt_client.h"
#include <unistd.h>  // Pour usleep()

// Global variables
volatile bool g_running = true;
device_config_t g_config;

/**
 * Main application entry point
 */
int main(int argc, char* argv[]) {
    int result = TECHTEMP_OK;
    sensor_reading_t reading;
    const char* config_file = NULL;
    
    // Parse command line arguments
    if (argc > 1) {
        config_file = argv[1];
    }
    
    printf("=== %s v%s ===\n", TECHTEMP_NAME, TECHTEMP_VERSION);
    printf("Starting TechTemp Device Client...\n");
    
    // Setup signal handlers for graceful shutdown
    setup_signal_handlers();
    
    // Load configuration
    LOG_INFO_F("Loading configuration...");
    result = config_load(config_file, &g_config);
    if (result != TECHTEMP_OK) {
        LOG_ERROR_F("Failed to load configuration");
        return EXIT_FAILURE;
    }
    
    // Validate configuration
    result = config_validate(&g_config);
    if (result != TECHTEMP_OK) {
        LOG_ERROR_F("Invalid configuration");
        return EXIT_FAILURE;
    }
    
    LOG_INFO_F("Device UID: %s", g_config.device_uid);
    LOG_INFO_F("Device Label: %s", g_config.label);
    LOG_INFO_F("Read interval: %d seconds", g_config.read_interval);
    
    // Initialize AHT20 sensor
    LOG_INFO_F("Initializing AHT20 sensor...");
    result = aht20_init(g_config.i2c_bus, g_config.i2c_address);
    if (result != TECHTEMP_OK) {
        LOG_ERROR_F("Failed to initialize AHT20 sensor: %s", aht20_get_error());
        return EXIT_FAILURE;
    }
    
    // Initialize MQTT client
    LOG_INFO_F("Initializing MQTT client...");
    
    // Create MQTT configuration from device config
    mqtt_config_t mqtt_cfg = {
        .port = g_config.mqtt_port,
        .qos = g_config.mqtt_qos,
        .keepalive = g_config.mqtt_keepalive,
        .connect_timeout_ms = 5000,
        .use_tls = false
    };
    
    // Copie sécurisée des chaînes de configuration
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wstringop-truncation"
    strncpy(mqtt_cfg.host, g_config.mqtt_host, sizeof(mqtt_cfg.host) - 1);
    strncpy(mqtt_cfg.username, g_config.mqtt_username, sizeof(mqtt_cfg.username) - 1);
    strncpy(mqtt_cfg.password, g_config.mqtt_password, sizeof(mqtt_cfg.password) - 1);
#pragma GCC diagnostic pop
    
    snprintf(mqtt_cfg.client_id, sizeof(mqtt_cfg.client_id), "techtemp-%s", g_config.device_uid);
    snprintf(mqtt_cfg.topic, sizeof(mqtt_cfg.topic), "home/%s/sensors/%s/reading", 
             g_config.home_id, g_config.device_uid);
    
    result = mqtt_init(&mqtt_cfg);
    if (result != TECHTEMP_OK) {
        LOG_ERROR_F("Failed to initialize MQTT client: %s", mqtt_get_error());
        aht20_cleanup();
        return EXIT_FAILURE;
    }
    
    // Connect to MQTT broker
    LOG_INFO_F("Connecting to MQTT broker %s:%d...", g_config.mqtt_host, g_config.mqtt_port);
    result = mqtt_connect();
    if (result != TECHTEMP_OK) {
        LOG_ERROR_F("Failed to connect to MQTT broker: %s", mqtt_get_error());
        mqtt_cleanup();
        aht20_cleanup();
        return EXIT_FAILURE;
    }
    
    LOG_INFO_F("🚀 TechTemp Device Client started successfully!");
    LOG_INFO_F("Publishing sensor readings every %d seconds...", g_config.read_interval);
    
    // Main application loop
    while (g_running) {
        // Process MQTT events
        mqtt_loop(100);
        
        // Check if it's time to read sensor
        static time_t last_reading = 0;
        time_t now = time(NULL);
        
        if ((now - last_reading) >= g_config.read_interval) {
            LOG_DEBUG_F("Reading sensor data...");
            
            // Read sensor data
            result = aht20_read(&reading);
            if (result == TECHTEMP_OK && reading.valid) {
                // Apply calibration offsets
                reading.temperature += g_config.temp_offset;
                reading.humidity += g_config.humidity_offset;
                
                LOG_INFO_F("📊 T: %.2f°C, H: %.2f%%, TS: %llu", 
                          reading.temperature, reading.humidity, reading.timestamp);
                
                // Publish to MQTT
                result = mqtt_publish_reading(&reading, g_config.device_uid);
                if (result == TECHTEMP_OK) {
                    LOG_DEBUG_F("✅ Data published successfully");
                } else {
                    LOG_WARN_F("⚠️  Failed to publish data: %s", mqtt_get_error());
                }
            } else {
                LOG_WARN_F("⚠️  Failed to read sensor: %s", aht20_get_error());
            }
            
            last_reading = now;
        }
        
        // Check MQTT connection status
        if (!mqtt_is_connected()) {
            LOG_WARN_F("MQTT disconnected, attempting reconnection...");
            mqtt_connect();
        }
        
        // Small delay to prevent CPU spinning
        usleep(100000); // 100ms
    }
    
    // Graceful shutdown
    LOG_INFO_F("Shutting down TechTemp Device Client...");
    
    mqtt_disconnect();
    mqtt_cleanup();
    aht20_cleanup();
    
    LOG_INFO_F("✅ TechTemp Device Client stopped");
    return EXIT_SUCCESS;
}

/**
 * Setup signal handlers for graceful shutdown
 */
void setup_signal_handlers(void) {
    signal(SIGINT, signal_handler);   // Ctrl+C
    signal(SIGTERM, signal_handler);  // Termination request
    signal(SIGHUP, signal_handler);   // Hangup
}

/**
 * Signal handler for graceful shutdown
 */
void signal_handler(int signum) {
    const char* signal_name;
    
    switch (signum) {
        case SIGINT:  signal_name = "SIGINT"; break;
        case SIGTERM: signal_name = "SIGTERM"; break;
        case SIGHUP:  signal_name = "SIGHUP"; break;
        default:      signal_name = "Unknown"; break;
    }
    
    LOG_INFO_F("Received signal %s (%d), initiating graceful shutdown...", signal_name, signum);
    g_running = false;
}
