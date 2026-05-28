const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'medilink_super_secret_session_key_9876';

/**
 * Authenticate user via JWT cookie.
 */
const authenticate =
  async (req, res, next) => {
    const token =
      req.cookies.token;

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );

      // PostgreSQL async
      const user =
        await User.findById(
          decoded.userId
        );

      if (!user) {
        res.clearCookie(
          'token'
        );

        req.user =
          null;

        return next();
      }

      req.user = {
        id: user.id,
        name: user.name,
        email:
          user.email,
        role:
          user.role
      };

      next();
    } catch (error) {
      console.error(
        'Auth middleware error:',
        error.message
      );

      res.clearCookie(
        'token'
      );

      req.user = null;

      next();
    }
  };

/**
 * Require authentication.
 */
const requireAuth = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({
        error:
          'Authentication required. Please log in.'
      });
  }

  next();
};

/**
 * Restrict access by role.
 */
const requireRole =
  (role) => {
    return (
      req,
      res,
      next
    ) => {
      if (
        !req.user
      ) {
        return res
          .status(401)
          .json({
            error:
              'Authentication required'
          });
      }

      if (
        req.user
          .role !==
        role
      ) {
        return res
          .status(403)
          .json({
            error: `Forbidden: Access restricted to ${role}s`
          });
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