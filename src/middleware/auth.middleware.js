const AppError = require('../utils/app-error');
const { COOKIE_NAME, verifyToken } = require('../utils/tokens');

// Reads the session cookie and attaches req.user. Put this in front of any
// route that needs to know who is logged in.
function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return next(new AppError(401, 'Please log in.'));

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(new AppError(401, 'Your session has expired. Please log in again.'));
  }
}

module.exports = { requireAuth };
