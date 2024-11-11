const express = require("express");
const { createClient } = require("redis");
const { setupRateLimiter } = require("./middleware/rate-limiter");
const { setupCache } = require("./middleware/cache");
const { fetchPreview } = require("./services/preview");

const app = express();
app.set("trust proxy", "127.0.0.1");
const port = process.env.PORT || 3000;

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Connect to Redis and handle connection
async function startServer() {
  try {
    await redis.connect();
    console.log("Connected to Redis");

    // Middleware
    app.use(await setupRateLimiter(redis));
    app.use(setupCache(redis));

    // Health check endpoint
    app.get("/health", async (req, res) => {
      try {
        // Check Redis connection
        await redis.ping();
        res.status(200).json({ status: "healthy", redis: "connected" });
      } catch (error) {
        res.status(503).json({ status: "unhealthy", redis: "disconnected" });
      }
    });

    // Routes
    app.get("/api/v1/preview", async (req, res) => {
      try {
        const url = req.query.url;
        if (!url) {
          return res.status(400).json({ error: "URL parameter is required" });
        }
        console.log("Fetching preview...");
        const preview = await fetchPreview(url);
        res.json(preview);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    process.exit(1);
  }
}

// Handle Redis errors
redis.on("error", (error) => {
  console.error("Redis Error:", error);
});

startServer();
