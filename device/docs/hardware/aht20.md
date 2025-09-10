# Capteur AHT20 - Guide Hardware

## 📊 Présentation

Le **AHT20** est un capteur de température et humidité haute précision :

- **Température** : -40°C à +85°C (±0.3°C)
- **Humidité** : 0% à 100% RH (±2% RH)
- **Interface** : I2C (adresse 0x38)
- **Alimentation** : 2.2V à 5.5V
- **Consommation** : 0.25µA en veille

## 🔌 Câblage sur Raspberry Pi

### Schéma de connexion

```
AHT20        Raspberry Pi Zero 2W
─────        ─────────────────────
VCC    ──────  3.3V (Pin 1)
GND    ──────  GND  (Pin 6)  
SDA    ──────  GPIO 2 - SDA (Pin 3)
SCL    ──────  GPIO 3 - SCL (Pin 5)
```

### Pinout Raspberry Pi

```
    3.3V  1 ● ● 2  5V
   SDA/2  3 ● ● 4  5V
   SCL/3  5 ● ● 6  GND    ← Utilisé pour GND
          7 ● ● 8
     GND  9 ● ● 10
         11 ● ● 12
         13 ● ● 14 GND
         15 ● ● 16
    3.3V 17 ● ● 18
         19 ● ● 20 GND
         21 ● ● 22
         23 ● ● 24
     GND 25 ● ● 26
```

## ⚙️ Configuration I2C

### 1. Activation I2C

```bash
# Via raspi-config
sudo raspi-config
# > Interface Options > I2C > Enable

# Ou directement
sudo raspi-config nonint do_i2c 0
```

### 2. Vérification

```bash
# Installer les outils I2C
sudo apt-get install i2c-tools

# Scanner les devices I2C
sudo i2cdetect -y 1
```

**Résultat attendu :**
```
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- -- 38 -- -- -- -- -- -- --  ← AHT20 détecté
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- --                         
```

## 🧪 Test manuel

### Lecture basique avec i2c-tools

```bash
# Initialisation du capteur
sudo i2cset -y 1 0x38 0xac 0x33 0x00 i

# Attendre 80ms
sleep 0.1

# Lecture des données
sudo i2cdump -y 1 0x38 i
```

### Test avec le code TechTemp

```bash
cd /home/pi/techtemp/device
sudo ./build/techtemp-device config/device.conf
```

**Sortie attendue :**
```
📊 T: 21.03°C, H: 63.32%, TS: 1757534571990
```

## 🔧 Caractéristiques techniques

### Protocole I2C

- **Adresse** : 0x38 (fixe)
- **Vitesse** : Standard (100kHz) ou Fast (400kHz)
- **Données** : 6 bytes (état + température + humidité + CRC)

### Séquence de lecture

1. **Trigger** : Envoyer `0xAC 0x33 0x00`
2. **Attente** : 80ms minimum
3. **Lecture** : 6 bytes de données
4. **Calcul** : Conversion température/humidité

### Format des données

```
Byte 0: Status (bit 7 = busy)
Byte 1-3: Humidité (20 bits)
Byte 4-6: Température (20 bits)
```

## 🚨 Problèmes courants

### Device non détecté (pas de 38 dans i2cdetect)

**Causes possibles :**
- ❌ I2C non activé
- ❌ Mauvais câblage
- ❌ Alimentation insuffisante
- ❌ Capteur défaillant

**Solutions :**
```bash
# Vérifier l'activation I2C
lsmod | grep i2c

# Vérifier les connexions
# - VCC bien sur 3.3V
# - GND bien connecté
# - SDA sur GPIO 2 (Pin 3)
# - SCL sur GPIO 3 (Pin 5)

# Test de continuité avec multimètre
```

### Lectures incohérentes

**Causes possibles :**
- ⚠️ Interférences électromagnétiques
- ⚠️ Alimentation instable
- ⚠️ Câbles trop longs

**Solutions :**
- Utiliser des câbles courts (<20cm)
- Ajouter des condensateurs de découplage
- Éloigner des sources d'interférences

### Valeurs bloquées

**Symptômes :**
- Température/humidité ne change pas
- Status bit toujours à 1 (busy)

**Solutions :**
```bash
# Reset soft du capteur
sudo i2cset -y 1 0x38 0xba i

# Attendre 20ms puis réinitialiser
sleep 0.02
sudo i2cset -y 1 0x38 0xac 0x33 0x00 i
```

## 📐 Considérations mécaniques

### Placement optimal

- **✅ Circulation d'air libre** : Éviter les boîtiers fermés
- **✅ À l'abri du soleil direct** : Fausse les mesures de température
- **✅ Loin des sources de chaleur** : Radiateurs, CPU, etc.
- **❌ Éviter l'humidité directe** : Pas dans la salle de bain

## ⏱️ Temporisation et Performance

### Différents types de "temps"

Il y a 3 temporisations différentes à comprendre :

#### 1. **Temps de lecture I2C** (technique)
- **Durée** : ~80 millisecondes
- **Description** : Temps pour lire une valeur via I2C
- **Code** : `usleep(80000);` dans le code C

#### 2. **Intervalle de lecture** (configuration)
- **Durée** : 30 secondes par défaut (configurable)
- **Description** : Fréquence des mesures envoyées par MQTT
- **Configuration** : `read_interval_seconds = 30` dans device.conf

#### 3. **Temps de réponse physique** (capteur)
- **Durée** : 5-30 secondes selon la mesure
- **Description** : Temps pour détecter un changement environnemental
- **Détail** : Voir section ci-dessous

### Temps de réponse aux changements environnementaux

⚠️ **Important :** Il s'agit du temps que met le capteur à **détecter un changement** dans l'environnement, pas du temps de lecture I2C.

- **📖 Lecture I2C** : ~80ms (quasi-instantané)
- **🌡️ Détection changement température** : ~5-10 secondes
- **💧 Détection changement humidité** : ~8-30 secondes selon conditions

**Exemple concret :**
- Vous placez le capteur d'une pièce à 20°C dans une pièce à 25°C
- Le capteur va graduellement afficher 20°C → 21°C → 22°C → ... → 25°C
- Ce processus prend 5-10 secondes pour la température
- L'humidité suit plus lentement (8-30 secondes)

**Pourquoi cette inertie ?**
- Le capteur doit s'équilibrer thermiquement avec l'air ambiant
- L'humidité dépend de la circulation d'air et de la condensation
- C'est **normal et physique**, pas un défaut du capteur

**💡 Cas d'usage pratiques :**

| Scénario | Temps de stabilisation | Recommandation |
|----------|----------------------|----------------|
| 🌡️ Chauffage allumé | 5-10 minutes | Normal, le capteur suit la montée en température |
| 🚿 Douche prise | 2-5 minutes | L'humidité monte graduellement |
| 🪟 Fenêtre ouverte | 3-8 minutes | Température et humidité changent lentement |
| ❄️ Climatisation | 8-15 minutes | Changements plus lents (air sec) |

**⚠️ Ne pas confondre avec :**
- La fréquence d'envoi MQTT (toutes les 30s par défaut)
- Le temps de lecture I2C (~80ms)
- Un dysfonctionnement du capteur

## 🔗 Ressources

- [Datasheet AHT20](https://www.aosong.com/en/products-40.html)
- [Application Notes](https://files.seeedstudio.com/wiki/Grove-AHT20_I2C_Industrial_Grade_Temperature_and_Humidity_Sensor/AHT20-datasheet-2020-4-16.pdf)
- [Code source TechTemp](../../src/aht20.c)
