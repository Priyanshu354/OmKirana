const express = require("express");
const Message = require("../models/Message");
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/handleError");

const router = express.Router();

// @route   GET /api/messages/
// @desc    Get chat history
// @access  Private
router.get("/", protect, async (req, res) => {
  const userId = req.user._id.toString();
  const { with: otherUserId, limit = 50, before } = req.query;

  try {
    if (!otherUserId) return res.status(400).json({ message: "Missing 'with' parameter" });

    const query = {
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    };

    if (before) {
      query.ts = { $lt: Number(before) };
    }

    const messages = await Message.find(query)
      .sort({ ts: -1 })
      .limit(Number(limit));

    res.status(200).json({
      messages: messages.reverse(),
      lastMessageTimeStamp: messages.length ? messages[messages.length-1].ts : null,
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
