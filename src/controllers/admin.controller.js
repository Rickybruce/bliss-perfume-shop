const productRepo = require('../repositories/product.repository');
const orderService = require('../services/order.service');
const AppError = require('../utils/app-error');
const { parseOrderId } = require('./order.controller');

function parseId(value, label) {
  const id = parseInt(value, 10);
  if (!Number.isFinite(id) || id < 1) throw new AppError(400, `Invalid ${label} id.`);
  return id;
}

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

async function listOrders(req, res, next) {
  try {
    const orders = await orderService.listForAdmin();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderService.getForAdmin(parseOrderId(req.params.id));
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const result = await orderService.updateStatus(parseOrderId(req.params.id), req.body.status);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Product editing
// ---------------------------------------------------------------------------

/** GET /api/admin/products/:id — one product, published or not, for the edit form. */
async function getProduct(req, res, next) {
  try {
    const product = await productRepo.findByIdAdmin(parseId(req.params.id, 'product'));
    if (!product) throw new AppError(404, 'Product not found.');
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/products/:id — change product fields, including is_published. */
async function updateProduct(req, res, next) {
  try {
    const id = parseId(req.params.id, 'product');
    const found = await productRepo.update(id, req.body);
    if (!found) throw new AppError(404, 'Product not found.');
    res.json({ message: 'Product updated.' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/products/:id/variants — add another bottle size. */
async function addVariant(req, res, next) {
  try {
    const productId = parseId(req.params.id, 'product');
    if (!(await productRepo.productExists(productId))) throw new AppError(404, 'Product not found.');
    const { size_ml, price_pesewas, stock, sku } = req.body;
    const variantId = await productRepo.addVariant({
      product_id: productId,
      size_ml,
      price_pesewas,
      stock,
      sku: sku || null,
    });
    res.status(201).json({ message: 'Size added.', variantId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError(409, 'That SKU is already used by another size.'));
    next(err);
  }
}

/** PATCH /api/admin/variants/:variantId — change price, stock, size or SKU. */
async function updateVariant(req, res, next) {
  try {
    const found = await productRepo.updateVariant(parseId(req.params.variantId, 'size'), req.body);
    if (!found) throw new AppError(404, 'Size not found.');
    res.json({ message: 'Size updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError(409, 'That SKU is already used by another size.'));
    next(err);
  }
}

/** DELETE /api/admin/variants/:variantId — only works if no order used that size. */
async function deleteVariant(req, res, next) {
  try {
    const found = await productRepo.deleteVariant(parseId(req.params.variantId, 'size'));
    if (!found) throw new AppError(404, 'Size not found.');
    res.json({ message: 'Size removed.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return next(new AppError(409, 'Orders already use this size. Set its stock to 0 instead of deleting it.'));
    }
    next(err);
  }
}

/** POST /api/admin/products/:id/images — attach an image link. */
async function addImage(req, res, next) {
  try {
    const productId = parseId(req.params.id, 'product');
    if (!(await productRepo.productExists(productId))) throw new AppError(404, 'Product not found.');
    const position = await productRepo.nextImagePosition(productId);
    const imageId = await productRepo.addImage({ product_id: productId, url: req.body.url, position });
    res.status(201).json({ message: 'Image added.', imageId });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/images/:imageId */
async function deleteImage(req, res, next) {
  try {
    const found = await productRepo.deleteImage(parseId(req.params.imageId, 'image'));
    if (!found) throw new AppError(404, 'Image not found.');
    res.json({ message: 'Image removed.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProduct,
  updateProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  addImage,
  deleteImage,
  listProducts,
  createProduct,
  listOrders,
  getOrder,
  updateOrderStatus,
};
