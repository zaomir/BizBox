/**
 * Batch Jobs Management Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  sendFollowUpEmails,
  send30DayCheckIns,
  updateLeadStatuses,
  sendReEngagementEmails,
  cleanupData,
  runAllJobs
} = require('../services/batchJobsService');

/**
 * POST /api/v1/jobs/run-all
 * Run all batch jobs immediately
 */
router.post('/run-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const results = await runAllJobs(db);

    res.json({
      success: true,
      message: 'All batch jobs executed',
      results
    });
  } catch (err) {
    console.error('❌ Run All Jobs Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/follow-ups
 * Send follow-up emails to qualified leads
 */
router.post('/follow-ups', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const sent = await sendFollowUpEmails(db);

    res.json({
      success: true,
      message: `Sent ${sent} follow-up emails`
    });
  } catch (err) {
    console.error('❌ Follow-up Job Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/30-day-checkins
 * Send 30-day check-in emails
 */
router.post('/30-day-checkins', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const sent = await send30DayCheckIns(db);

    res.json({
      success: true,
      message: `Sent ${sent} 30-day check-in emails`
    });
  } catch (err) {
    console.error('❌ 30-Day Check-in Job Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/update-statuses
 * Update lead statuses based on time and engagement
 */
router.post('/update-statuses', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const updated = await updateLeadStatuses(db);

    res.json({
      success: true,
      message: `Updated ${updated} lead statuses`
    });
  } catch (err) {
    console.error('❌ Update Statuses Job Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/re-engagement
 * Send re-engagement emails to inactive customers
 */
router.post('/re-engagement', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const sent = await sendReEngagementEmails(db);

    res.json({
      success: true,
      message: `Sent ${sent} re-engagement emails`
    });
  } catch (err) {
    console.error('❌ Re-engagement Job Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/cleanup
 * Cleanup old/inactive data
 */
router.post('/cleanup', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../index');
    const cleaned = await cleanupData(db);

    res.json({
      success: true,
      message: `Cleaned up ${cleaned} old records`
    });
  } catch (err) {
    console.error('❌ Cleanup Job Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
