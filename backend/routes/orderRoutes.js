const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/handleError");
const mongoose = require("mongoose");

const router = express.Router();

// @route   GET /api/orders/my
// @desc    Get current user's orders with cursor pagination and optional date range
// @access  Private
router.get("/my", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let { cursor, limit = 10, startDate, endDate } = req.query;
    limit = parseInt(limit);

    const query = { user: userId };

    if (cursor) {
      query.createdAt = { ...query.createdAt, $lt: new Date(cursor) };
    }

    if (startDate) {
      query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    let hasMore = false;
    if (orders.length > limit) {
      hasMore = true;
      orders.pop();
    }

    res.status(200).json({
      orders,
      hasMore,
      nextCursor: hasMore ? orders[orders.length - 1].createdAt : null,
    });
  } catch (err) {
    handleError(res, err);
  }
});


// @route   GET /api/orders/:id
// @desc    Get a single order by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(order);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
