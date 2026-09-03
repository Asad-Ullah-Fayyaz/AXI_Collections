const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendTrackingEmail } = require('../services/emailService');
const { ORDER } = require('../config/constants');
const logger = require('../utils/logger');

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/dashboard
// @access  Private (Admin Only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

    // Calculate total revenue from delivered and valid active orders
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select('name stock price category').limit(5);

    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(6)
      .populate('customer', 'name email');

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        totalCustomers,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all store orders (with optional status filter & pagination)
// @route   GET /api/admin/orders
// @access  Private (Admin Only)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name email');

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin Only)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!ORDER.VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status transition' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotency: setting the same status again is a no-op (prevents double-restock on retries)
    if (order.status === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already ${status}`,
        order
      });
    }

    // Enforce valid state machine transitions — the UI cannot bypass this.
    const allowed = ORDER.VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order from '${order.status}' to '${status}'. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}.`
      });
    }

    // Require tracking ID before shipping
    if (status === 'Shipped' && (!order.courierInfo || !order.courierInfo.trackingId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transition order status to Shipped without entering a valid Courier Tracking ID first.'
      });
    }

    // Idempotent restock: only cancel-transitioning orders restock, exactly once.
    // The transition check above already guarantees this runs at most once per order.
    if (status === 'Cancelled') {
      for (const item of order.items) {
        // eslint-disable-next-line no-await-in-loop
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
      logger.info('Order cancelled — stock restored', {
        orderId: order.orderId,
        items: order.items.length
      });
    }

    const previousStatus = order.status;
    order.status = status;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    await order.save();

    logger.info('Order status updated', {
      orderId: order.orderId,
      from: previousStatus,
      to: status,
      admin: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign courier tracking ID and trigger dispatch email
// @route   POST /api/admin/orders/:id/tracking
// @access  Private (Admin Only)
exports.assignTrackingId = async (req, res, next) => {
  try {
    const { carrier, trackingId, updateStatusToShipped = true } = req.body;

    if (!trackingId || trackingId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Courier Tracking ID cannot be blank' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousTrackingId = order.courierInfo ? order.courierInfo.trackingId : null;

    order.courierInfo = {
      carrier: carrier ? carrier.trim() : 'Standard Courier Service',
      trackingId: trackingId.trim(),
      shippedAt: new Date()
    };

    if (updateStatusToShipped) {
      order.status = 'Shipped';
    }

    await order.save();

    // Trigger tracking email only if the tracking ID is new or changed
    if (previousTrackingId !== trackingId.trim()) {
      sendTrackingEmail(order).catch((err) =>
        logger.error('Tracking email FAILED', {
          orderId: order.orderId,
          error: err.message
        })
      );
    } else {
      logger.info('Tracking ID unchanged — email skipped', { orderId: order.orderId });
    }

    res.status(200).json({
      success: true,
      message: 'Courier tracking information assigned and dispatch email sent.',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers list
// @route   GET /api/admin/customers
// @access  Private (Admin Only)
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort('-createdAt');

    // Attach order summary for each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (cust) => {
        const orderCount = await Order.countDocuments({ customer: cust._id });
        const lastOrder = await Order.findOne({ customer: cust._id }).sort('-createdAt').select('orderId createdAt totalAmount status');
        return {
          ...cust.toObject(),
          orderCount,
          lastOrder
        };
      })
    );

    res.status(200).json({
      success: true,
      count: customersWithOrders.length,
      customers: customersWithOrders
    });
  } catch (error) {
    next(error);
  }
};
