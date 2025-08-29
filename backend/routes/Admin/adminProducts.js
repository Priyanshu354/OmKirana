const express = require("express");
const mongoose = require("mongoose");
const Product = require("../../models/Product");
const handleError = require("../../utils/handleError");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/admin/products
// @desc    Get all the products (Admin Only)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    let { limit = 10, lastId } = req.query;
    limit = parseInt(limit);

    const query = {};
    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      query._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    const products = await Product.find(query)
      .sort({ _id: -1 })
      .limit(limit);

    res.status(200).json({
      data: products,
      meta: {
        hasMore: products.length === limit,
        lastId: products.length ? products[products.length - 1]._id : null,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});


// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private (Admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  const {
    name,
    brand,
    category,
    MRP,
    price,
    quantity,
    quantityType,
    unit,
    size,
    stock,
    image,
    description,
    priceByCustomer,
  } = req.body;

  try {
    const product = new Product({
      name,
      brand,
      category,
      MRP,
      price,
      quantity,
      unit,
      size,
      stock,
      image,
      description,
      priceByCustomer,
      averageRating: 0,
      totalReviews: 0,
      orderCount: 0,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    handleError(res, error);
  }
});


// @route   PUT /api/admin/products/:id
// @desc    Update/replace the product
// @access  Private (Admin)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    brand,
    category,
    MRP,
    price,
    quantity,
    quantityType,
    unit,
    size,
    stock,
    image,
    description,
    priceByCustomer,
  } = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name;
    product.brand = brand;
    product.category = category;
    product.MRP = MRP;
    product.price = price;
    product.quantity = quantity;
    product.quantityType = quantityType;
    product.unit = unit;
    product.size = size;
    product.stock = stock;
    product.image = image;
    product.description = description;
    product.priceByCustomer = priceByCustomer;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    handleError(res, error);
  }
});


// @route    DELETE /api/admin/products/:id
// @desc     Delete a product
// @access   Private (Admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product Not Found" });
    }

    res.status(200).json({
      message: "Product Deleted Successfully",
      deletedProduct,
    });
  } catch (error) {
    handleError(res, error);
  }
});


// @route   GET /api/admin/products/search
// @desc    Search products with cursor pagination (Admin Only)
// @access  Private (Admin)
router.get("/search", protect, authorize("admin"), async (req, res) => {
  try {
    let { q, limit = 10, lastId } = req.query;
    limit = parseInt(limit);

    const pipeline = [
      {
        $search: {
          index: "productSearchIndex",
          text: {
            query: q,
            path: ["name", "brand"],
            fuzzy: { maxEdits: 1, prefixLength: 1 },
          },
        },
      },
      { $limit: limit + 1 },
    ];

    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      pipeline.unshift({
        $match: { _id: { $lt: new mongoose.Types.ObjectId(lastId) } },
      });
    }

    const products = await Product.aggregate(pipeline);

    const hasMore = products.length > limit;
    if (hasMore) products.pop();

    res.status(200).json({
      data: products,
      meta: {
        hasMore,
        lastId: products.length ? products[products.length - 1]._id : null,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
