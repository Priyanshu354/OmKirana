const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "",
  },
  quantityType: {
    type: String,
    enum: ["loose", "packaged"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        if (value <= 0) return false;
        if (this.quantityType === "packaged") {
          return Number.isInteger(value);
        }
        return true;
      },
      message: "Quantity must be greater than 0 and integer if packaged",
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  MRP: {
    type: Number,
    required: true,
    min: 0,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return this.user
          ? null
          : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      },
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
