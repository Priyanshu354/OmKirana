const express = require("express");
const Product = require("../models/Product");
const { default: mongoose } = require("mongoose");

const router = express.Router();

// @route   GET api/products
// @desc    Get products with cursor-based pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    let { limit, lastId } = req.query;

    limit = parseInt(limit) || 10;

    let query = {};
    if (lastId) {
      query._id = { $gt: mongoose.Types.ObjectId(lastId) };
    }

    const products = await Product.find(query)
      .sort({ _id: 1 })
      .limit(limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({
      products,
      hasMore: products.length === limit,
      lastId: products.length ? products[products.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// @route   GET api/products/search
// @desc    Get searched products with fuzzy search.
// @access  Public
router.get("/search", async (req, res) => {
  const { q, lastId, limit = 20 } = req.query;
  const parsedLimit = parseInt(limit);

  try {
    if (!q) {
      return res.status(400).json({ error: "Query param 'q' is required" });
    }

    const matchStage = {};
    if (lastId) {
      matchStage._id = { $gt: new mongoose.Types.ObjectId(lastId) };
    }

    const pipeline = [
      {
        $search: {
          index: "productSearchIndex",
          text: {
            query: q,
            path: ["name", "description"],
            fuzzy: { maxEdits: 2, prefixLength: 2 },
          },
        },
      },
      { $match: matchStage },
      { $sort: { _id: 1 } },
      { $limit: parsedLimit },
      {
        $project: {
          name: 1,
          brand: 1,
          category: 1,
          price: 1,
          MRP: 1,
          quantity: 1,
          unit: 1,
          size: 1,
          stock: 1,
          description: 1,
          priceByCustomer: 1,
          createdAt: 1,
          score: { $meta: "searchScore" },
        },
      },
    ];

    const products = await Product.aggregate(pipeline);

    res.status(200).json({
      products,
      hasMore: products.length === parsedLimit,
      lastId: products.length ? products[products.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});





// @route   GET api/products/:id
// @desc    Get a single product
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});






module.exports = router;
