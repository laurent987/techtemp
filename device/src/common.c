/**
 * @file common.c
 * @brief Common Utility Functions Implementation
 * @author TechTemp Project
 * @date 2025-09-10
 */

#define _GNU_SOURCE  // Pour strdup()
#include "common.h"
#include <time.h>
#include <sys/time.h>
#include <stdarg.h>
#include <string.h>
#include <ctype.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <pwd.h>
#include <stdlib.h>
#include <errno.h>
#include <stdio.h>  // Pour fileno()
#include <limits.h> // Pour HOST_NAME_MAX
#include <inttypes.h> // Pour PRIu64

// Global log level
static log_level_t current_log_level = LOG_LEVEL_INFO;
static FILE* log_file = NULL;
static bool log_to_console = true;

// Internal helper functions
static const char* log_level_to_string(log_level_t level);
static const char* log_level_to_color(log_level_t level);
static void write_log_message(log_level_t level, const char* file, int line, const char* message);

/**
 * Get current timestamp in milliseconds
 */
uint64_t get_timestamp_ms(void) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)(tv.tv_sec) * 1000 + (uint64_t)(tv.tv_usec) / 1000;
}

/**
 * Get current timestamp as ISO 8601 string
 */
void get_timestamp_iso(char* buffer, size_t buffer_size) {
    if (!buffer || buffer_size < ISO8601_TIMESTAMP_SIZE) {
        return;
    }
    
    time_t now = time(NULL);
    struct tm* utc_tm = gmtime(&now);
    
    if (utc_tm) {
        strftime(buffer, buffer_size, "%Y-%m-%dT%H:%M:%SZ", utc_tm);
    } else {
        strncpy(buffer, "1970-01-01T00:00:00Z", buffer_size - 1);
        buffer[buffer_size - 1] = '\0';
    }
}

/**
 * Get current timestamp as local time string
 */
void get_timestamp_local(char* buffer, size_t buffer_size) {
    if (!buffer || buffer_size < 32) {
        return;
    }
    
    time_t now = time(NULL);
    struct tm* local_tm = localtime(&now);
    
    if (local_tm) {
        strftime(buffer, buffer_size, "%Y-%m-%d %H:%M:%S", local_tm);
    } else {
        strncpy(buffer, "1970-01-01 00:00:00", buffer_size - 1);
        buffer[buffer_size - 1] = '\0';
    }
}

/**
 * Initialize logging system
 */
int log_init(log_level_t level, const char* log_file_path, bool console_output) {
    current_log_level = level;
    log_to_console = console_output;
    
    // Close existing log file if open
    if (log_file && log_file != stdout && log_file != stderr) {
        fclose(log_file);
        log_file = NULL;
    }
    
    // Open log file if specified
    if (log_file_path && strlen(log_file_path) > 0) {
        log_file = fopen(log_file_path, "a");
        if (!log_file) {
            fprintf(stderr, "Warning: Failed to open log file '%s', logging to stderr only\n", log_file_path);
            log_file = stderr;
            return TECHTEMP_ERROR;
        }
        
        // Set line buffering for log file
        setvbuf(log_file, NULL, _IOLBF, 0);
        
        // Write startup message
        char timestamp[32];
        get_timestamp_local(timestamp, sizeof(timestamp));
        fprintf(log_file, "\n=== TechTemp Device Log Started at %s ===\n", timestamp);
        fflush(log_file);
    } else {
        log_file = stderr;
    }
    
    return TECHTEMP_OK;
}

/**
 * Set log level
 */
void log_set_level(log_level_t level) {
    current_log_level = level;
}

/**
 * Get current log level
 */
log_level_t log_get_level(void) {
    return current_log_level;
}

/**
 * Write log message
 */
void log_write(log_level_t level, const char* file, int line, const char* format, ...) {
    if (level > current_log_level) {
        return;
    }
    
    va_list args;
    va_start(args, format);
    
    char message[1024];
    vsnprintf(message, sizeof(message), format, args);
    message[sizeof(message) - 1] = '\0';
    
    va_end(args);
    
    write_log_message(level, file, line, message);
}

/**
 * Cleanup logging system
 */
void log_cleanup(void) {
    if (log_file && log_file != stdout && log_file != stderr) {
        // Write shutdown message
        char timestamp[32];
        get_timestamp_local(timestamp, sizeof(timestamp));
        fprintf(log_file, "=== TechTemp Device Log Ended at %s ===\n\n", timestamp);
        
        fclose(log_file);
        log_file = NULL;
    }
}

