const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Grocery",
        "Beverages",
        "Snacks",
        "Personal Care",
        "Household",
        "Dairy & Bakery",
        "Spices & Masala",
        "Oil & Ghee",
        "Packaged Food",
      ],
    },
    MRP: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.MRP;
        },
        message: "Price cannot be greater than MRP",
      },
    },
    quantityType: {
      type: String,
      required: true,
      enum: ["packaged", "loose"],
    },
    quantity: {
      type: Number,
      default: function () {
        return this.quantityType === "packed" ? 1 : null;
      },
      validate: {
        validator: function (value) {
          return value === null || value > 0;
        },
        message: "Quantity must be greater than 0",
      },
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "ltr", "ml", "pcs", "pack", "dozen"],
    },
    size: {
      type: String,
      enum: ["Small", "Medium", "Large", "XL"],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      url: {
        type: [String],
        required: true,
        validate: {
          validator: function (urls) {
            return (
              urls.length > 0 &&
              urls.every((url) => typeof url === "string" && url.trim() !== "")
            );
          },
          message: "At least one valid image URL is required",
        },
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priceByCustomer: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
