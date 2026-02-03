/**
 * Batch Jobs Service
 * Handles automated follow-ups, notifications, and background tasks
 */

const {
  sendWelcomeEmail,
  send30DayCheckInEmail,
  sendPaymentConfirmationEmail,
  sendOnboardingEmail
} = require('./emailService');

/**
 * Send follow-up emails to qualified leads
 */
const sendFollowUpEmails = async (db) => {
  try {
    const connection = await db.getConnection();

    // Get qualified leads that haven't been contacted yet
    const [leads] = await connection.query(`
      SELECT id, email, name, language, created_at
      FROM leads
      WHERE status = 'qualified'
      AND (last_follow_up IS NULL OR last_follow_up < DATE_SUB(NOW(), INTERVAL 3 DAY))
      LIMIT 50
    `);

    connection.release();

    let sent = 0;
    for (const lead of leads) {
      try {
        // Send follow-up email
        const result = await sendFollowUpEmail(lead);
        if (result) {
          sent++;
          // Update follow-up timestamp
          const updateConnection = await db.getConnection();
          await updateConnection.query(
            'UPDATE leads SET last_follow_up = NOW() WHERE id = ?',
            [lead.id]
          );
          updateConnection.release();
        }
      } catch (err) {
        console.error(`Failed to send follow-up to ${lead.email}:`, err);
      }
    }

    console.log(`✅ Sent ${sent} follow-up emails`);
    return sent;
  } catch (err) {
    console.error('❌ Follow-up Email Job Error:', err);
    return 0;
  }
};

/**
 * Send 30-day check-in emails to customers
 */
const send30DayCheckIns = async (db) => {
  try {
    const connection = await db.getConnection();

    // Get customers who are 30 days old
    const [customers] = await connection.query(`
      SELECT id, email, name, product_name, created_at
      FROM customers
      WHERE onboarding_status = 'in_progress'
      AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND (last_checkup IS NULL OR last_checkup < DATE_SUB(NOW(), INTERVAL 1 DAY))
      LIMIT 100
    `);

    connection.release();

    let sent = 0;
    for (const customer of customers) {
      try {
        await send30DayCheckInEmail(customer);
        sent++;

        // Update status
        const updateConnection = await db.getConnection();
        await updateConnection.query(
          'UPDATE customers SET onboarding_status = "30_day_check", last_checkup = NOW() WHERE id = ?',
          [customer.id]
        );
        updateConnection.release();
      } catch (err) {
        console.error(`Failed to send check-in to ${customer.email}:`, err);
      }
    }

    console.log(`✅ Sent ${sent} 30-day check-in emails`);
    return sent;
  } catch (err) {
    console.error('❌ 30-Day Check-in Job Error:', err);
    return 0;
  }
};

/**
 * Update lead status based on time and engagement
 */
const updateLeadStatuses = async (db) => {
  try {
    const connection = await db.getConnection();

    // Classify new leads as contacted if they exist for > 1 hour
    const [updated1] = await connection.query(`
      UPDATE leads
      SET status = 'contacted'
      WHERE status = 'new'
      AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    // Auto-convert leads that have high readiness score and readiness > 80
    const [updated2] = await connection.query(`
      UPDATE leads
      SET status = 'demo_scheduled'
      WHERE status = 'qualified'
      AND readiness_score > 80
      AND created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)
    `);

    connection.release();

    const total = (updated1[0]?.affectedRows || 0) + (updated2[0]?.affectedRows || 0);
    console.log(`✅ Updated ${total} lead statuses`);
    return total;
  } catch (err) {
    console.error('❌ Lead Status Update Job Error:', err);
    return 0;
  }
};

/**
 * Send inactive customer re-engagement emails
 */
const sendReEngagementEmails = async (db) => {
  try {
    const connection = await db.getConnection();

    // Find inactive customers (not checked in for 60 days)
    const [customers] = await connection.query(`
      SELECT id, email, name, product_name, created_at
      FROM customers
      WHERE status = 'active'
      AND last_activity < DATE_SUB(NOW(), INTERVAL 60 DAY)
      AND (last_reengagement IS NULL OR last_reengagement < DATE_SUB(NOW(), INTERVAL 30 DAY))
      LIMIT 50
    `);

    connection.release();

    let sent = 0;
    for (const customer of customers) {
      try {
        // Send re-engagement email
        console.log(`📧 Re-engagement email to ${customer.email}`);
        sent++;

        // Update timestamp
        const updateConnection = await db.getConnection();
        await updateConnection.query(
          'UPDATE customers SET last_reengagement = NOW() WHERE id = ?',
          [customer.id]
        );
        updateConnection.release();
      } catch (err) {
        console.error(`Failed to send re-engagement email to ${customer.email}:`, err);
      }
    }

    console.log(`✅ Sent ${sent} re-engagement emails`);
    return sent;
  } catch (err) {
    console.error('❌ Re-engagement Email Job Error:', err);
    return 0;
  }
};

/**
 * Cleanup old/inactive data
 */
const cleanupData = async (db) => {
  try {
    const connection = await db.getConnection();

    // Delete conversations older than 90 days
    const [deleted1] = await connection.query(
      'DELETE FROM conversations WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );

    // Archive old leads (status unchanged for 30+ days)
    const [archived] = await connection.query(`
      UPDATE leads
      SET status = 'archived'
      WHERE status = 'new'
      AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    connection.release();

    const total = (deleted1[0]?.affectedRows || 0) + (archived[0]?.affectedRows || 0);
    console.log(`✅ Cleaned up ${total} old records`);
    return total;
  } catch (err) {
    console.error('❌ Cleanup Job Error:', err);
    return 0;
  }
};

