// Every query here is parameterized (the ? placeholders), so user input can
// never be interpreted as SQL. Controllers never write raw SQL themselves —
// they call these functions instead.
//
// Money convention: price_pesewas is an integer (100 pesewas = 1 GHS).
// Never store or calculate money as a decimal/float.
const db = require('../config/db');

/**
 * List published products with their cheapest-variant price and primary image.
 * Optionally filter by scent_family and/or concentration.
 *
 * @param {{ scentFamily?: string, concentration?: string }} filters
 * @returns {Promise<Array>}
 */
async function findPublished({ scentFamily, concentration } = {}) {
  const conditions = ['p.is_published = 1'];
  const params = [];

  if (scentFamily) {
    conditions.push('p.scent_family = ?');
    params.push(scentFamily);
  }
  if (concentration) {
    conditions.push('p.concentration = ?');
    params.push(concentration);
  }

  const where = conditions.join(' AND ');

  // One row per product. Cheapest variant price via subquery so we can show
  // "from GHS X" on the card. Primary image is the one with the lowest
  // position value (position = 0 first by convention).
  const sql = `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.scent_family,
      p.concentration,
      (
        SELECT MIN(pv.price_pesewas)
        FROM product_variants pv
        WHERE pv.product_id = p.id
      ) AS min_price_pesewas,
      (
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.position ASC
        LIMIT 1
      ) AS primary_image_url
    FROM products p
    WHERE ${where}
    ORDER BY p.created_at DESC
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

/**
 * Fetch a single published product by id, including all variants and images.
 *
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  // Product row
  const [productRows] = await db.query(
    `SELECT id, name, brand, description, scent_family,
            top_notes, middle_notes, base_notes, concentration, is_published
     FROM products
     WHERE id = ? AND is_published = 1
     LIMIT 1`,
    [id]
  );
  if (!productRows.length) return null;

  const product = productRows[0];

  // All variants (size + price + stock)
  const [variantRows] = await db.query(
    `SELECT id, size_ml, price_pesewas, stock, sku
     FROM product_variants
     WHERE product_id = ?
     ORDER BY size_ml ASC`,
    [id]
  );

  // All images, ordered by position
  const [imageRows] = await db.query(
    `SELECT id, url, position
     FROM product_images
     WHERE product_id = ?
     ORDER BY position ASC`,
    [id]
  );

  return {
    ...product,
    variants: variantRows,
    images: imageRows,
  };
}

/**
 * Return every distinct scent_family value that has at least one published
 * product. Used to populate the filter dropdown.
 *
 * @returns {Promise<string[]>}
 */
async function findDistinctScentFamilies() {
  const [rows] = await db.query(
    `SELECT DISTINCT scent_family
     FROM products
     WHERE is_published = 1 AND scent_family IS NOT NULL
     ORDER BY scent_family ASC`
  );
  return rows.map((r) => r.scent_family);
}

/**
 * Return every distinct concentration value that has at least one published
 * product. Used to populate the filter dropdown.
 *
 * @returns {Promise<string[]>}
 */
async function findDistinctConcentrations() {
  const [rows] = await db.query(
    `SELECT DISTINCT concentration
     FROM products
     WHERE is_published = 1 AND concentration IS NOT NULL
     ORDER BY concentration ASC`
  );
  return rows.map((r) => r.concentration);
}

/**
 * List all products for the admin table, including unpublished products.
 * Includes variant count, total stock, minimum price, and primary image.
 */
async function findAllAdmin() {
  const sql = `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.scent_family,
      p.concentration,
      p.is_published,
      p.created_at,
      COUNT(pv.id) AS variant_count,
      COALESCE(SUM(pv.stock), 0) AS total_stock,
      MIN(pv.price_pesewas) AS min_price_pesewas,
      (
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.position ASC
        LIMIT 1
      ) AS primary_image_url
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

/**
 * Create a new product.
 */
async function create({
  name,
  brand,
  description,
  scent_family,
  top_notes,
  middle_notes,
  base_notes,
  concentration,
  is_published = 0,
}) {
  const [result] = await db.query(
    `INSERT INTO products
     (name, brand, description, scent_family, top_notes, middle_notes, base_notes, concentration, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      brand || null,
      description || null,
      scent_family || null,
      top_notes || null,
      middle_notes || null,
      base_notes || null,
      concentration || null,
      is_published ? 1 : 0,
    ]
  );
  return result.insertId;
}

/**
 * Add a variant to a product.
 */
async function addVariant({ product_id, size_ml, price_pesewas, stock = 0, sku = null }) {
  const [result] = await db.query(
    `INSERT INTO product_variants (product_id, size_ml, price_pesewas, stock, sku)
     VALUES (?, ?, ?, ?, ?)`,
    [product_id, size_ml, price_pesewas, stock, sku]
  );
  return result.insertId;
}

/**
 * Add an image URL to a product.
 */
async function addImage({ product_id, url, position = 0 }) {
  const [result] = await db.query(
    `INSERT INTO product_images (product_id, url, position)
     VALUES (?, ?, ?)`,
    [product_id, url, position]
  );
  return result.insertId;
}

module.exports = {
  findPublished,
  findById,
  findDistinctScentFamilies,
  findDistinctConcentrations,
  findAllAdmin,
  create,
  addVariant,
  addImage,
};
