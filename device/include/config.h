/**
 * @file config.h
 * @brief Configuration management for TechTemp Device Client
 * @author TechTemp Project
 * @date 2025-09-10
 */

#ifndef CONFIG_H
#define CONFIG_H

#include "common.h"

// Default configuration file paths
#define DEFAULT_CONFIG_FILE "/etc/techtemp/device.conf"
#define LOCAL_CONFIG_FILE   "./config/device.conf"

/**
 * Load configuration from file
 * @param config_file Path to configuration file (NULL for default)
 * @param config Pointer to configuration structure to fill
 * @return TECHTEMP_OK on success, error code on failure
 */
int config_load(const char* config_file, device_config_t* config);

/**
 * Set default configuration values
 * @param config Pointer to configuration structure to initialize
 */
void config_set_defaults(device_config_t* config);

/**
 * Validate configuration values
 * @param config Pointer to configuration structure to validate
 * @return TECHTEMP_OK if valid, TECHTEMP_CONFIG_ERROR if invalid
 */
int config_validate(const device_config_t* config);

/**
 * Print configuration to console (for debugging)
 * @param config Pointer to configuration structure to print
 */
void config_print(const device_config_t* config);

/**
 * Generate device UID from MAC address
 * @param device_uid Buffer to store generated device UID
 * @param max_len Maximum length of device_uid buffer
 * @return TECHTEMP_OK on success, error code on failure
 */
int config_generate_device_uid(char* device_uid, size_t max_len);

#endif // CONFIG_H