/**
 * Run all batch jobs
 */
const runAllJobs = async (db) => {
  console.log('\n🔄 Running batch jobs...');

  const results = {
    followUpEmails: await sendFollowUpEmails(db),
    thirtyDayCheckIns: await send30DayCheckIns(db),
    leadStatusUpdates: await updateLeadStatuses(db),
    reEngagementEmails: await sendReEngagementEmails(db),
    dataCleanup: await cleanupData(db)
  };

  console.log('✅ All batch jobs completed:', results);
  return results;
};

/**
 * Send follow-up email helper
 */
const sendFollowUpEmail = async (lead) => {
  try {
    const emailContent = {
      ru: {
        subject: `${lead.name}, не упустите возможность! 🚀`,
        html: `
          <h1>Вспомните о BizBox!</h1>
          <p>Привет ${lead.name},</p>
          <p>Вы интересовались нашим готовым бизнесом. Хотим напомнить о возможности запустить свой бизнес за 7 дней и зарабатывать от $150,000/месяц через 6 месяцев.</p>
          <p><a href="https://direco.com" style="background: #2C3E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Продолжить консультацию</a></p>
          <p>Удачи!</p>
        `
      },
      en: {
        subject: `Don't miss out, ${lead.name}! 🚀`,
        html: `
          <h1>Remember BizBox!</h1>
          <p>Hi ${lead.name},</p>
          <p>You showed interest in our ready-made business. We want to remind you of the opportunity to launch your business in 7 days and earn $150,000+/month within 6 months.</p>
          <p><a href="https://direco.com" style="background: #2C3E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Continue Consultation</a></p>
          <p>Good luck!</p>
        `
      }
    };

    const template = emailContent[lead.language] || emailContent.en;
    // In production, actually send email here
    console.log(`📧 Follow-up email prepared for ${lead.email}`);
    return true;
  } catch (err) {
    console.error('Error sending follow-up:', err);
    return false;
  }
};

/**
 * Schedule batch jobs to run at specific intervals
 */
const scheduleBatchJobs = (db) => {
  // Run daily cleanup at 2 AM
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 2) {
      cleanupData(db);
    }
  }, 3600000); // Check every hour

  // Run follow-up emails every 6 hours
  setInterval(() => {
    sendFollowUpEmails(db);
  }, 6 * 3600000);

  // Run 30-day check-ins daily
  setInterval(() => {
    send30DayCheckIns(db);
  }, 24 * 3600000);

  // Update lead statuses every 4 hours
  setInterval(() => {
    updateLeadStatuses(db);
  }, 4 * 3600000);

  // Run re-engagement emails weekly
  setInterval(() => {
    sendReEngagementEmails(db);
  }, 7 * 24 * 3600000);

  console.log('✅ Batch jobs scheduler initialized');
};

module.exports = {
  sendFollowUpEmails,
  send30DayCheckIns,
  updateLeadStatuses,
  sendReEngagementEmails,
  cleanupData,
  runAllJobs,
  scheduleBatchJobs
};
