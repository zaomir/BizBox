const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/cases
 * Get all case studies
 */
router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'ru';
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        title_${lang} as title,
        client_name,
        niche,
        initial_investment,
        revenue_month_6,
        profit_monthly,
        roi_percentage,
        testimonial_${lang} as testimonial,
        rating,
        featured,
        created_at
      FROM cases
      ORDER BY featured DESC, rating DESC
    `;

    const [rows] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('❌ Cases Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/cases/featured
 * Get featured case studies
 */
router.get('/featured', async (req, res) => {
  try {
    const lang = req.query.lang || 'ru';
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        title_${lang} as title,
        client_name,
        niche,
        initial_investment,
        revenue_month_6,
        profit_monthly,
        roi_percentage,
        testimonial_${lang} as testimonial,
        rating
      FROM cases
      WHERE featured = TRUE
      ORDER BY rating DESC
      LIMIT 3
    `;

    const [rows] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('❌ Featured Cases Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/cases/:id
 * Get specific case study
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        title_ru, title_uk, title_en, title_es,
        client_name,
        niche,
        initial_investment,
        revenue_month_6,
        profit_monthly,
        roi_percentage,
        testimonial_ru, testimonial_uk, testimonial_en, testimonial_es,
        rating,
        featured,
        created_at
      FROM cases
      WHERE id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('❌ Case Detail Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/cases/niche/:niche
 * Get cases by niche
 */
router.get('/niche/:niche', async (req, res) => {
  try {
    const lang = req.query.lang || 'ru';
    const { niche } = req.params;
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        title_${lang} as title,
        client_name,
        niche,
        roi_percentage,
        testimonial_${lang} as testimonial,
        rating
      FROM cases
      WHERE niche = ?
      ORDER BY rating DESC
    `;

    const [rows] = await connection.query(query, [niche]);
    connection.release();

    res.json({
      success: true,
      niche,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('❌ Niche Cases Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
