// Every query here is parameterized (the ? placeholders), so user input can
// never be interpreted as SQL. Controllers never write raw SQL themselves —
// they call these functions instead.
const db = require('../config/db');

async function findByEmailOrUsername(identifier) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function create({ username, email, phone, passwordHash }) {
  const [result] = await db.query(
    'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [username, email, phone, passwordHash]
  );
  return result.insertId;
}

async function markPhoneVerified(id) {
  await db.query('UPDATE users SET phone_verified_at = NOW() WHERE id = ?', [id]);
}

module.exports = { findByEmailOrUsername, findById, create, markPhoneVerified };
