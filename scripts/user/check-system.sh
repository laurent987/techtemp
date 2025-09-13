#!/bin/bash
#
# TechTemp - Check System Status
# Quick health check for your TechTemp system
#
# Usage: ./check-system.sh
#

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 TechTemp System Status${NC}"
echo -e "${BLUE}═════════════════════════${NC}"
echo ""

# Check if Docker is running
echo -e "${BLUE}🐳 Checking Docker services...${NC}"
if docker ps > /dev/null 2>&1; then
    CONTAINERS=$(docker ps --filter "name=techtemp" --format "table {{.Names}}\t{{.Status}}")
    if [ -n "$CONTAINERS" ]; then
        echo -e "${GREEN}✅ TechTemp containers running:${NC}"
        echo "$CONTAINERS"
    else
        echo -e "${YELLOW}⚠️  No TechTemp containers found${NC}"
        echo "Run: docker compose up -d"
    fi
else
    echo -e "${RED}❌ Docker not running or not accessible${NC}"
    echo "Make sure Docker is installed and running"
fi

echo ""

# Check web dashboard
echo -e "${BLUE}🌐 Checking web dashboard...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dashboard accessible at http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Dashboard not accessible on port 3000${NC}"
    echo "Check if TechTemp server is running"
fi

echo ""

# Check database
echo -e "${BLUE}📊 Checking database...${NC}"
if [ -f "./backend/db/techtemp.db" ]; then
    DB_SIZE=$(ls -lh ./backend/db/techtemp.db | awk '{print $5}')
    echo -e "${GREEN}✅ Database found (Size: $DB_SIZE)${NC}"
    
    # Quick database stats using our admin script
    if [ -f "./scripts/admin/db-overview.sh" ]; then
        echo ""
        echo -e "${BLUE}📈 Quick database stats:${NC}"
        ./scripts/admin/db-overview.sh | head -10
    fi
else
    echo -e "${YELLOW}⚠️  Database file not found${NC}"
    echo "Expected location: ./backend/db/techtemp.db"
fi

echo ""

# Network check for MQTT
echo -e "${BLUE}📡 Checking MQTT broker...${NC}"
if docker ps --filter "name=mqtt" --quiet | grep -q .; then
    echo -e "${GREEN}✅ MQTT broker container running${NC}"
else
    echo -e "${YELLOW}⚠️  MQTT broker container not found${NC}"
    echo "Sensors won't be able to send data"
fi

echo ""
echo -e "${BLUE}🎯 Summary:${NC}"
echo "• Dashboard: http://localhost:3000"
echo "• Logs: docker compose logs -f"
echo "• Restart: docker compose restart"
echo "• Stop: docker compose down"
echo ""
echo -e "${BLUE}📖 More help: docs/USER/README.md${NC}"
