const rateLimit = require('express-rate-limit');

// Slows down brute-force guessing on login and OTP codes without blocking
// a real person who mistypes once or twice.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

module.exports = { loginLimiter, otpLimiter };
