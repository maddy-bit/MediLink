const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'medilink_super_secret_session_key_9876';

/**
 * Middleware to authenticate a user via JWT cookie.
 * Populates req.user if token is valid.
 */
const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = User.findById(decoded.userId);
    
    if (!user) {
      res.clearCookie('token');
      req.user = null;
    } else {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    res.clearCookie('token');
    req.user = null;
  }
  next();
};

/**
 * Middleware to require a user to be logged in.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
};

/**
 * Middleware to restrict route access to specific roles.
 * Must be used after authenticate.
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Access restricted to ${role}s` });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireAuth,
  requireRole,
  JWT_SECRET
};
