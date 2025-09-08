const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv");
const { createServer } = require("http");

// Socket.IO + Redis Adapter
const { Server } = require("socket.io");
const { redisClient, connectRedis } = require('./redis');
const { createAdapter } = require("@socket.io/redis-adapter");

// Import Models
const Message = require("./models/Message");

// User Routes
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
    origin: "*", // change in production
    methods: "*",
  }
});

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


io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;

  if (userId) {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  }

  socket.on('direct', async ({ to, text }) => {
    if (!to || !text) return;

    const msg = { from: socket.userId, text, ts: Date.now() };

    Message.create({ from: socket.userId, to, text })
      .catch(err => console.error("Failed to save message:", err));

    io.to(`user:${to}`).emit('direct', msg);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connected Successfully");
  } catch (error) {
    console.error("DB connection failed:", error);
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

const port = process.env.PORT || 3000;
httpServer.listen(port, () => console.log(`🚀 Server is listening on PORT ${port}`));
