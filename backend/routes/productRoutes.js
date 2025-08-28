const express = require("express");
const Product = require("../models/Product");
const { default: mongoose } = require("mongoose");
const handleError = require("../utils/handleError");

const router = express.Router();

// Common projection for all product queries
const commonProjection = {
  _id: 1,
  name: 1,
  brand: 1,
  category: 1,
  MRP: 1,
  price: 1,
  quantity: 1,
  unit: 1,
  size: 1,
  totalReviews: 1,
  description: 1,
  averageRating: 1,
  priceByCustomer: 1,
  stock: {
    $cond: [{ $lte: ["$stock", 10] }, "$stock", "$$REMOVE"],
  },
};

// Helper to execute aggregation with common projection
const aggregateProducts = async (pipeline) => {
  pipeline.push({ $project: commonProjection });
  return await Product.aggregate(pipeline);
};

// Cursor-based pagination helper
const paginate = (docs, limit) => {
  const hasMore = docs.length > limit;
  if (hasMore) docs.pop(); // remove the extra one
  return {
    docs,
    hasMore,
    lastId: docs.length ? docs[docs.length - 1]._id : null,
  };
};

// @route   GET api/products
// @desc    Get products with cursor-based pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    let { limit = 10, lastId } = req.query;
    limit = parseInt(limit);

    const query = {};
    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      query._id = { $gt: new mongoose.Types.ObjectId(lastId) };
    }

    const products = await aggregateProducts([
      { $match: query },
      { $sort: { _id: 1 } },
      { $limit: limit + 1 },
    ]);

    const { docs, hasMore, lastId: newLastId } = paginate(products, limit);

    res.status(200).json({
      data: docs,
      meta: { hasMore, lastId: newLastId, limit },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET api/products/filter
// @desc    Search + filter + sort with cursor-based pagination
// @access  Public
router.get("/filter", async (req, res) => {
  try {
    const {
      search,
      brand,
      category,
      minPrice,
      maxPrice,
      size,
      sortByPrice,
      sortByRating,
      limit = 20,
      lastId,
    } = req.query;

    const parsedLimit = parseInt(limit);
    const filterConditions = [];
    const mustConditions = [];

    if (search) {
      mustConditions.push({
        text: {
          query: search,
          path: ["name", "brand"],
          fuzzy: { maxEdits: 2, prefixLength: 2 },
        },
      });
    }

    if (brand) filterConditions.push({ term: { path: "brand", query: brand } });
    if (category) filterConditions.push({ term: { path: "category", query: category } });
    if (size) filterConditions.push({ term: { path: "size", query: size } });

    if (minPrice || maxPrice) {
      const priceRange = {};
      if (minPrice) priceRange.gte = parseFloat(minPrice);
      if (maxPrice) priceRange.lte = parseFloat(maxPrice);
      filterConditions.push({ range: { path: "price", ...priceRange } });
    }

    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      filterConditions.push({ range: { path: "_id", gt: new mongoose.Types.ObjectId(lastId) } });
    }

    const pipeline = [];

    if (mustConditions.length || filterConditions.length) {
      pipeline.push({
        $search: {
          index: "productSearchIndex",
          compound: { must: mustConditions, filter: filterConditions },
        },
      });
    }

    if (sortByRating) pipeline.push({ $sort: { averageRating: sortByRating === "asc" ? 1 : -1 } });
    else if (sortByPrice) pipeline.push({ $sort: { price: sortByPrice === "asc" ? 1 : -1 } });
    else pipeline.push({ $sort: { _id: 1 } });

    pipeline.push({ $limit: parsedLimit + 1 });

    const products = await aggregateProducts(pipeline);
    const { docs, hasMore, lastId: newLastId } = paginate(products, parsedLimit);

    res.status(200).json({
      data: docs,
      meta: { hasMore, lastId: newLastId, limit: parsedLimit },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route    GET api/products/auto-complete
// @desc     Get product name/brand suggestions
// @access   Public
router.get("/auto-complete", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit, 10);

    if (!q) {
      return res.status(400).json({ message: "Query param 'q' is required" });
    }

    const suggestions = await Product.aggregate([
      {
        $search: {
          index: "productSearchIndex",
          compound: {
            should: [
              {
                autocomplete: {
                  query: q,
                  path: "name",
                  fuzzy: { maxEdits: 1, prefixLength: 1 },
                },
              },
              {
                autocomplete: {
                  query: q,
                  path: "brand",
                  fuzzy: { maxEdits: 1, prefixLength: 1 },
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          brand: 1,
          score: { $meta: "searchScore" },
        },
      },
      { $limit: parsedLimit },
    ]);

    res.status(200).json({
      data: suggestions,
      meta: { count: suggestions.length },
    });
  } catch (error) {
    console.error("Auto-complete error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

// @route   GET api/products/similar
// @desc    Get similar products by category
// @access  Public
router.get("/similar", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query param 'q' is required" });

    const products = await aggregateProducts([{ $match: { category: q } }, { $limit: 20 }]);

    res.status(200).json({
      data: products,
      meta: { count: products.length },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET api/products/best-seller
// @desc    Get top-selling products
// @access  Public
router.get("/best-seller", async (req, res) => {
  try {
    const products = await aggregateProducts([
      { $sort: { orderCount: -1, averageRating: -1 } },
      { $limit: 20 },
    ]);

    res.status(200).json({
      data: products,
      meta: { count: products.length },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid product ID" });

    const product = await aggregateProducts([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
    ]);

    if (!product.length) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ data: product[0] });
  } catch (error) {
    handleError(res, error);
  }
});

// @route    GET api/products/new-arrival
// @desc     Get new arrivals with cursor-based pagination
// @access   Public
router.get("/new-arrival", async (req, res) => {
  try {
    let { limit = 10, lastId } = req.query;
    limit = parseInt(limit, 10);

    const query = {};
    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      query._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    const newArrivals = await Product.aggregate([
      { $match: query },
      { $sort: { _id: -1 } },
      { $limit: limit + 1 },
      { $project: commonProjection },
    ]);

    const { docs, hasMore, lastId: newLastId } = paginate(newArrivals, limit);

    res.status(200).json({
      data: docs,
      meta: { hasMore, lastId: newLastId, limit },
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
