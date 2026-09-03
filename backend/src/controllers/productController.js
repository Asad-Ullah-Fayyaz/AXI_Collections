const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const slugify = require('slugify');
const { PAGINATION, SEARCH } = require('../config/constants');

// Escape user input before using it in $regex (prevents regex injection / ReDoS)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generate a unique slug by appending a counter suffix if needed
const generateUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
    if (counter > 100) {
      // extreme fallback — practically unreachable
      slug = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
  }
  return slug;
};

// Controlled local placeholder for products without images (no external random URLs)
const PLACEHOLDER_IMAGE = '/images/product-placeholder.svg';

// @desc    Get all catalog products with search, filters, sorting & pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subCategory,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const query = { isActive: true };

    // Search by product name or description (escaped, length-limited by validator)
    if (search) {
      const escaped = escapeRegex(search.trim()).slice(0, SEARCH.MAX_LENGTH);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Category filter by slug — invalid category returns EMPTY results, not all products
    if (category) {
      const catObj = await Category.findOne({ slug: category });
      if (!catObj) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: Number(page),
          products: []
        });
      }
      query.category = catObj._id;
    }

    // SubCategory filter by slug
    if (subCategory) {
      const subCatObj = await SubCategory.findOne({ slug: subCategory });
      if (!subCatObj) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: Number(page),
          products: []
        });
      }
      query.subCategory = subCatObj._id;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // In-Stock availability filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Sort options (whitelist enforced by validator; defense in depth)
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'price-asc') sortOptions = { price: 1 };
    if (sort === 'price-desc') sortOptions = { price: -1 };
    if (sort === 'featured') sortOptions = { isFeatured: -1, createdAt: -1 };

    // Clamp pagination — never allow huge datasets
    const pageNum = Math.min(Math.max(Number(page) || 1, 1), PAGINATION.MAX_PAGE);
    const limitNum = Math.min(Math.max(Number(limit) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .limit(8)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product details by slug
// @route   GET /api/products/:slug
// @access  Public
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products in same category
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Recommend primarily from same sub-category, falling back to same category
    let related = [];
    if (currentProduct.subCategory) {
      related = await Product.find({
        subCategory: currentProduct.subCategory,
        _id: { $ne: currentProduct._id },
        isActive: true
      }).limit(4).populate('category', 'name slug');
    }

    if (related.length < 4) {
      const excludeIds = [currentProduct._id, ...related.map((r) => r._id)];
      const categoryFallback = await Product.find({
        category: currentProduct.category,
        _id: { $nin: excludeIds },
        isActive: true
      }).limit(4 - related.length).populate('category', 'name slug');
      related = [...related, ...categoryFallback];
    }

    res.status(200).json({
      success: true,
      products: related
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN PRODUCT CRUD ---

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, subCategory, images, isFeatured } = req.body;

    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = await generateUniqueSlug(baseSlug);

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      subCategory: subCategory || null,
      images: Array.isArray(images) && images.length > 0 ? images : [PLACEHOLDER_IMAGE],
      isFeatured: Boolean(isFeatured)
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, subCategory, images, isFeatured, isActive } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name;
      // Ensure the new slug is unique (excluding this product itself)
      updateData.slug = await generateUniqueSlug(
        slugify(name, { lower: true, strict: true }),
        req.params.id
      );
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined && price !== '') updateData.price = Number(price);
    if (stock !== undefined && stock !== '') updateData.stock = Number(stock);
    if (category) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory || null;
    if (images && Array.isArray(images)) updateData.images = images;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }

    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ success: true, images: imagePaths });
  } catch (error) {
    next(error);
  }
};
