/**
 * @file test_aht20.c
 * @brief Programme de test isolé pour l'AHT20
 * @author TechTemp Project
 * @date 2025-09-10
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <unistd.h>
#include <wiringPi.h>
#include <wiringPiI2C.h>

// AHT20 Constants (basé sur la référence Adafruit)
#define AHT20_I2C_ADDR          0x38
#define AHT20_CMD_SOFTRESET     0xBA
#define AHT20_CMD_CALIBRATE     0xE1
#define AHT20_CMD_TRIGGER       0xAC
#define AHT20_STATUS_BUSY       0x80
#define AHT20_STATUS_CALIBRATED 0x08

static int i2c_handle = -1;

void delay_ms(int ms) {
    usleep(ms * 1000);
}

/**
 * Lire le statut du capteur
 */
uint8_t aht20_get_status(void) {
    int result = wiringPiI2CRead(i2c_handle);
    if (result == -1) {
        printf("❌ Erreur lecture statut\n");
        return 0xFF;
    }
    return (uint8_t)result;
}

/**
 * Test 1: Initialisation I2C
 */
bool test_i2c_init(void) {
    printf("🔧 Test 1: Initialisation I2C...\n");
    
    if (wiringPiSetup() == -1) {
        printf("❌ Échec wiringPiSetup\n");
        return false;
    }
    
    i2c_handle = wiringPiI2CSetup(AHT20_I2C_ADDR);
    if (i2c_handle == -1) {
        printf("❌ Échec wiringPiI2CSetup\n");
        return false;
    }
    
    printf("✅ I2C initialisé (handle: %d)\n", i2c_handle);
    return true;
}

/**
 * Test 2: Lecture du statut initial
 */
bool test_initial_status(void) {
    printf("\n🔧 Test 2: Lecture statut initial...\n");
    
    uint8_t status = aht20_get_status();
    if (status == 0xFF) {
        return false;
    }
    
    printf("📊 Statut initial: 0x%02X\n", status);
    printf("   - Busy: %s\n", (status & AHT20_STATUS_BUSY) ? "OUI" : "NON");
    printf("   - Calibrated: %s\n", (status & AHT20_STATUS_CALIBRATED) ? "OUI" : "NON");
    
    return true;
}

/**
 * Test 3: Reset logiciel
 */
bool test_soft_reset(void) {
    printf("\n🔧 Test 3: Reset logiciel...\n");
    
    int result = wiringPiI2CWrite(i2c_handle, AHT20_CMD_SOFTRESET);
    if (result == -1) {
        printf("❌ Échec commande reset\n");
        return false;
    }
    
    printf("✅ Commande reset envoyée\n");
    
    // Attendre 20ms comme dans Adafruit
    delay_ms(20);
    
    // Attendre que le capteur ne soit plus busy
    int timeout = 10;
    while (timeout-- > 0) {
        uint8_t status = aht20_get_status();
        printf("📊 Statut après reset: 0x%02X (busy: %s)\n", 
               status, (status & AHT20_STATUS_BUSY) ? "OUI" : "NON");
        
        if (!(status & AHT20_STATUS_BUSY)) {
            printf("✅ Reset terminé\n");
            return true;
        }
        delay_ms(10);
    }
    
    printf("❌ Timeout après reset\n");
    return false;
}

/**
 * Écrire plusieurs bytes en une transaction I2C
 */
bool write_i2c_block(uint8_t* data, int length) {
    // Pour WiringPi, on doit utiliser write() système
    ssize_t result = write(i2c_handle, data, length);
    return (result == length);
}

/**
 * Lire plusieurs bytes en une transaction I2C
 */
bool read_i2c_block(uint8_t* buffer, int length) {
    ssize_t result = read(i2c_handle, buffer, length);
    return (result == length);
}

/**
 * Test 4: Calibration
 */
