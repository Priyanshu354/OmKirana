const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/handleError");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/checkout
// @desc    Create checkout from current cart
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod, deliveryType, shippingAddress, name, mobile } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const existingCheckout = await Checkout.findOne({
      user: userId,
      totalPrice: cart.totalPrice,
      isPaid: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingCheckout) {
      return res.status(400).json({
        message: "You already have an active checkout. Please complete it first.",
        checkout: existingCheckout,
      });
    }

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select("price MRP");
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (let item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) return res.status(400).json({ message: `Product ${item.name} no longer exists` });

      item.price = product.price;
      item.MRP = product.MRP;
    }
    await cart.save();

    const checkout = await Checkout.create({
      user: userId,
      checkoutItems: cart.items,
      paymentMethod,
      deliveryType,
      shippingAddress: deliveryType === "DELIVERY" ? shippingAddress : {},
      name,
      mobile,
      totalPrice: cart.totalPrice,
    });

    if (paymentMethod === "RAZORPAY") {
      const options = {
        amount: cart.totalPrice * 100,
        currency: "INR",
        receipt: `rcpt_${checkout._id}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      checkout.paymentDetails = razorpayOrder;
      await checkout.save();

      return res.status(201).json({
        success: true,
        checkout,
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    res.status(201).json({ success: true, checkout });
  } catch (err) {
    handleError(res, err);
  }
});

// @route   POST /api/checkout/verify
// @desc    Verify Razorpay payment and create order
// @access  Private
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const checkout = await Checkout.findOne({
      "paymentDetails.id": razorpay_order_id,
    });

    if (!checkout) return res.status(404).json({ message: "Checkout not found" });

    if (checkout.isPaid) {
      const existingOrder = await Order.findOne({
        "paymentDetails.razorpayPaymentId": checkout.paymentDetails.razorpayPaymentId,
      });
      return res.status(200).json({ success: true, order: existingOrder });
    }

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = shasum.digest("hex");

    if (expectedSignature !== razorpay_signature) {
      checkout.paymentStatus = "Failed";
      checkout.isPaid = false;
      await checkout.save();
      return res.status(400).json({ message: "Invalid signature, payment verification failed" });
    }

    checkout.paymentStatus = "Paid";
    checkout.isPaid = true;
    checkout.paidAt = new Date();
    checkout.paymentDetails = {
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    };
    await checkout.save();

    const order = await Order.create({
      user: checkout.user,
      orderItems: checkout.checkoutItems,
      shippingAddress: checkout.shippingAddress,
      deliveryType: checkout.deliveryType,
      paymentMethod: checkout.paymentMethod,
      name: checkout.name,
      mobile: checkout.mobile,
      totalPrice: checkout.totalPrice,
      isPaid: true,
      paidAt: checkout.paidAt,
      paymentDetails: checkout.paymentDetails,
    });

    await checkout.deleteOne();

    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;
