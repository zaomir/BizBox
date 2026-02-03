/**
 * Advanced Lead Scoring & Recommendation Engine
 * Analyzes conversation data to provide personalized recommendations
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Calculate readiness score based on conversation
 */
const calculateReadinessScore = (conversation) => {
  let score = 0;

  // Analyze conversation for key indicators
  const text = conversation
    .map(msg => msg.content)
    .join(' ')
    .toLowerCase();

  // Positive indicators (each +10 points)
  const positiveIndicators = [
    { keyword: 'ready', points: 10 },
    { keyword: 'launch', points: 10 },
    { keyword: 'invest', points: 10 },
    { keyword: 'growth', points: 10 },
    { keyword: 'expand', points: 10 },
    { keyword: 'scale', points: 10 },
    { keyword: 'business', points: 5 },
    { keyword: 'experience', points: 8 },
    { keyword: 'capital', points: 10 },
    { keyword: 'team', points: 8 }
  ];

  positiveIndicators.forEach(({ keyword, points }) => {
    if (text.includes(keyword)) {
      score += points;
    }
  });

  // Negative indicators (each -5 points)
  const negativeIndicators = [
    { keyword: 'maybe', points: 5 },
    { keyword: 'unsure', points: 5 },
    { keyword: 'later', points: 8 },
    { keyword: 'consider', points: 3 },
    { keyword: 'budget', points: 5 }
  ];

  negativeIndicators.forEach(({ keyword, points }) => {
    if (text.includes(keyword)) {
      score -= points;
    }
  });

  // Conversation length indicator (more questions = more interested)
  score += Math.min(conversation.length * 2, 20);

  // Cap score between 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Determine business stage based on conversation
 */
const determinStage = (conversation, budget, experience) => {
  const text = conversation
    .map(msg => msg.content)
    .join(' ')
    .toLowerCase();

  // STARTUP: no business, less experience, low budget
  if (experience === 'none' || (budget && parseInt(budget) < 50000)) {
    return 'STARTUP';
  }

  // TRACTION: has business, some revenue, medium budget
  if (experience === 'some' || (budget && parseInt(budget) >= 50000 && parseInt(budget) < 200000)) {
    return 'TRACTION';
  }

  // SCALING: established business, experienced, high budget, growth focus
  if (text.includes('scale') || text.includes('growth') || text.includes('expand')) {
    return 'SCALING';
  }

  return 'TRACTION'; // Default
};

/**
 * Recommend product based on conversation analysis
 */
const recommendProduct = async (conversation, language = 'ru') => {
  try {
    const conversationText = conversation
      .map((msg, idx) => `${idx % 2 === 0 ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n');

    const prompt = `Based on this conversation, recommend ONE product from these options:
1. Cosmetics Salon - Best for: Beauty-focused entrepreneurs, $50k investment, $250k/month income potential
2. Medical Clinic - Best for: Healthcare professionals, $120k investment, $450k/month income potential
3. Financial Services - Best for: Finance-savvy entrepreneurs, $330k investment, $850k/month income potential

Conversation:
${conversationText}

Respond ONLY with:
PRODUCT: [cosmetics|healthcare|fintech]
REASON: [one sentence explanation]
CONFIDENCE: [0-100]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;

    // Parse response
    const productMatch = text.match(/PRODUCT:\s*(\w+)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/);

    const productMap = {
      cosmetics: 'cosmetics',
      healthcare: 'healthcare',
      fintech: 'fintech'
    };

    const product = productMap[productMatch ? productMatch[1].toLowerCase() : 'fintech'];
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;

    return {
      product,
      confidence,
      rawResponse: text
    };
  } catch (err) {
    console.error('❌ Product Recommendation Error:', err);
    return {
      product: 'fintech', // Default
      confidence: 50,
      error: err.message
    };
  }
};

/**
 * Determine urgency level
 */
const determineUrgency = (conversation, readinessScore) => {
  const text = conversation
    .map(msg => msg.content)
    .join(' ')
    .toLowerCase();

  // HIGH urgency indicators
  if (
    readinessScore > 75 &&
    (text.includes('asap') || text.includes('immediately') || text.includes('this week'))
  ) {
    return 'high';
  }

  // LOW urgency indicators
  if (text.includes('later') || text.includes('maybe') || text.includes('in a year')) {
    return 'low';
  }

  // Default to MEDIUM
  return 'medium';
};

/**
 * Calculate budget range from conversation
 */
const extractBudgetRange = (conversation) => {
  const text = conversation
    .map(msg => msg.content)
    .join(' ');

  // Look for budget mentions
  const budgetPatterns = [
    /\$([0-9,]+)/g, // $50,000
    /([0-9,]+)\s*k/gi, // 50k
    /([0-9,]+)\s*(thousand|usd|dollars)/gi
  ];

  let maxBudget = 0;
  let minBudget = Infinity;

  budgetPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 0) {
        maxBudget = Math.max(maxBudget, amount);
        minBudget = Math.min(minBudget, amount);
      }
    }
  });

  if (maxBudget === 0) {
    return null;
  }

  if (minBudget === Infinity) {
    minBudget = maxBudget;
  }

  return `$${minBudget.toLocaleString()} - $${maxBudget.toLocaleString()}`;
};

