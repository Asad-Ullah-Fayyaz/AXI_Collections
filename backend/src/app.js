const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { config } = require('./config/env');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration — strict origin allow-list (never allow all origins unconditionally)
const allowedOrigins = config.allowedOrigins;

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server / same-origin (no Origin header, e.g. curl) — but not
    // cross-origin browser requests from untrusted domains.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (config.isDevelopment) {
      logger.warn('CORS request from unconfigured origin (allowed in dev)', { origin });
      callback(null, true);
    } else {
      logger.warn('CORS request blocked', { origin });
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true
}));

// General API rate limit — generous enough for normal catalog browsing
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Strict limit for sensitive auth operations (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Password reset gets its own tighter limit
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' }
});

app.use('/api', apiLimiter);

// Request Logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root & Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AXI Collection API Server is active and operational',
    timestamp: new Date()
  });
});

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Expose shipping config for the frontend (single source of truth is backend)
app.get('/api/config/shipping', (req, res) => {
  const { SHIPPING } = require('./config/constants');
  res.json({ success: true, shipping: SHIPPING });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found on AXI Collection server`
  });
});

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
