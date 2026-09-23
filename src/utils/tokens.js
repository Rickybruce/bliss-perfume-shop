const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'session';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// httpOnly so client-side JS (and an XSS bug) can never read the token.
// "Keep me logged in" decides whether it survives closing the browser.
function setSessionCookie(res, token, remember) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : undefined,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setSessionCookie, clearSessionCookie };