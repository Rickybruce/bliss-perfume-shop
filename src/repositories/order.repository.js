// Order creation runs as one database transaction: the order row, its
// items, and the stock decrement either all happen or none do. Every
// function that takes a `conn` argument is meant to run inside that
// transaction — see order.service.js for how they're chained together.
const db = require('../config/db');

async function getConnection() {
  return db.getConnection();
}

// Locks the variant row (FOR UPDATE) so two simultaneous orders can't both
// read "stock: 1" and both succeed. Whoever's transaction commits first wins.
async function findVariantForUpdate(conn, variantId) {
  const [rows] = await conn.query(
    `SELECT pv.id, pv.product_id, pv.size_ml, pv.price_pesewas, pv.stock, p.name AS product_name
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? FOR UPDATE`,
    [variantId]
  );
  return rows[0] || null;
}

// Only decrements if enough stock remains — the WHERE clause is the real
// guard, not the earlier SELECT, since another transaction could shrink
// stock in between. affectedRows === 0 means someone beat us to it.
async function decrementStock(conn, variantId, quantity) {
  const [result] = await conn.query(
    'UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, variantId, quantity]
  );
  return result.affectedRows > 0;
}

async function restoreStock(conn, variantId, quantity) {
  await conn.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [quantity, variantId]);
}

async function createAddress(conn, userId, { line1, city, landmark }) {
  const [result] = await conn.query(
    'INSERT INTO addresses (user_id, line1, city, landmark) VALUES (?, ?, ?, ?)',
    [userId, line1, city, landmark || null]
  );
  return result.insertId;
}

async function createOrder(conn, { userId, fulfillmentType, deliveryAddressId, junctionName, deliveryFeePesewas, totalPesewas }) {
  const [result] = await conn.query(
    `INSERT INTO orders (user_id, fulfillment_type, delivery_address_id, junction_name, delivery_fee_pesewas, total_pesewas)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, fulfillmentType, deliveryAddressId || null, junctionName || null, deliveryFeePesewas, totalPesewas]
  );
  return result.insertId;
}

async function addOrderItem(conn, orderId, { productVariantId, productName, sizeMl, unitPricePesewas, quantity }) {
  await conn.query(
    `INSERT INTO order_items (order_id, product_variant_id, product_name, size_ml, unit_price_pesewas, quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, productVariantId, productName, sizeMl, unitPricePesewas, quantity]
  );
}

async function createPickupCode(conn, orderId, codeHash) {
  await conn.query('INSERT INTO pickup_codes (order_id, code_hash) VALUES (?, ?)', [orderId, codeHash]);
}

async function findPickupCode(conn, orderId) {
  const [rows] = await conn.query(
    'SELECT id, code_hash, used_at FROM pickup_codes WHERE order_id = ? ORDER BY id DESC LIMIT 1',
    [orderId]
  );
  return rows[0] || null;
}

async function markPickupCodeUsed(conn, id) {
  await conn.query('UPDATE pickup_codes SET used_at = NOW() WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Plain reads — no transaction needed
// ---------------------------------------------------------------------------

async function findItemsByOrderId(orderId) {
  const [rows] = await db.query(
    'SELECT product_name, size_ml, unit_price_pesewas, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  return rows;
}

async function findByIdForUser(orderId, userId) {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1', [orderId, userId]);
  return rows[0] || null;
}

async function findByIdForAdmin(orderId) {
  const [rows] = await db.query(
    `SELECT o.*, u.username, u.phone AS customer_phone,
            a.line1 AS address_line1, a.city AS address_city, a.landmark AS address_landmark
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     WHERE o.id = ? LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

async function listForUser(userId) {
  const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
}

async function listForAdmin(status) {
  const params = [];
  let sql = `SELECT o.*, u.username, u.phone AS customer_phone
             FROM orders o JOIN users u ON u.id = o.user_id`;
  if (status) {
    sql += ' WHERE o.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY o.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function updateStatus(orderId, status) {
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

module.exports = {
  getConnection,
  findVariantForUpdate,
  decrementStock,
  restoreStock,
  createAddress,
  createOrder,
  addOrderItem,
  createPickupCode,
  findPickupCode,
  markPickupCodeUsed,
  findItemsByOrderId,
  findByIdForUser,
  findByIdForAdmin,
  listForUser,
  listForAdmin,
  updateStatus,
};