const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register, login, adminLogin, getMe, updateProfile, forgotPassword, resetPassword
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

// Reuses authLimiter deliberately. A stricter dedicated bucket was considered and
// rejected: `app.set('trust proxy', ...)` is not configured anywhere, so behind any
// reverse proxy every client collapses into a single per-IP bucket, and a handful of
// junk requests per window would lock the only administrator out of the console with
// no way back except a server restart (express-rate-limit's default store is
// in-memory). A separate low-volume bucket would also leak sign-in activity through
// the RateLimit-Remaining header. Tightening this needs the deployment topology
// settled first, and is tracked as its own task.
router.post('/admin-login', authLimiter, loginRules, validate, adminLogin);

router.get('/me', protect, getMe);
router.put('/profile', protect, addressRules, validate, updateProfile);
router.post('/forgot-password', resetLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetLimiter, resetPasswordRules, validate, resetPassword);

module.exports = router;
