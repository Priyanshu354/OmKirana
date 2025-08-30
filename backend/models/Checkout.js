const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  brand: { type: String, default: "" },
  category: { type: String, default: "" },
  quantityType: { type: String, enum: ["loose", "packaged"], required: true },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        if (value <= 0) return false;
        if (this.quantityType === "packaged") return Number.isInteger(value);
        return true;
      },
      message: "Quantity must be > 0 and an integer if packaged",
    },
  },
  price: { type: Number, required: true, min: 0 },
  MRP: { type: Number, required: true, min: 0 },
});

// Address Schema for Delivery orders
const addressSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const checkoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    checkoutItems: [checkoutItemSchema],

    paymentMethod: {
      type: String,
      enum: ["RAZORPAY", "COD"],
      required: true,
    },

    deliveryType: {
      type: String,
      enum: ["DELIVERY", "TAKEAWAY"],
      required: true,
    },

    shippingAddress: {
      type: addressSchema,
      required: function () {
        return this.deliveryType === "DELIVERY";
      },
    },
    
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    totalPrice: { type: Number, required: true },

    // Payment details
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    isPaid: { type: Boolean, default: false },
    paymentDetails: { type: Object, default: {} },
    paidAt: { type: Date },


    expiresAt: {
        type: Date,
        default: () => Date.now() + 30 * 60 * 1000,
        index: { expires: 0 },
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Checkout", checkoutSchema);
