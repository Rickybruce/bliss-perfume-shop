const express = require('express');
const controller = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkoutLimiter } = require('../middleware/rate-limit.middleware');
const { checkoutSchema } = require('../validators/order.validator');

const router = express.Router();

router.use(requireAuth);
router.post('/', checkoutLimiter, validate(checkoutSchema), controller.create);
router.get('/', controller.listForUser);
router.get('/:id', controller.getForUser);

module.exports = router;
