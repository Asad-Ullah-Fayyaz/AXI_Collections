const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const slugify = require('slugify');

// Ambiguous glyphs (0/O, 1/l/I) are excluded so a password copied out of the
// terminal cannot be misread.
const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*-_=+';
const ALPHABET = LETTERS + DIGITS + SYMBOLS;

// Same rule the API enforces in middleware/validators.js: 8+ chars, a letter, a digit.
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const pick = (set) => set[crypto.randomInt(set.length)];

// Cryptographically random password that always satisfies PASSWORD_POLICY.
const generatePassword = (length = 20) => {
  const chars = [pick(LETTERS), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(ALPHABET));
  // Shuffle so the guaranteed characters are not always in the first three slots.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

// Uses the env override if set, otherwise generates one. An override that the API
// would reject is a hard error rather than an account nobody can re-validate later.
const resolvePassword = (envKey) => {
  const override = process.env[envKey];
  if (!override) return generatePassword();
  if (!PASSWORD_POLICY.test(override)) {
    throw new Error(`${envKey} must be at least 8 characters and include a letter and a digit.`);
  }
  return override;
};

const seedData = async () => {
  try {
    // Every collection below is wiped with deleteMany({}). Against a live database
    // that destroys real customer accounts and order history.
    if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
      console.error('[Seeder] Refusing to run with NODE_ENV=production.');
      console.error('[Seeder] This deletes all users, categories, sub-categories and products.');
      console.error('[Seeder] Set SEED_ALLOW_PRODUCTION=true only if you are certain.');
      process.exit(1);
    }

    const adminPassword = resolvePassword('SEED_ADMIN_PASSWORD');
    const customerPassword = resolvePassword('SEED_CUSTOMER_PASSWORD');

    await connectDB();
    console.log('[Seeder] Clearing existing database collections...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await SubCategory.deleteMany({});
    await Product.deleteMany({});

    console.log('[Seeder] Creating admin & customer users...');
    await User.create({
      name: 'AXI Admin',
      email: 'admin@axicollection.com',
      password: adminPassword,
      role: 'admin'
    });

    await User.create({
      name: 'Alexander Wright',
      email: 'customer@axicollection.com',
      password: customerPassword,
      role: 'customer',
      addresses: [{
        fullName: 'Alexander Wright',
        phone: '+92 300 1234567',
        street: 'Suite 404, Grand Avenue',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan',
        isDefault: true
      }]
    });

    console.log('[Seeder] Creating Categories & SubCategories...');
    
    // Category 1: Watches
    const watchesCat = await Category.create({
      name: 'Watches',
      slug: 'watches',
      description: 'Precision horology and luxury timepieces engineered for distinction.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'
    });

    const mensWatches = await SubCategory.create({
      name: "Men's Watches",
      slug: 'mens-watches',
      category: watchesCat._id,
      description: 'Bold chronographs and minimalist dress watches.'
    });

    const womensWatches = await SubCategory.create({
      name: "Women's Watches",
      slug: 'womens-watches',
      category: watchesCat._id,
      description: 'Elegant watch designs adorned with fine metals and sapphire glass.'
    });

    const chronographWatches = await SubCategory.create({
      name: 'Chronograph Watches',
      slug: 'chronograph-watches',
      category: watchesCat._id,
      description: 'High performance precision timekeeping.'
    });

    // Category 2: Glasses
    const glassesCat = await Category.create({
      name: 'Glasses',
      slug: 'glasses',
      description: 'Handcrafted acetate and titanium eyewear designed for clarity and aesthetic impact.',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop'
    });

    const sunglasses = await SubCategory.create({
      name: 'Sunglasses',
      slug: 'sunglasses',
      category: glassesCat._id,
      description: 'UV400 polarized luxury eyewear.'
    });

    const eyeglasses = await SubCategory.create({
      name: 'Eyeglasses',
      slug: 'eyeglasses',
      category: glassesCat._id,
      description: 'Blue-light filtering optical frames.'
    });

    // Category 3: Mobile Accessories
    const accessoriesCat = await Category.create({
      name: 'Mobile Accessories',
      slug: 'mobile-accessories',
      description: 'Refined technical gear, magnetic charging docks, and genuine leather cases.',
      image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop'
    });

    const wirelessChargers = await SubCategory.create({
      name: 'Wireless Chargers',
      slug: 'wireless-chargers',
      category: accessoriesCat._id,
      description: 'Fast wireless charging stands crafted from anodized aluminum.'
    });

    const leatherCases = await SubCategory.create({
      name: 'Leather Cases',
      slug: 'leather-cases',
      category: accessoriesCat._id,
      description: 'Full-grain Italian leather protective cases.'
    });

    console.log('[Seeder] Creating luxury product catalog...');
    const productsData = [
      {
        name: 'AXI Royal Chronograph Obsidian Edition',
        slug: 'axi-royal-chronograph-obsidian-edition',
        description: 'Forged from brushed 316L stainless steel with a matte black dial and anti-reflective sapphire crystal. Features a Japanese quartz movement, 50m water resistance, and an interchangeable genuine leather strap.',
        price: 24900,
        stock: 15,
        category: watchesCat._id,
        subCategory: chronographWatches._id,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Minimalist Silver Mesh Timepiece',
        slug: 'axi-minimalist-silver-mesh-timepiece',
        description: 'An ultra-slim 7mm case profile paired with a flexible stainless steel mesh bracelet. Perfect for modern minimalism and effortless formal wear.',
        price: 18500,
        stock: 22,
        category: watchesCat._id,
        subCategory: mensWatches._id,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Stella Gold Mesh Watch',
        slug: 'axi-stella-gold-mesh-watch',
        description: 'Designed specifically for contemporary elegance. Features a sunray gold dial, scratch-resistant mineral glass, and champagne gold stainless steel mesh strap.',
        price: 21000,
        stock: 10,
        category: watchesCat._id,
        subCategory: womensWatches._id,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Matte Black Aviator Sunglasses',
        slug: 'axi-matte-black-aviator-sunglasses',
        description: 'Classic teardrop silhouette handcrafted with ultra-lightweight titanium frames and Category 3 dark smoke polarized lenses with 100% UV400 protection.',
        price: 14500,
        stock: 18,
        category: glassesCat._id,
        subCategory: sunglasses._id,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Tortoise Shell Optical Eyeglasses',
        slug: 'axi-tortoise-shell-optical-eyeglasses',
        description: 'Premium Italian Mazzucchelli acetate frame with custom spring hinges and anti-blue-light protective lenses to reduce digital eye strain.',
        price: 12900,
        stock: 8,
        category: glassesCat._id,
        subCategory: eyeglasses._id,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Mag-Charge 3-in-1 Aluminum Stand',
        slug: 'axi-mag-charge-3-in-1-aluminum-stand',
        description: 'Simultaneously charge your phone, wireless earbuds, and smartwatch using intelligent 15W MagSafe magnetic fast-charging technology housed in solid CNC aluminum.',
        price: 16800,
        stock: 30,
        category: accessoriesCat._id,
        subCategory: wirelessChargers._id,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1622445268465-843dcb46a9e8?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'AXI Italian Saddle Leather Phone Folio',
        slug: 'axi-italian-saddle-leather-phone-folio',
        description: 'Crafted from vegetable-tanned full grain leather that develops a beautiful patina over time. Includes micro-fiber lining and integrated RFID-blocking card slots.',
        price: 9500,
        stock: 25,
        category: accessoriesCat._id,
        subCategory: leatherCases._id,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1601593378480-827d06637e6f?q=80&w=1000&auto=format&fit=crop'
        ]
      }
    ];

    await Product.insertMany(productsData);

    console.log('[Seeder] Successfully seeded database!');
    console.log('----------------------------------------------------');
    console.log('  Admin     admin@axicollection.com');
    console.log(`            ${adminPassword}`);
    console.log('');
    console.log('  Customer  customer@axicollection.com');
    console.log(`            ${customerPassword}`);
    console.log('----------------------------------------------------');
    console.log('  Passwords are generated fresh on every seed and are stored');
    console.log('  only as bcrypt hashes. This is the one time they are shown.');
    console.log('  To pin them for local development, set SEED_ADMIN_PASSWORD');
    console.log('  and SEED_CUSTOMER_PASSWORD in backend/.env.');
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
