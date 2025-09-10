const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { v4: uuidv4 } = require("uuid");

// Socket.IO + Redis Adapter
const { Server } = require("socket.io");
const { redisClient, connectRedis } = require("./redis");
const { createAdapter } = require("@socket.io/redis-adapter");

// BullMQ Queue + Bull Board
const { messageQueue } = require("./queues/messageQueue");
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");

// Middleware
const { authorize, protect } = require("./middleware/authMiddleware");

// Routes
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const refreshTokenRoute = require("./routes/refreshTokenRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoute = require("./routes/cartRotutes");
const checkoutRoute = require("./routes/checkoutRoutes");
const orderRoute = require("./routes/orderRoutes");

// Admin Routes
const adminProductRoute = require("./routes/Admin/adminProductRoutes");
const adminOrderRoute = require("./routes/Admin/adminOrderRoutes");

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // restrict in production
    methods: ["GET", "POST"],
  },
});

// --- Middlewares ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true }));

// --- Redis Adapter Setup ---
(async () => {
  await connectRedis();

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Socket.IO Redis Adapter connected");
})();

// --- Socket.IO Events ---
io.on("connection", (socket) => {
  const { userId } = socket.handshake.query;

  if (userId) {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  }

  socket.on("direct", async ({ to, text }) => {
    if (!to || !text) return;

    const msg = {
      messageId: uuidv4(),
      from: socket.userId,
      to,
      text,
      ts: Date.now(),
    };

    // Add job to queue for persistence
    await messageQueue.add("save-message", msg, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    // Real-time emit
    io.to(`user:${to}`).emit("direct", msg);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// --- Bull Board Setup ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(messageQueue)],
  serverAdapter,
});

// Protect Bull Board in production
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

// Admin Routes
app.use("/api/admin/products", adminProductRoute);
app.use("/api/admin/orders", adminOrderRoute);

// --- Start Server ---
const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
