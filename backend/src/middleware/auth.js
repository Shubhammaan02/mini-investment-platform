// backend/src/middleware/auth.js
const JWTUtils = require('../utils/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = JWTUtils.verifyToken(token);
    
    // Find user and ensure they're active
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token or user account is inactive.',
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Token has expired. Please login again.',
      });
    }

    res.status(401).json({
      error: 'Invalid token.',
    });
  }
};

// Optional: Admin-only middleware (we'll use this later for product management)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
};