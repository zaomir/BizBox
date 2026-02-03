#!/bin/bash

# BizBox Production Deployment Script
# Complete automated deployment to direco.com (213.155.28.121)
# This script handles everything needed to deploy to production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PRODUCTION_IP="213.155.28.121"
PRODUCTION_DOMAIN="direco.com"
SSH_USER="root"
APP_PATH="/var/www/bizbox"
GIT_REPO="https://github.com/zaomir/BizBox.git"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   BizBox Production Deployment         ║"
echo "║   Target: direco.com (213.155.28.121) ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# 1. Check connectivity
echo -e "${YELLOW}Step 1: Checking server connectivity...${NC}"
if ping -c 1 $PRODUCTION_IP &> /dev/null; then
    echo -e "${GREEN}✅ Server is reachable${NC}"
else
    echo -e "${RED}❌ Cannot reach server. Check IP and firewall.${NC}"
    exit 1
fi
echo ""

# 2. Check SSH access
echo -e "${YELLOW}Step 2: Testing SSH connection...${NC}"
if ssh -o BatchMode=yes -o ConnectTimeout=5 $SSH_USER@$PRODUCTION_IP "echo OK" &> /dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection test failed. Will attempt with password.${NC}"
    read -sp "Enter SSH password for root@$PRODUCTION_IP: " SSH_PASSWORD
    echo ""
fi
echo ""

# 3. Create SSH function
if [ -z "$SSH_PASSWORD" ]; then
    SSH_CMD="ssh $SSH_USER@$PRODUCTION_IP"
    SCP_CMD="scp -r"
else
    # Using sshpass if available
    if command -v sshpass &> /dev/null; then
        SSH_CMD="sshpass -p '$SSH_PASSWORD' ssh -o StrictHostKeyChecking=no $SSH_USER@$PRODUCTION_IP"
        SCP_CMD="sshpass -p '$SSH_PASSWORD' scp -o StrictHostKeyChecking=no -r"
    else
        echo -e "${RED}❌ sshpass not found. Install it first: apt-get install sshpass${NC}"
        exit 1
    fi
fi

# 4. Check if app directory exists
echo -e "${YELLOW}Step 3: Checking application directory...${NC}"
if $SSH_CMD "[ -d $APP_PATH ]" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Application directory already exists. Will update.${NC}"
    UPDATE_EXISTING=true
else
    echo -e "${GREEN}✅ Fresh installation${NC}"
    UPDATE_EXISTING=false
fi
echo ""

# 5. Copy deployment files
echo -e "${YELLOW}Step 4: Uploading deployment files...${NC}"
echo "Uploading code to $SSH_USER@$PRODUCTION_IP:$APP_PATH"

# Create remote directory if doesn't exist
$SSH_CMD "mkdir -p $APP_PATH"

# Copy application files
echo "  Copying backend files..."
$SCP_CMD ./backend $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1

echo "  Copying frontend files..."
$SCP_CMD ./public_html $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1

echo "  Copying database files..."
$SCP_CMD ./database $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1

echo "  Copying deployment scripts..."
$SCP_CMD ./deploy $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1

echo "  Copying configuration files..."
$SCP_CMD ./.env.example $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1
$SCP_CMD ./Dockerfile $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1
$SCP_CMD ./docker-compose.yml $SSH_USER@$PRODUCTION_IP:$APP_PATH/ > /dev/null 2>&1

echo -e "${GREEN}✅ Files uploaded successfully${NC}"
echo ""

# 6. Run deployment script on remote server
echo -e "${YELLOW}Step 5: Running deployment script on server...${NC}"
echo "This may take 15-20 minutes..."
echo ""

# Create the deployment command
DEPLOY_SCRIPT='#!/bin/bash
set -e

cd '"$APP_PATH"'

echo "📦 Running system updates..."
apt-get update > /dev/null
apt-get upgrade -y > /dev/null

echo "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs > /dev/null
fi

echo "📦 Installing MySQL..."
if ! command -v mysql &> /dev/null; then
    apt-get install -y mysql-server mysql-client > /dev/null
