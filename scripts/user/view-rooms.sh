#!/bin/bash
#
# TechTemp - View Your Rooms Data
# Simple script to see current readings from all your rooms
#
# Usage: ./view-rooms.sh [last_ip_octet]
# Example: ./view-rooms.sh 42  (connects to 192.168.0.42)
#

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LAST_OCTET=${1:-42}  # Default to 42 (192.168.0.42) if not specified
SERVER_URL="http://192.168.0.${LAST_OCTET}:3000"

echo -e "${BLUE}🏠 TechTemp - Your Rooms Data${NC}"
echo -e "${BLUE}═════════════════════════════${NC}"
echo -e "${BLUE}📡 Connecting to: ${SERVER_URL}${NC}"
echo ""

# Check if we can access the API
if ! curl -s "${SERVER_URL}/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  TechTemp server not accessible at ${SERVER_URL}${NC}"
    echo "Make sure your TechTemp server is running on 192.168.0.${LAST_OCTET}:"
    echo "  Check if the IP address is correct"
    echo "  Verify the server is running: docker compose up -d"
    exit 1
fi

echo -e "${BLUE}📊 Latest readings from your rooms :${NC}"
echo ""

# Get latest readings via API
READINGS=$(curl -s "${SERVER_URL}/api/v1/readings/latest?limit=10")

if [ $? -eq 0 ] && [ "$READINGS" != "[]" ]; then
    # Pretty print the JSON data
    echo "$READINGS" | python3 -c "
import json, sys
from datetime import datetime

try:
    raw_data = sys.stdin.read()
    data = json.loads(raw_data)
    
    if not data:
        print('📭 No readings found yet')
        print('Make sure you have sensors sending data')
        sys.exit(0)
    
    # Handle different response formats
    if isinstance(data, dict):
        if 'data' in data:
            readings = data['data']
        elif 'readings' in data:
            readings = data['readings']
        else:
            readings = [data]
    elif isinstance(data, list):
        readings = data
    else:
        print(f'❌ Unexpected data format: {type(data)}')
        sys.exit(1)
        
    print(f'{'Room':<15} {'Device':<20} {'Temp':<8} {'Humidity':<10} {'Time':<20}')
    print('─' * 75)
    
    for reading in readings:
        if not isinstance(reading, dict):
            print(f'❌ Invalid reading format: {type(reading)} - {reading}')
            continue
            
        # Handle new API format with device_id and room_id
        device_id = reading.get('device_id', 'Unknown')
        room_id = reading.get('room_id', 'Unknown')
        
        # Use room_id as room name for now (could be enhanced with a room lookup)
        room_name = f'Room {room_id}' if room_id != 'Unknown' else 'Unknown'
        
        # Clean up device_id for display
        device_name = device_id.replace('aht20-', '') if device_id.startswith('aht20-') else device_id
        
        temp = f\"{reading.get('temperature', 'N/A')}°C\"
        humidity = f\"{reading.get('humidity', 'N/A')}%\"
        
        # Format timestamp (ts field in this API)
        timestamp = reading.get('ts', reading.get('timestamp', ''))
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                time_str = dt.strftime('%m/%d %H:%M')
            except:
                time_str = timestamp[:16]
        else:
            time_str = 'Unknown'
            
        print(f'{room_name:<15} {device_name:<20} {temp:<8} {humidity:<10} {time_str:<20}')
        
except json.JSONDecodeError as e:
    print(f'❌ Error parsing JSON: {e}')
except Exception as e:
    print(f'❌ Error: {e}')
"
else
    echo -e "${YELLOW}📭 No readings found or API error${NC}"
    echo "Raw API response:"
    echo "$READINGS"
    echo ""
    echo "Possible reasons:"
    echo "• No sensors configured yet"
    echo "• Sensors not sending data (check WiFi connection)"
    echo "• TechTemp server just started (wait 1-2 minutes)"
    echo "• API endpoint changed or server error"
    echo ""
    echo "To add a new sensor:"
    echo "  ./scripts/user/setup-room-sensor.sh <pi_ip>"
fi

echo ""
echo -e "${GREEN}🌐 Dashboard (Safari): ${SERVER_URL}${NC}"
echo -e "${YELLOW}⚠️  Chrome compatibility issues - use Safari${NC}"
echo -e "${BLUE}📖 User guide: docs/USER/README.md${NC}"