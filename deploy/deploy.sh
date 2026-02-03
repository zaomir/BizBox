#!/bin/bash

# BizBox Complete Deployment Script
# This script sets up the entire BizBox platform on a fresh server

set -e

# Configuration
DOMAIN="direco.com"
APP_PATH="/var/www/bizbox"
APP_USER="www-data"
NODE_VERSION="18"
MYSQL_ROOT_PASS="ChangeMe123!"
DB_NAME="direco_com"
DB_USER="diroco_com"
DB_PASS="Ld$[)vHZ|\Za0/Ep"

echo "🚀 BizBox Complete Deployment Script"
echo "===================================="
echo "Domain: $DOMAIN"
echo "App Path: $APP_PATH"
echo "Node Version: $NODE_VERSION"
echo ""

# 1. Update system
echo "📦 Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git nano build-essential

# 2. Install Node.js
echo "📦 Step 2: Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
apt-get install -y nodejs

node --version
npm --version

# 3. Install MySQL
echo "📦 Step 3: Installing MySQL..."
apt-get install -y mysql-server mysql-client

# 4. Install Nginx
echo "📦 Step 4: Installing Nginx..."
apt-get install -y nginx

# 5. Install Certbot for SSL
echo "📦 Step 5: Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# 6. Install PM2 globally
echo "📦 Step 6: Installing PM2..."
npm install -g pm2

# 7. Create application directory
echo "📁 Step 7: Creating application directories..."
mkdir -p $APP_PATH/backend
mkdir -p $APP_PATH/frontend
mkdir -p $APP_PATH/public_html
mkdir -p $APP_PATH/database
mkdir -p $APP_PATH/logs
mkdir -p $APP_PATH/uploads

chown -R $APP_USER:$APP_USER $APP_PATH
chmod -R 755 $APP_PATH

# 8. Clone or update repository
echo "🔄 Step 8: Setting up Git repository..."
if [ -d "$APP_PATH/.git" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd $APP_PATH
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/zaomir/BizBox.git $APP_PATH
    cd $APP_PATH
fi

# 9. Install Node dependencies
echo "📚 Step 9: Installing Node.js dependencies..."
cd $APP_PATH/backend
npm install

# 10. Setup MySQL database
echo "🗄️  Step 10: Setting up MySQL database..."
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Load schema
mysql -u $DB_USER -p$DB_PASS $DB_NAME < $APP_PATH/database/schema.sql

# Load seed data
mysql -u $DB_USER -p$DB_PASS $DB_NAME < $APP_PATH/database/seed.sql

echo "✅ Database setup complete"

# 11. Setup .env file
echo "⚙️  Step 11: Creating .env file..."
if [ ! -f "$APP_PATH/.env" ]; then
    cat > $APP_PATH/.env << EOF
NODE_ENV=production
PORT=3000
APP_URL=https://$DOMAIN

DB_HOST=localhost
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME

ANTHROPIC_API_KEY=sk-ant-api03-YOUR-API-KEY-HERE
STRIPE_PUBLIC_KEY=pk_live_YOUR-KEY-HERE
STRIPE_SECRET_KEY=sk_live_YOUR-KEY-HERE

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

DEFAULT_LANGUAGE=ru
SUPPORTED_LANGUAGES=ru,uk,en,es

JWT_SECRET=bizbox-secret-key-2024-change-in-production
SESSION_SECRET=session-secret-2024-change-in-production

LOG_LEVEL=info
EOF
    echo "⚠️  Please edit $APP_PATH/.env and add your API keys!"
else
    echo "✅ .env file already exists"
fi

# 12. Setup Nginx
echo "🌐 Step 12: Configuring Nginx..."
cp $APP_PATH/deploy/nginx.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

# 13. Setup SSL Certificate
echo "🔒 Step 13: Setting up SSL certificate..."
bash $APP_PATH/deploy/setup-ssl.sh

# 14. Setup PM2
echo "🔄 Step 14: Setting up PM2..."
cd $APP_PATH
pm2 start deploy/ecosystem.config.js
pm2 startup
pm2 save

# 15. Setup log rotation
echo "📝 Step 15: Setting up log rotation..."
cat > /etc/logrotate.d/bizbox << EOF
$APP_PATH/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        pm2 reload bizbox-api > /dev/null 2>&1 || true
    endscript
}
EOF

# 16. Setup firewall (if UFW is available)
echo "🔐 Step 16: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp     # SSH
    ufw allow 80/tcp     # HTTP
    ufw allow 443/tcp    # HTTPS
    ufw --force enable
    echo "✅ Firewall configured"
else
    echo "ℹ️  UFW not found, skipping firewall setup"
fi

# 17. Create monitoring script
echo "📊 Step 17: Setting up monitoring..."
cat > /usr/local/bin/bizbox-check << 'EOF'
#!/bin/bash
echo "🔍 BizBox Health Check"
echo "====================="
echo ""
echo "📍 API Status:"
curl -s http://localhost:3000/health | jq '.' || echo "❌ API is down"
echo ""
echo "📍 PM2 Status:"
pm2 status
echo ""
echo "📍 Nginx Status:"
systemctl is-active nginx
echo ""
echo "📍 MySQL Status:"
systemctl is-active mysql
echo ""
echo "📍 Disk Usage:"
df -h | grep -E '^/dev/|Filesystem'
echo ""
echo "📍 Memory Usage:"
free -h
EOF

chmod +x /usr/local/bin/bizbox-check

# Final summary
echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "📋 Server Information:"
echo "  Domain: https://$DOMAIN"
echo "  App Path: $APP_PATH"
echo "  Database: $DB_NAME"
echo ""
echo "🔧 Services:"
echo "  ✅ Node.js API (PM2)"
echo "  ✅ Nginx Web Server"
echo "  ✅ MySQL Database"
echo "  ✅ Let's Encrypt SSL"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit .env file: nano $APP_PATH/.env"
echo "  2. Add API keys (Anthropic, Stripe, etc.)"
echo "  3. Restart API: pm2 restart bizbox-api"
echo "  4. Check health: bizbox-check"
echo "  5. Monitor logs: pm2 logs bizbox-api"
echo ""
echo "📚 Useful Commands:"
echo "  View logs: pm2 logs bizbox-api"
echo "  Restart API: pm2 restart bizbox-api"
echo "  Stop API: pm2 stop bizbox-api"
echo "  View status: pm2 status"
echo "  Health check: bizbox-check"
echo ""
echo "🎉 BizBox is ready to go!"
