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
#define MAX_STRING_LEN         256
#define MAX_TOPIC_LEN          512
#define MAX_PAYLOAD_LEN        1024
#define MAX_DEVICE_UID_LEN     64
#define MAX_HOME_ID_LEN        32
#define DEVICE_UID_LENGTH      16
#define ISO8601_TIMESTAMP_SIZE 32

// Logging levels
typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR
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
void get_timestamp_iso(char* buffer, size_t buffer_size);
void get_timestamp_local(char* buffer, size_t buffer_size);

// Logging functions
int log_init(log_level_t level, const char* log_file_path, bool console_output);
void log_set_level(log_level_t level);
log_level_t log_get_level(void);
void log_write(log_level_t level, const char* file, int line, const char* format, ...);
void log_cleanup(void);

// String utilities
char* str_trim(char* str);
int str_iequals(const char* str1, const char* str2);
int str_to_bool(const char* str, bool* value);
int str_to_int(const char* str, int* value, int min_val, int max_val);

// File utilities
bool file_exists(const char* filepath);
int create_directory(const char* path);
const char* get_home_directory(void);

// Device utilities
int generate_device_uid(char* uid_buffer, size_t buffer_size);

// Signal handling
void setup_signal_handlers(void);
void signal_handler(int signum);

// Error handling macros
#define CHECK_ERROR(condition, message) \
    do { \
        if (!(condition)) { \
            LOG_ERROR_F("%s: %s", message, strerror(errno)); \
            return TECHTEMP_ERROR; \
        } \
    } while(0)

#define LOG_DEBUG_F(format, ...) log_write(LOG_LEVEL_DEBUG, __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_INFO_F(format, ...)  log_write(LOG_LEVEL_INFO, __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_WARN_F(format, ...)  log_write(LOG_LEVEL_WARN, __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_ERROR_F(format, ...) log_write(LOG_LEVEL_ERROR, __FILE__, __LINE__, format, ##__VA_ARGS__)

#endif // COMMON_H
