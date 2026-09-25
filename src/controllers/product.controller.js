const AppError = require('../utils/app-error');
const productRepo = require('../repositories/product.repository');
const { listProductsQuerySchema } = require('../validators/product.validator');

/**
 * GET /api/products
 * Returns published products. Accepts optional ?scentFamily= and
 * ?concentration= query params to filter the list.
 */
async function listProducts(req, res, next) {
  try {
    // Validate query params through zod — same safety guarantee as body
    // validation, just applied to req.query instead.
    const result = listProductsQuerySchema.safeParse(req.query);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        fields[issue.path[0]] = issue.message;
      }
      return res.status(400).json({ message: 'Invalid filter.', fields });
    }

    const { scentFamily, concentration } = result.data;
    const products = await productRepo.findPublished({ scentFamily, concentration });

    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/filters
 * Returns the available scent families and concentrations for populating
 * the filter dropdowns without a separate round-trip per filter type.
 */
async function getFilters(req, res, next) {
  try {
    const [scentFamilies, concentrations] = await Promise.all([
      productRepo.findDistinctScentFamilies(),
      productRepo.findDistinctConcentrations(),
    ]);
    res.json({ scentFamilies, concentrations });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 * Returns a single published product with all variants and images.
 */
async function getProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return next(new AppError(400, 'Invalid product id.'));
    }

    const product = await productRepo.findById(id);
    if (!product) {
      return next(new AppError(404, 'Product not found.'));
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, getFilters, getProduct };
