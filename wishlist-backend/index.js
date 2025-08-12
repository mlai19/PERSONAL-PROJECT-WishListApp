// const express = require("express");
// const cors = require("cors");
// const axios = require("axios");
// const cheerio = require("cheerio");

// const app = express();
// app.use(cors());
// app.use(express.json());

// const apiKey = "59914157de9245cf95b6fb66e610c51e";

// function extractPriceFromHtml(html) {
//   const $ = cheerio.load(html);

//   // JSON-LD Product schema
//   try {
//     $('script[type="application/ld+json"]').each((_, el) => {
//       const raw = $(el).contents().text();
//       const parsed = JSON.parse(raw);
//       const arr = Array.isArray(parsed) ? parsed : [parsed];
//       for (const x of arr) {
//         if (x["@type"] === "Product") {
//           const offer = Array.isArray(x.offers) ? x.offers[0] : x.offers;
//           const p = offer?.price || offer?.priceSpecification?.price;
//           if (p) throw p; // quick escape with value
//         }
//       }
//     });
//   } catch (p) {
//     if (typeof p === "string" || typeof p === "number") return String(p);
//   }

//   // Common meta tags
//   const meta =
//     $('meta[property="product:price:amount"]').attr("content") ||
//     $('meta[property="og:price:amount"]').attr("content") ||
//     $('meta[name="twitter:data1"]').attr("content");
//   if (meta) return meta.replace(/[^\d.,]/g, "");

//   // Common selectors
//   const guesses = [
//     ".a-price .a-offscreen",
//     "#priceblock_ourprice",
//     "#priceblock_dealprice",
//     ".product-price",
//     ".price--main",
//     ".current-price",
//     ".sale-price",
//     '[itemprop="price"]',
//     'meta[itemprop="price"]',
//   ];
//   for (const sel of guesses) {
//     const el = $(sel).first();
//     const v = (el.attr("content") || el.text() || "").trim();
//     if (v) return v.replace(/[^\d.,]/g, "");
//   }

//   // Fallback
//   const m = html.match(/[$€£]\s?\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?/);
//   return m ? m[0].replace(/[^\d.,]/g, "") : null;
// }

// app.post("/preview", async (req, res) => {
//   const { url } = req.body;
//   try {
//     const lp = await axios.get(
//       `https://api.linkpreview.net/?key=${apiKey}&q=${url}`,
//       { timeout: 8000 }
//     );
//     const image = lp.data?.image || null;

//     const page = await axios.get(url, {
//       timeout: 8000,
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
//         "Accept-Language": "en-US,en;q=0.9",
//       },
//     });

//     const price = extractPriceFromHtml(page.data);
//     res.json({ image, price });
//   } catch (e) {
//     console.error("Preview/price failed:", e?.response?.status || e.message);
//     res.status(200).json({ image: null, price: null }); // fail soft
//   }
// });

// app.listen(5001, () => console.log("Server running on 5001"));


const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = "59914157de9245cf95b6fb66e610c51e"; // consider moving to process.env

// ---------- helpers ----------
const cache = new Map(); // url -> { image, price, ts }
const TTL_MS = 1000 * 60 * 60; // 1 hour

async function backoff(fn, { tries = 3, startMs = 600 } = {}) {
  let delay = startMs;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const code = e?.response?.status;
      if (code !== 429 || i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

function extractOgImage(html) {
  const $ = cheerio.load(html);
  return (
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null
  );
}

function extractPriceFromHtml(html) {
  const $ = cheerio.load(html);

  // JSON-LD Product schema
  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const x of arr) {
        if (x && x["@type"] === "Product") {
          const offer = Array.isArray(x.offers) ? x.offers[0] : x.offers;
          const p = offer?.price || offer?.priceSpecification?.price;
          if (p) throw p; // escape with value
        }
      }
    });
  } catch (p) {
    if (typeof p === "string" || typeof p === "number") return String(p);
  }

  // Common meta tags
  const meta =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content") ||
    $('meta[name="twitter:data1"]').attr("content");
  if (meta) return meta.replace(/[^\d.,]/g, "");

  // Common selectors
  const guesses = [
    ".a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    ".product-price",
    ".price--main",
    ".current-price",
    ".sale-price",
    '[itemprop="price"]',
    'meta[itemprop="price"]',
  ];
  for (const sel of guesses) {
    const el = $(sel).first();
    const v = (el.attr("content") || el.text() || "").trim();
    if (v) return v.replace(/[^\d.,]/g, "");
  }

  // Fallback: first currency-looking token
  const m = html.match(/[$€£]\s?\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?/);
  return m ? m[0].replace(/[^\d.,]/g, "") : null;
}

// ---------- route ----------
app.post("/preview", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ image: null, price: null });

  // Serve from cache if fresh
  const hit = cache.get(url);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return res.json({ image: hit.image, price: hit.price });
  }

  try {
    // 1) Fetch the product page once (cheap + avoids LinkPreview limit)
    let pageHtml = null;
    let image = null;
    let price = null;

    await backoff(async () => {
      const resp = await axios.get(url, {
        timeout: 8000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      pageHtml = resp.data;
    });

    if (pageHtml) {
      image = extractOgImage(pageHtml);      // try OG image from the page
      price = extractPriceFromHtml(pageHtml); // try to parse price
    }

    // 2) Fallback for image via LinkPreview ONLY if still missing
    if (!image) {
      try {
        await backoff(async () => {
          const lp = await axios.get(
            `https://api.linkpreview.net/?key=${apiKey}&q=${encodeURIComponent(url)}`,
            { timeout: 8000 }
          );
          image = lp.data?.image || null;
        });
      } catch (e) {
        console.error("LinkPreview failed:", e?.response?.status || e.message);
      }
    }

    const payload = { image, price };
    cache.set(url, { ...payload, ts: Date.now() });
    res.json(payload);
  } catch (e) {
    console.error("Preview/price failed:", e?.response?.status || e.message);
    res.status(200).json({ image: null, price: null }); // fail soft
  }
});

app.get("/", (_req, res) => res.send("OK"));
app.listen(5001, () => console.log("Server running on 5001"));
