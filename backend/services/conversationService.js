/**
 * Conversation Management Service
 * Handles persistence and retrieval of chat conversations
 */

/**
 * Save conversation to database
 */
const saveConversation = async (db, sessionId, email, conversation, metadata = {}) => {
  try {
    const connection = await db.getConnection();

    // Create conversations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100) UNIQUE,
        email VARCHAR(255),
        conversation_json LONGTEXT,
        message_count INT,
        duration_seconds INT,
        quality_score INT,
        metadata_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_session (session_id)
      )
    `);

    const durationSeconds = metadata.durationSeconds || 0;
    const qualityScore = metadata.qualityScore || 0;

    const query = `
      INSERT INTO conversations (
        session_id, email, conversation_json,
        message_count, duration_seconds, quality_score,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        conversation_json = VALUES(conversation_json),
        message_count = VALUES(message_count),
        duration_seconds = VALUES(duration_seconds),
        quality_score = VALUES(quality_score),
        metadata_json = VALUES(metadata_json),
        updated_at = NOW()
    `;

    await connection.query(query, [
      sessionId,
      email,
      JSON.stringify(conversation),
      conversation.length,
      durationSeconds,
      qualityScore,
      JSON.stringify(metadata)
    ]);

    connection.release();
    return true;
  } catch (err) {
    console.error('❌ Save Conversation Error:', err);
    return false;
  }
};

/**
 * Get conversation by session ID
 */
const getConversation = async (db, sessionId) => {
  try {
    const connection = await db.getConnection();

    const [rows] = await connection.query(
      'SELECT * FROM conversations WHERE session_id = ?',
      [sessionId]
    );

    connection.release();

    if (rows.length === 0) {
      return null;
    }

    return {
      ...rows[0],
      conversation: JSON.parse(rows[0].conversation_json),
      metadata: JSON.parse(rows[0].metadata_json)
    };
  } catch (err) {
    console.error('❌ Get Conversation Error:', err);
    return null;
  }
};

/**
 * Get all conversations for a lead
 */
const getLeadConversations = async (db, email) => {
  try {
    const connection = await db.getConnection();

    const [rows] = await connection.query(
      'SELECT * FROM conversations WHERE email = ? ORDER BY created_at DESC',
      [email]
    );

    connection.release();

    return rows.map(row => ({
      ...row,
      conversation: JSON.parse(row.conversation_json),
      metadata: JSON.parse(row.metadata_json || '{}')
    }));
  } catch (err) {
    console.error('❌ Get Lead Conversations Error:', err);
    return [];
  }
};

/**
 * Delete old conversations (older than 30 days)
 */
const cleanupOldConversations = async (db, daysOld = 30) => {
  try {
    const connection = await db.getConnection();

    const result = await connection.query(
      'DELETE FROM conversations WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );

    connection.release();

    console.log(`🧹 Deleted ${result[0].affectedRows} old conversations`);
    return result[0].affectedRows;
  } catch (err) {
    console.error('❌ Cleanup Conversations Error:', err);
    return 0;
  }
};

/**
 * Get conversation statistics
 */
const getConversationStats = async (db) => {
  try {
    const connection = await db.getConnection();

    const [stats] = await connection.query(`
      SELECT
        COUNT(*) as total_conversations,
        AVG(message_count) as avg_messages,
        AVG(quality_score) as avg_quality,
        MAX(quality_score) as best_quality,
        COUNT(DISTINCT email) as unique_leads,
        AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) as avg_duration_seconds
      FROM conversations
    `);

    connection.release();

    return stats[0];
  } catch (err) {
    console.error('❌ Get Conversation Stats Error:', err);
    return null;
  }
};

/**
 * Get top performing conversations (by quality score)
 */
const getTopConversations = async (db, limit = 10) => {
  try {
    const connection = await db.getConnection();

    const [rows] = await connection.query(
      'SELECT session_id, email, message_count, quality_score, created_at FROM conversations ORDER BY quality_score DESC LIMIT ?',
      [limit]
    );

    connection.release();

    return rows;
  } catch (err) {
    console.error('❌ Get Top Conversations Error:', err);
    return [];
  }
};

/**
 * Export conversation for analysis
 */
const exportConversation = async (db, sessionId) => {
  try {
    const conversation = await getConversation(db, sessionId);

    if (!conversation) {
      return null;
    }

    return {
      sessionId: conversation.session_id,
      email: conversation.email,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messageCount: conversation.message_count,
      durationSeconds: conversation.duration_seconds,
      qualityScore: conversation.quality_score,
      messages: conversation.conversation,
      metadata: conversation.metadata
    };
  } catch (err) {
    console.error('❌ Export Conversation Error:', err);
    return null;
  }
};

module.exports = {
  saveConversation,
  getConversation,
  getLeadConversations,
  cleanupOldConversations,
  getConversationStats,
  getTopConversations,
  exportConversation
};
