/**
 * Validation utilities
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Basic phone validation (E.164 format or variations)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const isValidLanguage = (lang) => {
  return ['ru', 'uk', 'en', 'es'].includes(lang);
};

const isValidNiche = (niche) => {
  return ['cosmetics', 'healthcare', 'fintech', 'other'].includes(niche);
};

/**
 * Middleware to validate email in request body
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  next();
};

/**
 * Middleware to validate password
 */
const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
    });
  }

  next();
};

/**
 * Middleware to sanitize input
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  req.pagination = { page, limit, offset: (page - 1) * limit };

  next();
};

/**
 * Validate lead data
 */
const validateLeadData = (req, res, next) => {
  const { email, name, language } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required'
    });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Name is required'
    });
  }

  if (language && !isValidLanguage(language)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language'
    });
  }

  next();
};

/**
 * Validate chat message
 */
const validateChatMessage = (req, res, next) => {
  const { message, language } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message cannot be empty'
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Message is too long (max 5000 characters)'
    });
  }

  if (language && !isValidLanguage(language)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language'
    });
  }

  next();
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidLanguage,
  isValidNiche,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validatePagination,
  validateLeadData,
  validateChatMessage
};
