const fetch = require("node-fetch");
const cheerio = require("cheerio");
const dns = require("dns").promises;

const DOMAIN_MAPPINGS = (process.env.DOMAIN_MAPPINGS || "")
  .split(",")
  .reduce((acc, mapping) => {
    if (mapping) {
      // Split by : but handle cases with and without port
      const parts = mapping.split(":");
      const domain = parts[0];
      const ip = parts[1];
      const port = parts.length > 2 ? parts[2] : null;
      acc[domain] = { ip, port };
    }
    return acc;
  }, {});

async function fetchPreview(url) {
  try {
    console.log(`[Preview Service] Starting fetch for URL: ${url}`);
    const urlObj = new URL(url);

    // Check domain mappings
    const mapping = DOMAIN_MAPPINGS[urlObj.hostname];
    if (mapping) {
      console.log(
        `[Preview Service] Using domain mapping for ${urlObj.hostname}: ${
          mapping.ip
        }${mapping.port ? ":" + mapping.port : ""}`
      );
      // Construct new URL using the mapping, only add port if it exists
      const mappedUrl = `http://${mapping.ip}${
        mapping.port ? ":" + mapping.port : ""
      }${urlObj.pathname}${urlObj.search}`;
      url = mappedUrl;
      console.log(`[Preview Service] Mapped URL: ${url}`);
    } else {
      // Original DNS resolution code
      try {
        console.log(`[Preview Service] Resolving DNS for ${urlObj.hostname}`);
        const addresses = await dns.resolve4(urlObj.hostname);
        console.log(`[Preview Service] DNS resolved to:`, addresses);
      } catch (dnsError) {
        console.error(`[Preview Service] DNS resolution failed:`, dnsError);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[Preview Service] Request timed out, aborting...`);
      controller.abort();
    }, 15000); // increased timeout to 15 seconds

    console.log(`[Preview Service] Initiating fetch request`);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0;)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Host: new URL(url).host, // Explicitly set the Host header
      },
      timeout: 15000,
      follow: 5, // follow up to 5 redirects
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
