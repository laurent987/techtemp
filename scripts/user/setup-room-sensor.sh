#!/bin/bash
#
# TechTemp - Setup New Room Sensor
# Easy script for users to add a new room to their TechTemp system
#
# Usage: ./setup-room-sensor.sh <pi_ip>
# Example: ./setup-room-sensor.sh 192.168.1.100
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if IP provided
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Error: Please provide your Raspberry Pi's IP address${NC}"
    echo ""
    echo "Usage: $0 <pi_ip>"
    echo "Example: $0 192.168.1.100"
    echo ""
    echo "💡 To find your Pi's IP address:"
    echo "   - Check your router's admin page"
    echo "   - Or run: nmap -sn 192.168.1.0/24"
    exit 1
fi

PI_IP="$1"

echo -e "${BLUE}🏠 TechTemp - Setup New Room Sensor${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""
echo -e "📡 Raspberry Pi IP: ${YELLOW}$PI_IP${NC}"
echo ""

# Check if bootstrap script exists
BOOTSTRAP_SCRIPT="./deployment/bootstrap-pi.sh"

if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
    echo -e "${RED}❌ Error: Bootstrap script not found${NC}"
    echo "Make sure you're running this from the TechTemp directory"
    echo "Expected: $BOOTSTRAP_SCRIPT"
    exit 1
fi

echo -e "${GREEN}🚀 Starting automatic sensor setup...${NC}"
echo ""

# Run the bootstrap script
if ! "$BOOTSTRAP_SCRIPT" "$PI_IP"; then
    echo ""
    echo -e "${RED}❌ Sensor setup failed!${NC}"
    echo -e "${YELLOW}💡 SSH problems? See: scripts/SSH-HELP.md${NC}"
    echo -e "${YELLOW}💡 Troubleshooting: docs/USER/devices/troubleshooting/common-issues.md${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}📱 Next steps:${NC}"
echo "1. Open your TechTemp dashboard: http://YOUR_SERVER_IP:3000"
echo "2. You should see your new room appear within 1-2 minutes"
echo "3. Check that temperature and humidity readings are showing"
echo ""
echo -e "${BLUE}🛠️ Need help?${NC}"
echo "- Troubleshooting: docs/USER/devices/troubleshooting/common-issues.md"
echo "- Community: https://github.com/laurent987/techtemp/discussions"
