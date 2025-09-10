/**
 * @file config.c
 * @brief Configuration management implementation
 * @author TechTemp Project
 * @date 2025-09-10
 */

#define _GNU_SOURCE  // Pour gethostname()
#include "config.h"
#include <limits.h>
#include <unistd.h>  // Pour gethostname()
#include <string.h>  // Pour memcpy()

// Internal helper functions
static int parse_config_line(const char* line, const char* section, device_config_t* config);
static int parse_device_section(const char* key, const char* value, device_config_t* config);
static int parse_sensor_section(const char* key, const char* value, device_config_t* config);
static int parse_mqtt_section(const char* key, const char* value, device_config_t* config);
static int parse_logging_section(const char* key, const char* value, device_config_t* config);
static int parse_system_section(const char* key, const char* value, device_config_t* config);
static void trim_whitespace(char* str);
static log_level_t parse_log_level(const char* level_str);

// Helper pour copie sécurisée sans warnings
static void safe_strcpy(char* dest, const char* src, size_t dest_size) {
    size_t len = strlen(src);
    if (len >= dest_size) {
        len = dest_size - 1;
    }
    memcpy(dest, src, len);
    dest[len] = '\0';
}

/**
 * Load configuration from file
 */
int config_load(const char* config_file, device_config_t* config) {
    FILE* file = NULL;
    char line[MAX_STRING_LEN];
    char current_section[64] = "";
    int line_number = 0;
    
    if (!config) {
        LOG_ERROR_F("Config pointer is null");
        return TECHTEMP_ERROR;
    }
    
    // Set defaults first
    config_set_defaults(config);
    
    // Determine config file path
    const char* file_path = config_file;
    if (!file_path) {
        // Try local config first, then system config
        if (access(LOCAL_CONFIG_FILE, R_OK) == 0) {
            file_path = LOCAL_CONFIG_FILE;
        } else if (access(DEFAULT_CONFIG_FILE, R_OK) == 0) {
            file_path = DEFAULT_CONFIG_FILE;
        } else {
            LOG_WARN_F("No config file found, using defaults");
            return TECHTEMP_OK;
        }
    }
    
    LOG_INFO_F("Loading config from: %s", file_path);
    
    file = fopen(file_path, "r");
    if (!file) {
        LOG_ERROR_F("Cannot open config file: %s", file_path);
        return TECHTEMP_CONFIG_ERROR;
    }
    
    while (fgets(line, sizeof(line), file)) {
        line_number++;
        trim_whitespace(line);
        
        // Skip empty lines and comments
        if (line[0] == '\0' || line[0] == '#') {
            continue;
        }
        
        // Check for section headers [section]
        if (line[0] == '[' && line[strlen(line)-1] == ']') {
            line[strlen(line)-1] = '\0'; // Remove closing bracket
            strncpy(current_section, line + 1, sizeof(current_section) - 1);
            current_section[sizeof(current_section) - 1] = '\0';
            continue;
        }
        
        // Parse key=value pairs
        int result = parse_config_line(line, current_section, config);
        if (result != TECHTEMP_OK) {
            LOG_WARN_F("Invalid config at line %d: %s", line_number, line);
        }
    }
    
    fclose(file);
    LOG_INFO_F("Configuration loaded successfully");
    return TECHTEMP_OK;
}

/**
 * Set default configuration values
 */
void config_set_defaults(device_config_t* config) {
    if (!config) return;
    
    // Device defaults
    strncpy(config->device_uid, "aht20-unknown", sizeof(config->device_uid) - 1);
    strncpy(config->home_id, "home-001", sizeof(config->home_id) - 1);
    strncpy(config->label, "TechTemp Sensor", sizeof(config->label) - 1);
    
    // Sensor defaults
    config->i2c_address = 0x38; // AHT20_DEFAULT_ADDRESS;
    config->i2c_bus = 1;
    config->read_interval = 30;
    config->temp_offset = 0.0f;
    config->humidity_offset = 0.0f;
    
    // MQTT defaults
    strncpy(config->mqtt_host, "localhost", sizeof(config->mqtt_host) - 1);
    config->mqtt_port = 1883;
    config->mqtt_username[0] = '\0';
    config->mqtt_password[0] = '\0';
    config->mqtt_qos = 1;
    config->mqtt_retain = false;
    config->mqtt_keepalive = 60;
    
    // Logging defaults
    config->log_level = LOG_LEVEL_INFO;
    config->log_to_console = true;
    config->log_to_file = false;
    strncpy(config->log_file, "/var/log/techtemp-device.log", sizeof(config->log_file) - 1);
    
    // System defaults
    config->daemon_mode = false;
    strncpy(config->pid_file, "/var/run/techtemp-device.pid", sizeof(config->pid_file) - 1);
}