fi

echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx > /dev/null
fi

echo "📦 Installing PM2..."
npm install -g pm2 > /dev/null

echo "📦 Installing application dependencies..."
cd backend
npm install > /dev/null
cd ..

echo "🗄️  Setting up database..."
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS direco_com CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS '"'"'diroco_com'"'"'@'"'"'localhost'"'"' IDENTIFIED BY '"'"'Ld$[)vHZ|\Za0/Ep'"'"';
GRANT ALL PRIVILEGES ON direco_com.* TO '"'"'diroco_com'"'"'@'"'"'localhost'"'"';
FLUSH PRIVILEGES;
EOF

mysql -u diroco_com -p"Ld$[)vHZ|\Za0/Ep" direco_com < database/schema.sql
mysql -u diroco_com -p"Ld$[)vHZ|\Za0/Ep" direco_com < database/seed.sql

echo "⚙️  Configuring environment..."
if [ ! -f .env ]; then
    cat > .env << '"'"'ENVEOF'"'"'
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
'"'"'ENVEOF'"'"'
fi

echo "🌐 Configuring Nginx..."
cp deploy/nginx.conf /etc/nginx/sites-available/direco.com
ln -sf /etc/nginx/sites-available/direco.com /etc/nginx/sites-enabled/direco.com
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null
systemctl restart nginx

echo "🔒 Setting up SSL certificate..."
apt-get install -y certbot python3-certbot-nginx > /dev/null
bash deploy/setup-ssl.sh

echo "⚙️  Setting up PM2..."
pm2 start deploy/ecosystem.config.js
pm2 startup > /dev/null
pm2 save

echo "✅ Deployment complete!"
'

# Execute deployment script
$SSH_CMD bash << 'REMOTESCRIPT'
'"$DEPLOY_SCRIPT"'
REMOTESCRIPT

echo ""
echo -e "${GREEN}✅ Server deployment completed!${NC}"
echo ""

# 7. Post-deployment checks
echo -e "${YELLOW}Step 6: Running post-deployment checks...${NC}"

# Check if API is running
echo "Checking API status..."
if $SSH_CMD "curl -s http://localhost:3000/health | grep -q 'ok'" 2>/dev/null; then
    echo -e "${GREEN}✅ API is running${NC}"
else
    echo -e "${YELLOW}⚠️  API may still be starting, please check in 30 seconds${NC}"
fi

# Check Nginx
if $SSH_CMD "systemctl is-active nginx" &>/dev/null; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi

# Check MySQL
if $SSH_CMD "systemctl is-active mysql" &>/dev/null; then
    echo -e "${GREEN}✅ MySQL is running${NC}"
else
    echo -e "${RED}❌ MySQL is not running${NC}"
fi

echo ""

# 8. Final summary
echo -e "${BLUE}╔════════════════════════════════════════╗"
echo "║      Deployment Complete! 🎉            ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${GREEN}🌍 Website:${NC}  https://direco.com"
echo -e "${GREEN}📍 Server:${NC}   $PRODUCTION_IP"
echo -e "${GREEN}🎯 API:${NC}      https://direco.com/api/v1/info"
echo -e "${GREEN}💻 SSH:${NC}      ssh root@$PRODUCTION_IP"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Visit https://direco.com to see the website"
echo "  2. Test the chat: Click 'Начать консультацию'"
echo "  3. Check admin: https://direco.com/api/v1/admin/login"
echo "  4. Monitor: ssh root@$PRODUCTION_IP && pm2 logs"
echo ""
echo -e "${YELLOW}📚 Useful commands:${NC}"
echo "  View logs:      ssh root@$PRODUCTION_IP && pm2 logs bizbox-api"
echo "  Check status:   ssh root@$PRODUCTION_IP && pm2 status"
echo "  Monitor:        ssh root@$PRODUCTION_IP && bizbox-check"
echo "  Restart API:    ssh root@$PRODUCTION_IP && pm2 restart bizbox-api"
echo ""
echo -e "${GREEN}✅ BizBox is live at https://direco.com!${NC}"
