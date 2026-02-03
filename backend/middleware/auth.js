const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bizbox-secret-key-2024-change-in-production';

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          details: err.message
        });
      }

      req.user = decoded;
      next();
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Middleware to verify admin role
 */
const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No user authenticated'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Refresh token
 */
const refreshToken = (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token expired or invalid'
        });
      }

      const newToken = generateToken(decoded);
      res.json({
        success: true,
        token: newToken
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  generateToken,
  refreshToken,
  JWT_SECRET
};
