# 🚀 BizBox - Ready-Made Business Platform

**Production-Ready Platform for Launching Ready-Made Businesses with AI-Powered Guidance**

---

## 📋 Overview

BizBox is a complete platform for helping entrepreneurs launch ready-made business solutions in 7 days. Features include:

- 🤖 **AI Advisor**: Multi-language Claude AI chatbot for lead qualification
- 📦 **Ready-Made Products**: 3 business niches (Cosmetics, Healthcare, FinTech)
- 💳 **Stripe Integration**: Complete payment processing
- 📊 **Dashboard**: Customer onboarding and progress tracking
- 🌍 **Multilingual**: Support for RU, UK, EN, ES
- 👨‍💼 **Admin Panel**: Lead and customer management

---

## 🏗️ Architecture

```
BizBox/
├── backend/                 # Node.js Express API
│   ├── index.js            # Main server
│   ├── routes/             # API endpoints
│   │   ├── chat.js         # AI Chat
│   │   ├── products.js     # Products catalog
│   │   ├── cases.js        # Case studies
│   │   ├── checkout.js     # Stripe payments
│   │   ├── leads.js        # Lead management
│   │   ├── dashboard.js    # Customer dashboard
│   │   └── admin.js        # Admin panel
│   ├── services/           # Business logic
│   │   ├── aiAdvisor.js    # Claude AI integration
│   │   └── emailService.js # Email notifications
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # JWT authentication
│   │   ├── validation.js   # Input validation
│   │   └── rateLimit.js    # Rate limiting
│   └── package.json
│
├── public_html/            # Frontend
│   ├── index.html         # Landing page
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       ├── i18n.js        # Internationalization
│       ├── main.js        # Main app logic
│       └── chat.js        # Chat interface
│
├── database/              # Database
│   ├── schema.sql         # MySQL schema
│   └── seed.sql           # Initial data
│
├── logs/                  # Application logs
├── uploads/               # User uploads
└── .env                   # Configuration

```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Anthropic API Key (Claude)
- Stripe API Keys (optional)

### 1. Setup Environment

```bash
# Set environment variables in .env
NODE_ENV=production
PORT=3000
APP_URL=https://direco.com

DB_HOST=localhost
DB_USER=diroco_com
DB_PASS=YourPassword
DB_NAME=direco_com

ANTHROPIC_API_KEY=sk-ant-api03-...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Setup Database

```bash
mysql -u root << EOF
$(cat database/schema.sql)
$(cat database/seed.sql)
EOF
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start

# With PM2
pm2 start backend/index.js --name "bizbox-api"
```

---

## 📚 API Documentation

### Base URL
`https://direco.com/api/v1`

### Authentication
Some endpoints require JWT token:
```
Authorization: Bearer <token>
```

### Endpoints

#### 🤖 Chat API
```
POST   /chat/message       # Send message to AI advisor
POST   /chat/qualify       # Qualify lead from conversation
GET    /chat/session/:id   # Get session info
DELETE /chat/session/:id   # Clear session
```

#### 📦 Products
```
GET  /products              # List all products
GET  /products/:id          # Get product details
GET  /products/niche/:niche # Get products by niche
```

#### 📋 Cases
```
GET  /cases                 # List all cases
GET  /cases/featured        # Get featured cases
GET  /cases/:id             # Get case details
GET  /cases/niche/:niche    # Get cases by niche
```

#### 💳 Checkout
```
POST /checkout/create-session  # Create Stripe session
POST /checkout/webhook         # Stripe webhook
GET  /checkout/session/:id     # Get session status
```

#### 👤 Leads
```
POST /leads                    # Create lead
GET  /leads                    # List leads
GET  /leads/:email             # Get lead details
PUT  /leads/:email             # Update lead status
```

#### 📊 Dashboard
```
GET  /dashboard/customer/:email              # Get customer overview
GET  /dashboard/customer/:email/progress     # Get metrics
POST /dashboard/customer/:email/survey       # Submit survey
GET  /dashboard/customer/:email/documents    # Get documents
```

#### 👨‍💼 Admin
```
POST /admin/login                            # Admin login
GET  /admin/stats                            # Dashboard stats
GET  /admin/leads                            # List all leads
GET  /admin/customers                        # List customers
PUT  /admin/leads/:email/status              # Update lead
POST /admin/products                         # Create product
DELETE /admin/products/:id                   # Delete product
```

---

## 🔐 Security Features

✅ JWT Authentication
✅ Input Validation & Sanitization
✅ Rate Limiting
✅ SQL Injection Prevention (Prepared Statements)
✅ XSS Protection (Helmet.js)
✅ CORS Configuration
✅ Secure Password Handling
✅ Error Handling

---

## 📧 Email Service

Integrated email notifications:

