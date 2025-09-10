/**
 * @file aht20.c
 * @brief AHT20 Temperature and Humidity Sensor Driver - Version corrigée
 * @author TechTemp Project
 * @date 2025-09-10
 * 
 * Basé sur la référence Adafruit et tests validés
 */

#define _DEFAULT_SOURCE  // Pour usleep()
#include "aht20.h"
#include <stdarg.h>
#include <unistd.h>
#ifdef SIMULATION_MODE
    // Simulation stubs
    #define wiringPiSetup() 0
    #define wiringPiI2CSetup(addr) 42
    #define wiringPiI2CWrite(fd, data) 0
    #define wiringPiI2CRead(fd) 0x18
    #define usleep(us) 
    #define write(fd, buf, count) count
    #define read(fd, buf, count) count
#else
    #include <wiringPi.h>
    #include <wiringPiI2C.h>
#endif

// AHT20 Constants (basé sur la référence Adafruit)
#define AHT20_CMD_SOFTRESET     0xBA
#define AHT20_CMD_CALIBRATE     0xE1
#define AHT20_CMD_TRIGGER       0xAC
#define AHT20_STATUS_BUSY       0x80
#define AHT20_STATUS_CALIBRATED 0x08

// Timing constants (utilise ceux du header pour les principaux)
#define AHT20_POWERUP_DELAY_MS  20
#define AHT20_BUSY_TIMEOUT      10

// Internal state
static int i2c_handle = -1;
static bool initialized = false;
static char last_error[256] = "";

// Internal helper functions
static void aht20_delay_ms(int ms);
static float calculate_temperature(uint32_t raw_temp);
static float calculate_humidity(uint32_t raw_humidity);
static void set_error(const char* format, ...);
static bool write_i2c_block(uint8_t* data, int length);
static bool read_i2c_block(uint8_t* buffer, int length);
static uint8_t aht20_get_status(void);
static bool aht20_wait_not_busy(int timeout_cycles);

/**
 * Set error message
 */
static void set_error(const char* format, ...) {
    va_list args;
    va_start(args, format);
    vsnprintf(last_error, sizeof(last_error), format, args);
    va_end(args);
}

/**
 * Delay in milliseconds
 */
static void aht20_delay_ms(int ms) {
    usleep(ms * 1000);
}

/**
 * Write multiple bytes in a single I2C transaction
 */
static bool write_i2c_block(uint8_t* data, int length) {
    ssize_t result = write(i2c_handle, data, length);
    return (result == length);
}

/**
 * Read multiple bytes in a single I2C transaction
 */
static bool read_i2c_block(uint8_t* buffer, int length) {
    ssize_t result = read(i2c_handle, buffer, length);
    return (result == length);
}

/**
 * Get sensor status
 */
static uint8_t aht20_get_status(void) {
    int result = wiringPiI2CRead(i2c_handle);
    if (result == -1) {
        return 0xFF;
    }
    return (uint8_t)result;
}

/**
 * Wait for sensor to not be busy
 */
static bool aht20_wait_not_busy(int timeout_cycles) {
    while (timeout_cycles-- > 0) {
        uint8_t status = aht20_get_status();
        if (status == 0xFF) {
            return false;
        }
        if (!(status & AHT20_STATUS_BUSY)) {
            return true;
        }
        aht20_delay_ms(10);
    }
    return false;
}

/**
 * Calculate temperature from raw value (based on Adafruit formula)
 */
static float calculate_temperature(uint32_t raw_temp) {
    return ((float)raw_temp * 200.0 / 0x100000) - 50.0;
}

/**
 * Calculate humidity from raw value (based on Adafruit formula)
 */
static float calculate_humidity(uint32_t raw_humidity) {
    return ((float)raw_humidity * 100.0) / 0x100000;
}

/**
 * Initialize AHT20 sensor
 */
