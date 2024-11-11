const fetch = require("node-fetch");
const cheerio = require("cheerio");
const https = require("https");
const dns = require("dns").promises;

// Get local domains from env var
const localDomains = (process.env.LOCAL_DOMAINS || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

async function fetchPreview(url) {
  try {
    console.log(`[Preview Service] Starting fetch for URL: ${url}`);
    const urlObj = new URL(url);

    // Check if domain is in LOCAL_DOMAINS list
    const isLocalDomain = localDomains.includes(urlObj.hostname);
    console.log(`[Preview Service] Is local domain: ${isLocalDomain}`);

    const agent = isLocalDomain
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[Preview Service] Request timed out, aborting...`);
      controller.abort();
    }, 30000); // Increased timeout to 30 seconds

    console.log(
      `[Preview Service] Initiating fetch request with${
        isLocalDomain ? " local" : " external"
      } domain config`
    );
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0;)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      agent: agent,
      timeout: 30000,
      follow: 5,
    });
    clearTimeout(timeout);

    console.log(`[Preview Service] Response received:`, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`[Preview Service] HTML received, length: ${html.length}`);

    const $ = cheerio.load(html);

    const result = {
      title:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        "",
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "",
      image: $('meta[property="og:image"]').attr("content") || "",
      url,
    };

    console.log(`[Preview Service] Parsed preview data:`, result);
    return result;
  } catch (error) {
    console.error("[Preview Service] Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = { fetchPreview };
