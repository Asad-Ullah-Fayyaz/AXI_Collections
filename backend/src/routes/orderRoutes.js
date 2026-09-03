const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderByOrderId,
  trackOrderPublic
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrderRules } = require('../middleware/validators');

const router = express.Router();

router.post('/track', trackOrderPublic); // Public route

router.use(protect); // Protected customer routes
router.post('/', createOrderRules, validate, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:orderId', getOrderByOrderId);

module.exports = router;
