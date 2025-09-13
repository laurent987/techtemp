#!/bin/bash
#
# TechTemp - View Your Rooms Data
# Simple script to see current readings from all your rooms
#
# Usage: ./view-rooms.sh [number_of_readings]
# Example: ./view-rooms.sh 5
#

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LIMIT=${1:-10}  # Default to 10 readings if not specified

echo -e "${BLUE}🏠 TechTemp - Your Rooms Data${NC}"
echo -e "${BLUE}═════════════════════════════${NC}"
echo ""

# Check if we can access the API
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  TechTemp server not accessible${NC}"
    echo "Make sure your TechTemp server is running:"
    echo "  docker compose up -d"
    exit 1
fi

echo -e "${BLUE}📊 Latest readings from your rooms (last $LIMIT):${NC}"
echo ""

# Get latest readings via API
READINGS=$(curl -s "http://localhost:3000/api/v1/readings/latest?limit=$LIMIT")

if [ $? -eq 0 ] && [ "$READINGS" != "[]" ]; then
    # Pretty print the JSON data
    echo "$READINGS" | python3 -c "
import json, sys
from datetime import datetime

try:
    data = json.load(sys.stdin)
    
    if not data:
        print('📭 No readings found yet')
        print('Make sure you have sensors sending data')
        sys.exit(0)
        
    print(f'{'Room':<15} {'Device':<20} {'Temp':<8} {'Humidity':<10} {'Time':<20}')
    print('─' * 75)
    
    for reading in data:
        device = reading.get('device', {})
        room = device.get('room', {}).get('name', 'Unknown')
        device_name = device.get('label', device.get('device_uid', 'Unknown'))
        temp = f\"{reading.get('temperature', 'N/A')}°C\"
        humidity = f\"{reading.get('humidity', 'N/A')}%\"
        
        # Format timestamp
        timestamp = reading.get('timestamp', '')
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                time_str = dt.strftime('%m/%d %H:%M')
            except:
                time_str = timestamp[:16]
        else:
            time_str = 'Unknown'
            
        print(f'{room:<15} {device_name:<20} {temp:<8} {humidity:<10} {time_str:<20}')
        
except json.JSONDecodeError:
    print('❌ Error reading data from TechTemp API')
except Exception as e:
    print(f'❌ Error: {e}')
"
else
    echo -e "${YELLOW}📭 No readings found${NC}"
    echo ""
    echo "Possible reasons:"
    echo "• No sensors configured yet"
    echo "• Sensors not sending data (check WiFi connection)"
    echo "• TechTemp server just started (wait 1-2 minutes)"
    echo ""
    echo "To add a new sensor:"
    echo "  ./scripts/user/setup-room-sensor.sh <pi_ip>"
fi

echo ""
echo -e "${BLUE}🌐 Open dashboard: http://localhost:3000${NC}"
echo -e "${BLUE}📖 User guide: docs/USER/README.md${NC}"
