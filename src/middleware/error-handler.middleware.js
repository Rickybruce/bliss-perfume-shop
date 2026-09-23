const AppError = require('../utils/app-error');

// Must be registered LAST, after every route, so it can catch whatever
// they pass to next(err) or throw inside an async handler.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // A unique-key clash: username, email or phone already registered.
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'That username, email or phone is already registered.' });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

module.exports = errorHandler;