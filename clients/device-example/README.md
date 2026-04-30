# Device Example - Raspberry Pi Client

Example Raspberry Pi client for sending sensor data to TechTemp service.

## Features

- DHT22 temperature/humidity sensor support
- MQTT publishing to TechTemp service
- Configurable publishing intervals
- Error handling and reconnection
- Device identification

## Hardware Requirements

- Raspberry Pi (any model with GPIO)
- DHT22 temperature/humidity sensor
- Connecting wires

## Software Requirements

- Python 3.7+
- paho-mqtt library
- Adafruit CircuitPython DHT library

## Setup

1. Install dependencies:
   ```bash
   pip install paho-mqtt adafruit-circuitpython-dht
   ```

2. Wire the DHT22 sensor:
   - VCC to 3.3V
   - GND to Ground  
   - Data to GPIO 4

3. Configure the client:
   ```bash
   cp config.example.py config.py
   # Edit config.py with your settings
   ```

4. Run the client:
   ```bash
   python sensor_client.py
   ```

## Configuration

Edit `config.py`:
- `MQTT_BROKER`: TechTemp service IP/hostname
- `DEVICE_ID`: Unique identifier for this device
- `PUBLISH_INTERVAL`: Seconds between readings

## MQTT Topic Format

Messages are published to: `sensors/{device_id}/readings`

Message format:
```json
{
  "deviceId": "rpi_001",
  "temperature": 23.5,
  "humidity": 65.2,
  "timestamp": 1694361234
}
```
