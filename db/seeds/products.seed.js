// Seed script — inserts all 9 real products with their local images,
// real scent notes (researched from Fragrantica / Jumia GH), and
// realistic Ghana market prices in pesewas (1 GHS = 100 pesewas).
//
// Run once:  node db/seeds/products.seed.js
// Safe to re-run — it deletes and re-inserts cleanly.

require('dotenv').config();

const db = require('../../src/config/db');

// Prices are in PESEWAS (integer). 35000 = GHS 350.00
const products = [
  {
    name: 'Angham',
    brand: 'Lattafa',
    description:
      'Angham — meaning "rhythm of music" in Arabic — is a warm, gourmand oriental that opens with spiced citrus and deepens into a rich praline-and-cacao heart. Long-lasting and versatile, equally at home for a lecture or a night out.',
    scent_family: 'oriental',
    top_notes: 'Ginger, Mandarin, Pink Pepper',
    middle_notes: 'Praline, Cacao, Lavender, Jasmine',
    base_notes: 'Vanilla, Amber, Musk',
    concentration: 'EDP',
    is_published: 1,
    image: 'Angham by Lattafa.webp',
    variants: [
      { size_ml: 100, price_pesewas: 36000, stock: 15, sku: 'LAT-ANGHAM-100' },
    ],
  },
  {
    name: 'Brown Orchid (Gold Edition)',
    brand: 'Fragrance World',
    description:
      'A luxurious, rich oriental that leads with a jewelled bouquet of jasmine and ylang-ylang before settling into a dark, seductive base of oud, patchouli, and dark chocolate. Bold enough for evenings, complex enough to intrigue.',
    scent_family: 'oriental',
    top_notes: 'Jasmine, Gardenia, Ylang Ylang, Bergamot, Lemon, Mandarin',
    middle_notes: 'Blackcurrant, Truffle, Spices, Lotus, Orchid, Sandalwood',
    base_notes: 'Patchouli, Vetiver, Amber, Incense, Vanilla, Dark Chocolate',
    concentration: 'EDP',
    is_published: 1,
    image: 'Brown Orchid (Gold Edition) by Fragrance World.png',
    variants: [
      { size_ml: 80, price_pesewas: 15500, stock: 20, sku: 'FW-BROWNO-80' },
    ],
  },
  {
    name: 'Dolores Pour Femme',
    brand: 'Fragrance World',
    description:
      'Inspired by the irreverent glamour of Marc Jacobs Decadence, Dolores Pour Femme opens with Italian plum and saffron before unfolding into a heart of Bulgarian rose and jasmine sambac. Grounded in vetiver and liquid amber, it is confident and unmistakably feminine.',
    scent_family: 'floral',
    top_notes: 'Italian Plum, Iris, Saffron',
    middle_notes: 'Bulgarian Rose, Jasmine Sambac, Orris',
    base_notes: 'Vetiver, Papyrus, Liquid Amber',
    concentration: 'EDP',
    is_published: 1,
    image: 'Dolores Pour Femme.jpg',
    variants: [
      { size_ml: 100, price_pesewas: 17000, stock: 12, sku: 'FW-DOLORES-100' },
    ],
  },
  {
    name: 'Hayaati Belle',
    brand: 'Fragrance World',
    description:
      'Hayaati Belle opens with a fresh burst of pear and peach that feels instantly bright and youthful. A lush floral heart — ylang-ylang, jasmine, and tonka bean — carries it into a warm, creamy close of vanilla and soft musk. The perfect daytime floral for campus or a casual evening.',
    scent_family: 'floral',
    top_notes: 'Pear, Peach',
    middle_notes: 'Ylang Ylang, Tonka Bean, Jasmine, Lily of the Valley',
    base_notes: 'Vanilla, Musk, Woody Notes',
    concentration: 'EDP',
    is_published: 1,
    image: 'Hayaati Belle.jpg',
    variants: [
      { size_ml: 100, price_pesewas: 19000, stock: 10, sku: 'FW-HAYAATIB-100' },
    ],
  },
  {
    name: 'Hayaati',
    brand: 'Lattafa',
    description:
      'The original Hayaati is a clean, modern unisex fragrance that balances fruity freshness with a warm, spicy heart. Apple and bergamot open bright and energetic; cinnamon and cedar add depth; musk and vanilla keep the dry-down smooth and wearable all day.',
    scent_family: 'woody',
    top_notes: 'Apple, Bergamot',
    middle_notes: 'Cinnamon, Cedar',
    base_notes: 'Musk, Vanilla',
    concentration: 'EDP',
    is_published: 1,
    image: 'Hayaati by Lattafa.jpg',
    variants: [
      { size_ml: 100, price_pesewas: 30000, stock: 8, sku: 'LAT-HAYAATI-100' },
    ],
  },
  {
    name: 'Her Confession',
    brand: 'Lattafa',
    description:
      'A creamy, mysterious oriental launched in 2024. The opening is warm and slightly smoky — cinnamon meets a mystical accord — before a dense, rich heart of tuberose and jasmine unfolds over incense. Settles into a long-lasting, comforting vanilla and tonka finish. Niche quality at an accessible price.',
    scent_family: 'oriental',
    top_notes: 'Cinnamon, Mystical Accord',
    middle_notes: 'Tuberose, Jasmine, Incense, Mahonial',
    base_notes: 'Vanilla, Tonka Bean, Musk',
    concentration: 'EDP',
    is_published: 1,
    image: 'Her Confession by Lattafa.jpg',
    extra_images: [
      'Her Confession by Lattafa 2.webp',
      'Her Confession by Lattafa 3.webp',
    ],
    variants: [
      { size_ml: 100, price_pesewas: 52000, stock: 6, sku: 'LAT-HERCONF-100' },
    ],
  },
  {
    name: 'Yara Elixir',
    brand: 'Lattafa',
    description:
      'A sweet, decadent gourmand that balances rich fruitiness with a creamy dessert-like finish. Opens with strawberry s\'mores and blackcurrant, blends into soft white florals, and lingers in a cloud of vanilla, caramel, and warm amber.',
    scent_family: 'gourmand',
    top_notes: 'Strawberry S\'mores, Blackcurrant',
    middle_notes: 'Jasmine, Orange Blossom',
    base_notes: 'Vanilla, Caramel, Amber, Musk',
    concentration: 'EDP',
    is_published: 1,
    image: 'Lattafa Yara Elxir.webp',
    variants: [
      { size_ml: 100, price_pesewas: 32000, stock: 16, sku: 'LAT-YARAELX-100' },
    ],
  },
  {
    name: 'Jungle Vibe',
    brand: 'Rayhaan',
    description:
      'Jungle Vibe is a fresh, green, and nature-inspired EDP that opens with grapefruit and fig, brightened by bergamot. Violet leaf and oakmoss give it a botanical, almost earthy character. The dry-down of patchouli, sandalwood, and musk keeps it grounded and long-lasting. Ideal for everyday wear — campus, gym, or outdoors.',
    scent_family: 'fresh',
    top_notes: 'Grapefruit, Fig, Bergamot',
    middle_notes: 'Violet Leaf, Fig Leaf, Oakmoss',
    base_notes: 'Musk, Patchouli, Sandalwood',
    concentration: 'EDP',
    is_published: 1,
    image: 'Jungle Vibe by Rayhaan.jfif',
    variants: [
      { size_ml: 100, price_pesewas: 30000, stock: 18, sku: 'RAY-JUNGLE-100' },
    ],
  },
  {
    name: 'Rose Seduction Secret Obsession',
    brand: 'Fragrance World',
    description:
      'A bold, feminine floral by Fragrance World inspired by the Victoria\'s Secret universe. Opens with tangy blackcurrant before blooming into a vivid heart of fuchsia rose and queen peony. The base of feather-light musk and polished woods keeps it sensual without being heavy. Eye-catching in the best way.',
    scent_family: 'floral',
    top_notes: 'Blackcurrant (Cassis)',
    middle_notes: 'Fuchsia Rose, Queen Peony',
    base_notes: 'Luxurious Woods, Light Musk',
    concentration: 'EDP',
    is_published: 1,
    image: 'Rose Seduction Secret Obsession.png',
    variants: [
      { size_ml: 100, price_pesewas: 22000, stock: 14, sku: 'FW-ROSESEDU-100' },
    ],
  },
  {
    name: 'Vanille Bouquet',
    brand: 'Fragrance World',
    description:
      'A warm, creamy gourmand that punches far above its price. Orange and lemon open bright and fresh, giving way to a luscious heart of Madagascar vanilla and amber. The dry-down of white musk and bergamot keeps it clean and wearable. Excellent longevity — 7 to 10 hours on skin. Unisex and universally crowd-pleasing.',
    scent_family: 'gourmand',
    top_notes: 'Orange, Lemon',
    middle_notes: 'Madagascar Vanilla, Amber',
    base_notes: 'White Musk, Bergamot',
    concentration: 'EDP',
    is_published: 1,
    image: 'Vanille Bouquet.webp',
    variants: [
      { size_ml: 100, price_pesewas: 18000, stock: 22, sku: 'FW-VANILBQ-100' },
    ],
  },
];

