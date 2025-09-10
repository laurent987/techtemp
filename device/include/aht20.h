/**
 * @file aht20.h
 * @brief AHT20 Temperature and Humidity Sensor Driver
 * @author TechTemp Project
 * @date 2025-09-10
 * 
 * Driver for AHT20 I2C temperature and humidity sensor
 * Supports temperature range: -40°C to +85°C
 * Supports humidity range: 0% to 100% RH
 */

#ifndef AHT20_H
#define AHT20_H

#include "common.h"

// AHT20 I2C constants
#define AHT20_DEFAULT_ADDRESS   0x38
#define AHT20_RESET_DELAY_MS    20
#define AHT20_MEASURE_DELAY_MS  120
#define AHT20_INIT_DELAY_MS     40

// AHT20 Commands
#define AHT20_CMD_INIT          0xBE    // Initialize sensor
#define AHT20_CMD_MEASURE       0xAC    // Trigger measurement  
#define AHT20_CMD_RESET         0xBA    // Soft reset
#define AHT20_CMD_STATUS        0x71    // Read status

// AHT20 Command parameters
#define AHT20_INIT_PARAM1       0x08
#define AHT20_INIT_PARAM2       0x00
#define AHT20_MEASURE_PARAM1    0x33
#define AHT20_MEASURE_PARAM2    0x00

// Status register bits
#define AHT20_STATUS_BUSY       0x80    // Sensor busy bit
#define AHT20_STATUS_CALIBRATED 0x08    // Calibration status bit

// Data processing constants
#define AHT20_HUMIDITY_MAX      1048576.0f   // 2^20
#define AHT20_TEMPERATURE_MAX   1048576.0f   // 2^20

/**
 * Initialize AHT20 sensor
 * @param i2c_bus I2C bus number (usually 1 on Raspberry Pi)
 * @param address I2C address of sensor (default 0x38)
 * @return TECHTEMP_OK on success, error code on failure
 */
int aht20_init(int i2c_bus, uint8_t address);

/**
 * Read temperature and humidity from AHT20
 * @param reading Pointer to sensor_reading_t structure to fill
 * @return TECHTEMP_OK on success, error code on failure
 */
int aht20_read(sensor_reading_t* reading);

/**
 * Perform soft reset of AHT20 sensor
 * @return TECHTEMP_OK on success, error code on failure
 */
int aht20_reset(void);

/**
 * Check if AHT20 is busy (measurement in progress)
 * @param busy Pointer to bool to store busy status
 * @return TECHTEMP_OK on success, error code on failure
 */
int aht20_is_busy(bool* busy);

/**
 * Check if AHT20 is calibrated and ready
 * @param calibrated Pointer to bool to store calibration status
 * @return TECHTEMP_OK on success, error code on failure
 */
int aht20_is_calibrated(bool* calibrated);

/**
 * Close AHT20 sensor and cleanup resources
 */
void aht20_cleanup(void);

/**
 * Get last error message from AHT20 operations
 * @return Pointer to error string
 */
const char* aht20_get_error(void);

#endif // AHT20_H
