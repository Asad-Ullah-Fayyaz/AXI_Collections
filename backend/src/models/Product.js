const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  price: {
    type: Number,
    required: [true, 'Please specify the product price'],
    min: [0, 'Price must be positive']
  },
  stock: {
    type: Number,
    required: [true, 'Please specify available stock'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product must belong to a category'],
    index: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    default: null,
    index: true
  },
  images: {
    type: [String],
    validate: [arrayMinLength, 'Product must have at least one image']
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

function arrayMinLength(val) {
  return val && val.length > 0;
}

// Compound text index for search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
