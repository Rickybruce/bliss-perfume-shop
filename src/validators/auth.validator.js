const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{3,20}$/, 'Use 3 to 20 letters, numbers or underscores.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  // Shape only — normalisePhone() in the controller does the real Ghana-number check
  // and produces the field-specific error, since it needs to run after this passes.
  phone: z.string().trim().min(1, 'Enter your phone number.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Use 72 characters or fewer.'),
});

const verifyOtpSchema = z.object({
  userId: z.number().int().positive(),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});

const resendOtpSchema = z.object({
  userId: z.number().int().positive(),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional().default(false),
});

module.exports = { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema };
