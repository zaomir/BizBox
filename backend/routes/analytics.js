const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getPlatformMetrics,
  getLeadFunnel,
  getProductPerformance,
  getCustomerLifecycle,
  getDailyLeadVolume,
  getRevenueMetrics,
  getLanguageDistribution,
  getCohortAnalysis,
  generateExecutiveSummary
} = require('../services/analyticsService');

/**
 * GET /api/v1/analytics/overview
 * Get platform overview metrics
 */
router.get('/overview', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const metrics = await getPlatformMetrics(req.app.locals.db || require('../index').db);
    res.json({
      success: true,
      data: metrics
    });
  } catch (err) {
    console.error('❌ Overview Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/funnel
 * Get lead funnel analysis
 */
router.get('/funnel', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const funnel = await getLeadFunnel(db);
    res.json({
      success: true,
      data: funnel
    });
  } catch (err) {
    console.error('❌ Funnel Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/products
 * Get product performance metrics
 */
router.get('/products', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const products = await getProductPerformance(db);
    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('❌ Products Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/customers/lifecycle
 * Get customer lifecycle metrics
 */
router.get('/customers/lifecycle', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const lifecycle = await getCustomerLifecycle(db);
    res.json({
      success: true,
      data: lifecycle
    });
  } catch (err) {
    console.error('❌ Lifecycle Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/leads/daily
 * Get daily lead volume
 */
router.get('/leads/daily', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const { db } = require('../index');
    const dailyVolume = await getDailyLeadVolume(db, days);
    res.json({
      success: true,
      data: dailyVolume
    });
  } catch (err) {
    console.error('❌ Daily Leads Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/revenue
 * Get revenue metrics
 */
router.get('/revenue', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const revenue = await getRevenueMetrics(db);
    res.json({
      success: true,
      data: revenue
    });
  } catch (err) {
    console.error('❌ Revenue Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/languages
 * Get language distribution
 */
router.get('/languages', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const languages = await getLanguageDistribution(db);
    res.json({
      success: true,
      data: languages
    });
  } catch (err) {
    console.error('❌ Languages Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/cohorts
 * Get cohort analysis
 */
router.get('/cohorts', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const cohorts = await getCohortAnalysis(db);
    res.json({
      success: true,
      data: cohorts
    });
  } catch (err) {
    console.error('❌ Cohorts Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/analytics/summary
 * Get executive summary report
 */
router.get('/summary', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const summary = await generateExecutiveSummary(db);
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('❌ Summary Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
