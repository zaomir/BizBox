/**
 * Analytics & Reporting Service
 * Provides insights into platform performance, lead quality, and customer success
 */

/**
 * Get platform overview metrics
 */
const getPlatformMetrics = async (db) => {
  try {
    const connection = await db.getConnection();

    const [metrics] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE status = 'converted') as converted_leads,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT SUM(price_paid) FROM customers) as total_revenue,
        (SELECT AVG(price_paid) FROM customers) as avg_order_value,
        (SELECT COUNT(*) FROM conversations) as total_conversations,
        (SELECT AVG(message_count) FROM conversations) as avg_messages_per_conversation,
        (SELECT AVG(quality_score) FROM conversations) as avg_conversation_quality
    `);

    connection.release();

    return {
      leads: {
        total: metrics[0].total_leads,
        converted: metrics[0].converted_leads,
        conversionRate: metrics[0].total_leads > 0
          ? ((metrics[0].converted_leads / metrics[0].total_leads) * 100).toFixed(2)
          : 0
      },
      customers: {
        total: metrics[0].total_customers,
        totalRevenue: metrics[0].total_revenue || 0,
        avgOrderValue: metrics[0].avg_order_value || 0,
        totalRevenueFormatted: `$${(metrics[0].total_revenue / 100 || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
      },
      conversations: {
        total: metrics[0].total_conversations,
        avgMessagesPerConversation: Math.round(metrics[0].avg_messages_per_conversation || 0),
        avgQuality: Math.round(metrics[0].avg_conversation_quality || 0)
      }
    };
  } catch (err) {
    console.error('❌ Platform Metrics Error:', err);
    return null;
  }
};

/**
 * Get lead funnel analysis
 */
const getLeadFunnel = async (db) => {
  try {
    const connection = await db.getConnection();

    const [funnel] = await connection.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM leads
      GROUP BY status
      ORDER BY FIELD(status, 'new', 'contacted', 'qualified', 'demo_scheduled', 'converted')
    `);

    connection.release();

    const stages = {
      new: 0,
      contacted: 0,
      qualified: 0,
      demo_scheduled: 0,
      converted: 0
    };

    let total = 0;
    funnel.forEach(row => {
      stages[row.status] = row.count;
      total += row.count;
    });

    return {
      stages: Object.entries(stages).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      })),
      total,
      conversionRate: total > 0 ? ((stages.converted / total) * 100).toFixed(2) : 0
    };
  } catch (err) {
    console.error('❌ Lead Funnel Error:', err);
    return null;
  }
};

/**
 * Get product performance
 */
const getProductPerformance = async (db) => {
  try {
    const connection = await db.getConnection();

    const [products] = await connection.query(`
      SELECT
        p.id,
        p.name_en as name,
        p.niche,
        p.price_usd,
        COUNT(c.id) as sales_count,
        SUM(c.price_paid) as total_revenue,
        AVG(DATEDIFF(NOW(), c.payment_date)) as days_since_last_sale
      FROM products p
      LEFT JOIN customers c ON p.id = c.product_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY sales_count DESC
    `);

    connection.release();

    return products.map(p => ({
      id: p.id,
      name: p.name,
      niche: p.niche,
      price: `$${p.price_usd}`,
      salesCount: p.sales_count || 0,
      totalRevenue: `$${(p.total_revenue / 100 || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      daysSinceLastSale: p.days_since_last_sale ? Math.round(p.days_since_last_sale) : null
    }));
  } catch (err) {
    console.error('❌ Product Performance Error:', err);
    return [];
  }
};

/**
 * Get customer lifecycle metrics
 */
const getCustomerLifecycle = async (db) => {
  try {
    const connection = await db.getConnection();

    const [metrics] = await connection.query(`
      SELECT
        onboarding_status,
        COUNT(*) as count,
        AVG(DATEDIFF(NOW(), created_at)) as days_active
      FROM customers
      GROUP BY onboarding_status
    `);

    connection.release();

    return metrics.map(m => ({
      status: m.onboarding_status,
      count: m.count,
      daysActive: Math.round(m.days_active || 0)
    }));
  } catch (err) {
    console.error('❌ Customer Lifecycle Error:', err);
    return [];
  }
};

