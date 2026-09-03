const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  items: [orderItemSnapshotSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Pakistan' }
  },
  paymentMethod: {
    type: String,
    enum: ['COD'],
    default: 'COD',
    required: true
  },
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  courierInfo: {
    carrier: { type: String, default: '' },
    trackingId: { type: String, default: '', index: true },
    shippedAt: { type: Date, default: null }
  },
  adminNotes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
