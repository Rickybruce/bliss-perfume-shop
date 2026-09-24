const productRepo = require('../repositories/product.repository');

/**
 * GET /api/admin/products
 * List all products for the admin table, including unpublished products.
 */
async function listProducts(req, res, next) {
  try {
    const products = await productRepo.findAllAdmin();
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/products
 * Creates a product with its initial variant and primary image.
 */
async function createProduct(req, res, next) {
  try {
    const {
      name,
      brand,
      description,
      scent_family,
      top_notes,
      middle_notes,
      base_notes,
      concentration,
      is_published,
      size_ml,
      price_pesewas,
      stock,
      sku,
      image_url,
    } = req.body;

    const productId = await productRepo.create({
      name,
      brand,
      description,
      scent_family,
      top_notes,
      middle_notes,
      base_notes,
      concentration: concentration || null,
      is_published,
    });

    // Add initial variant
    const variantId = await productRepo.addVariant({
      product_id: productId,
      size_ml,
      price_pesewas,
      stock,
      sku: sku || null,
    });

    // Add primary image if provided
    let imageId = null;
    if (image_url) {
      imageId = await productRepo.addImage({
        product_id: productId,
        url: image_url,
        position: 0,
      });
    }

    res.status(201).json({
      message: 'Product created successfully.',
      productId,
      variantId,
      imageId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  createProduct,
};
