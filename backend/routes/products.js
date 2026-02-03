const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/products
 * Get all products
 */
router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'ru';
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        name_${lang} as name,
        description_${lang} as description,
        niche,
        price_usd,
        average_monthly_income,
        roi_percentage,
        setup_time_days,
        image_url,
        status
      FROM products
      WHERE status = 'active'
      ORDER BY name_${lang} ASC
    `;

    const [rows] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('❌ Products Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/products/:id
 * Get specific product
 */
router.get('/:id', async (req, res) => {
  try {
    const lang = req.query.lang || 'ru';
    const { id } = req.params;
    const { db } = require('../index');

    const connection = await db.getConnection();

    const query = `
      SELECT
        id,
        name_ru, name_uk, name_en, name_es,
        description_ru, description_uk, description_en, description_es,
        niche,
        price_usd,
        average_monthly_income,
        roi_percentage,
        setup_time_days,
        image_url,
        status,
        created_at
      FROM products
      WHERE id = ? AND status = 'active'
    `;

    const [rows] = await connection.query(query, [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('❌ Product Detail Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/products/niche/:niche
 * Get products by niche
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
        name_${lang} as name,
        description_${lang} as description,
        niche,
        price_usd,
        roi_percentage,
        image_url
      FROM products
      WHERE niche = ? AND status = 'active'
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
    console.error('❌ Niche Products Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
