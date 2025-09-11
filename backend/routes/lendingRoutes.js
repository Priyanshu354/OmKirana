const express = require("express");
const ClosedLending = require("../models/Lending/CloseLending");
const ActiveLending = require("../models/Lending/ActiveLending");
const { protect, authLending } = require("../middleware/authMiddleware");
const handleError = require("../utils/handleError");
const paginate = require("../utils/paginate");
const getLimit = require("../utils/getLimit");

const router = express.Router();


// @route    api/lendings/:id/active-lendings/custom-date
// @desc     Filter Active Lending with custom date (YY-MM-DD)
// @access   private (auth Lending)
router.get("/:id/active-lendings/custom-date", protect, authLending, async (req, res) => {
  const { id } = req.params;
  const { limit = 20, lastId: lastIdQuery, startDate, endDate } = req.query;
  const parsedLimit = getLimit(limit);

  try {
    let query = { user: id };

    if (lastIdQuery) {
      query._id = { $lt: lastIdQuery };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activeLendings = await ActiveLending.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1);

    const { docs, hasMore, lastId: lastIdResult } = paginate(activeLendings.reverse(), parsedLimit);

    res.status(200).json({ docs, hasMore, lastId: lastIdResult });
  } catch (error) {
    handleError(res, error);
  }
});


// @route    api/lendings/:id/close-lendings/custom-date/
// @desc     Filter Close Lending with custom date (YY-MM-DD)
// @access   private (auth Lending)
router.get("/:id/close-lendings/custom-date", protect, authLending, async (req, res) => {
  const { id } = req.params;
  const { limit = 20, lastId: lastIdQuery, startDate, endDate } = req.query;

  const parsedLimit = getLimit(limit);

  try {
    let query = { user: id };
    if (lastIdQuery) query._id = { $lt: lastIdQuery };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const closeLendings = await ClosedLending.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1);

    const { docs, hasMore, lastId: lastIdResult } = paginate(closeLendings, parsedLimit);

    res.status(200).json({ docs, hasMore, lastId: lastIdResult });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   api/lendings/:id/active-lendings
// @desc    active lending for a user
// @access  private (auth Lending)
router.get("/:id/active-lendings", protect, authLending, async (req, res) => {
  const { id } = req.params;
  const { limit, lastId: lastIdQuery } = req.query;
  const parsedLimit = getLimit(limit);

  try {
    let query = { user: id };

    if (lastIdQuery) {
      query._id = { $lt: lastIdQuery };
    }

    const activeLendings = await ActiveLending.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1);

    const { docs, hasMore, lastId: lastIdResult } = paginate(
      activeLendings.reverse(),
      parsedLimit
    );

    res.status(200).json({
      docs,
      hasMore,
      lastId: lastIdResult,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   api/lendings/:id/close-lendings
// @desc    close lending for a user
// @access  private (auth Lending)
router.get("/:id/close-lendings", protect, authLending, async (req, res) => {
  const { id } = req.params;
  const { limit, lastId: lastIdQuery } = req.query;
  const parsedLimit = getLimit(limit);

  try {
    let query = { user: id };

    if (lastIdQuery) {
      query._id = { $lt: lastIdQuery };
    }

    const closeLendings = await ClosedLending.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1);

    const { docs, hasMore, lastId: lastIdResult } = paginate(closeLendings, parsedLimit);

    res.status(200).json({
      docs,
      hasMore,
      lastId: lastIdResult,
    });
  } catch (error) {
    handleError(res, error);
  }
});



module.exports = router;