/**
 * Trim whitespace from string
 */
char* str_trim(char* str) {
    if (!str) return NULL;
    
    // Trim leading whitespace
    char* start = str;
    while (isspace((unsigned char)*start)) {
        start++;
    }
    
    // If all spaces
    if (*start == '\0') {
        *str = '\0';
        return str;
    }
    
    // Trim trailing whitespace
    char* end = start + strlen(start) - 1;
    while (end > start && isspace((unsigned char)*end)) {
        end--;
    }
    
    // Null terminate
    *(end + 1) = '\0';
    
    // Move trimmed string to beginning
    if (start != str) {
        memmove(str, start, strlen(start) + 1);
    }
    
    return str;
}

/**
 * Case-insensitive string comparison
 */
int str_iequals(const char* str1, const char* str2) {
    if (!str1 || !str2) {
        return (str1 == str2) ? 1 : 0;
    }
    
    while (*str1 && *str2) {
        if (tolower((unsigned char)*str1) != tolower((unsigned char)*str2)) {
            return 0;
        }
        str1++;
        str2++;
    }
    
    return (*str1 == '\0' && *str2 == '\0') ? 1 : 0;
}

/**
 * Parse boolean from string
 */
int str_to_bool(const char* str, bool* value) {
    if (!str || !value) {
        return TECHTEMP_ERROR;
    }
    
    char* trimmed = strdup(str);
    if (!trimmed) {
        return TECHTEMP_ERROR;
    }
    
    str_trim(trimmed);
    
    // Convert to lowercase for comparison
    for (char* p = trimmed; *p; p++) {
        *p = tolower((unsigned char)*p);
    }
    
    if (strcmp(trimmed, "true") == 0 || 
        strcmp(trimmed, "yes") == 0 || 
        strcmp(trimmed, "1") == 0 || 
        strcmp(trimmed, "on") == 0) {
        *value = true;
    } else if (strcmp(trimmed, "false") == 0 || 
               strcmp(trimmed, "no") == 0 || 
               strcmp(trimmed, "0") == 0 || 
               strcmp(trimmed, "off") == 0) {
        *value = false;
    } else {
        free(trimmed);
        return TECHTEMP_ERROR;
    }
    
    free(trimmed);
    return TECHTEMP_OK;
}

/**
 * Parse integer from string with range validation
 */
int str_to_int(const char* str, int* value, int min_val, int max_val) {
    if (!str || !value) {
        return TECHTEMP_ERROR;
    }
    
    char* endptr;
    errno = 0;
    long parsed = strtol(str, &endptr, 10);
    
    if (errno != 0 || endptr == str || *endptr != '\0') {
        return TECHTEMP_ERROR;
    }
    
    if (parsed < min_val || parsed > max_val) {
        return TECHTEMP_ERROR;
    }
    
    *value = (int)parsed;
    return TECHTEMP_OK;
}

/**
 * Check if file exists
 */
bool file_exists(const char* filepath) {
    if (!filepath) {
        return false;
    }
    
    return access(filepath, F_OK) == 0;
}

/**
 * Create directory recursively
 */
int create_directory(const char* path) {
    if (!path) {
        return TECHTEMP_ERROR;
    }
    
    char* path_copy = strdup(path);
    if (!path_copy) {
        return TECHTEMP_ERROR;
    }
    
    char* p = path_copy;
    
    // Skip leading slash
    if (*p == '/') {
        p++;
    }
    
    while (*p) {
        // Find next slash
        while (*p && *p != '/') {
            p++;
        }
        
        // Temporarily null-terminate
        char saved = *p;
        *p = '\0';
        
        // Create directory
        if (mkdir(path_copy, 0755) != 0 && errno != EEXIST) {
            free(path_copy);
            return TECHTEMP_ERROR;
        }
        
        // Restore character and continue
        *p = saved;
        if (*p) {
            p++;
        }
    }
    
    free(path_copy);
    return TECHTEMP_OK;
}

/**
 * Get user home directory
 */
const char* get_home_directory(void) {
    // Try environment variable first
    const char* home = getenv("HOME");
    if (home && strlen(home) > 0) {
        return home;
    }
    
    // Fallback to passwd entry
    struct passwd* pw = getpwuid(getuid());
    if (pw && pw->pw_dir) {
        return pw->pw_dir;
    }
    
    // Last resort
    return "/tmp";
}

