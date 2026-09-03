const express = require('express');
const { getCart, addItem, updateQuantity, removeItem, clearCart, mergeCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { quantityRule } = require('../middleware/validators');

const router = express.Router();

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/add', quantityRule('quantity', { required: false }), validate, addItem);
router.post('/merge', validate, mergeCart);
router.put('/update', quantityRule(), validate, updateQuantity);
router.delete('/item/:productId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;
