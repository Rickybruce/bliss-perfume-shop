const express = require('express');
const controller = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { createProductSchema } = require('../validators/product.validator');

const router = express.Router();

// All routes here require authentication and the admin role.
router.use(requireAuth, requireAdmin);

// GET /api/admin/products — list all products
router.get('/products', controller.listProducts);

// POST /api/admin/products — create a new product with variant and image
router.post('/products', validate(createProductSchema), controller.createProduct);

module.exports = router;
