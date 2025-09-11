const mongoose = require("mongoose");

const lendingOrderItemSchema = new mongoose.Schema({
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


const addressSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);


const lendingOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    orderItems: [lendingOrderItemSchema],

    deliveryType: {
      type: String,
      enum: ["DELIVERY", "TAKEAWAY"],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: function () {
        return this.deliveryType === "DELIVERY";
      },
    },

    paymentMethod: {
      type: String,
      enum: ["RAZORPAY", "COD", "LEND"],
      required: true,
    },

    name: { type: String, required: true },
    mobile: { type: String, required: true },
    totalPrice: { type: Number, required: true, min: 1 },

    // Payment details
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Lending"],
      default: "Pending",
    },

    // special for lending partners
    paidAmount: { type: Number, default: 0},

    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentDetails: { type: Object, default: {} },

    // Delivery details
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // Order status
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LendingOrder", lendingOrderSchema);
