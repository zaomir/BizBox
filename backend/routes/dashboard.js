const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { validateEmail } = require('../middleware/validation');

/**
 * GET /api/v1/dashboard/customer/:email
 * Get customer dashboard data
 */
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { db } = require('../index');
    const connection = await db.getConnection();

    // Get customer info
    const [customers] = await connection.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const customer = customers[0];

    // Get onboarding checklist based on status
    const onboardingSteps = {
      started: [
        { step: 1, title: 'Account Setup', completed: true, dueDate: new Date() },
        { step: 2, title: 'Document Submission', completed: false, dueDate: new Date(Date.now() + 86400000) },
        { step: 3, title: 'Client Base Setup', completed: false, dueDate: new Date(Date.now() + 172800000) },
        { step: 4, title: 'Launch Day', completed: false, dueDate: new Date(Date.now() + 604800000) }
      ],
      in_progress: [
        { step: 1, title: 'Account Setup', completed: true, dueDate: new Date() },
        { step: 2, title: 'Document Submission', completed: true, dueDate: new Date(Date.now() - 86400000) },
        { step: 3, title: 'Client Base Setup', completed: false, dueDate: new Date(Date.now() + 172800000) },
        { step: 4, title: 'Launch Day', completed: false, dueDate: new Date(Date.now() + 604800000) }
      ],
      completed: [
        { step: 1, title: 'Account Setup', completed: true, dueDate: new Date() },
        { step: 2, title: 'Document Submission', completed: true, dueDate: new Date(Date.now() - 86400000) },
        { step: 3, title: 'Client Base Setup', completed: true, dueDate: new Date(Date.now() - 172800000) },
        { step: 4, title: 'Launch Day', completed: true, dueDate: new Date(Date.now() - 604800000) }
      ]
    };

    // Get support info
    const supportInfo = {
      manager: {
        name: 'BizBox Support Team',
        email: 'support@direco.com',
        phone: '+1 (800) BIZBOX-1'
      },
      resources: [
        { title: 'Getting Started Guide', url: '/docs/getting-started' },
        { title: 'Setup Checklist', url: '/docs/checklist' },
        { title: 'FAQ', url: '/docs/faq' },
        { title: 'Video Tutorials', url: '/docs/videos' }
      ]
    };

    connection.release();

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company_name,
        product: customer.product_name,
        status: customer.status,
        onboardingStatus: customer.onboarding_status,
        paymentDate: customer.payment_date,
        language: customer.language
      },
      onboarding: onboardingSteps[customer.onboarding_status] || onboardingSteps.started,
      support: supportInfo,
      metrics: {
        daysActive: Math.floor((Date.now() - new Date(customer.created_at)) / 86400000),
        status: customer.status,
        onboardingProgress: ['started', 'in_progress', 'completed'].indexOf(customer.onboarding_status) * 33 + 33
      }
    });
  } catch (err) {
    console.error('❌ Dashboard Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/dashboard/customer/:email/progress
 * Get customer progress/metrics
 */
router.get('/customer/:email/progress', async (req, res) => {
  try {
    const { email } = req.params;
    const { db } = require('../index');
    const connection = await db.getConnection();

    const [customers] = await connection.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const customer = customers[0];

    // Simulate progress metrics (in production, these would be from actual business data)
    const metrics = {
      revenue: {
        monthly: Math.floor(Math.random() * 50000) + 10000,
        target: 150000,
        currency: 'USD'
      },
      customers: {
        active: Math.floor(Math.random() * 500) + 10,
        target: 1000
      },
      roi: {
        current: Math.floor((customer.price_paid / 100) * 2.5), // Mock ROI calculation
        percentage: 250
      },
      satisfaction: {
        score: Math.random() * 100,
        maxScore: 100
      }
    };

    connection.release();

    res.json({
      success: true,
      metrics
    });
  } catch (err) {
    console.error('❌ Progress Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/dashboard/customer/:email/survey
 * Submit 30-day survey
 */
router.post('/customer/:email/survey', async (req, res) => {
  try {
    const { email } = req.params;
    const { revenue, satisfaction, feedback } = req.body;
    const { db } = require('../index');
    const connection = await db.getConnection();

    const [customers] = await connection.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // In production, save survey data to database
    console.log(`📊 Survey received from ${email}:`, {
      revenue,
      satisfaction,
      feedback
    });

    connection.release();

    res.json({
      success: true,
      message: 'Survey submitted successfully',
      nextCheckIn: new Date(Date.now() + 2592000000) // 30 days from now
    });
  } catch (err) {
    console.error('❌ Survey Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/dashboard/customer/:email/documents
 * Get customer documents
 */
router.get('/customer/:email/documents', async (req, res) => {
  try {
    const { email } = req.params;
    const { db } = require('../index');
    const connection = await db.getConnection();

    const [customers] = await connection.query(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Mock documents (in production, these would be actual file links)
    const documents = [
      {
        id: 1,
        title: 'Setup Guide',
        type: 'PDF',
        url: '/documents/setup-guide.pdf',
        size: '2.5 MB',
        uploadedDate: new Date()
      },
      {
        id: 2,
        title: 'Client Scripts',
        type: 'DOCX',
        url: '/documents/client-scripts.docx',
        size: '1.2 MB',
        uploadedDate: new Date()
      },
      {
        id: 3,
        title: 'Operations Manual',
        type: 'PDF',
        url: '/documents/operations-manual.pdf',
        size: '5.8 MB',
        uploadedDate: new Date()
      }
    ];

    connection.release();

    res.json({
      success: true,
      documents
    });
  } catch (err) {
    console.error('❌ Documents Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
