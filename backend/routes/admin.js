const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const { verifyToken, verifyAdmin, generateToken } = require('../middleware/auth');

/**
 * POST /api/v1/admin/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Hardcoded admin credentials (in production, use database)
    const ADMIN_EMAIL = 'admin@direco.com';
    const ADMIN_PASSWORD_HASH = await bcryptjs.hash('ChangeMe123!', 10);

    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // For demo, use direct comparison
    if (password !== 'ChangeMe123!') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = generateToken({
      id: 1,
      email: ADMIN_EMAIL,
      role: 'admin'
    });

    res.json({
      success: true,
      token,
      user: {
        id: 1,
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('❌ Admin Login Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const connection = await db.getConnection();

    // Get stats
    const [stats] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE status = 'converted') as converted_leads,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT SUM(price_paid) FROM customers) as total_revenue,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
        (SELECT COUNT(*) FROM cases) as total_cases
    `);

    connection.release();

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (err) {
    console.error('❌ Stats Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/leads
 * Get all leads with pagination and filters
 */
router.get('/leads', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = null, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;
    const { db } = require('../index');
    const connection = await db.getConnection();

    let query = 'SELECT * FROM leads';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ` ORDER BY ${sort} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await connection.query(query, params);

    // Get count
    const countQuery = status
      ? 'SELECT COUNT(*) as total FROM leads WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM leads';
    const [countResult] = await connection.query(
      countQuery,
      status ? [status] : []
    );

    connection.release();

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Leads Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/customers
 * Get all customers
 */
router.get('/customers', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = null } = req.query;
    const offset = (page - 1) * limit;
    const { db } = require('../index');
    const connection = await db.getConnection();

    let query = 'SELECT * FROM customers';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await connection.query(query, params);

    const countQuery = status
      ? 'SELECT COUNT(*) as total FROM customers WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM customers';
    const [countResult] = await connection.query(
      countQuery,
      status ? [status] : []
    );

    connection.release();

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Customers Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/admin/leads/:email/status
 * Update lead status
 */
router.put('/leads/:email/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.body;

    if (!['new', 'contacted', 'qualified', 'demo_scheduled', 'converted'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const { db } = require('../index');
    const connection = await db.getConnection();

    await connection.query(
      'UPDATE leads SET status = ?, updated_at = NOW() WHERE email = ?',
      [status, email]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Lead status updated'
    });
  } catch (err) {
    console.error('❌ Update Lead Status Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/products
 * Create new product
 */
router.post('/products', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      name_ru, name_uk, name_en, name_es,
      description_ru, description_uk, description_en, description_es,
      niche, price_usd, average_monthly_income, roi_percentage,
      setup_time_days, image_url
    } = req.body;

    const { db } = require('../index');
    const connection = await db.getConnection();

    const query = `
      INSERT INTO products (
        name_ru, name_uk, name_en, name_es,
        description_ru, description_uk, description_en, description_es,
        niche, price_usd, average_monthly_income, roi_percentage,
        setup_time_days, image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    const [result] = await connection.query(query, [
      name_ru, name_uk, name_en, name_es,
      description_ru, description_uk, description_en, description_es,
      niche, price_usd, average_monthly_income, roi_percentage,
      setup_time_days, image_url
    ]);

    connection.release();

    res.json({
      success: true,
      productId: result.insertId,
      message: 'Product created'
    });
  } catch (err) {
    console.error('❌ Create Product Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/v1/admin/products/:id
 * Delete product
 */
router.delete('/products/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('../index');
    const connection = await db.getConnection();

    await connection.query('UPDATE products SET status = "inactive" WHERE id = ?', [id]);

    connection.release();

    res.json({
      success: true,
      message: 'Product deleted'
    });
  } catch (err) {
    console.error('❌ Delete Product Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
