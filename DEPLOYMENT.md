# 🚀 BizBox Deployment Guide

Production-ready deployment guide for BizBox platform on Linux servers.

---

## 📋 Prerequisites

- **Server**: Linux (Ubuntu 20.04 LTS or newer recommended)
- **IP**: 213.155.28.121 (direco.com)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: Minimum 20GB
- **SSH Access**: Root or sudo privileges
- **Domain**: direco.com with DNS pointing to server
- **API Keys**:
  - Anthropic Claude API key
  - Stripe API keys
  - Gmail App Password

---

## 🔧 Installation Methods

### Option 1: Automated Deployment Script (Recommended)

Fastest way to get up and running:

```bash
# SSH into server
ssh root@213.155.28.121

# Download and run deployment script
cd /tmp
wget https://raw.githubusercontent.com/zaomir/BizBox/main/deploy/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Update system packages
- Install Node.js 18, MySQL, Nginx, PM2
- Clone the repository
- Setup database with schema and seed data
- Configure SSL certificates
- Start the API server
- Setup log rotation and monitoring

**Estimated time**: 15-20 minutes

---

### Option 2: Docker Deployment (Modern Approach)

Using Docker Compose for containerized deployment:

```bash
# SSH into server
ssh root@213.155.28.121

# Clone repository
git clone https://github.com/zaomir/BizBox.git /var/www/bizbox
cd /var/www/bizbox

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose

# Setup environment
cp .env.example .env
nano .env  # Edit with your API keys

# Build and start containers
docker-compose up -d

# Run database migrations
docker-compose exec api npm run migrate
```

**Benefits**:
- Isolation and security
- Easy scaling
- Version consistency
- Quick rollbacks

---

### Option 3: Manual Setup

For complete control:

```bash
# 1. Update system
apt-get update && apt-get upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. Install MySQL
apt-get install -y mysql-server

# 4. Install Nginx
apt-get install -y nginx

# 5. Install PM2 globally
npm install -g pm2

# 6. Setup application
mkdir -p /var/www/bizbox
cd /var/www/bizbox
git clone https://github.com/zaomir/BizBox.git .

# 7. Install dependencies
cd backend && npm install

# 8. Setup database
mysql -u root < ../database/schema.sql
mysql -u root < ../database/seed.sql

# 9. Configure environment
cp .env.example .env
nano .env

# 10. Start application
pm2 start deploy/ecosystem.config.js
pm2 startup && pm2 save

# 11. Setup Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/direco.com
ln -s /etc/nginx/sites-available/direco.com /etc/nginx/sites-enabled/
systemctl restart nginx

# 12. Setup SSL
bash deploy/setup-ssl.sh
```

---

## 🔑 Configuration

### Essential Environment Variables

Create `.env` file in project root:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://direco.com

# Database
DB_HOST=localhost
DB_USER=diroco_com
DB_PASS=SecurePassword123
DB_NAME=direco_com

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Stripe (Optional - for payments)
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Email (Gmail recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SSL Certificate Setup

Let's Encrypt provides free SSL:

```bash
# Automatic setup (included in deploy.sh)
bash deploy/setup-ssl.sh

# Manual setup with certbot
certbot certonly \
    --nginx \
    -d direco.com \
    -d www.direco.com \
    --non-interactive \
    --agree-tos \
    -m admin@direco.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

Certificate renewal happens automatically. Verify:

```bash
certbot renew --dry-run
```

---

## 📊 Process Management (PM2)

### Basic Commands

```bash
# Start application
pm2 start deploy/ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs bizbox-api

# Monitor in real-time
pm2 monit

# Restart
pm2 restart bizbox-api

# Stop
pm2 stop bizbox-api

# Delete
pm2 delete bizbox-api

# Save state
pm2 save

# Startup on reboot
pm2 startup
pm2 save
```

### Auto-restart Configuration

Edit `deploy/ecosystem.config.js`:

```javascript
max_memory_restart: '500M',    // Restart if exceeds 500MB
max_restarts: 10,               // Max restarts in window
min_uptime: '10s',              // Minimum uptime before counting restart
cron_restart: '0 3 * * *'       // Daily restart at 3 AM
```

---

## 🌐 Nginx Configuration

### Key Features

- **HTTPS**: Force redirect from HTTP
- **Compression**: gzip compression enabled
- **Caching**: Static assets cached for 1 year
- **Security Headers**: HSTS, X-Frame-Options, etc.
- **API Proxy**: Forward `/api/*` to Node.js app
- **Rate Limiting**: (can be added)

### Test Configuration

```bash
nginx -t
```

### Reload Configuration

```bash
systemctl reload nginx
```

### View Logs

```bash
tail -f /var/log/nginx/direco.com.access.log
tail -f /var/log/nginx/direco.com.error.log
```

---

## 🗄️ Database Management

### Backup Database

```bash
mysqldump -u diroco_com -p direco_com > backup.sql
```

