const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ORDER } = require('../config/constants');
const logger = require('../utils/logger');

// Helper to calculate total and validate active stock
const formatCartResponse = async (cart) => {
  // Gracefully handle a missing/null cart — never throw a 500
  if (!cart) {
    return { _id: null, user: null, items: [], itemCount: 0, subtotal: 0 };
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product).populate('category', 'name slug');
    if (product && product.isActive) {
      // Clamp quantity to available stock
      const validQty = Math.min(item.quantity, product.stock);
      const itemTotal = product.price * validQty;
      subtotal += itemTotal;

      validatedItems.push({
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          images: product.images,
          category: product.category
        },
        quantity: validQty,
        itemTotal
      });
    }
  }

  return {
    _id: cart._id || null,
    user: cart.user || null,
    items: validatedItems,
    itemCount: validatedItems.reduce((acc, item) => acc + item.quantity, 0),
    subtotal
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const formattedCart = await formatCartResponse(cart);
    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/add
// @access  Private
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    // quantity is validated by middleware (integer 1..MAX); sanitize defensively
    const qty = Math.min(Number(quantity) || 1, ORDER.MAX_QTY_PER_ITEM);

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product is unavailable' });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is currently out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${product.stock} units available in stock`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${product.stock} units available in stock`
        });
      }
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const formattedCart = await formatCartResponse(cart);

    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of item in cart
// @route   PUT /api/cart/update
// @access  Private
exports.updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    // quantity validated by middleware: integer >= 1
    const qty = Number(quantity);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
      await cart.save();
    }

    const formattedCart = await formatCartResponse(cart);
    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId
// @access  Private
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      // No cart to modify — return an empty cart instead of a 500
      return res.status(200).json({
        success: true,
        cart: { _id: null, user: req.user.id, items: [], itemCount: 0, subtotal: 0 }
      });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();

    const formattedCart = await formatCartResponse(cart);
    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Merge a guest cart into the user's server cart after login
// @route   POST /api/cart/merge
// @access  Private
// Body: { items: [{ productId, quantity }] } — from localStorage guest cart.
// Server validates every item: existence, active status, stock limits, duplicates.
exports.mergeCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      // Nothing to merge — just return the current cart
      const existing = await Cart.findOne({ user: req.user.id });
      return res.status(200).json({ success: true, cart: await formatCartResponse(existing) });
    }

    if (items.length > 50) {
      return res.status(400).json({ success: false, message: 'Too many items to merge' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const mergeResults = { merged: 0, rejected: [] };

    for (const entry of items) {
      const productId = entry && entry.productId;
      const qty = Number(entry && entry.quantity);

      if (!productId || !Number.isInteger(qty) || qty < 1 || qty > ORDER.MAX_QTY_PER_ITEM) {
        mergeResults.rejected.push({ productId, reason: 'Invalid item or quantity' });
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const product = await Product.findById(productId);
      if (!product || !product.isActive || product.stock < 1) {
        mergeResults.rejected.push({ productId, reason: 'Product unavailable or out of stock' });
        // eslint-disable-next-line no-continue
        continue;
      }

      const existingIndex = cart.items.findIndex(
        (i) => i.product.toString() === productId
      );

      if (existingIndex > -1) {
        // Duplicate product — keep the larger quantity, capped at stock
        const maxQty = Math.min(Math.max(cart.items[existingIndex].quantity, qty), product.stock);
        cart.items[existingIndex].quantity = maxQty;
      } else {
        cart.items.push({ product: productId, quantity: Math.min(qty, product.stock) });
      }
      mergeResults.merged += 1;
    }

    await cart.save();
    const formattedCart = await formatCartResponse(cart);

    logger.info('Guest cart merged', {
      userId: req.user.id,
      merged: mergeResults.merged,
      rejected: mergeResults.rejected.length
    });

    res.status(200).json({ success: true, cart: formattedCart, merge: mergeResults });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { _id: null, user: req.user.id, items: [], itemCount: 0, subtotal: 0 }
    });
  } catch (error) {
    next(error);
  }
};
