const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { aiChat, analyzeConversation } = require('../services/aiAdvisor');
const { validateChatMessage } = require('../middleware/validation');
const {
  sendWelcomeEmail,
  sendLeadQualificationEmail
} = require('../services/emailService');
const {
  saveConversation,
  getConversation,
  getLeadConversations
} = require('../services/conversationService');
const {
  generateLeadProfile
} = require('../services/leadScoringEngine');

// Session storage (in production, use Redis or DB)
const sessions = new Map();

/**
 * POST /api/v1/chat/message
 * Send message and get AI response
 */
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    const { message, sessionId, language = 'ru' } = req.body;

    // Create or retrieve session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId || uuidv4(),
        history: [],
        language,
        createdAt: new Date()
      };
      sessions.set(session.id, session);
    }

    // Update language if provided
    if (language) {
      session.language = language;
    }

    // Get AI response
    const result = await aiChat(message, session.language, session.history);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update session history
    session.history = result.history;
    session.updatedAt = new Date();

    res.json({
      success: true,
      sessionId: session.id,
      response: result.response,
      model: result.model
    });
  } catch (err) {
    console.error('❌ Chat Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/chat/qualify
 * Analyze conversation and create lead
 */
router.post('/qualify', async (req, res) => {
  try {
    const { sessionId, email, name, phone, country } = req.body;
    const { db } = require('../index');

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Analyze conversation
    const analysis = await analyzeConversation(session.history, session.language);

    // Get database connection
    const connection = await db.getConnection();

    try {
      // Insert lead
      const query = `
        INSERT INTO leads (
          email, name, phone, country, language,
          readiness_score, stage_category, recommended_product_id,
          budget_range, urgency, status, conversation_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          phone = VALUES(phone),
          readiness_score = VALUES(readiness_score),
          updated_at = NOW()
      `;

      const productMap = { cosmetics: 1, healthcare: 2, fintech: 3 };
      const recommendedProductId = productMap[analysis.recommended_product] || null;

      const result = await connection.query(query, [
        email,
        name,
        phone,
        country,
        session.language,
        analysis.readiness_score || 0,
        analysis.stage || null,
        recommendedProductId,
        analysis.budget_range || null,
        analysis.urgency || 'medium',
        JSON.stringify(session.history)
      ]);

      connection.release();

      // Send welcome email to lead
      await sendWelcomeEmail(email, name, session.language);

      // Send notification to admin
      const leadData = {
        id: result[0].insertId,
        email,
        name,
        phone,
        country,
        language: session.language
      };
      await sendLeadQualificationEmail(leadData, analysis);

      res.json({
        success: true,
        leadCreated: true,
        leadId: result[0].insertId,
        analysis
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('❌ Qualify Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/chat/session/:sessionId
 * Get session details
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      language: session.language,
      messageCount: session.history.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/v1/chat/session/:sessionId
 * Clear session
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    sessions.delete(req.params.sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/chat/analyze
 * Advanced conversation analysis with lead scoring
 */
router.post('/analyze', async (req, res) => {
  try {
    const { sessionId, email, name } = req.body;
    const { db } = require('../index');

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate comprehensive lead profile
    const leadProfile = await generateLeadProfile(
      session.history,
      email,
      name,
      session.language
    );

    // Save conversation to database
    await saveConversation(db, sessionId, email, session.history, {
      qualityScore: leadProfile.qualityScore,
      durationSeconds: Math.floor((Date.now() - session.createdAt) / 1000),
      recommendedProduct: leadProfile.recommendedProduct,
      readinessScore: leadProfile.readinessScore
    });

    res.json({
      success: true,
      leadProfile,
      recommendations: {
        product: leadProfile.recommendedProduct,
        confidence: leadProfile.productConfidence,
        painPoints: leadProfile.painPoints,
        nextSteps: generateNextSteps(leadProfile)
      }
    });
  } catch (err) {
    console.error('❌ Analyze Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/chat/history/:email
 * Get all conversations for a lead
 */
router.get('/history/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { db } = require('../index');

    const conversations = await getLeadConversations(db, email);

    res.json({
      success: true,
      count: conversations.length,
      conversations: conversations.map(c => ({
        sessionId: c.session_id,
        messageCount: c.message_count,
        qualityScore: c.quality_score,
        duration: c.duration_seconds,
        createdAt: c.created_at
      }))
    });
  } catch (err) {
    console.error('❌ History Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Helper function to generate next steps based on lead profile
 */
function generateNextSteps(leadProfile) {
  const steps = [];

  if (leadProfile.readinessScore > 75) {
    steps.push('Schedule demo call');
    steps.push('Send product details');
  }

  if (leadProfile.readinessScore > 50 && leadProfile.readinessScore <= 75) {
    steps.push('Send case studies');
    steps.push('Provide pricing info');
    steps.push('Follow up in 3 days');
  }

  if (leadProfile.readinessScore <= 50) {
    steps.push('Educational materials');
    steps.push('Schedule follow-up');
    steps.push('Nurture campaign');
  }

  if (leadProfile.painPoints.length > 0) {
    steps.push(`Address: ${leadProfile.painPoints[0]}`);
  }

  return steps;
}

module.exports = router;
