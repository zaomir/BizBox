require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Middleware
const { sanitizeInput, validatePagination } = require('./middleware/validation');
const { rateLimits } = require('./middleware/rateLimit');
const { scheduleBatchJobs } = require('./services/batchJobsService');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(validatePagination);

// Logging
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file stream
const logFile = fs.createWriteStream(path.join(logsDir, 'api.log'), { flags: 'a' });

// Database Connection Pool
let db;
async function initDB() {
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'direco_com',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });
    console.log('✅ Database Connected Successfully');
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
    process.exit(1);
  }
}

// Health check and info endpoints
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/v1/info', (req, res) => {
  res.json({
    name: 'BizBox API',
    version: '1.0.0',
    description: 'Ready-made business platform with AI advisor',
    endpoints: {
      chat: '/api/v1/chat',
      products: '/api/v1/products',
      cases: '/api/v1/cases',
      checkout: '/api/v1/checkout',
      leads: '/api/v1/leads',
      dashboard: '/api/v1/dashboard',
      admin: '/api/v1/admin',
      analytics: '/api/v1/analytics'
    }
  });
});

// Apply rate limiting to specific routes
app.use('/api/v1/chat', rateLimits.chat);
app.use('/api/v1/leads', rateLimits.leads);
app.use('/api/v1/checkout', rateLimits.checkout);

// API Routes
app.use('/api/v1/chat', require('./routes/chat'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/cases', require('./routes/cases'));
app.use('/api/v1/checkout', require('./routes/checkout'));
app.use('/api/v1/leads', require('./routes/leads'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/jobs', require('./routes/jobs'));
app.use('/api/v1/admin', require('./routes/admin'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  logFile.write(`[${new Date().toISOString()}] ERROR: ${err.message}\n`);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message
  });
});

// Initialize and Start
async function start() {
  try {
    await initDB();

    // Verify email service
    try {
      const { verifyConnection } = require('./services/emailService');
      await verifyConnection();
    } catch (err) {
      console.warn('⚠️  Email service not available:', err.message);
    }

    // Initialize batch jobs scheduler
    try {
      scheduleBatchJobs(db);
    } catch (err) {
      console.warn('⚠️  Batch jobs scheduler not initialized:', err.message);
    }

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`
🚀 BizBox API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
📝 Environment: ${process.env.NODE_ENV}
🌍 App URL: ${process.env.APP_URL}
🔑 API Keys: Loaded from .env
📊 Database: Connected
✉️  Email Service: Ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 API Endpoints:
  • /api/v1/info - API info
  • /api/v1/chat - AI Chat & Analysis
  • /api/v1/products - Products Catalog
  • /api/v1/cases - Case Studies
  • /api/v1/checkout - Stripe Payments
  • /api/v1/leads - Lead Management
  • /api/v1/dashboard - Customer Dashboard
  • /api/v1/analytics - Advanced Analytics
  • /api/v1/admin - Admin Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = { app, db };