int aht20_init(int i2c_bus, uint8_t address) {
    LOG_DEBUG_F("Initializing AHT20 on I2C bus %d, address 0x%02X", i2c_bus, address);
    
    if (wiringPiSetup() == -1) {
        set_error("Failed to initialize WiringPi");
        return TECHTEMP_ERROR;
    }
    
    // Initialize I2C
    i2c_handle = wiringPiI2CSetup(address);
    if (i2c_handle == -1) {
        set_error("Failed to initialize I2C");
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("I2C handle: %d", i2c_handle);
    
    // Wait for AHT20 to be ready (power-on time)
    aht20_delay_ms(AHT20_POWERUP_DELAY_MS);
    
    // Perform soft reset
    int result = wiringPiI2CWrite(i2c_handle, AHT20_CMD_SOFTRESET);
    if (result == -1) {
        set_error("Failed to send reset command");
        return TECHTEMP_ERROR;
    }
    
    // Wait for reset to complete
    aht20_delay_ms(AHT20_RESET_DELAY_MS);
    
    // Wait for sensor to not be busy
    if (!aht20_wait_not_busy(AHT20_BUSY_TIMEOUT)) {
        set_error("Timeout waiting for reset completion");
        return TECHTEMP_TIMEOUT;
    }
    
    // Send calibration command
    uint8_t cal_cmd[3] = {AHT20_CMD_CALIBRATE, 0x08, 0x00};
    if (!write_i2c_block(cal_cmd, 3)) {
        set_error("Failed to send calibration command");
        return TECHTEMP_ERROR;
    }
    
    // Wait for calibration to complete
    if (!aht20_wait_not_busy(AHT20_BUSY_TIMEOUT)) {
        set_error("Timeout waiting for calibration completion");
        return TECHTEMP_TIMEOUT;
    }
    
    // Check calibration status (optional - some new AHT20s don't set this bit)
    uint8_t status = aht20_get_status();
    LOG_DEBUG_F("Final status after calibration: 0x%02X", status);
    
    initialized = true;
    return TECHTEMP_OK;
}

/**
 * Read sensor data
 */
int aht20_read(sensor_reading_t* reading) {
    if (!initialized || i2c_handle == -1) {
        set_error("AHT20 not initialized");
        return TECHTEMP_ERROR;
    }
    
    if (!reading) {
        set_error("Invalid reading buffer");
        return TECHTEMP_ERROR;
    }
    
    // Send measurement command
    uint8_t measure_cmd[3] = {AHT20_CMD_TRIGGER, 0x33, 0x00};
    if (!write_i2c_block(measure_cmd, 3)) {
        set_error("Failed to send measurement command");
        return TECHTEMP_ERROR;
    }
    
    // Wait for measurement to complete
    if (!aht20_wait_not_busy(AHT20_BUSY_TIMEOUT)) {
        set_error("Timeout waiting for measurement completion");
        return TECHTEMP_TIMEOUT;
    }
    
    // Read measurement data (6 bytes)
    uint8_t data[6];
    if (!read_i2c_block(data, 6)) {
        set_error("Failed to read measurement data");
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("Raw bytes: %02X %02X %02X %02X %02X %02X", 
                data[0], data[1], data[2], data[3], data[4], data[5]);
    
    // Extract humidity (based on Adafruit implementation)
    uint32_t raw_humidity = data[1];
    raw_humidity <<= 8;
    raw_humidity |= data[2];
    raw_humidity <<= 4;
    raw_humidity |= data[3] >> 4;
    
    // Extract temperature (based on Adafruit implementation)
    uint32_t raw_temperature = data[3] & 0x0F;
    raw_temperature <<= 8;
    raw_temperature |= data[4];
    raw_temperature <<= 8;
    raw_temperature |= data[5];
    
    // Calculate actual values
    reading->temperature = calculate_temperature(raw_temperature);
    reading->humidity = calculate_humidity(raw_humidity);
    reading->timestamp = get_timestamp_ms();
    reading->valid = true;
    
    LOG_DEBUG_F("Raw data - Humidity: 0x%06X, Temperature: 0x%06X", raw_humidity, raw_temperature);
    LOG_DEBUG_F("Calculated - T: %.2f°C, H: %.2f%%", reading->temperature, reading->humidity);
    
    return TECHTEMP_OK;
}

/**
 * Get last error message
 */
const char* aht20_get_error(void) {
    return last_error;
}

/**
 * Cleanup AHT20 resources
 */
void aht20_cleanup(void) {
    LOG_DEBUG_F("Cleaning up AHT20 resources");
    
    if (i2c_handle != -1) {
        // Note: wiringPi doesn't provide a close function for I2C
        i2c_handle = -1;
    }
    
    initialized = false;
    last_error[0] = '\0';
}
