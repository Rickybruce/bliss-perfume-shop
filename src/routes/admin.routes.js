const express = require('express');
const controller = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantSchema,
  addImageSchema,
} = require('../validators/product.validator');
const { updateOrderStatusSchema } = require('../validators/order.validator');

const router = express.Router();

// All routes here require authentication and the admin role.
router.use(requireAuth, requireAdmin);

// GET /api/admin/products — list all products
router.get('/products', controller.listProducts);

// POST /api/admin/products — create a new product with variant and image
router.post('/products', validate(createProductSchema), controller.createProduct);

// One product for the edit form, then its fields, sizes and images
router.get('/products/:id', controller.getProduct);
router.patch('/products/:id', validate(updateProductSchema), controller.updateProduct);
router.post('/products/:id/variants', validate(addVariantSchema), controller.addVariant);
router.post('/products/:id/images', validate(addImageSchema), controller.addImage);
router.patch('/variants/:variantId', validate(updateVariantSchema), controller.updateVariant);
router.delete('/variants/:variantId', controller.deleteVariant);
router.delete('/images/:imageId', controller.deleteImage);

router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), controller.updateOrderStatus);

module.exports = router;
