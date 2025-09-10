# Web Example - TechTemp Dashboard

Simple web dashboard example for TechTemp IoT service.

## Features

- Real-time sensor data visualization
- Temperature and humidity charts
- Device status monitoring
- REST API consumption example

## Setup

1. Start the TechTemp service:
   ```bash
   cd ../..
   npm start
   ```

2. Open `index.html` in your browser
3. The dashboard will connect to `http://localhost:3000`

## API Endpoints Used

- `GET /health` - Service health check
- `GET /readings` - Get latest sensor readings
- `GET /readings?device=<id>` - Get readings for specific device

## Technology Stack

- Vanilla JavaScript (ES6+)
- Chart.js for visualizations
- CSS Grid for responsive layout
- Fetch API for HTTP requests
