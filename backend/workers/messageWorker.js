require('dotenv').config();
const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const { redisClient } = require('../redis');
const Message = require('../models/Message');

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ DB connected successfully for BullMQ worker");
  } catch (error) {
    console.error("❌ DB connection failed for BullMQ worker:", error);
    process.exit(1);
  }
};
connectDB();

// --- Worker definition ---
const connection = redisClient.duplicate();

const worker = new Worker(
  'messages',
  async (job) => {
    const { messageId, from, to, text, ts } = job.data;

    // Basic validation
    if (!from || !to || !text) {
      throw new Error("Invalid message payload");
    }

    // Deduplication check
    if (messageId) {
      const exists = await Message.findOne({ messageId });
      if (exists) {
        return { status: 'skipped_duplicate' };
      }
    }

    // Save message to DB
    const doc = new Message({ messageId, from, to, text, ts });
    await doc.save();

    return { status: 'saved', id: doc._id };
  },
  {
    connection,
    concurrency: 5, // process 5 jobs in parallel
    settings: {
      backoffStrategies: {
        // Custom retry delay: exponential up to 30s
        custom: (attemptsMade) => Math.min(1000 * attemptsMade, 30000),
      },
    },
  }
);

// --- Logging ---
worker.on('completed', (job, result) => {
  console.log(`✅ Worker: job ${job.id} completed`, result);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Worker: job ${job.id} failed`, err);
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log("⚠️ Worker shutting down...");
  await worker.close();
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("⚠️ Worker shutting down...");
  await worker.close();
  await mongoose.disconnect();
  process.exit(0);
});
