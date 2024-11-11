const express = require("express");
const cors = require("express");
const { createClient } = require("redis");
const { setupRateLimiter } = require("./middleware/rate-limiter");
const { setupCache } = require("./middleware/cache");
const { fetchPreview } = require("./services/preview");

const app = express();
app.set("trust proxy", "127.0.0.1");
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

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
      console.log("===== New Preview Request =====");
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`IP: ${req.ip}`);

      try {
        const url = req.query.url;
        console.log(`Requested URL: ${url}`);

        if (!url) {
          console.log("Error: No URL provided");
          return res.status(400).json({ error: "URL parameter is required" });
        }

        console.log("Calling fetchPreview...");
        const preview = await fetchPreview(url);
        console.log("Preview successful:", preview);
        res.json(preview);
      } catch (error) {
        console.error("Route handler error:", {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });
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
