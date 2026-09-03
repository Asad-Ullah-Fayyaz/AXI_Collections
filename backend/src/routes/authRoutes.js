const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register, login, getMe, updateProfile, forgotPassword, resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules, addressRules, forgotPasswordRules, resetPasswordRules } = require('../middleware/validators');

const router = express.Router();

// Brute-force protection on public auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' }
});

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, addressRules, validate, updateProfile);
router.post('/forgot-password', resetLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetLimiter, resetPasswordRules, validate, resetPassword);

module.exports = router;

module.exports = router;
