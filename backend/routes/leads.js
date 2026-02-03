const express = require('express');
const router = express.Router();

/**
 * POST /api/v1/leads
 * Create or update a lead
 */
router.post('/', async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      country,
      language = 'ru',
      business_experience,
      budget_range,
      urgency
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { db } = require('../index');
    const connection = await db.getConnection();

    const query = `
      INSERT INTO leads (
        email, name, phone, country, language,
        business_experience, budget_range, urgency,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
      ON DUPLICATE KEY UPDATE
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        country = COALESCE(?, country),
        language = COALESCE(?, language),
        business_experience = COALESCE(?, business_experience),
        budget_range = COALESCE(?, budget_range),
        urgency = COALESCE(?, urgency),
        updated_at = NOW()
    `;

    await connection.query(query, [
      email,
      name || null,
      phone || null,
      country || null,
      language,
      business_experience || null,
      budget_range || null,
      urgency || 'medium',
      name,
      phone,
      country,
      language,
      business_experience,
      budget_range,
      urgency
    ]);

    connection.release();

    res.json({
      success: true,
      message: 'Lead created/updated successfully',
      email
    });
  } catch (err) {
    console.error('❌ Create Lead Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/leads/:email
 * Get lead details
 */
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id, email, name, phone, country, language,
        readiness_score, stage_category, business_experience,
        budget_range, urgency, status,
        created_at, updated_at
      FROM leads
      WHERE email = ?
    `;

    const [rows] = await connection.query(query, [email]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('❌ Get Lead Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/leads
 * Get all leads (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;
    const offset = (page - 1) * limit;

    const { db } = require('../index');
    const connection = await db.getConnection();

    let query = 'SELECT * FROM leads';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await connection.query(query, params);

    // Get total count
    const countQuery = status
      ? 'SELECT COUNT(*) as count FROM leads WHERE status = ?'
      : 'SELECT COUNT(*) as count FROM leads';

    const countParams = status ? [status] : [];
    const [countRows] = await connection.query(countQuery, countParams);

    connection.release();

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].count,
        pages: Math.ceil(countRows[0].count / limit)
      }
    });
  } catch (err) {
    console.error('❌ Get Leads Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/leads/:email
 * Update lead status
 */
router.put('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { status, readiness_score, stage_category } = req.body;

    const { db } = require('../index');
    const connection = await db.getConnection();

    let updateQuery = 'UPDATE leads SET updated_at = NOW()';
    const params = [];

    if (status) {
      updateQuery += ', status = ?';
      params.push(status);
    }
    if (readiness_score !== undefined) {
      updateQuery += ', readiness_score = ?';
      params.push(readiness_score);
    }
    if (stage_category) {
      updateQuery += ', stage_category = ?';
      params.push(stage_category);
    }

    updateQuery += ' WHERE email = ?';
    params.push(email);

    await connection.query(updateQuery, params);
    connection.release();

    res.json({
      success: true,
      message: 'Lead updated successfully'
    });
  } catch (err) {
    console.error('❌ Update Lead Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
