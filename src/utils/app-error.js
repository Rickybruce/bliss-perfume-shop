// A known, expected error (bad input, wrong password, not found) as opposed
// to a bug. The error handler sends `message` straight to the client only
// for these — every other error gets a generic message instead.
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;