const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const {
  createCategory,
  deleteCategory,
  getCategories,
  toggleCategoryStatus,
  updateCategory
} = require('../src/controllers/categoryController');
const { getProducts } = require('../src/controllers/productController');
const { getProductCountsByCategory } = require('../src/controllers/adminController');
const {
  findSiblingDuplicates,
  hasSiblingIndex,
  isNameOnlyUniqueIndex
} = require('../src/scripts/migrateCategoryUniqueness');

const siblingNameIndex = Category.schema.indexes().find(
  ([keys, options]) =>
    keys.level === 1 &&
    keys.parent === 1 &&
    keys.name === 1 &&
    options.unique === true
);

test('category schema has case-insensitive sibling uniqueness', () => {
  assert.ok(siblingNameIndex);
  assert.deepEqual(siblingNameIndex[1].collation, { locale: 'en', strength: 2 });
});

test('category model preserves a controller-generated unique slug', async () => {
  const category = new Category({
    name: 'Pants',
    slug: 'pants-1',
    level: 2,
    parent: new mongoose.Types.ObjectId()
  });

  await category.validate();
  assert.equal(category.slug, 'pants-1');
});

test('migration preflight scopes trimmed, case-insensitive names to their parents', () => {
  const parentMen = new mongoose.Types.ObjectId();
  const parentWomen = new mongoose.Types.ObjectId();
  const categories = [
    { _id: new mongoose.Types.ObjectId(), name: 'Pants', level: 2, parent: parentMen },
    { _id: new mongoose.Types.ObjectId(), name: ' pants ', level: 2, parent: parentMen },
    { _id: new mongoose.Types.ObjectId(), name: 'Pants', level: 2, parent: parentWomen }
  ];

  const duplicates = findSiblingDuplicates(categories);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].parent, parentMen.toString());
});

test('migration identifies only obsolete global category-name indexes', () => {
  assert.equal(isNameOnlyUniqueIndex({ unique: true, key: { name: 1 } }), true);
  assert.equal(isNameOnlyUniqueIndex({ unique: false, key: { name: 1 } }), false);
  assert.equal(
    isNameOnlyUniqueIndex({ unique: true, key: { level: 1, parent: 1, name: 1 } }),
    false
  );
});

test('migration recognizes the case-insensitive sibling index', () => {
  assert.equal(
    hasSiblingIndex([
      {
        unique: true,
        key: { level: 1, parent: 1, name: 1 },
        collation: { locale: 'en', strength: 2 }
      }
    ]),
    true
  );
  assert.equal(
    hasSiblingIndex([
      {
        unique: true,
        key: { level: 1, parent: 1, name: 1 },
        collation: { locale: 'en', strength: 1 }
      }
    ]),
    false
  );
});

const testMongoUri = process.env.MONGODB_TEST_URI;

