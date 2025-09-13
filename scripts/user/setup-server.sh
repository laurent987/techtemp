#!/bin/bash
#
# TechTemp User - Setup Server
# User-friendly wrapper for setting up TechTemp on your server
#
# Usage: ./scripts/user/setup-server.sh [pi@192.168.1.100]
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 TechTemp User - Setup Server${NC}"
echo -e "Setting up TechTemp on your server..."
echo ""

# Check if target provided
TARGET="$1"
if [ -z "$TARGET" ]; then
    echo -e "${YELLOW}⚠️  Please provide your server address:${NC}"
    echo -e "   ./scripts/user/setup-server.sh pi@192.168.1.100"
    echo ""
    echo -e "${BLUE}💡 Common examples:${NC}"
    echo -e "   pi@192.168.1.100     # Local Raspberry Pi"
    echo -e "   user@server.com      # Remote server"
    exit 1
fi

echo -e "${GREEN}🎯 Target server: $TARGET${NC}"
echo -e "${BLUE}📡 Using robust deployment script...${NC}"
echo ""

# Call the robust admin script
if ! ./scripts/admin/deploy-robust-pi.sh "$TARGET"; then
    echo -e "${RED}❌ Setup failed! Check the error above.${NC}"
    echo -e "${YELLOW}💡 SSH problems? See: scripts/SSH-HELP.md${NC}"
    echo -e "${YELLOW}💡 System check: ./scripts/user/check-system.sh${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ TechTemp setup complete!${NC}"
echo -e "${BLUE}🌐 Access your dashboard at: http://$TARGET:3000${NC}"
echo -e "${YELLOW}💡 Next: ./scripts/user/setup-room-sensor.sh to add sensors${NC}"