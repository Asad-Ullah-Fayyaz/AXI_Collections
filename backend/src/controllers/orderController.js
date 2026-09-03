const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const generateOrderId = require('../utils/generateOrderId');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { SHIPPING, ORDER } = require('../config/constants');
const logger = require('../utils/logger');

// @desc    Place a new COD order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  const deducted = []; // for compensating rollback if anything fails

  try {
    const { items, shippingAddress, orderNotes } = req.body;

    // Items/address shape is validated by middleware; defensive re-checks below.
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    let calculatedSubtotal = 0;
    const orderItemSnapshots = [];

    // Server-side price calculation — client prices are NEVER trusted.
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name || 'Requested Item'}' is no longer available.`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}.`
        });
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      orderItemSnapshots.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
      });
    }

    // Shared shipping config — single source of truth
    const shippingCost = calculatedSubtotal > SHIPPING.FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING.STANDARD_SHIPPING_COST;
    const totalAmount = calculatedSubtotal + shippingCost;
    const newOrderId = generateOrderId();

    // ATOMIC stock deduction — only succeeds if enough stock remains.
    // Prevents two concurrent orders from overselling the same product.
    for (const snapshot of orderItemSnapshots) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Product.findOneAndUpdate(
        { _id: snapshot.product, stock: { $gte: snapshot.quantity } },
        { $inc: { stock: -snapshot.quantity } },
        { new: true }
      );

      if (!updated) {
        // Insufficient stock at deduction time (race lost) — roll back prior deductions
        const productName = (await Product.findById(snapshot.product))?.name || 'Requested Item';
        for (const d of deducted) {
          // eslint-disable-next-line no-await-in-loop
          await Product.findByIdAndUpdate(d.product, { $inc: { stock: d.quantity } });
        }
        logger.warn('Order stock race lost — rolled back', {
          product: snapshot.product.toString(),
          rolledBack: deducted.length
        });
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for '${productName}'. It may have just sold out — please review your bag.`
        });
      }

      deducted.push({ product: snapshot.product, quantity: snapshot.quantity });
    }

    // Create Order Record
    let order;
    try {
      order = await Order.create({
        orderId: newOrderId,
        customer: req.user._id,
        customerEmail: req.user.email,
        items: orderItemSnapshots,
        shippingAddress,
        paymentMethod: 'COD',
        subtotal: calculatedSubtotal,
        shippingCost,
        totalAmount,
        status: 'Pending',
        ...(orderNotes ? { adminNotes: `Customer note: ${String(orderNotes).slice(0, 500)}` } : {})
      });
    } catch (createError) {
      // Compensating rollback — restore all deducted stock
      for (const d of deducted) {
        // eslint-disable-next-line no-await-in-loop
        await Product.findByIdAndUpdate(d.product, { $inc: { stock: d.quantity } });
      }
      logger.error('Order creation failed — stock rolled back', {
        error: createError.message,
        restored: deducted.length
      });
      throw createError;
    }

    // Clear Customer Cart (non-fatal — cart clearing must not fail the order)
    try {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    } catch (cartErr) {
      logger.warn('Failed to clear cart after order', { error: cartErr.message });
    }

    // Email failure must never invalidate the order — logged and observable.
    sendOrderConfirmationEmail(order).catch((err) =>
      logger.error('Order confirmation email FAILED', {
        orderId: order.orderId,
        error: err.message
      })
    );

    logger.info('Order created', {
      orderId: order.orderId,
      total: totalAmount,
      customer: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by orderId (e.g. ORD-2026-X89A2)
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrderByOrderId = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // IDOR Protection: Verify caller is owner or admin
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Public order tracking lookup
// @route   POST /api/orders/track
// @access  Public
exports.trackOrderPublic = async (req, res, next) => {
  try {
    const { orderId, emailOrPhone } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order Reference ID is required' });
    }

    const order = await Order.findOne({ orderId: orderId.trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'No matching order found for this reference ID.' });
    }

    // Optional verification check for extra security
    if (emailOrPhone) {
      const queryStr = emailOrPhone.trim().toLowerCase();
      const emailMatches = order.customerEmail.toLowerCase() === queryStr;
      // Phone: compare last 7 digits to avoid trivial 2-3 digit fragment matches
      const digitsOnly = (s) => (s || '').replace(/\D/g, '');
      const phoneMatches = digitsOnly(order.shippingAddress.phone).length >= 7 &&
        digitsOnly(order.shippingAddress.phone).endsWith(digitsOnly(queryStr).slice(-7)) &&
        digitsOnly(queryStr).length >= 7;
      if (!emailMatches && !phoneMatches) {
        return res.status(400).json({ success: false, message: 'Security check failed. The email or phone number provided does not match our records for this order.' });
      }
    }

    // Return redacted/safe tracking payload
    res.status(200).json({
      success: true,
      tracking: {
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        courierInfo: order.courierInfo,
        itemCount: order.items.length,
        cityName: order.shippingAddress.city
      }
    });
  } catch (error) {
    next(error);
  }
};
