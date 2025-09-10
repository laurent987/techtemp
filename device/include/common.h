/**
 * @file common.h
 * @brief Common types, constants and utilities for TechTemp Device Client
 * @author TechTemp Project
 * @date 2025-09-10
 */

#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdbool.h>
#include <stdint.h>
#include <time.h>
#include <signal.h>
#include <errno.h>

// Project information
#define TECHTEMP_VERSION "1.0.0"
#define TECHTEMP_NAME "TechTemp Device Client"

// Return codes
#define TECHTEMP_OK          0
#define TECHTEMP_ERROR       -1
#define TECHTEMP_TIMEOUT     -2
#define TECHTEMP_NO_DATA     -3
#define TECHTEMP_CONFIG_ERROR -4

// Limits and constants
#define MAX_STRING_LEN       256
#define MAX_TOPIC_LEN        512
#define MAX_PAYLOAD_LEN      1024
#define MAX_DEVICE_UID_LEN   64
#define MAX_HOME_ID_LEN      32

// Logging levels
typedef enum {
    LOG_DEBUG = 0,
    LOG_INFO,
    LOG_WARN,
    LOG_ERROR
} log_level_t;

// Sensor reading structure
typedef struct {
    float temperature;      // Temperature in Celsius
    float humidity;        // Humidity in percentage
    uint64_t timestamp;    // Unix timestamp in milliseconds
    bool valid;            // Data validity flag
} sensor_reading_t;

// Device configuration structure  
typedef struct {
    // Device info
    char device_uid[MAX_DEVICE_UID_LEN];
    char home_id[MAX_HOME_ID_LEN];
    char label[MAX_STRING_LEN];
    
    // Sensor settings
    uint8_t i2c_address;
    int i2c_bus;
    int read_interval;
    float temp_offset;
    float humidity_offset;
    
    // MQTT settings
    char mqtt_host[MAX_STRING_LEN];
    int mqtt_port;
    char mqtt_username[MAX_STRING_LEN];
    char mqtt_password[MAX_STRING_LEN];
    int mqtt_qos;
    bool mqtt_retain;
    int mqtt_keepalive;
    
    // Logging settings
    log_level_t log_level;
    bool log_to_console;
    bool log_to_file;
    char log_file[MAX_STRING_LEN];
    
    // System settings
    bool daemon_mode;
    char pid_file[MAX_STRING_LEN];
} device_config_t;

// Global variables
extern volatile bool g_running;      // Application running flag
extern device_config_t g_config;    // Global configuration

// Utility functions
uint64_t get_timestamp_ms(void);
void log_message(log_level_t level, const char* format, ...);
const char* log_level_string(log_level_t level);

// Signal handling
void setup_signal_handlers(void);
void signal_handler(int signum);

// Error handling macros
#define CHECK_ERROR(condition, message) \
    do { \
        if (!(condition)) { \
            log_message(LOG_ERROR, "%s: %s", message, strerror(errno)); \
            return TECHTEMP_ERROR; \
        } \
    } while(0)

#define LOG_DEBUG_F(format, ...) log_message(LOG_DEBUG, format, ##__VA_ARGS__)
#define LOG_INFO_F(format, ...)  log_message(LOG_INFO, format, ##__VA_ARGS__)
#define LOG_WARN_F(format, ...)  log_message(LOG_WARN, format, ##__VA_ARGS__)
#define LOG_ERROR_F(format, ...) log_message(LOG_ERROR, format, ##__VA_ARGS__)

#endif // COMMON_H
