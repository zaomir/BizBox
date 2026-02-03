/**
 * Simple in-memory rate limiter
 * For production, use Redis instead
 */

const requests = new Map();

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Max requests per time window
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }

    const requestTimes = requests.get(identifier);

    // Remove old requests outside the time window
    const recentRequests = requestTimes.filter(time => now - time < windowMs);
    requests.set(identifier, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(recentRequests[0] + windowMs).toISOString());

    next();
  };
};

/**
 * Specific rate limits for different endpoints
 */
const rateLimits = {
  // Chat: 10 messages per minute
  chat: rateLimit(10, 60000),

  // Login: 5 attempts per 15 minutes
  login: rateLimit(5, 900000),

  // API: 100 requests per minute
  api: rateLimit(100, 60000),

  // Checkout: 5 sessions per 10 minutes
  checkout: rateLimit(5, 600000),

  // Lead creation: 3 per 5 minutes
  leads: rateLimit(3, 300000)
};

module.exports = {
  rateLimit,
  rateLimits
};
