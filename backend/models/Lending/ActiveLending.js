const mongoose = require("mongoose");

const activeLendingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lendedorders: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LendingOrder",
        required: true,
    },
    currentTotalDue: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActiveLending", activeLendingSchema);
