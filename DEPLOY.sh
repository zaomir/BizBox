#!/bin/bash

# BizBox One-Command Deployment to direco.com
# Run this script to deploy BizBox to production server
#
# Usage: bash DEPLOY.sh
#
# Requirements:
#  - SSH access to root@213.155.28.121
#  - sshpass installed (brew install sshpass)
#  - git installed

set -e

# Configuration
PRODUCTION_IP="213.155.28.121"
PRODUCTION_DOMAIN="direco.com"
SSH_PASSWORD="vqMa3Xz5iA593"
APP_PATH="/var/www/bizbox"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       🚀 BizBox Production Deployment 🚀         ║
║                                                   ║
║        Deploying to direco.com                   ║
║        IP: 213.155.28.121                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass is not installed${NC}"
    echo -e "${YELLOW}Install it:${NC}"
    echo "  macOS: brew install sshpass"
    echo "  Linux: apt-get install sshpass"
    exit 1
fi
echo -e "${GREEN}✅ sshpass found${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ git found${NC}"

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ ssh is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ssh found${NC}"

echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection to $PRODUCTION_IP...${NC}"
if sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$PRODUCTION_IP "echo 'SSH OK'" &>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to $PRODUCTION_IP${NC}"
    echo "Check:"
    echo "  1. Server IP is correct: $PRODUCTION_IP"
    echo "  2. SSH password is correct"
    echo "  3. Server is online"
    exit 1
fi

echo ""

# Deploy
echo -e "${YELLOW}Starting deployment...${NC}"
echo "This will take approximately 20-30 minutes"
echo ""

# Run deployment on remote server
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no root@$PRODUCTION_IP << 'DEPLOY_END'

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_PATH="/var/www/bizbox"
GIT_REPO="https://github.com/zaomir/BizBox.git"
BRANCH="claude/bizbox-phase-zero-DfyKo"

echo -e "${BLUE}Step 1: Preparing server environment${NC}"
apt-get update > /dev/null
apt-get upgrade -y > /dev/null
apt-get install -y curl wget git nano build-essential > /dev/null
echo -e "${GREEN}✅ System updated${NC}"
echo ""

echo -e "${BLUE}Step 2: Installing Node.js 18${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null
    apt-get install -y nodejs > /dev/null
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo ""

echo -e "${BLUE}Step 3: Installing MySQL${NC}"
if ! command -v mysql &> /dev/null; then
    apt-get install -y mysql-server > /dev/null
fi
echo -e "${GREEN}✅ MySQL installed${NC}"
echo ""

echo -e "${BLUE}Step 4: Installing Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx > /dev/null
fi
echo -e "${GREEN}✅ Nginx installed${NC}"
echo ""

echo -e "${BLUE}Step 5: Installing PM2${NC}"
npm install -g pm2 > /dev/null
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

echo -e "${BLUE}Step 6: Setting up application directory${NC}"
mkdir -p $APP_PATH
cd $APP_PATH

if [ -d .git ]; then
    echo "Updating existing repository..."
    git fetch origin $BRANCH
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH --single-branch $GIT_REPO .
fi
echo -e "${GREEN}✅ Repository ready${NC}"
echo ""

echo -e "${BLUE}Step 7: Installing Node.js dependencies${NC}"
cd backend
npm install > /dev/null
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 8: Setting up database${NC}"
mysql -u root << 'DBEOF'
CREATE DATABASE IF NOT EXISTS direco_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'diroco_com'@'localhost' IDENTIFIED BY 'Ld$[)vHZ|\Za0/Ep';
GRANT ALL PRIVILEGES ON direco_com.* TO 'diroco_com'@'localhost';
FLUSH PRIVILEGES;
DBEOF

mysql -u diroco_com -p'Ld$[)vHZ|\Za0/Ep' direco_com < database/schema.sql
mysql -u diroco_com -p'Ld$[)vHZ|\Za0/Ep' direco_com < database/seed.sql
echo -e "${GREEN}✅ Database created and seeded${NC}"
echo ""

echo -e "${BLUE}Step 9: Creating .env configuration${NC}"
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
APP_URL=https://direco.com

DB_HOST=localhost
DB_USER=diroco_com
DB_PASS=Ld$[)vHZ|\Za0/Ep
DB_NAME=direco_com