- Welcome email to new leads
- Lead qualification alerts to admin
- Payment confirmation
- Onboarding instructions
- 30-day check-in

Configure in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🌍 Supported Languages

- 🇷🇺 **Russian** (ru)
- 🇺🇦 **Ukrainian** (uk)
- 🇺🇸 **English** (en)
- 🇪🇸 **Spanish** (es)

Language selection is stored in browser's localStorage and persists.

---

## 💾 Database Schema

### Products Table
```sql
- id: INT
- name_ru/uk/en/es: VARCHAR(255)
- description_ru/uk/en/es: TEXT
- niche: VARCHAR(100) [cosmetics|healthcare|fintech]
- price_usd: INT
- average_monthly_income: INT
- roi_percentage: INT
- setup_time_days: INT
- status: ENUM [active|inactive]
```

### Leads Table
```sql
- id: INT
- email: VARCHAR(255) UNIQUE
- name: VARCHAR(255)
- language: VARCHAR(10)
- readiness_score: INT
- stage_category: VARCHAR(50)
- status: ENUM [new|contacted|qualified|demo_scheduled|converted]
```

### Customers Table
```sql
- id: INT
- email: VARCHAR(255) UNIQUE
- product_id: INT
- price_paid: INT
- stripe_customer_id: VARCHAR(255)
- status: ENUM [active|inactive|churned]
- onboarding_status: ENUM [started|in_progress|30_day_check|completed]
```

---

## 🤖 AI Integration

Uses **Claude 3.5 Sonnet** via Anthropic API:

- Analyzes lead conversations
- Generates personalized recommendations
- Computes readiness scores
- Multi-language support
- Extracts business metrics

System prompts customized per language for optimal results.

---

## 📊 Monitoring & Logging

Logs stored in `/logs/api.log`:

```
[2024-02-03T14:30:00.000Z] INFO: Server started
[2024-02-03T14:30:15.234Z] INFO: Database connected
[2024-02-03T14:30:20.456Z] ERROR: Payment processing failed
```

---

## 🚀 Deployment

### Requirements
- Linux server
- Node.js 18+
- MySQL 8.0+
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

### Steps

```bash
# 1. Clone repository
git clone https://github.com/zaomir/BizBox.git
cd BizBox

# 2. Install dependencies
cd backend && npm install

# 3. Configure .env
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
mysql -u root < database/schema.sql
mysql -u root < database/seed.sql

# 5. Start with PM2
pm2 start backend/index.js --name "bizbox"
pm2 startup
pm2 save

# 6. Configure Nginx
# See deployment guides

# 7. Setup SSL
certbot certonly --nginx -d direco.com
```

---

## 🧪 Testing

```bash
# Test health endpoint
curl https://direco.com/health

# Test API info
curl https://direco.com/api/v1/info

# Test chat
curl -X POST https://direco.com/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "sessionId": "test-123",
    "language": "en"
  }'
```

---

## 📝 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
APP_URL=https://direco.com

# Database
DB_HOST=localhost
DB_USER=diroco_com
DB_PASS=SecurePassword123
DB_NAME=direco_com

# AI (Anthropic/Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Payments (Stripe)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@direco.com
SMTP_PASS=app-password

# Languages
DEFAULT_LANGUAGE=ru
SUPPORTED_LANGUAGES=ru,uk,en,es

# Security
JWT_SECRET=your-secret-key-2024
SESSION_SECRET=your-session-secret

# Logging
LOG_LEVEL=info
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Check DB credentials in .env
Verify MySQL server is running
mysql -u root -p
```

### Email Service Not Working
```
Enable "Less secure app access" in Gmail
Use App Password instead of account password
Check SMTP credentials
```

### AI API Errors
```
Verify Anthropic API key is correct
Check API quota/balance
Ensure model name is correct (claude-3-5-sonnet-20241022)
```

---

## 📞 Support

- **Email**: support@direco.com
- **Phone**: +1 (800) BIZBOX-1
- **Documentation**: https://direco.com/docs
- **Issues**: https://github.com/zaomir/BizBox/issues

---

## 📄 License

Proprietary - BizBox Platform
© 2024 Rovlex International LTD

---

## 🗺️ Roadmap

- [ ] Payment gateway alternatives (PayPal, etc.)
- [ ] Advanced analytics dashboard
- [ ] Customer success metrics
- [ ] Automated onboarding flows
- [ ] Mobile app (iOS/Android)
- [ ] CRM integration
- [ ] Video hosting for tutorials
- [ ] Live support chat
- [ ] Advanced fraud detection

---

## 🎯 Next Steps

1. **PHASE 1**: ✅ Backend setup
2. **PHASE 2**: AI improvements
3. **PHASE 3**: Deployment setup
4. **PHASE 4**: Production launch

Happy building! 🚀
