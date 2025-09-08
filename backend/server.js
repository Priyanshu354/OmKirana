const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv");
const { createServer } = require("http");

// SoketIo + redisClient
const { Server } = require("socket.io");
const { redisClient, connectRedis } = require('./redis');

// User Routes Import
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const refreshTokenRoute = require("./routes/refreshTokenRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoute = require("./routes/cartRotutes");
const checkoutRoute = require("./routes/checkoutRoutes");
const orderRoute = require("./routes/orderRoutes");

// Admin Routes Import
const adminProductRoute = require("./routes/Admin/adminProductRoutes");
const adminOrderRoute = require("./routes/Admin/adminOrderRoutes");

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // change it in production
    methods: "*",
  }
});

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "*", // change it in production
    credentials: true,
  })
);

(async () => {
  await connectRedis();

  const sub = redisClient.duplicate();
  await sub.connect();

  await sub.subscribe('direct-chat', (raw) => {
    const {to , message} = JSON.parse(raw);
    io.to(`user:${to}`).emit('direct',{message});
  });
})();


io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;

  if (userId) {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    //console.log(`Socket ${socket.id} joined room user:${userId}`);
  }

  socket.on('direct', async ({ to, text }) => {
    if (!to || !text) return;

    const msg = { from: socket.userId, text, ts: Date.now() };
    
    await Message.create({ from: socket.userId, to, text });

    io.to(`user:${to}`).emit('direct', msg);
    await redisClient.publish('direct-chat', JSON.stringify({ to, message: msg }));
  });

  socket.on('disconnect', () => {
    //console.log('Socket disconnected', socket.id);
  });
});

const port = process.env.PORT;

// Connection to MongoDB
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

app.get("/", (req, res) => {
    res.send("Hi, You are here on Om Kirana");
});

app.use("/api/users", userRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/uploads", uploadRoute);
app.use("/api/refresh-token", refreshTokenRoute);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders" , orderRoute);

// Admin Routes
app.use("/api/admin/products", adminProductRoute);  
app.use("/api/admin/orders", adminOrderRoute);

httpServer.listen(port, () => console.log(`🚀 Server is listening on PORT ${port}`));
