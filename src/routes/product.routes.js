const express = require('express');
const controller = require('../controllers/product.controller');

const router = express.Router();

// GET /api/products/filters — must come before /:id so "filters" isn't
// treated as a product id.
router.get('/filters', controller.getFilters);

// GET /api/products?scentFamily=woody&concentration=EDP
router.get('/', controller.listProducts);

// GET /api/products/42
router.get('/:id', controller.getProduct);

module.exports = router;
