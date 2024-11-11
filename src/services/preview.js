const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function fetchPreview(url) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $("title").text() || $('meta[property="og:title"]').attr("content");
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content");
  const image = $('meta[property="og:image"]').attr("content");

  return {
    title: title || "",
    description: description || "",
    image: image || "",
    url,
  };
}

module.exports = { fetchPreview };
