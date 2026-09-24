const AppError = require('../utils/app-error');

/**
 * Checks that the authenticated user has the 'admin' role.
 * Must be used AFTER requireAuth middleware.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'Access denied. Admins only.'));
  }
  next();
}

module.exports = { requireAdmin };
