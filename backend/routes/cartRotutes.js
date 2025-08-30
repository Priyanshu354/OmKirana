const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { v4: uuidv4 } = require("uuid");
const { optionalAuth } = require("../middleware/optionalAuth");
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/handleError");

const router = express.Router();

// Helper to get cart by userId or guestId
const getCart = async (guestId, userId) => {
  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ user: userId });
  }
  if (!cart && guestId) {
    cart = await Cart.findOne({ guestId });
  }
  return cart;
};

// Helper to validate quantity based on product type
const validateQuantity = (quantity, quantityType) => {
  if (typeof quantity !== "number" || quantity <= 0) return false;
  if (quantityType === "packaged" && !Number.isInteger(quantity)) return false;
  return true;
};

// @route    POST api/cart/
// @desc     Add product to cart (create if not exists)
// @access   Public
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?._id || null;
    let guestId = req.cookies.guestId || null;

    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ message: "Invalid productId or quantity" });
    }

    if (!userId && !guestId) {
      guestId = uuidv4();
      res.cookie("guestId", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const product = await Product.findById(productId).select(
      "name images price MRP brand category quantityType"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!validateQuantity(quantity, product.quantityType)) {
      return res.status(400).json({
        message: `Invalid quantity for product type ${product.quantityType}`,
      });
    }

    let cart = await getCart(guestId, userId);
    if (!cart) {
      cart = new Cart({
        user: userId || null,
        guestId: userId ? null : guestId,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        brand: product.brand || "",
        category: product.category || "",
        quantityType: product.quantityType,
        quantity,
        price: product.price,
        MRP: product.MRP,
      });
    }

    if (!userId) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
});

// @route    PUT api/cart/
// @desc     Update quantity or add product
// @access   Public
router.put("/", optionalAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?._id || null;
    let guestId = req.cookies.guestId || null;

    if (!productId || typeof quantity !== "number") {
      return res.status(400).json({ message: "Invalid productId or quantity" });
    }

    const product = await Product.findById(productId).select(
      "name images price MRP brand category quantityType"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!validateQuantity(quantity, product.quantityType)) {
      return res.status(400).json({
        message: `Invalid quantity for product type ${product.quantityType}`,
      });
    }

    const cart = await getCart(guestId, userId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else if (quantity > 0) {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        brand: product.brand || "",
        category: product.category || "",
        quantityType: product.quantityType,
        quantity,
        price: product.price,
        MRP: product.MRP,
      });
    }

    if (!userId) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
});

// @route    GET api/cart/
// @desc     Get current cart (guest or user)
// @access   Public
router.get("/", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const guestId = req.cookies.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({ message: "userId or guestId not provided" });
    }

    const cart = await getCart(guestId, userId);
    if (!cart) return res.status(200).json({ items: [], totalPrice: 0 });

    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
});

// @route    GET api/cart/refresh
// @desc     Refresh cart prices with latest product data
// @access   Public
router.get("/refresh", protect, async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const guestId = req.cookies.guestId || null;
    const cart = await getCart(guestId, userId);

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    for (let item of cart.items) {
      const product = await Product.findById(item.product).select("price MRP");
      if (product) {
        item.price = product.price;
        item.MRP = product.MRP;
      }
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    handleError(res, err);
  }
});

// @route    DELETE api/cart/:productId
// @desc     Remove a single product from cart
// @access   Public
router.delete("/:productId", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const guestId = req.cookies.guestId || null;
    const { productId } = req.params;

    if (!userId && !guestId) {
      return res.status(400).json({ message: "userId or guestId not provided" });
    }

    const cart = await getCart(guestId, userId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    handleError(res, err);
  }
});

// @route    POST api/cart/merge-cart
// @desc     Merge guest cart with user cart
// @access   Private
router.post("/merge-cart", protect, async (req, res) => {
  const userId = req.user?._id;
  const guestId = req.cookies.guestId;

  if (!userId) return res.status(400).json({ message: "User must be logged in" });
  if (!guestId) return res.status(400).json({ message: "Guest cart not found" });

  try {
    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0) {
      return res.status(404).json({ message: "Guest cart is empty" });
    }

    let userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      guestCart.user = userId;
      guestCart.guestId = null;
      await guestCart.save();

      // cleanup cookie
      res.clearCookie("guestId");

      return res.status(200).json(guestCart);
    }

    guestCart.items.forEach((guestItem) => {
      const index = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString()
      );
      if (index > -1) {
        userCart.items[index].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    });

    await userCart.save();
    await guestCart.deleteOne();

    // cleanup cookie
    res.clearCookie("guestId");

    res.status(200).json(userCart);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