/**
 * Extract key pain points from conversation
 */
const extractPainPoints = (conversation) => {
  const text = conversation
    .map(msg => msg.content)
    .join(' ')
    .toLowerCase();

  const painPoints = [];

  const painKeywords = {
    'time management': ['busy', 'time', 'schedule', 'overwhelm'],
    'limited revenue': ['income', 'revenue', 'money', 'cash flow', 'profit'],
    'lack of expertise': ['don\'t know', 'inexperienced', 'learning', 'help'],
    'scaling challenges': ['grow', 'expand', 'scale', 'growth'],
    'operational issues': ['process', 'operations', 'system', 'structure'],
    'customer acquisition': ['customers', 'clients', 'sales', 'marketing']
  };

  for (const [pain, keywords] of Object.entries(painKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      painPoints.push(pain);
    }
  }

  return painPoints.slice(0, 3); // Return top 3
};

/**
 * Extract business metrics from conversation
 */
const extractBusinessMetrics = (conversation) => {
  const text = conversation
    .map(msg => msg.content)
    .join(' ');

  const metrics = {
    hasExistingBusiness: /business|company|shop|store|operation/i.test(text),
    hasTeam: /team|staff|employee|work|people/i.test(text),
    hasCapital: /budget|capital|investment|money|fund/i.test(text),
    hasExperience: /experience|worked|years|background/i.test(text),
    seekingGrowth: /grow|scale|expand|revenue|income/i.test(text)
  };

  return metrics;
};

/**
 * Generate comprehensive lead profile
 */
const generateLeadProfile = async (conversation, email, name, language = 'ru') => {
  const readinessScore = calculateReadinessScore(conversation);
  const stage = determinStage(conversation, extractBudgetRange(conversation));
  const urgency = determineUrgency(conversation, readinessScore);
  const budgetRange = extractBudgetRange(conversation);
  const painPoints = extractPainPoints(conversation);
  const metrics = extractBusinessMetrics(conversation);
  const { product, confidence } = await recommendProduct(conversation, language);

  return {
    email,
    name,
    language,
    readinessScore,
    stage,
    urgency,
    budgetRange,
    recommendedProduct: product,
    productConfidence: confidence,
    painPoints,
    businessMetrics: metrics,
    conversationLength: conversation.length,
    qualityScore: Math.floor((readinessScore * 0.4) + (confidence * 0.4) + (100 - painPoints.length * 15) * 0.2)
  };
};

module.exports = {
  calculateReadinessScore,
  determinStage,
  recommendProduct,
  determineUrgency,
  extractBudgetRange,
  extractPainPoints,
  extractBusinessMetrics,
  generateLeadProfile
};
