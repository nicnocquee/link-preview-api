function setupCache(redis) {
  return async (req, res, next) => {
    if (!req.query.url) return next();

    const cacheKey = `preview:${req.query.url}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store the original send function
      const originalSend = res.send;
      res.send = function (body) {
        // Only cache if response status is 200
        if (res.statusCode === 200) {
          redis.set(
            cacheKey,
            body,
            "EX",
            parseInt(process.env.CACHE_DURATION) || 3600 // 1 hour default
          );
        }

        // Call the original send function
        originalSend.call(this, body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { setupCache };
