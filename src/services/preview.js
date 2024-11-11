const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function fetchPreview(url) {
  try {
    console.log(`Starting fetch for URL: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0;)",
      },
      timeout: 10000,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Fetched URL, status: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") || $("title").text() || "";
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const image = $('meta[property="og:image"]').attr("content") || "";

    console.log("Successfully parsed preview data");

    return {
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      url,
    };
  } catch (error) {
    console.error("Error in fetchPreview:", error);
    throw new Error(`Failed to fetch preview: ${error.message}`);
  }
}

module.exports = { fetchPreview };