if (testMongoUri) {
  describe('category hierarchy database integration', () => {
    const categoryIds = [];
    const productIds = [];
    const suffix = new mongoose.Types.ObjectId().toString().slice(-8);

    const invoke = (handler, req) =>
      new Promise((resolve, reject) => {
        let statusCode = 200;
        handler(
          req,
          {
            status(code) {
              statusCode = code;
              return this;
            },
            json(body) {
              resolve({ status: statusCode, body });
            }
          },
          reject
        );
      });

    const createCategoryForTest = async (name, level, parent) => {
      const result = await invoke(createCategory, {
        body: { name, level, ...(parent ? { parent: parent.toString() } : {}) }
      });
      if (result.body.category) categoryIds.push(result.body.category._id);
      return result;
    };

    const createProductForTest = async (category, name) => {
      const product = await Product.create({
        name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${suffix}`,
        description: 'Category filtering test product',
        price: 10,
        stock: 1,
        category,
        images: ['/images/product-placeholder.svg']
      });
      productIds.push(product._id);
      return product;
    };

    before(async () => {
      const databaseName = new URL(testMongoUri).pathname.replace(/^\//, '');
      if (!databaseName.toLowerCase().includes('test')) {
        throw new Error('MONGODB_TEST_URI must point to an isolated database with "test" in its name');
      }
      await mongoose.connect(testMongoUri, { autoIndex: false });
      await Category.createIndexes();
      await Product.createIndexes();
    });

    after(async () => {
      if (mongoose.connection.readyState !== 0) {
        if (productIds.length > 0) await Product.deleteMany({ _id: { $in: productIds } });
        if (categoryIds.length > 0) await Category.deleteMany({ _id: { $in: categoryIds } });
        await mongoose.disconnect();
      }
    });

    test('creation, filtering, validation, and category mutations respect parent IDs', async () => {
      const men = (await createCategoryForTest(`Men ${suffix}`, 1)).body.category;
      const women = (await createCategoryForTest(`Women ${suffix}`, 1)).body.category;
      assert.equal((await createCategoryForTest(` men ${suffix} `, 1)).status, 409);
      const pantsName = `Pants ${suffix}`;
      const menPants = (await createCategoryForTest(pantsName, 2, men._id)).body.category;
      const womenPants = (await createCategoryForTest(pantsName, 2, women._id)).body.category;

      assert.notEqual(menPants._id.toString(), womenPants._id.toString());
      assert.notEqual(menPants.slug, womenPants.slug);
      assert.equal((await createCategoryForTest(pantsName.toUpperCase(), 2, men._id)).status, 409);

      const concurrentName = `Concurrent ${suffix}`;
      const concurrentResults = await Promise.all([
        createCategoryForTest(concurrentName, 2, men._id),
        createCategoryForTest(concurrentName, 2, men._id)
      ]);
      assert.deepEqual(
        concurrentResults.map((result) => result.status).sort(),
        [201, 409]
      );

      const crossBranchConcurrentName = `Concurrent branch ${suffix}`;
      const concurrentOtherParent = await Promise.all([
        createCategoryForTest(crossBranchConcurrentName, 2, men._id),
        createCategoryForTest(crossBranchConcurrentName, 2, women._id)
      ]);
      assert.deepEqual(
        concurrentOtherParent.map((result) => result.status).sort(),
        [201, 201]
      );
      assert.notEqual(
        concurrentOtherParent[0].body.category.slug,
        concurrentOtherParent[1].body.category.slug
      );

      const menShirts = (await createCategoryForTest(`Shirts ${suffix}`, 2, men._id)).body.category;
      const duplicateNameUpdate = await invoke(updateCategory, {
        params: { id: menShirts._id.toString() },
        body: { name: pantsName.toUpperCase() }
      });
      assert.equal(duplicateNameUpdate.status, 409);

      const renameTarget = `Rename target ${suffix}`;
      const createdWithWhitespace = await createCategoryForTest(
        ` ${renameTarget} `,
        2,
        women._id
      );
      assert.equal(createdWithWhitespace.body.category.name, renameTarget);
      const renameResult = await invoke(updateCategory, {
        params: { id: menShirts._id.toString() },
        body: { name: ` ${renameTarget} ` }
      });
      assert.equal(renameResult.status, 200);
      assert.equal(renameResult.body.category.name, renameTarget);

      const jeansName = `Jeans ${suffix}`;
      const menJeans = (await createCategoryForTest(jeansName, 3, menPants._id)).body.category;
      const womenJeans = (await createCategoryForTest(jeansName, 3, womenPants._id)).body.category;
      assert.notEqual(menJeans._id.toString(), womenJeans._id.toString());
      assert.equal((await createCategoryForTest(jeansName.toUpperCase(), 3, menPants._id)).status, 409);

      assert.equal((await createCategoryForTest(`Missing L2 ${suffix}`, 2)).status, 400);
      assert.equal(
        (
          await invoke(createCategory, {
            body: { name: `Malformed parent ${suffix}`, parent: 'not-an-object-id' }
          })
        ).status,
        400
      );
      assert.equal(
        (
          await createCategoryForTest(
            `Invalid parent ${suffix}`,
            2,
            new mongoose.Types.ObjectId()
          )
        ).status,
        404
      );
      assert.equal(
        (await createCategoryForTest(`L2 parent is invalid ${suffix}`, 2, menPants._id)).status,
        400
      );
      assert.equal((await createCategoryForTest(`Wrong L3 ${suffix}`, 3, men._id)).status, 400);
      assert.equal((await createCategoryForTest(`Too deep ${suffix}`, 1, menJeans._id)).status, 400);

      const menPantsProduct = await createProductForTest(menPants._id, `Men Pants ${suffix}`);
      const menJeansProduct = await createProductForTest(menJeans._id, `Men Jeans ${suffix}`);
      const womenPantsProduct = await createProductForTest(womenPants._id, `Women Pants ${suffix}`);
      const womenJeansProduct = await createProductForTest(womenJeans._id, `Women Jeans ${suffix}`);

      const menResults = await invoke(getProducts, {
        query: { category: menPants._id.toString(), limit: '100' }
      });
      assert.deepEqual(
        new Set(menResults.body.products.map((product) => product._id.toString())),
        new Set([menPantsProduct._id.toString(), menJeansProduct._id.toString()])
      );
      const womenResults = await invoke(getProducts, {
        query: { category: womenPants._id.toString(), limit: '100' }
      });
      assert.deepEqual(
        new Set(womenResults.body.products.map((product) => product._id.toString())),
        new Set([womenPantsProduct._id.toString(), womenJeansProduct._id.toString()])
      );
      const menJeansResults = await invoke(getProducts, {
        query: { category: menJeans._id.toString(), limit: '100' }
      });
      assert.deepEqual(
        menJeansResults.body.products.map((product) => product._id.toString()),
        [menJeansProduct._id.toString()]
      );

      const treeResult = await invoke(getCategories, { query: {} });
      const menNode = treeResult.body.categories.find((node) => node._id.toString() === men._id.toString());
      const womenNode = treeResult.body.categories.find((node) => node._id.toString() === women._id.toString());
      assert.ok(menNode.children.some((node) => node._id.toString() === menPants._id.toString()));
      assert.ok(womenNode.children.some((node) => node._id.toString() === womenPants._id.toString()));

      const countResult = await invoke(getProductCountsByCategory, { query: {} });
      assert.equal(countResult.body.byCategory[menPants._id.toString()], 2);
      assert.equal(countResult.body.byCategory[womenPants._id.toString()], 2);
      assert.equal(countResult.body.byCategory[menPants.slug], 2);
      assert.equal(countResult.body.byCategory[womenPants.slug], 2);

      const updateResult = await invoke(updateCategory, {
        params: { id: womenPants._id.toString() },
        body: { image: '/uploads/category-banner.jpg' }
      });
      assert.equal(updateResult.status, 200);
      assert.equal(updateResult.body.category.image, '/uploads/category-banner.jpg');

      const toggleResult = await invoke(toggleCategoryStatus, {
        params: { id: womenPants._id.toString() }
      });
      assert.equal(toggleResult.status, 200);
      assert.equal(toggleResult.body.category.isActive, false);
      const disabledResults = await invoke(getProducts, {
        query: { category: womenPants._id.toString() }
      });
      assert.equal(disabledResults.body.total, 0);
      await invoke(toggleCategoryStatus, { params: { id: womenPants._id.toString() } });

      const blockedDelete = await invoke(deleteCategory, {
        params: { id: men._id.toString() }
      });
      assert.equal(blockedDelete.status, 400);

      const removable = (await createCategoryForTest(`Removable ${suffix}`, 1)).body.category;
      const removableChild = (
        await createCategoryForTest(`Removable child ${suffix}`, 2, removable._id)
      ).body.category;
      const deleteResult = await invoke(deleteCategory, {
        params: { id: removable._id.toString() }
      });
      assert.equal(deleteResult.status, 200);
      assert.equal(deleteResult.body.deletedCount, 2);
      assert.ok(categoryIds.some((id) => id.toString() === removableChild._id.toString()));
    });
  });
} else {
  test('category hierarchy database integration (set MONGODB_TEST_URI)', { skip: true }, () => {});
}
