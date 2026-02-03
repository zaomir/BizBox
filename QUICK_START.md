# 🚀 BizBox Quick Start Guide

## One-Command Deployment to Production

Deploy BizBox to direco.com (213.155.28.121) with a single command!

### Prerequisites

**On your local machine (Mac/Linux):**

```bash
# Install sshpass
# macOS:
brew install sshpass

# Linux:
sudo apt-get install sshpass
```

### Deploy in One Command

From the BizBox directory, run:

```bash
bash DEPLOY.sh
```

That's it! The script will:

✅ Check prerequisites
✅ Test SSH connection
✅ Update server packages
✅ Install Node.js 18, MySQL, Nginx, PM2
✅ Clone BizBox repository
✅ Install dependencies
✅ Create and seed database
✅ Configure Nginx with SSL
✅ Setup Let's Encrypt certificates
✅ Start API with PM2
✅ Setup monitoring

**Estimated time: 20-30 minutes**

---

## What Happens During Deployment

1. **System Preparation**
   - Ubuntu system updates
   - Install required packages

2. **Runtime Installation**
   - Node.js 18
   - MySQL 8.0
   - Nginx
   - PM2

3. **Application Setup**
   - Clone BizBox from GitHub
   - Install npm dependencies
   - Create database and tables
   - Seed with sample data

4. **Web Server Configuration**
   - Nginx reverse proxy
   - Static file serving
   - API proxying to Node.js

5. **SSL/HTTPS**
   - Let's Encrypt certificates
   - Auto-renewal setup
   - HTTP → HTTPS redirect

6. **Process Management**
   - PM2 cluster mode
   - Auto-restart on crash
   - Monitoring setup

---

## After Deployment

### Access Your Platform

| Service | URL | Login |
|---------|-----|-------|
| **Website** | https://direco.com | Public |
| **API Info** | https://direco.com/api/v1/info | Public |
| **API Docs** | https://direco.com/api/v1/ | Public |
| **Admin Panel** | https://direco.com/api/v1/admin/login | admin@direco.com / ChangeMe123! |

### Monitor the Server

SSH into server:
```bash
ssh root@213.155.28.121
```

Useful commands:
```bash
# View logs
pm2 logs bizbox-api

# Monitor processes
pm2 monit

# Health check
bizbox-check

# Restart API
pm2 restart bizbox-api

# Check status
pm2 status
```

### Test the Platform

1. **Visit website:**
   ```
   https://direco.com
   ```

2. **Test AI Chat:**
   - Click "Начать консультацию"
   - Chat with the AI Advisor

3. **Check Products:**
   - View ready-made businesses
   - Change language (RU/UK/EN/ES)

4. **Check Case Studies:**
   - View success stories
   - See ROI numbers

5. **Test API:**
   ```bash
   curl https://direco.com/api/v1/products?lang=en
   curl https://direco.com/health
   ```

---

## Platform Features

### 🤖 AI-Powered Advisor
- Claude 3.5 Sonnet integration
- Multi-language support (RU, UK, EN, ES)
- Lead qualification and scoring
- Conversation persistence

### 📦 Ready-Made Businesses
- 3 business models
- Multi-language descriptions
- Pricing and ROI information
- Setup time estimates

### 💳 Payment Processing
- Stripe integration
- Secure checkout
- Payment confirmation
- Invoice tracking

### 📊 Advanced Analytics
- Lead funnel analysis
- Customer metrics
- Revenue tracking
- Conversion rates

### 📧 Email Automation
- Welcome emails
- Lead notifications
- Follow-up campaigns
- 30-day check-ins

### ⚙️ Admin Dashboard
- Lead management
- Customer tracking
- Product management
- Batch job execution

---

## Configuration

Environment variables in `/var/www/bizbox/.env`:

```env
# Server
NODE_ENV=production
PORT=3000
APP_URL=https://direco.com

# Database
DB_HOST=localhost
DB_USER=diroco_com
DB_PASS=Ld$[)vHZ|\Za0/Ep
DB_NAME=direco_com

# AI (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Payments (Stripe)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Update these values as needed.

---

## Database

### Create backup:
```bash
ssh root@213.155.28.121
mysqldump -u diroco_com -p direco_com > backup.sql
```

### Restore backup:
```bash
mysql -u diroco_com -p direco_com < backup.sql
```

---

## SSL Certificates

Auto-renewed by Let's Encrypt.

Check expiration:
```bash
ssh root@213.155.28.121
openssl x509 -in /etc/letsencrypt/live/direco.com/fullchain.pem -text -noout | grep "Not After"
```

---

## Troubleshooting

### API not starting
```bash
ssh root@213.155.28.121
pm2 logs bizbox-api
```

### Database issues
```bash
ssh root@213.155.28.121
mysql -u diroco_com -p
SHOW DATABASES;
USE direco_com;
SHOW TABLES;
```

### Nginx errors
```bash
ssh root@213.155.28.121
tail -f /var/log/nginx/error.log
```

### Full restart
```bash
ssh root@213.155.28.121
pm2 restart all
systemctl restart nginx
systemctl restart mysql
```

---

## Support

- **Documentation**: See DEPLOYMENT.md for detailed guide
- **Email**: support@direco.com
- **Server**: 213.155.28.121 (direco.com)

---

## Next Steps

1. ✅ Deploy with `bash DEPLOY.sh`
2. ✅ Visit https://direco.com
3. ✅ Test AI Chat
4. ✅ Check admin panel
5. ✅ Monitor logs
6. ✅ Configure email (SMTP)
7. ✅ Add Stripe keys
8. ✅ Customize content

---

**Happy deploying! 🚀**

Last updated: February 3, 2024
