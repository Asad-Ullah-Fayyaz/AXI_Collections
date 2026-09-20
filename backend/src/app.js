const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');

const { config } = require('./config/env');
const { SHIPPING } = require('./config/constants');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siteContentRoutes = require('./routes/siteContentRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Behind a single reverse proxy (nginx / Cloudflare / Render / Railway / Heroku).
// If you have two hops (Cloudflare -> nginx -> Node), change to 2 or 'loopback'.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Compression (place before routes)
app.use(compression());

// CORS — strict origin allow-list
const allowedOrigins = config.allowedOrigins;
app.use(
  cors({
    origin(origin, callback) {
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
  })
);

// Global API rate limit — 300 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production'
});
app.use('/api', apiLimiter);

// Request Logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
      stream: { write: (msg) => logger.warn(msg.trim()) }
    })
  );
}

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static Uploads — cache aggressively (filenames are unique per upload)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '30d',
    immutable: true,
    etag: true
  })
);

// Health — shallow (liveness)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Health — deep (readiness, verifies DB)
app.get('/api/health/deep', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  if (dbState === 1) {
    res.status(200).json({ status: 'ok', db: 'connected' });
  } else {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/reviews', reviewRoutes);

// Shipping config (public, cached for 1 hour)
app.get('/api/config/shipping', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ success: true, shipping: SHIPPING });
});

// 404 catch-all (Express 4 + 5 compatible)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;