/**
 * Validate configuration values
 */
int config_validate(const device_config_t* config) {
    if (!config) {
        LOG_ERROR_F("Config pointer is null");
        return TECHTEMP_CONFIG_ERROR;
    }
    
    // Validate device_uid
    if (strlen(config->device_uid) == 0) {
        LOG_ERROR_F("Device UID cannot be empty");
        return TECHTEMP_CONFIG_ERROR;
    }
    
    // Validate home_id
    if (strlen(config->home_id) == 0) {
        LOG_ERROR_F("Home ID cannot be empty");
        return TECHTEMP_CONFIG_ERROR;
    }
    
    // Validate I2C settings
    if (config->i2c_address == 0) {
        LOG_ERROR_F("Invalid I2C address: 0x%02X", config->i2c_address);
        return TECHTEMP_CONFIG_ERROR;
    }
    
    if (config->read_interval <= 0 || config->read_interval > 3600) {
        LOG_ERROR_F("Invalid read interval: %d (must be 1-3600 seconds)", config->read_interval);
        return TECHTEMP_CONFIG_ERROR;
    }
    
    // Validate MQTT settings
    if (strlen(config->mqtt_host) == 0) {
        LOG_ERROR_F("MQTT host cannot be empty");
        return TECHTEMP_CONFIG_ERROR;
    }
    
    if (config->mqtt_port <= 0 || config->mqtt_port > 65535) {
        LOG_ERROR_F("Invalid MQTT port: %d", config->mqtt_port);
        return TECHTEMP_CONFIG_ERROR;
    }
    
    return TECHTEMP_OK;
}

/**
 * Print configuration (for debugging)
 */
void config_print(const device_config_t* config) {
    if (!config) return;
    
    printf("\n=== TechTemp Device Configuration ===\n");
    printf("Device UID: %s\n", config->device_uid);
    printf("Home ID: %s\n", config->home_id);
    printf("Label: %s\n", config->label);
    printf("I2C Address: 0x%02X\n", config->i2c_address);
    printf("I2C Bus: %d\n", config->i2c_bus);
    printf("Read Interval: %d seconds\n", config->read_interval);
    printf("MQTT Broker: %s:%d\n", config->mqtt_host, config->mqtt_port);
    printf("Log Level: %d\n", config->log_level);
    printf("=====================================\n\n");
}

/**
 * Generate device UID from MAC address
 */
int config_generate_device_uid(char* device_uid, size_t max_len) {
    if (!device_uid || max_len < 20) {
        return TECHTEMP_ERROR;
    }
    
    // Try to read MAC address from system
    FILE* file = fopen("/sys/class/net/eth0/address", "r");
    if (!file) {
        // Fallback to wlan0
        file = fopen("/sys/class/net/wlan0/address", "r");
    }
    
    if (file) {
        char mac[18];
        if (fgets(mac, sizeof(mac), file)) {
            // Remove colons and newlines from MAC
            char clean_mac[13];
            int j = 0;
            for (int i = 0; mac[i] && j < 12; i++) {
                if (mac[i] != ':' && mac[i] != '\n') {
                    clean_mac[j++] = mac[i];
                }
            }
            clean_mac[j] = '\0';
            
            snprintf(device_uid, max_len, "aht20-%s", clean_mac);
            fclose(file);
            return TECHTEMP_OK;
        }
        fclose(file);
    }
    
    // Fallback to hostname-based UID
    char hostname[64];
    if (gethostname(hostname, sizeof(hostname)) == 0) {
        snprintf(device_uid, max_len, "aht20-%s", hostname);
        return TECHTEMP_OK;
    }
    
    // Ultimate fallback
    strncpy(device_uid, "aht20-unknown", max_len - 1);
    device_uid[max_len - 1] = '\0';
    return TECHTEMP_OK;
}

// Internal helper functions implementation

static int parse_config_line(const char* line, const char* section, device_config_t* config) {
    char* equals = strchr(line, '=');
    if (!equals) return TECHTEMP_ERROR;
    
    char key[128], value[256];
    
    // Extract key
    size_t key_len = equals - line;
    if (key_len >= sizeof(key)) return TECHTEMP_ERROR;
    strncpy(key, line, key_len);
    key[key_len] = '\0';
    trim_whitespace(key);
    
    // Extract value
    strncpy(value, equals + 1, sizeof(value) - 1);
    value[sizeof(value) - 1] = '\0';
    trim_whitespace(value);
    
    // Route to appropriate section parser
    if (strcmp(section, "device") == 0) {
        return parse_device_section(key, value, config);
    } else if (strcmp(section, "sensor") == 0) {
        return parse_sensor_section(key, value, config);
    } else if (strcmp(section, "mqtt") == 0) {
        return parse_mqtt_section(key, value, config);
    } else if (strcmp(section, "logging") == 0) {
        return parse_logging_section(key, value, config);
    } else if (strcmp(section, "system") == 0) {
        return parse_system_section(key, value, config);
    }
    
    return TECHTEMP_ERROR;
}

