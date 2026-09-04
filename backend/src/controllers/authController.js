const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');
const { config } = require('../config/env');
const { SECURITY } = require('../config/constants');
const logger = require('../utils/logger');

// SECURITY: compared against when no account matches the submitted email, so that a
// rejected admin login takes the same wall-clock time whether or not that email is
// real. Built at module load from fresh random bytes — never hardcoded, never read
// from the environment, never pasted in. bcryptjs reads the cost factor out of the
// hash prefix and short-circuits to `false` in microseconds for any string that is
// not a well-formed 60-character hash, so a stray newline or a cost that drifts from
// the one models/User.js hashes with would silently turn this defence back into the
// enumeration oracle it exists to close. Both read SECURITY.BCRYPT_SALT_ROUNDS.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  crypto.randomBytes(32).toString('hex'),
  SECURITY.BCRYPT_SALT_ROUNDS
);

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses
    }
  });
};

// @desc    Register a new customer account
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // STRICT SECURITY: Always force role to customer
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'customer'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Administrator login for the /admin console
// @route   POST /api/auth/admin-login
// @access  Public
//
// This endpoint exists so the storefront login page never has to offer an "Admin
// Login" option. It is a separate DOOR and an audit point — it is NOT the
// authorization boundary. Authorization lives entirely in middleware/auth.js:
// `protect` re-reads the user from MongoDB on every request and `requireAdmin`
// checks that database row's role, so the token minted here carries exactly the
// same authority as one minted by POST /api/auth/login and nothing more. Do not
// grant this token extra claims, and do not relax requireAdmin on the assumption
// that reaching this route proves anything about the caller.
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // SECURITY: run a bcrypt comparison on EVERY request, against the real account's
    // hash whenever one exists, so the unknown-email, wrong-password and
    // not-an-administrator paths are indistinguishable by response time. Do not
    // switch this to user.matchPassword(password) — that throws on a null user, and
    // the 500 it produces would itself be a flawless account-existence oracle.
    const storedHash = user && user.password ? user.password : DUMMY_PASSWORD_HASH;
    const isMatch = await bcrypt.compare(password, storedHash);

    // SECURITY: one identical generic reply for all three failure modes. What
    // actually went wrong goes to the server log and never to the client — the same
    // split that requireAdmin and forgotPassword already use.
    if (!user || !isMatch) {
      logger.warn('Admin login failed: invalid credentials', user ? { userId: user._id } : undefined);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role !== 'admin') {
      logger.warn('Admin login denied: account is not an administrator', { userId: user._id });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    logger.info('Admin login succeeded', { userId: user._id });
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile details / addresses
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, addresses } = req.body;
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (addresses) fieldsToUpdate.addresses = addresses;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password — generate & email a secure reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // ALWAYS return the same generic response — never reveal whether an account exists.
    const genericResponse = {
      success: true,
      message: 'If an account exists with that email, a password reset link has been dispatched.'
    };

    if (!user) {
      logger.info('Password reset requested for unknown email');
      return res.status(200).json(genericResponse);
    }

    // Generate a cryptographically secure random token; only its HASH is stored.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Send the RAW token (never stored) to the user via email
    try {
      await sendPasswordResetEmail(user, rawToken);
    } catch (emailErr) {
      // Clear the token so it can't be used — email delivery failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error('Password reset email failed', { error: emailErr.message });
      return res.status(500).json({
        success: false,
        message: 'Email delivery is currently unavailable. Please try again later.'
      });
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Hash the incoming raw token the same way it was stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Set new password (pre-save hook hashes it) and invalidate the token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info('Password reset completed', { userId: user._id });

    // Log the user in with a fresh token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
