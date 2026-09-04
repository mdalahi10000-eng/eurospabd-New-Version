const fs = require("fs");
const html = fs.readFileSync("maps_full.html", "utf8");

// Search for photos
const photos = [...new Set(html.match(/https:\/\/[^"'\\]+googleusercontent\.com\/p\/[^"'\\]+/g) || [])];
console.log("Photos found count:", photos.length);
console.log("Photos:", photos.slice(0, 10));

// Meta tags
const titleMatch = html.match(/<meta content="([^"]+)" itemprop="name">/);
console.log("Meta title:", titleMatch ? titleMatch[1] : null);

const descMatch = html.match(/<meta content="([^"]+)" itemprop="description">/);
console.log("Meta description:", descMatch ? descMatch[1] : null);

const ogImage = html.match(/<meta content="([^"]+)" property="og:image">/);
console.log("OG Image:", ogImage ? ogImage[1] : null);

// Search for rating and reviews in JSON blobs
const initState = html.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[.+?\]);/);
if (initState) {
  try {
    const parsed = JSON.parse(initState[1]);
    console.log("Parsed init state array length:", parsed.length);
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (typeof item === 'string') {
        if (item.includes("Euro Spa Center")) console.log(`String in index ${i} has Euro Spa Center`);
      } else if (Array.isArray(item)) {
        const str = JSON.stringify(item);
        if (str.includes("Euro Spa Center")) console.log(`Array in index ${i} has Euro Spa Center, len ${str.length}`);
      }
    }
  } catch(e) {
    console.log("Error parsing init state:", e.message);
  }
}