### Restore Database

```bash
mysql -u diroco_com -p direco_com < backup.sql
```

### Schedule Automatic Backups

```bash
# Create backup script
cat > /usr/local/bin/bizbox-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/bizbox"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mysqldump -u diroco_com -p$DB_PASS direco_com | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/bizbox-backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/bizbox-backup.sh
```

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl https://direco.com/health
```

Response:
```json
{
  "ok": true,
  "timestamp": "2024-02-03T14:30:00.000Z",
  "environment": "production"
}
```

### Monitoring Script

```bash
# Run health check
bizbox-check

# Or use curl
curl https://direco.com/health | jq

# Check PM2 status
pm2 status

# Monitor resources
pm2 monit
```

### Performance Metrics

```bash
# View Node.js process
ps aux | grep node

# Memory usage
free -h

# Disk space
df -h

# Check logs
pm2 logs bizbox-api
```

---

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Deny all other incoming
ufw default deny incoming
```

### Security Headers

Already configured in Nginx:
- Strict-Transport-Security (HSTS)
- X-Frame-Options (prevent clickjacking)
- X-Content-Type-Options (prevent MIME sniffing)
- X-XSS-Protection

### API Security

- Rate limiting enabled
- Input validation and sanitization
- JWT authentication
- SQL injection prevention (prepared statements)
- CORS properly configured

---

## 📈 Scaling Recommendations

### For Small Traffic (< 1000 req/day)

- Current setup sufficient
- Single server with PM2 clustering

### For Medium Traffic (1000-10k req/day)

```javascript
// In ecosystem.config.js
instances: 4,  // Use 4 Node.js processes
exec_mode: 'cluster'  // Load balancing
```

### For Large Traffic (> 10k req/day)

- Setup load balancer (HAProxy or Nginx)
- Multiple application servers
- Dedicated database server
- Redis cache layer
- CDN for static assets

---

## 🐛 Troubleshooting

### API Not Starting

```bash
# Check logs
pm2 logs bizbox-api

# Check port 3000 is available
lsof -i :3000

# Check database connection
mysql -u diroco_com -p direco_com

# Verify .env file exists and is valid
cat .env
```

### Nginx Not Loading

```bash
# Test configuration
nginx -t

# Check logs
tail -f /var/log/nginx/error.log

# Verify port 80/443 are available
ss -tlnp | grep ':80\|:443'
```

### Database Issues

```bash
# Check MySQL is running
systemctl status mysql

# Check disk space
df -h

# Verify user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'diroco_com'@'localhost';"
```

### SSL Certificate Issues

```bash
# Verify certificate exists
ls -la /etc/letsencrypt/live/direco.com/

# Check expiration
openssl x509 -in /etc/letsencrypt/live/direco.com/fullchain.pem -text -noout | grep "Not After"

# Force renewal
certbot renew --force-renewal
```

---

## 📚 Useful Commands

```bash
# Restart entire application
pm2 restart bizbox-api && systemctl reload nginx

# View real-time logs
pm2 logs bizbox-api --lines 100 --stream

# Check application status
pm2 status && systemctl status nginx && systemctl status mysql

# Quick health check
curl -s https://direco.com/health | jq .

# View Node.js processes
pm2 list

# Memory usage
pm2 info bizbox-api
```

---

## 🚨 Emergency Recovery

### If Application Crashes

```bash
# Restart immediately
pm2 restart bizbox-api

# Check for errors
pm2 logs bizbox-api

# Full restart (reload dependencies)
pm2 stop bizbox-api
cd /var/www/bizbox/backend
npm install
pm2 start ../deploy/ecosystem.config.js
```

### If Database Crashes

```bash
# Restart MySQL
systemctl restart mysql

# Check integrity
mysqlcheck -u root -p -A

# Restore from backup if needed
mysql -u diroco_com -p direco_com < backup.sql
```

### If Server is Down

```bash
# SSH to server
ssh root@213.155.28.121

# Check what's running
ps aux

# Check logs
journalctl -u mysql -n 50
journalctl -u nginx -n 50

# Restart services
systemctl restart mysql nginx
pm2 restart all
```

---

## 📞 Support

- **Documentation**: https://direco.com/docs
- **Email**: support@direco.com
- **Phone**: +1 (800) BIZBOX-1

---

## ✅ Post-Deployment Checklist

- [ ] Domain points to server IP
- [ ] SSL certificate is valid and auto-renewing
- [ ] Application starts on server reboot
- [ ] Database backups scheduled
- [ ] Monitoring and alerts configured
- [ ] API keys are set in .env
- [ ] Email service is working
- [ ] Health check endpoint returns 200
- [ ] Admin panel is accessible
- [ ] Customer can view products
- [ ] Chat with AI Advisor works
- [ ] Payment processing is tested
- [ ] Logs are rotating properly
- [ ] Firewall is configured
- [ ] Regular backups are being taken

---

Last updated: February 2024
