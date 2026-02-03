#!/bin/bash

# BizBox Monitoring and Health Check Script
# Run this periodically to check system health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "🔍 BizBox System Health Check"
echo "=============================="
echo -e "${NC}"

# Check timestamp
echo -e "${YELLOW}Last check:${NC} $(date)"
echo ""

# 1. API Health
echo -e "${BLUE}📡 API Status:${NC}"
if curl -s http://localhost:3000/health | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is running${NC}"
    curl -s http://localhost:3000/health | jq .
else
    echo -e "${RED}❌ API is down${NC}"
    exit 1
fi
echo ""

# 2. Nginx Status
echo -e "${BLUE}🌐 Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
    systemctl status nginx --no-pager
else
    echo -e "${RED}❌ Nginx is down${NC}"
fi
echo ""

# 3. MySQL Status
echo -e "${BLUE}🗄️  MySQL Status:${NC}"
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL is running${NC}"
    if mysql -u diroco_com -p"$DB_PASS" direco_com -e "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        mysql -u diroco_com -p"$DB_PASS" direco_com -e "SELECT COUNT(*) as leads FROM leads; SELECT COUNT(*) as customers FROM customers;"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
    fi
else
    echo -e "${RED}❌ MySQL is down${NC}"
fi
echo ""

# 4. PM2 Status
echo -e "${BLUE}⚙️  PM2 Status:${NC}"
pm2 status
echo ""

# 5. Resource Usage
echo -e "${BLUE}💾 Resource Usage:${NC}"
echo -e "${YELLOW}Memory:${NC}"
free -h | head -2
echo ""
echo -e "${YELLOW}Disk:${NC}"
df -h | grep -E '^/dev/|Filesystem'
echo ""

# 6. Load Average
echo -e "${BLUE}📊 Load Average:${NC}"
uptime
echo ""

# 7. SSL Certificate Status
echo -e "${BLUE}🔒 SSL Certificate:${NC}"
if [ -f /etc/letsencrypt/live/direco.com/fullchain.pem ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/direco.com/fullchain.pem -notext -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
    DAYS_LEFT=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    if [ $DAYS_LEFT -lt 30 ]; then
        echo -e "${YELLOW}⚠️  Certificate expires in $DAYS_LEFT days${NC}"
    elif [ $DAYS_LEFT -lt 0 ]; then
        echo -e "${RED}❌ Certificate has expired${NC}"
    else
        echo -e "${GREEN}✅ Certificate is valid (${DAYS_LEFT} days remaining)${NC}"
    fi
else
    echo -e "${RED}❌ Certificate not found${NC}"
fi
echo ""

# 8. Recent Errors
echo -e "${BLUE}📝 Recent Errors (last 10 from PM2):${NC}"
pm2 logs bizbox-api --lines 10 --nostream 2>/dev/null || echo "No errors"
echo ""

# 9. API Endpoint Tests
echo -e "${BLUE}🧪 API Endpoint Tests:${NC}"
echo -e "${YELLOW}Testing /health:${NC}"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/health

echo -e "${YELLOW}Testing /api/v1/info:${NC}"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://direco.com/api/v1/info

echo -e "${YELLOW}Testing /api/v1/products:${NC}"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://direco.com/api/v1/products?lang=en
echo ""

# 10. Summary
echo -e "${BLUE}📋 Summary:${NC}"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
NGINX_STATUS=$(systemctl is-active nginx)
MYSQL_STATUS=$(systemctl is-active mysql)

if [ "$API_STATUS" == "200" ] && [ "$NGINX_STATUS" == "active" ] && [ "$MYSQL_STATUS" == "active" ]; then
    echo -e "${GREEN}✅ All systems operational${NC}"
else
    echo -e "${RED}⚠️  Some systems are down. Check above.${NC}"
fi

echo ""
echo -e "${YELLOW}For detailed logs, run:${NC}"
echo "  pm2 logs bizbox-api"
echo "  tail -f /var/log/nginx/direco.com.error.log"
echo "  tail -f /var/log/nginx/direco.com.access.log"
