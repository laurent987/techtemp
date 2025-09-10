/**
 * @file aht20.c
 * @brief AHT20 Temperature and Humidity Sensor Driver Implementation
 * @author TechTemp Project
 * @date 2025-09-10
 */

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
#else
    #include <wiringPi.h>
    #include <wiringPiI2C.h>
#endif

// Internal state
static int i2c_handle = -1;
static bool initialized = false;
static char last_error[256] = "";

// Internal helper functions
static int aht20_write_command(uint8_t cmd, uint8_t param1, uint8_t param2);
static int aht20_read_data(uint8_t* buffer, size_t length);
static uint8_t aht20_read_status(void);
static void aht20_delay_ms(int ms);
static float calculate_temperature(uint32_t raw_temp);
static float calculate_humidity(uint32_t raw_humidity);
static void set_error(const char* format, ...);

/**
 * Initialize AHT20 sensor
 */
int aht20_init(int i2c_bus, uint8_t address) {
    LOG_DEBUG_F("Initializing AHT20 on I2C bus %d, address 0x%02X", i2c_bus, address);
    
    // Initialize WiringPi if not already done
    if (wiringPiSetup() == -1) {
        set_error("Failed to initialize WiringPi");
        return TECHTEMP_ERROR;
    }
    
    // Setup I2C
    i2c_handle = wiringPiI2CSetup(address);
    if (i2c_handle == -1) {
        set_error("Failed to setup I2C communication with AHT20");
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("I2C handle: %d", i2c_handle);
    
    // Wait for sensor to be ready after power-on
    aht20_delay_ms(AHT20_INIT_DELAY_MS);
    
    // Perform soft reset
    int result = aht20_reset();
    if (result != TECHTEMP_OK) {
        return result;
    }
    
    // Initialize sensor
    result = aht20_write_command(AHT20_CMD_INIT, AHT20_INIT_PARAM1, AHT20_INIT_PARAM2);
    if (result != TECHTEMP_OK) {
        set_error("Failed to send initialization command");
        return result;
    }
    
    // Wait for initialization
    aht20_delay_ms(AHT20_INIT_DELAY_MS);
    
    // Check if sensor is calibrated
    bool calibrated;
    result = aht20_is_calibrated(&calibrated);
    if (result != TECHTEMP_OK) {
        return result;
    }
    
    if (!calibrated) {
        set_error("AHT20 sensor is not calibrated");
        return TECHTEMP_ERROR;
    }
    
    initialized = true;
    LOG_INFO_F("AHT20 sensor initialized successfully");
    return TECHTEMP_OK;
}

/**
 * Read temperature and humidity from AHT20
 */
int aht20_read(sensor_reading_t* reading) {
    if (!reading) {
        set_error("Reading pointer is null");
        return TECHTEMP_ERROR;
    }
    
    if (!initialized) {
        set_error("AHT20 not initialized");
        return TECHTEMP_ERROR;
    }
    
    // Initialize reading structure
    memset(reading, 0, sizeof(sensor_reading_t));
    reading->valid = false;
    
    // Check if sensor is busy
    bool busy;
    int result = aht20_is_busy(&busy);
    if (result != TECHTEMP_OK) {
        return result;
    }
    
    if (busy) {
        set_error("AHT20 sensor is busy");
        return TECHTEMP_TIMEOUT;
    }
    
    // Trigger measurement
    result = aht20_write_command(AHT20_CMD_MEASURE, AHT20_MEASURE_PARAM1, AHT20_MEASURE_PARAM2);
    if (result != TECHTEMP_OK) {
        set_error("Failed to trigger measurement");
        return result;
    }
    
    // Wait for measurement to complete
    aht20_delay_ms(AHT20_MEASURE_DELAY_MS);
    
    // Wait for sensor to not be busy
    int timeout = 10; // 100ms timeout
    while (timeout-- > 0) {
        result = aht20_is_busy(&busy);
        if (result != TECHTEMP_OK) {
            return result;
        }
        if (!busy) break;
        aht20_delay_ms(10);
    }
    
    if (busy) {
        set_error("Timeout waiting for measurement completion");
        return TECHTEMP_TIMEOUT;
    }
    
    // Read measurement data (7 bytes: status + 6 data bytes)
    uint8_t data[7];
    result = aht20_read_data(data, sizeof(data));
    if (result != TECHTEMP_OK) {
        set_error("Failed to read measurement data");
        return result;
    }
    
    // Extract raw values from data
    // Humidity: data[1][7:0] data[2][7:0] data[3][7:4]
    uint32_t raw_humidity = ((uint32_t)data[1] << 12) | ((uint32_t)data[2] << 4) | ((data[3] & 0xF0) >> 4);
    
    // Temperature: data[3][3:0] data[4][7:0] data[5][7:0]
    uint32_t raw_temperature = (((uint32_t)data[3] & 0x0F) << 16) | ((uint32_t)data[4] << 8) | data[5];
    
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
 * Perform soft reset of AHT20 sensor
 */
int aht20_reset(void) {
    if (!initialized && i2c_handle == -1) {
        set_error("AHT20 not initialized");
        return TECHTEMP_ERROR;
    }
    
    LOG_DEBUG_F("Performing AHT20 soft reset");
    
    int result = wiringPiI2CWrite(i2c_handle, AHT20_CMD_RESET);
    if (result == -1) {
        set_error("Failed to send reset command");
        return TECHTEMP_ERROR;
    }
    
    // Wait for reset to complete
    aht20_delay_ms(AHT20_RESET_DELAY_MS);
    
    return TECHTEMP_OK;
}

/**
 * Check if AHT20 is busy
 */
int aht20_is_busy(bool* busy) {
    if (!busy) {
        set_error("Busy pointer is null");
        return TECHTEMP_ERROR;
    }
    
    if (!initialized) {
        set_error("AHT20 not initialized");
        return TECHTEMP_ERROR;
    }
    
    uint8_t status = aht20_read_status();
    *busy = (status & AHT20_STATUS_BUSY) != 0;
    
    return TECHTEMP_OK;
}

/**
 * Check if AHT20 is calibrated
 */
int aht20_is_calibrated(bool* calibrated) {
    if (!calibrated) {
        set_error("Calibrated pointer is null");
        return TECHTEMP_ERROR;
    }
    
    if (!initialized && i2c_handle == -1) {
        set_error("AHT20 not initialized");
        return TECHTEMP_ERROR;
    }
    
    uint8_t status = aht20_read_status();
    *calibrated = (status & AHT20_STATUS_CALIBRATED) != 0;
    
    return TECHTEMP_OK;
}

/**
 * Cleanup AHT20 resources
 */
void aht20_cleanup(void) {
    if (initialized) {
        LOG_DEBUG_F("Cleaning up AHT20 resources");
        initialized = false;
        i2c_handle = -1;
    }
}

/**
 * Get last error message
 */
const char* aht20_get_error(void) {
    return last_error;
}

// Internal helper functions

static int aht20_write_command(uint8_t cmd, uint8_t param1, uint8_t param2) {
#ifdef SIMULATION_MODE
    (void)cmd; (void)param1; (void)param2; // Suppress unused warnings
#endif
    if (i2c_handle == -1) {
        return TECHTEMP_ERROR;
    }
    
    // Write command byte
    if (wiringPiI2CWrite(i2c_handle, cmd) == -1) {
        return TECHTEMP_ERROR;
    }
    
    // Write parameter bytes
    if (wiringPiI2CWrite(i2c_handle, param1) == -1) {
        return TECHTEMP_ERROR;
    }
    
    if (wiringPiI2CWrite(i2c_handle, param2) == -1) {
        return TECHTEMP_ERROR;
    }
    
    return TECHTEMP_OK;
}

static int aht20_read_data(uint8_t* buffer, size_t length) {
    if (!buffer || length == 0) {
        return TECHTEMP_ERROR;
    }
    
    if (i2c_handle == -1) {
        return TECHTEMP_ERROR;
    }
    
    for (size_t i = 0; i < length; i++) {
        int byte = wiringPiI2CRead(i2c_handle);
        if (byte == -1) {
            return TECHTEMP_ERROR;
        }
        buffer[i] = (uint8_t)byte;
    }
    
    return TECHTEMP_OK;
}

static uint8_t aht20_read_status(void) {
    if (i2c_handle == -1) {
        return 0xFF;
    }
    
    int status = wiringPiI2CRead(i2c_handle);
    return (status == -1) ? 0xFF : (uint8_t)status;
}

static void aht20_delay_ms(int ms) {
#ifdef SIMULATION_MODE
    (void)ms; // Suppress unused warning
#else
    usleep(ms * 1000);
#endif
}

static float calculate_temperature(uint32_t raw_temp) {
    // Temperature calculation: ((raw / 2^20) * 200) - 50
    float temp = ((float)raw_temp / AHT20_TEMPERATURE_MAX) * 200.0f - 50.0f;
    return temp;
}

static float calculate_humidity(uint32_t raw_humidity) {
    // Humidity calculation: (raw / 2^20) * 100
    float humidity = ((float)raw_humidity / AHT20_HUMIDITY_MAX) * 100.0f;
    
    // Clamp humidity to valid range
    if (humidity < 0.0f) humidity = 0.0f;
    if (humidity > 100.0f) humidity = 100.0f;
    
    return humidity;
}

static void set_error(const char* format, ...) {
    va_list args;
    va_start(args, format);
    vsnprintf(last_error, sizeof(last_error), format, args);
    va_end(args);
    last_error[sizeof(last_error) - 1] = '\0';
}
