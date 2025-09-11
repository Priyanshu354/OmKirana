const { Server } = require("socket.io");
const { redisClient, connectRedis } = require("../redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { messageQueue } = require("../queues/messageQueue");
const { v4: uuidv4 } = require("uuid");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // restrict in production
      methods: ["GET", "POST"],
    },
  });

  // --- Redis Adapter ---
  (async () => {
    await connectRedis();
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Socket.IO Redis Adapter connected");
  })();

  // --- JWT Middleware ---
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) return next(new Error("Unauthorized"));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // --- Connection Events ---
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    socket.on("direct", async ({ to, text }) => {
      if (!to || !text) return;

      const msg = {
        messageId: uuidv4(),
        from: socket.userId,
        to,
        text,
        ts: Date.now(),
      };

      await messageQueue.add("save-message", msg, {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      });

      io.to(`user:${to}`).emit("direct", msg);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = { initSocket, io };