/**
 * Generate device UID from system information
 */
int generate_device_uid(char* uid_buffer, size_t buffer_size) {
    if (!uid_buffer || buffer_size < DEVICE_UID_LENGTH + 1) {
        return TECHTEMP_ERROR;
    }
    
    // Try to read from /proc/cpuinfo for Raspberry Pi serial
    FILE* cpuinfo = fopen("/proc/cpuinfo", "r");
    char serial[32] = "";
    
    if (cpuinfo) {
        char line[256];
        while (fgets(line, sizeof(line), cpuinfo)) {
            if (strncmp(line, "Serial", 6) == 0) {
                char* colon = strchr(line, ':');
                if (colon) {
                    strncpy(serial, colon + 1, sizeof(serial) - 1);
                    str_trim(serial);
                    break;
                }
            }
        }
        fclose(cpuinfo);
    }
    
    // If no serial found, use hostname + timestamp
    if (strlen(serial) == 0) {
        char hostname[64];
        if (gethostname(hostname, sizeof(hostname)) != 0) {
            strncpy(hostname, "unknown", sizeof(hostname) - 1);
        }
        hostname[sizeof(hostname) - 1] = '\0';
        
        uint64_t timestamp = get_timestamp_ms();
        #pragma GCC diagnostic push
        #pragma GCC diagnostic ignored "-Wformat-truncation"
        snprintf(serial, sizeof(serial), "%s_%" PRIu64, hostname, timestamp);
        #pragma GCC diagnostic pop
    }
    
    // Create UID by taking first 16 characters and padding/truncating as needed
    snprintf(uid_buffer, buffer_size, "TTDEV_%.10s", serial);
    
    // Ensure it's exactly DEVICE_UID_LENGTH characters
    if (strlen(uid_buffer) > DEVICE_UID_LENGTH) {
        uid_buffer[DEVICE_UID_LENGTH] = '\0';
    } else {
        // Pad with zeros if too short
        while (strlen(uid_buffer) < DEVICE_UID_LENGTH) {
            strcat(uid_buffer, "0");
        }
    }
    
    // Convert to uppercase and ensure only alphanumeric
    for (size_t i = 0; uid_buffer[i]; i++) {
        if (isalnum((unsigned char)uid_buffer[i])) {
            uid_buffer[i] = toupper((unsigned char)uid_buffer[i]);
        } else {
            uid_buffer[i] = '0';
        }
    }
    
    return TECHTEMP_OK;
}

// Internal helper functions

static const char* log_level_to_string(log_level_t level) {
    switch (level) {
        case LOG_LEVEL_DEBUG: return "DEBUG";
        case LOG_LEVEL_INFO:  return "INFO ";
        case LOG_LEVEL_WARN:  return "WARN ";
        case LOG_LEVEL_ERROR: return "ERROR";
        default:              return "UNKN ";
    }
}

static const char* log_level_to_color(log_level_t level) {
    switch (level) {
        case LOG_LEVEL_DEBUG: return "\033[36m"; // Cyan
        case LOG_LEVEL_INFO:  return "\033[32m"; // Green
        case LOG_LEVEL_WARN:  return "\033[33m"; // Yellow
        case LOG_LEVEL_ERROR: return "\033[31m"; // Red
        default:              return "\033[0m";  // Reset
    }
}

static void write_log_message(log_level_t level, const char* file, int line, const char* message) {
    char timestamp[32];
    get_timestamp_local(timestamp, sizeof(timestamp));
    
    // Extract filename from path
    const char* filename = strrchr(file, '/');
    filename = filename ? filename + 1 : file;
    
    // Format log message
    char log_line[1024];
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wformat-truncation"
    snprintf(log_line, sizeof(log_line), "[%s] %s %s:%d: %s",
        timestamp,
        log_level_to_string(level),
        filename,
        line,
        message
    );
    #pragma GCC diagnostic pop
    
    // Write to console if enabled
    if (log_to_console) {
        bool use_color = isatty(fileno(stderr));
        if (use_color) {
            fprintf(stderr, "%s%s\033[0m\n", log_level_to_color(level), log_line);
        } else {
            fprintf(stderr, "%s\n", log_line);
        }
        fflush(stderr);
    }
    
    // Write to log file
    if (log_file && log_file != stderr) {
        fprintf(log_file, "%s\n", log_line);
        fflush(log_file);
    }
}