/**
 * Get daily lead volume
 */
const getDailyLeadVolume = async (db, days = 30) => {
  try {
    const connection = await db.getConnection();

    const [data] = await connection.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as lead_count,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as conversions
      FROM leads
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    connection.release();

    return data.map(d => ({
      date: d.date,
      leads: d.lead_count,
      conversions: d.conversions || 0
    }));
  } catch (err) {
    console.error('❌ Daily Lead Volume Error:', err);
    return [];
  }
};

/**
 * Get revenue metrics
 */
const getRevenueMetrics = async (db) => {
  try {
    const connection = await db.getConnection();

    const [data] = await connection.query(`
      SELECT
        DATE(payment_date) as date,
        COUNT(*) as transactions,
        SUM(price_paid) as daily_revenue,
        AVG(price_paid) as avg_order_value
      FROM customers
      WHERE payment_date IS NOT NULL
      GROUP BY DATE(payment_date)
      ORDER BY date DESC
      LIMIT 30
    `);

    connection.release();

    return data.map(d => ({
      date: d.date,
      transactions: d.transactions,
      revenue: `$${(d.daily_revenue / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      avgOrderValue: `$${(d.avg_order_value / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    }));
  } catch (err) {
    console.error('❌ Revenue Metrics Error:', err);
    return [];
  }
};

/**
 * Get language distribution
 */
const getLanguageDistribution = async (db) => {
  try {
    const connection = await db.getConnection();

    const [data] = await connection.query(`
      SELECT
        language,
        COUNT(*) as count
      FROM leads
      GROUP BY language
      ORDER BY count DESC
    `);

    connection.release();

    const total = data.reduce((sum, row) => sum + row.count, 0);

    return data.map(d => ({
      language: {
        ru: '🇷🇺 Russian',
        uk: '🇺🇦 Ukrainian',
        en: '🇺🇸 English',
        es: '🇪🇸 Spanish'
      }[d.language] || d.language,
      count: d.count,
      percentage: ((d.count / total) * 100).toFixed(1)
    }));
  } catch (err) {
    console.error('❌ Language Distribution Error:', err);
    return [];
  }
};

/**
 * Get cohort analysis (customers by signup date)
 */
const getCohortAnalysis = async (db) => {
  try {
    const connection = await db.getConnection();

    const [data] = await connection.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as cohort,
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'churned' THEN 1 ELSE 0 END) as churned,
        AVG(price_paid) as avg_ltv
      FROM customers
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY cohort DESC
    `);

    connection.release();

    return data.map(d => ({
      cohort: d.cohort,
      totalCustomers: d.total_customers,
      active: d.active,
      churned: d.churned,
      retentionRate: ((d.active / d.total_customers) * 100).toFixed(1),
      avgLTV: `$${(d.avg_ltv / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    }));
  } catch (err) {
    console.error('❌ Cohort Analysis Error:', err);
    return [];
  }
};

/**
 * Generate executive summary report
 */
const generateExecutiveSummary = async (db) => {
  try {
    const platformMetrics = await getPlatformMetrics(db);
    const leadFunnel = await getLeadFunnel(db);
    const productPerformance = await getProductPerformance(db);
    const customerLifecycle = await getCustomerLifecycle(db);
    const languageDistribution = await getLanguageDistribution(db);

    return {
      generatedAt: new Date().toISOString(),
      platformMetrics,
      leadFunnel,
      topProducts: productPerformance.slice(0, 3),
      customerLifecycle,
      languageDistribution,
      keyMetrics: {
        leadConversionRate: leadFunnel.conversionRate,
        totalRevenue: platformMetrics.customers.totalRevenueFormatted,
        totalCustomers: platformMetrics.customers.total,
        conversationQuality: `${platformMetrics.conversations.avgQuality}%`,
        topLanguage: languageDistribution[0]?.language || 'N/A'
      }
    };
  } catch (err) {
    console.error('❌ Executive Summary Error:', err);
    return null;
  }
};

module.exports = {
  getPlatformMetrics,
  getLeadFunnel,
  getProductPerformance,
  getCustomerLifecycle,
  getDailyLeadVolume,
  getRevenueMetrics,
  getLanguageDistribution,
  getCohortAnalysis,
  generateExecutiveSummary
};
