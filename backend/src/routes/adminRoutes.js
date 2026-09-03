const express = require('express');
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  assignTrackingId,
  getCustomers
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { trackingRules } = require('../middleware/validators');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/tracking', trackingRules, validate, assignTrackingId);
router.get('/customers', getCustomers);

module.exports = router;
