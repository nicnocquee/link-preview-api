const fetch = require("node-fetch");
const cheerio = require("cheerio");
const https = require("https");
const dns = require("dns").promises;

// Function to check if IP is private/local
function isPrivateIP(ip) {
  // Convert IP to parts
  const parts = ip.split(".").map((part) => parseInt(part, 10));

  return (
    parts[0] === 127 || // localhost
    parts[0] === 10 || // Class A private network
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // Class B private network
    (parts[0] === 192 && parts[1] === 168) // Class C private network
  );
}

async function fetchPreview(url) {
  try {
    console.log(`[Preview Service] Starting fetch for URL: ${url}`);

    const urlObj = new URL(url);

    // Try to lookup using the system's resolver (including hosts file)
    let isLocalDomain = false;
    try {
      const lookupResult = await new Promise((resolve, reject) => {
        require("dns").lookup(urlObj.hostname, (err, address, family) => {
          if (err) reject(err);
          else resolve({ address, family });
        });
      });

      console.log(`[Preview Service] DNS lookup resolved to:`, lookupResult);
      isLocalDomain =
        lookupResult.address === "127.0.0.1" ||
        lookupResult.address === "localhost" ||
        lookupResult.address.startsWith("192.168.") ||
        lookupResult.address.startsWith("10.") ||
        (lookupResult.address.startsWith("172.") &&
          parseInt(lookupResult.address.split(".")[1]) >= 16 &&
          parseInt(lookupResult.address.split(".")[1]) <= 31);

      console.log(`[Preview Service] Is local domain: ${isLocalDomain}`);
    } catch (dnsError) {
      console.error(`[Preview Service] DNS lookup failed:`, dnsError);
    }

    const agent = isLocalDomain
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[Preview Service] Request timed out, aborting...`);
      controller.abort();
    }, 15000);

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
        Host: urlObj.host,
      },
      agent: agent,
      timeout: 15000,
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