static int parse_device_section(const char* key, const char* value, device_config_t* config) {
    if (strcmp(key, "device_uid") == 0) {
        safe_strcpy(config->device_uid, value, sizeof(config->device_uid));
    } else if (strcmp(key, "home_id") == 0) {
        safe_strcpy(config->home_id, value, sizeof(config->home_id));
    } else if (strcmp(key, "label") == 0) {
        safe_strcpy(config->label, value, sizeof(config->label));
    } else {
        return TECHTEMP_ERROR;
    }
    return TECHTEMP_OK;
}

static int parse_sensor_section(const char* key, const char* value, device_config_t* config) {
    if (strcmp(key, "i2c_address") == 0) {
        config->i2c_address = (uint8_t)strtol(value, NULL, 0);
    } else if (strcmp(key, "i2c_bus") == 0) {
        config->i2c_bus = atoi(value);
    } else if (strcmp(key, "read_interval_seconds") == 0) {
        config->read_interval = atoi(value);
    } else if (strcmp(key, "temperature_offset") == 0) {
        config->temp_offset = (float)atof(value);
    } else if (strcmp(key, "humidity_offset") == 0) {
        config->humidity_offset = (float)atof(value);
    } else {
        return TECHTEMP_ERROR;
    }
    return TECHTEMP_OK;
}

static int parse_mqtt_section(const char* key, const char* value, device_config_t* config) {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wstringop-truncation"
    if (strcmp(key, "broker_host") == 0) {
        strncpy(config->mqtt_host, value, sizeof(config->mqtt_host) - 1);
    } else if (strcmp(key, "broker_port") == 0) {
        config->mqtt_port = atoi(value);
    } else if (strcmp(key, "username") == 0) {
        strncpy(config->mqtt_username, value, sizeof(config->mqtt_username) - 1);
    } else if (strcmp(key, "password") == 0) {
        strncpy(config->mqtt_password, value, sizeof(config->mqtt_password) - 1);
#pragma GCC diagnostic pop
    } else if (strcmp(key, "qos") == 0) {
        config->mqtt_qos = atoi(value);
    } else if (strcmp(key, "retain") == 0) {
        config->mqtt_retain = (strcmp(value, "true") == 0);
    } else if (strcmp(key, "keepalive_seconds") == 0) {
        config->mqtt_keepalive = atoi(value);
    } else {
        return TECHTEMP_ERROR;
    }
    return TECHTEMP_OK;
}

static int parse_logging_section(const char* key, const char* value, device_config_t* config) {
    if (strcmp(key, "log_level") == 0) {
        config->log_level = parse_log_level(value);
    } else if (strcmp(key, "log_to_console") == 0) {
        config->log_to_console = (strcmp(value, "true") == 0);
    } else if (strcmp(key, "log_to_file") == 0) {
        config->log_to_file = (strcmp(value, "true") == 0);
    } else if (strcmp(key, "log_file_path") == 0) {
        safe_strcpy(config->log_file, value, sizeof(config->log_file));
    } else {
        return TECHTEMP_ERROR;
    }
    return TECHTEMP_OK;
}

static int parse_system_section(const char* key, const char* value, device_config_t* config) {
    if (strcmp(key, "daemon_mode") == 0) {
        config->daemon_mode = (strcmp(value, "true") == 0);
    } else if (strcmp(key, "pid_file") == 0) {
        safe_strcpy(config->pid_file, value, sizeof(config->pid_file));
    } else {
        return TECHTEMP_ERROR;
    }
    return TECHTEMP_OK;
}

static void trim_whitespace(char* str) {
    if (!str) return;
    
    // Trim leading whitespace
    char* start = str;
    while (*start && (*start == ' ' || *start == '\t' || *start == '\n' || *start == '\r')) {
        start++;
    }
    
    // Move trimmed string to beginning
    if (start != str) {
        memmove(str, start, strlen(start) + 1);
    }
    
    // Trim trailing whitespace
    char* end = str + strlen(str) - 1;
    while (end >= str && (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r')) {
        *end = '\0';
        end--;
    }
}

static log_level_t parse_log_level(const char* level_str) {
    if (strcmp(level_str, "DEBUG") == 0) return LOG_LEVEL_DEBUG;
    if (strcmp(level_str, "INFO") == 0) return LOG_LEVEL_INFO;
    if (strcmp(level_str, "WARN") == 0) return LOG_LEVEL_WARN;
    if (strcmp(level_str, "ERROR") == 0) return LOG_LEVEL_ERROR;
    return LOG_LEVEL_INFO; // Default
}
