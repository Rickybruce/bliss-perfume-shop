// One-off: swaps the local /images/... paths in product_images for hosted
// links (Cloudinary etc.), using the map in image-urls.json.
//
//   1. Paste each hosted link as the value next to its old path in image-urls.json
//   2. node db/seeds/apply-image-urls.js
//
// Safe to re-run. Entries left empty are skipped. Do NOT re-run
// products.seed.js on a live database for this: it would add a second image
// per product and reset stock back to the seed numbers.

require('dotenv').config();

const db = require('../../src/config/db');
const map = require('./image-urls.json');

async function main() {
  let updated = 0;
  const skipped = [];

  for (const [oldPath, newUrl] of Object.entries(map)) {
    if (!newUrl) {
      skipped.push(oldPath);
      continue;
    }
    if (!/^https:\/\//i.test(newUrl) || newUrl.length > 300) {
      console.error(`Skipped (must be an https link under 300 chars): ${oldPath}`);
      skipped.push(oldPath);
      continue;
    }
    const [result] = await db.query('UPDATE product_images SET url = ? WHERE url = ?', [newUrl, oldPath]);
    console.log(`${result.affectedRows ? 'Updated' : 'No match for'}: ${oldPath}`);
    updated += result.affectedRows;
  }

  const [left] = await db.query("SELECT COUNT(*) AS n FROM product_images WHERE url LIKE '/images/%'");
  console.log(`\nRows updated: ${updated}. Rows still pointing at /images/: ${left[0].n}.`);
  if (skipped.length) console.log(`Left empty in image-urls.json: ${skipped.length}`);
  await db.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
