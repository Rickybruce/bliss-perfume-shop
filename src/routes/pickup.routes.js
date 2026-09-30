const express = require('express');
const controller = require('../controllers/pickup.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { verifyPickupSchema } = require('../validators/order.validator');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.post('/verify', validate(verifyPickupSchema), controller.verify);

module.exports = router;
