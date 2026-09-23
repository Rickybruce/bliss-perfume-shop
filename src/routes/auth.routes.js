const express = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { loginLimiter, otpLimiter } = require('../middleware/rate-limit.middleware');
const {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), controller.resendOtp);
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
