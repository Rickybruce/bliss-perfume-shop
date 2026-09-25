const bcrypt = require('bcryptjs');
const AppError = require('../utils/app-error');
const { normalisePhone } = require('../utils/phone');
const { signToken, setSessionCookie, clearSessionCookie } = require('../utils/tokens');
const otpService = require('../services/otp.service');
const userRepo = require('../repositories/user.repository');

const SALT_ROUNDS = 10;

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const phone = normalisePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        message: 'Check the highlighted fields.',
        fields: { phone: 'Enter a Ghana mobile number, like 024 123 4567.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await userRepo.create({ username, email, phone, passwordHash });

    const code = await otpService.createOtp(userId, 'phone_verify');
    await otpService.sendOtpSms(phone, code);

    res.status(201).json({ userId, phone });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { userId, code } = req.body;
    const result = await otpService.verifyOtp(userId, 'phone_verify', code);

    if (!result.ok) {
      const messages = {
        no_pending_code: 'Request a new code.',
        expired: 'That code has expired. Request a new one.',
        too_many_attempts: 'Too many attempts. Request a new code.',
        wrong_code: 'That code is incorrect.',
      };
      return res.status(400).json({ message: messages[result.reason] || 'That code is incorrect.' });
    }

    await userRepo.markPhoneVerified(userId);
    const user = await userRepo.findById(userId);

    const token = signToken({ id: user.id, role: user.role });
    setSessionCookie(res, token, true);

    res.json({ message: 'Phone verified.' });
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { userId } = req.body;
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError(404, 'Account not found.');
    if (user.phone_verified_at) {
      return res.status(400).json({ message: 'This phone is already verified.' });
    }

    const code = await otpService.createOtp(userId, 'phone_verify');
    await otpService.sendOtpSms(user.phone, code);
    res.json({ message: 'Code sent.' });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password, remember } = req.body;
    const user = await userRepo.findByEmailOrUsername(identifier);

    // Same message whether the account doesn't exist or the password is
    // wrong, so this form can never be used to find out who has an account.
    if (!user) return next(new AppError(401, 'Incorrect email, username or password.'));

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) return next(new AppError(401, 'Incorrect email, username or password.'));

    if (!user.phone_verified_at) {
      return res.status(403).json({ message: 'Verify your phone number to continue.', userId: user.id });
    }

    const token = signToken({ id: user.id, role: user.role });
    setSessionCookie(res, token, remember);

    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  clearSessionCookie(res);
  res.json({ message: 'Logged out.' });
}

async function me(req, res, next) {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) throw new AppError(401, 'Please log in.');
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verifyOtp, resendOtp, login, logout, me };