async function seed() {
  console.log('Seeding products...');

  for (const p of products) {
    // Upsert product by name+brand so re-runs are safe
    const [existing] = await db.query(
      'SELECT id FROM products WHERE name = ? AND brand = ? LIMIT 1',
      [p.name, p.brand]
    );

    let productId;

    if (existing.length) {
      productId = existing[0].id;
      await db.query(
        `UPDATE products
         SET description=?, scent_family=?, top_notes=?, middle_notes=?,
             base_notes=?, concentration=?, is_published=?
         WHERE id=?`,
        [p.description, p.scent_family, p.top_notes, p.middle_notes,
          p.base_notes, p.concentration, p.is_published, productId]
      );
      console.log(`  ↻ Updated: ${p.brand} — ${p.name} (id ${productId})`);
    } else {
      const [res] = await db.query(
        `INSERT INTO products (name, brand, description, scent_family, top_notes, middle_notes, base_notes, concentration, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.brand, p.description, p.scent_family, p.top_notes,
          p.middle_notes, p.base_notes, p.concentration, p.is_published]
      );
      productId = res.insertId;
      console.log(`  + Inserted: ${p.brand} — ${p.name} (id ${productId})`);
    }

    // Images: local path served via Express static files at /images/<filename>
    const allImages = [p.image, ...(p.extra_images || [])];
    for (let pos = 0; pos < allImages.length; pos++) {
      const imgUrl = `/images/${allImages[pos]}`;
      const [imgCheck] = await db.query(
        'SELECT id FROM product_images WHERE product_id = ? AND url = ? LIMIT 1',
        [productId, imgUrl]
      );
      if (!imgCheck.length) {
        await db.query(
          'INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)',
          [productId, imgUrl, pos]
        );
      }
    }

    // Variants: upsert by SKU
    for (const v of p.variants) {
      const [vExisting] = await db.query(
        'SELECT id FROM product_variants WHERE sku = ? LIMIT 1',
        [v.sku]
      );
      if (vExisting.length) {
        await db.query(
          'UPDATE product_variants SET size_ml=?, price_pesewas=?, stock=? WHERE sku=?',
          [v.size_ml, v.price_pesewas, v.stock, v.sku]
        );
      } else {
        await db.query(
          'INSERT INTO product_variants (product_id, size_ml, price_pesewas, stock, sku) VALUES (?, ?, ?, ?, ?)',
          [productId, v.size_ml, v.price_pesewas, v.stock, v.sku]
        );
      }
    }
  }

  console.log('\nDone! All 9 products seeded.');
  await db.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
