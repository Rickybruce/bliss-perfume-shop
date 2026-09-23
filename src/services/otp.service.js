const crypto = require('crypto');
const db = require('../config/db');

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Creates a fresh OTP row and returns the plain 6-digit code to send by SMS.
// Only the hash is ever stored. An older, unconsumed code for the same
// purpose is simply left to expire rather than deleted.
async function createOtp(userId, purpose) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await db.query(
    'INSERT INTO otp_codes (user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?)',
    [userId, purpose, hashCode(code), expiresAt]
  );
  return code;
}

// No SMS provider is wired up yet. Until SMS_API_KEY is set, this just
// prints the code to the server console — that's how you get the code to
// test with locally.
async function sendOtpSms(phone, code) {
  if (!process.env.SMS_API_KEY) {
    console.log(`[OTP] would text ${phone}: your code is ${code}`);
    return;
  }
  // TODO: call the real SMS provider here (e.g. Arkesel, mNotify, Hubtel).
  console.log(`[OTP] would text ${phone}: your code is ${code}`);
}

// Checks a submitted code against the most recent unconsumed one for this
// user and purpose. Never throws on a wrong code — it returns a reason
// instead, so the controller can show a specific message.
async function verifyOtp(userId, purpose, submittedCode) {
  const [rows] = await db.query(
    `SELECT id, code_hash, attempts, expires_at, consumed_at
     FROM otp_codes
     WHERE user_id = ? AND purpose = ?
     ORDER BY id DESC LIMIT 1`,
    [userId, purpose]
  );
  const row = rows[0];

  if (!row || row.consumed_at) return { ok: false, reason: 'no_pending_code' };
  if (new Date(row.expires_at) < new Date()) return { ok: false, reason: 'expired' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };

  await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);

  if (row.code_hash !== hashCode(submittedCode)) {
    return { ok: false, reason: 'wrong_code' };
  }

  await db.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?', [row.id]);
  return { ok: true };
}

module.exports = { createOtp, sendOtpSms, verifyOtp };
