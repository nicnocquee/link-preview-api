const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");

function setupRateLimiter(redis) {
  return rateLimit({
    store: new RedisStore({
      // Use the sendCommand method from the redis client
      sendCommand: async (...args) => redis.sendCommand(args),
    }),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: false,
  });
}

module.exports = { setupRateLimiter };
