const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { aiChat, analyzeConversation } = require('../services/aiAdvisor');

// Session storage (in production, use Redis or DB)
const sessions = new Map();

/**
 * POST /api/v1/chat/message
 * Send message and get AI response
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, language = 'ru' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

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

      await connection.query(query, [
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

      res.json({
        success: true,
        leadCreated: true,
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

module.exports = router;