ANTHROPIC_API_KEY=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

STRIPE_PUBLIC_KEY=Acw_LRX-X5ABHq-iIxKblV_2FD2W6BBjQETs5-5Jx6JJomU432giSs7MU8lMVjZ7X7VUw5zRRJH9cK-l
STRIPE_SECRET_KEY=EMLRBhTyB8JVnRtSo3RKiM7lHXgL0tmxvMWOqycsvMEJRl3JuFzUFLLybguvs_rUaAkpFDM7ouvcQA2M

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=diroco@diroco.com
SMTP_PASS=app-password

DEFAULT_LANGUAGE=ru
SUPPORTED_LANGUAGES=ru,uk,en,es

JWT_SECRET=bizbox-secret-key-2024-change-in-production
SESSION_SECRET=session-secret-2024-change-in-production

LOG_LEVEL=info
ENVEOF
fi
echo -e "${GREEN}✅ Configuration created${NC}"
echo ""

echo -e "${BLUE}Step 10: Configuring Nginx${NC}"
cp deploy/nginx.conf /etc/nginx/sites-available/direco.com
ln -sf /etc/nginx/sites-available/direco.com /etc/nginx/sites-enabled/direco.com
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null
systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

echo -e "${BLUE}Step 11: Setting up SSL certificate${NC}"
apt-get install -y certbot python3-certbot-nginx > /dev/null

if [ ! -d /etc/letsencrypt/live/direco.com ]; then
    certbot certonly \
        --nginx \
        -d direco.com \
        -d www.direco.com \
        --non-interactive \
        --agree-tos \
        -m admin@direco.com \
        --redirect > /dev/null 2>&1
fi

systemctl enable certbot.timer
systemctl start certbot.timer
echo -e "${GREEN}✅ SSL certificate configured${NC}"
echo ""

echo -e "${BLUE}Step 12: Starting API with PM2${NC}"
pm2 delete bizbox-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 startup --user root > /dev/null 2>&1
pm2 save > /dev/null
echo -e "${GREEN}✅ API started${NC}"
echo ""

echo -e "${BLUE}Step 13: Setting up monitoring${NC}"
mkdir -p /usr/local/bin
cp deploy/monitor.sh /usr/local/bin/bizbox-check
chmod +x /usr/local/bin/bizbox-check
echo -e "${GREEN}✅ Monitoring setup complete${NC}"
echo ""

sleep 3

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║           Deployment Successful! 🎉              ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

DEPLOY_END

echo ""
echo -e "${GREEN}✅ Remote deployment completed!${NC}"
echo ""

# Final information
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🌍 BizBox is now live!${NC}"
echo ""
echo -e "${YELLOW}📱 Access Points:${NC}"
echo "  Website:     https://direco.com"
echo "  API:         https://direco.com/api/v1/info"
echo "  SSH:         ssh root@$PRODUCTION_IP"
echo ""
echo -e "${YELLOW}🎯 Test the platform:${NC}"
echo "  1. Visit https://direco.com"
echo "  2. Click 'Начать консультацию' for AI Chat"
echo "  3. Check products and case studies"
echo "  4. Test payment flow (Stripe)"
echo ""
echo -e "${YELLOW}📊 Monitor the server:${NC}"
echo "  ssh root@$PRODUCTION_IP"
echo "  pm2 logs bizbox-api       # View API logs"
echo "  pm2 monit                 # Monitor processes"
echo "  bizbox-check              # Health check"
echo ""
echo -e "${YELLOW}📋 Server Details:${NC}"
echo "  IP:          $PRODUCTION_IP"
echo "  Domain:      $PRODUCTION_DOMAIN"
echo "  App Path:    $APP_PATH"
echo "  Database:    direco_com"
echo "  API Port:    3000"
echo "  Web Port:    80/443 (HTTPS)"
echo ""
echo -e "${YELLOW}🔐 Admin Access:${NC}"
echo "  Login:       https://direco.com/api/v1/admin/login"
echo "  Username:    admin@direco.com"
echo "  Password:    ChangeMe123!"
echo ""
echo -e "${GREEN}✅ All systems are running!${NC}"
echo ""
