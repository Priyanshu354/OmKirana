const { Queue } = require('bullmq');
const { redisClient } = require('../redis');

const connection = redisClient.duplicate(); // BullMQ wants its own connection

// Note: do not connect here — BullMQ will manage the connection internally.
// But for clarity we provide the connection options using the duplicate client’s options.

const messageQueue = new Queue('messages', { connection });

module.exports = { messageQueue };