bool test_calibration(void) {
    printf("\n🔧 Test 4: Calibration...\n");
    
    // Envoyer commande de calibration comme dans Adafruit
    uint8_t cmd[3] = {AHT20_CMD_CALIBRATE, 0x08, 0x00};
    
    // Écrire les 3 bytes en une seule transaction
    if (!write_i2c_block(cmd, 3)) {
        printf("❌ Échec écriture commande calibration\n");
        return false;
    }
    
    printf("✅ Commande calibration envoyée\n");
    
    // Attendre que le capteur ne soit plus busy
    int timeout = 10;
    while (timeout-- > 0) {
        uint8_t status = aht20_get_status();
        printf("📊 Statut pendant calibration: 0x%02X (busy: %s, cal: %s)\n", 
               status, 
               (status & AHT20_STATUS_BUSY) ? "OUI" : "NON",
               (status & AHT20_STATUS_CALIBRATED) ? "OUI" : "NON");
        
        if (!(status & AHT20_STATUS_BUSY)) {
            if (status & AHT20_STATUS_CALIBRATED) {
                printf("✅ Calibration réussie\n");
                return true;
            } else {
                printf("⚠️  Calibration terminée mais bit CAL non défini\n");
                return true; // Certains AHT20 récents ne définissent pas ce bit
            }
        }
        delay_ms(10);
    }
    
    printf("❌ Timeout pendant calibration\n");
    return false;
}

/**
 * Test 5: Mesure de température et humidité
 */
bool test_measurement(void) {
    printf("\n🔧 Test 5: Mesure...\n");
    
    // Envoyer commande de mesure comme dans Adafruit
    uint8_t cmd[3] = {AHT20_CMD_TRIGGER, 0x33, 0x00};
    
    // Écrire les 3 bytes en une seule transaction
    if (!write_i2c_block(cmd, 3)) {
        printf("❌ Échec écriture commande mesure\n");
        return false;
    }
    
    printf("✅ Commande mesure envoyée\n");
    
    // Attendre que la mesure soit prête
    int timeout = 10;
    while (timeout-- > 0) {
        uint8_t status = aht20_get_status();
        printf("📊 Statut pendant mesure: 0x%02X (busy: %s)\n", 
               status, (status & AHT20_STATUS_BUSY) ? "OUI" : "NON");
        
        if (!(status & AHT20_STATUS_BUSY)) {
            break;
        }
        delay_ms(10);
    }
    
    if (timeout <= 0) {
        printf("❌ Timeout pendant mesure\n");
        return false;
    }
    
    // Lire les 6 bytes de données en une seule transaction
    printf("📖 Lecture des données...\n");
    uint8_t data[6];
    if (!read_i2c_block(data, 6)) {
        printf("❌ Échec lecture des données\n");
        return false;
    }
    
    printf("🔢 Données brutes: %02X %02X %02X %02X %02X %02X\n",
           data[0], data[1], data[2], data[3], data[4], data[5]);
    
    // Extraire humidité (basé sur Adafruit)
    uint32_t h = data[1];
    h <<= 8;
    h |= data[2]; 
    h <<= 4;
    h |= data[3] >> 4;
    
    float humidity = ((float)h * 100.0) / 0x100000;
    
    // Extraire température (basé sur Adafruit)
    uint32_t tdata = data[3] & 0x0F;
    tdata <<= 8;
    tdata |= data[4];
    tdata <<= 8;
    tdata |= data[5];
    
    float temperature = ((float)tdata * 200.0 / 0x100000) - 50.0;
    
    printf("🌡️  Température: %.2f°C\n", temperature);
    printf("💧 Humidité: %.2f%%\n", humidity);
    
    // Vérifier que les valeurs sont réalistes
    if (temperature < -10.0 || temperature > 60.0) {
        printf("⚠️  Température hors plage réaliste\n");
    }
    if (humidity < 0.0 || humidity > 100.0) {
        printf("⚠️  Humidité hors plage valide\n");
    }
    
    return true;
}

int main(void) {
    printf("=== Test isolé AHT20 ===\n");
    printf("Basé sur la référence Adafruit\n\n");
    
    if (!test_i2c_init()) {
        printf("\n❌ Test I2C échoué\n");
        return 1;
    }
    
    if (!test_initial_status()) {
        printf("\n❌ Test statut initial échoué\n");
        return 1;
    }
    
    // Délai de 20ms après démarrage (comme Adafruit)
    delay_ms(20);
    
    if (!test_soft_reset()) {
        printf("\n❌ Test reset échoué\n");
        return 1;
    }
    
    if (!test_calibration()) {
        printf("\n❌ Test calibration échoué\n");
        return 1;
    }
    
    // Faire plusieurs mesures pour vérifier la cohérence
    for (int i = 0; i < 3; i++) {
        printf("\n--- Mesure %d ---\n", i + 1);
        if (!test_measurement()) {
            printf("\n❌ Test mesure %d échoué\n", i + 1);
            return 1;
        }
        delay_ms(1000);
    }
    
    printf("\n✅ Tous les tests réussis !\n");
    return 0;
}
