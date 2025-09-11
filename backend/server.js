const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { createServer } = require("http");

// BullMQ + Bull Board
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { messageQueue } = require("./queues/messageQueue");

// Middleware
const { protect, authorize } = require("./middleware/authMiddleware");

// Routes
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const refreshTokenRoute = require("./routes/refreshTokenRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoute = require("./routes/cartRotutes");
const checkoutRoute = require("./routes/checkoutRoutes");
const orderRoute = require("./routes/orderRoutes");
const messageRoute = require("./routes/messageRoutes");
const lendingRoute = require("./routes/lendingRoutes");

// Admin Routes
const adminProductRoute = require("./routes/Admin/adminProductRoutes");
const adminOrderRoute = require("./routes/Admin/adminOrderRoutes");

// Socket.IO
const { initSocket } = require("./socket/io");

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- Middlewares ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true }));

// --- Socket.IO Initialization ---
initSocket(httpServer);

// --- Bull Board Setup ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(messageQueue)],
  serverAdapter,
});

app.use("/admin/queues", protect, authorize("admin"), serverAdapter.getRouter());

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
connectDB();

// --- Routes ---
app.get("/", (req, res) => res.send("Hi, You are here on Om Kirana"));

app.use("/api/users", userRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/uploads", uploadRoute);
app.use("/api/refresh-token", refreshTokenRoute);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders", orderRoute);
app.use("/api/messages", messageRoute);
app.use("/api/lendings", lendingRoute);

// Admin Routes
app.use("/api/admin/products", adminProductRoute);
app.use("/api/admin/orders", adminOrderRoute);

// --- Start Server ---
const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
