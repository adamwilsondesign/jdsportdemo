// Builds src/data/catalog.json from JD Sports Canada's public Shopify product feeds.
//
//   node scripts/build-catalog.mjs --fetch   # refresh scripts/raw/*.json from jdsports.ca
//   node scripts/build-catalog.mjs           # rebuild catalog from the cached raw feeds
//
// Output mirrors the Shopify Storefront API shape (products → variants → selectedOptions,
// MoneyV2 prices, images with dimensions) so the UI reads like a real headless Shopify build.
// Inventory quantities, ratings and store stock are NOT public, so they are generated
// deterministically from the product id and flagged as demo data.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RAW = path.join(ROOT, "scripts/raw");
const OUT = path.join(ROOT, "src/data/catalog.json");

const FEEDS = {
  na1: "new-arrivals?page=1",
  na2: "new-arrivals?page=2",
  na3: "new-arrivals?page=3",
  na4: "new-arrivals?page=4",
  "apparel-new-arrivals": "apparel-new-arrivals",
  "womens-new-arrivals": "womens-new-arrivals",
  "mens-sale": "mens-sale",
  "womens-sale": "womens-sale",
};

async function fetchFeeds() {
  fs.mkdirSync(RAW, { recursive: true });
  for (const [name, handle] of Object.entries(FEEDS)) {
    const [h, q = ""] = handle.split("?");
    const url = `https://jdsports.ca/collections/${h}/products.json?limit=250${q ? "&" + q : ""}`;
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    fs.writeFileSync(path.join(RAW, `${name}.json`), await res.text());
    console.log("fetched", name, res.status);
  }
}

if (process.argv.includes("--fetch")) await fetchFeeds();

const read = (n) => JSON.parse(fs.readFileSync(path.join(RAW, `${n}.json`), "utf8")).products ?? [];

// ---------- helpers ----------
const hash = (s) => {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
};
const tagValue = (tags, key) => {
  for (const t of tags) {
    if (t.startsWith(key + ":")) return t.slice(key.length + 1);
    if (t.startsWith(key + "_")) return t.slice(key.length + 1);
  }
  return null;
};
const money = (amount) => ({ amount: Number(amount).toFixed(2), currencyCode: "CAD" });

const BRAND_NAMES = {
  "Supply and Demand": "Supply & Demand",
  HOODRICH: "Hoodrich",
  Levis: "Levi's",
  Hoka: "HOKA",
  Puma: "PUMA",
  "The North Face": "The North Face",
};
const BRAND_PREFIXES = {
  "Supply & Demand": ["Supply & Demand", "Supply Demand", "Supply and Demand"],
  "Levi's": ["Levi's", "Levis"],
  adidas: ["adidas Originals x Molly-Mae", "adidas Originals", "adidas"],
  "Criminal Damage": ["Criminal Damage"],
  "The North Face": ["The North Face"],
};

const departmentOf = (tags) => tagValue(tags, "Department") ?? "";

function classify(p) {
  const dept = departmentOf(p.tags);
  const gender = /^Mens/.test(dept) ? "Men" : /^Womens/.test(dept) ? "Women" : "Unisex";
  const hierarchy = tagValue(p.tags, "Hierarchy Group") ?? p.product_type;
  const category = /foot/i.test(hierarchy) ? "Footwear" : /access/i.test(hierarchy) ? "Accessories" : "Clothing";
  return { dept, gender, category };
}

function isAdult(p) {
  const d = departmentOf(p.tags);
  if (/Junior|Infant|Child|Kids/i.test(d)) return false;
  if (/Junior|Infant|Kids|Big Kids|Little Kids/i.test(p.title)) return false;
  return /Mens|Womens|Clothing Accessories/.test(d);
}

// ---------- selection ----------
const pool = new Map();
const newArrivalIds = new Set();
for (const f of ["na1", "na2", "na3", "na4", "apparel-new-arrivals", "womens-new-arrivals"]) {
  for (const p of read(f)) {
    if (!isAdult(p) || p.images.length < 3) continue;
    pool.set(p.id, p);
    newArrivalIds.add(p.id);
  }
}

// sale: pick discounted adult products with good imagery and reasonable availability
const saleCandidates = [];
for (const f of ["mens-sale", "womens-sale"]) {
  for (const p of read(f)) {
    if (!isAdult(p) || pool.has(p.id) || p.images.length < 5) continue;
    const v = p.variants;
    const price = Number(v[0].price);
    const cmp = Math.max(...v.map((x) => Number(x.compare_at_price || 0)));
    const avail = v.filter((x) => x.available).length;
    if (cmp > price && avail >= 3 && p.product_type !== "Accessories") saleCandidates.push(p);
  }
}
const saleSeen = new Set();
for (const p of saleCandidates) {
  if (saleSeen.has(p.id)) continue;
  saleSeen.add(p.id);
  if (saleSeen.size > 44) break;
  pool.set(p.id, p);
}

// ---------- naming: separate brand, model and colourway ----------
const raw = [...pool.values()];

// colour vocabulary = every word that appears after " / " in any title
const colourVocab = new Set(
  "Smokey Black White Grey Gray Navy Blue Red Green Pink Brown Silver Gold Cream Sail Bone Ivory Olive Beige Tan Khaki Purple Orange Yellow Multi Metallic Light Dark Pale University Royal Cool Wolf Smoke Iron Off Core Cloud Triple Chalk Linen Sea Salt Slate Stardust Cosmic Platinum Squash Eclipse Jay Glacier Espresso Mushroom Harbor Summit Pure Team Gum Medium Wild Varsity Cobalt Celery Concord Sky Volt Anthracite Pewter Light Army Oil Crimson Lemon Twist Bright Ashen Armory Obsidian Hyper Chrome Venom Baroque Gorge Graphite Photo Sea Foam Milieu Cloudburst Gull Bayberry Concrete Coconut Milk Pumpernickel Dress Blues Oyster Biscuit Desert Berry Moonbeam Neptune Rust Velvet Pink Foam Cave Stone Bitter Chocolate Icy Dawn Ecru Seagrass Airforce Weathervane Lychee Lava Parisian Night Optic Washed Blazer Marl Bordeaux Jet Heather Birch Fir Coffee Aurora Earth Victory Mystic Dates Lilac Keepsake Sachet Skyway Troposphere Flint Elegance Camo Indigo Chestnut Meteorite Pebble Branch Maroon Power Berry True Heat Oxalis Castlerock Raincloud Wonder Strata Crystal Morganite Pearl Collegiate Scarlet Better Alkaline Mint Ash Sunstone Void Seashell Pinksicle Blush Halo Nylon Vintage Sage Tint Glazed Ghost Racer Lucid Semi Bold Arid Truffle Matter Reflection Faded Bird Port Truffle Infrared Fire Flight Club Toro Comet Neutral Oat Shadow Snow Mountain Tea Carbon Charcoal Classic Lime Plum"
    .split(" "),
);
for (const p of raw) {
  const parts = p.title.split(" / ");
  if (parts.length > 1) parts.slice(1).join(" ").split(/[\s/-]+/).forEach((w) => w && colourVocab.add(w));
}
// words that are colour-ish but belong to model names
for (const w of ["Cloud", "Air", "Force", "Max", "Retro", "Low", "Mid", "High", "OG", "SE", "LV8", "Pro", "GTX", "Fleece", "Jacket", "Hoodie", "Tee", "T-Shirt", "Pants", "Crew", "Big", "Ripstop", "Track", "Top", "Polo"]) colourVocab.delete(w);

function stripBrand(title, brand, vendor) {
  let t = title.trim();
  const prefixes = [...(BRAND_PREFIXES[brand] ?? []), brand, vendor];
  for (const pre of prefixes) {
    if (pre && t.toLowerCase().startsWith(pre.toLowerCase() + " ")) {
      t = t.slice(pre.length + 1);
      break;
    }
  }
  if (brand === "Jordan") t = "Jordan " + t; // Jordan reads as part of the model name ("Jordan 1 Mid")
  t = t.replace(/\b(Men's|Women's|Womne's|Woman|Women|Mens|Womens)\s+/g, "");
  t = t.replace(/\bJordan Jordan\b/, "Jordan").replace(/\s+/g, " ").trim();
  return t;
}

function splitModel(name) {
  const slash = name.indexOf(" / ");
  if (slash === -1) return { model: name, colourway: "" };
  const before = name.slice(0, slash).split(" ");
  const after = name.slice(slash + 3).trim();
  let i = before.length;
  while (i > 1 && colourVocab.has(before[i - 1].replace(/[^A-Za-z]/g, "")) && !/\d/.test(before[i - 1])) i--;
  const model = before.slice(0, i).join(" ");
  const colourStart = before.slice(i).join(" ");
  return { model, colourway: [colourStart, after].filter(Boolean).join(" / ") };
}

// hand-tuned names where the title has no reliable model / colour separator
const NAME_OVERRIDES = {
  "adidas-womens-core-black": ["Samba Jane T-Strap", "Core Black"],
  "new-balance-204l-black": ["204L", "Black"],
  "converse-chuck-taylor-throwback-oxford-natural-lin": ["Chuck Taylor Throwback Ox", "Linen / Linen"],
  "new-balance-rebel-v5-alkaline-green": ["FuelCell Rebel V5", "Alkaline Green"],
  "adidas-adizero-evo-sl-grey-two-silver-metallic": ["Adizero Evo SL", "Grey Two / Silver Metallic"],
  "jordan-aj-1-mid-womens-cacao-wow-pearl-white-rust-": ["Jordan 1 Mid", "Cacao Wow / Pearl White - Rust Pink"],
  "the-north-face-kanaga-jacket-matte-aop-grey": ["Kanaga Jacket", "Matte AOP / Grey"],
  "nike-womens-camo-cargo-pant-st-camo-camo-green-pin": ["Camo Cargo Pant", "ST Camo / Camo Green - Pink Rise"],
};

// ---------- sizes ----------
const APPAREL_ORDER = ["3XS", "XXS", "XS", "S/M", "S", "M", "M/L", "L", "L/XL", "XL", "XXL", "3XL", "ONE SIZE"];
const APPAREL_LABEL = { SM: "S", SML: "S", MED: "M", LRG: "L", XLG: "XL", XLRG: "XL", "2XLRG": "XXL", "2XL": "XXL", "3XLRG": "3XL", "2XS": "XXS", ONE: "One Size", OS: "One Size" };
function sizeKey(s) {
  const n = parseFloat(s);
  if (!Number.isNaN(n) && /^\d/.test(s)) return n;
  const i = APPAREL_ORDER.indexOf(s.toUpperCase());
  return i === -1 ? 999 : 100 + i;
}

// ---------- build ----------
const products = raw.map((p) => {
  const vendor = p.vendor;
  const brand = BRAND_NAMES[vendor] ?? vendor;
  const { gender, category, dept } = classify(p);
  const name = stripBrand(p.title, brand, vendor);
  let { model, colourway } = splitModel(name);
  const ov = Object.entries(NAME_OVERRIDES).find(([h]) => p.handle.startsWith(h));
  if (ov) [model, colourway] = ov[1];
  const group = tagValue(p.tags, "Group") ?? tagValue(p.tags, "#.Group");
  const colourFamily = tagValue(p.tags, "Colour") ?? p.options[0]?.values?.[0] ?? "";
  const productClass = tagValue(p.tags, "Class") ?? "";
  const subClass = tagValue(p.tags, "Sub-Class") ?? "";
  const productType = tagValue(p.tags, "Product Type") ?? p.product_type;
  const text = `${p.title} ${productClass} ${subClass}`;
  const style =
    category === "Footwear"
      ? /Outdoor|Boot/i.test(text) ? "Boots & Outdoor"
      : /Sandal|Slide|Clog/i.test(text) ? "Sandals & Slides"
      : /Basketball/i.test(productClass) && /Signature|Performance/i.test(subClass) ? "Basketball"
      : /Basketball/i.test(productClass) ? "Basketball"
      : /Running/i.test(productClass) && /Performance|Technical|Trail|Weatherproof/i.test(subClass) ? "Running"
      : /Skate/i.test(subClass) ? "Skate"
      : /Court/i.test(subClass) ? "Court"
      : "Lifestyle"
    : category === "Clothing"
      ? /Jean/i.test(subClass) ? "Jeans"
      : /Short/i.test(subClass) ? "Shorts"
      : /Bottom/i.test(productClass) ? "Pants & Joggers"
      : /Jacket|Outerwear|Gilet|Parka/i.test(productClass + subClass) ? "Jackets & Coats"
      : /Mid Layer|Sweatshirt/i.test(productClass) ? "Hoodies & Sweatshirts"
      : /Jersey/i.test(subClass) ? "Jerseys"
      : "T-Shirts & Tops"
    : /Beanie/i.test(subClass) ? "Beanies" : /Sock/i.test(productClass) ? "Socks" : "Caps";
  const waterproof = /GTX|Gore-Tex|Waterproof|Weatherized|Weatherproof/i.test(text);
  const sizeTypeRaw = tagValue(p.tags, "Size Type");
  const sizeType = sizeTypeRaw && !/one size/i.test(sizeTypeRaw) ? sizeTypeRaw : (category === "Footwear" ? `${gender === "Women" ? "Womens" : "Mens"} US Sizing` : category === "Accessories" ? "One Size" : "Apparel Sizing");
  const exclusive = p.tags.some((t) => /^Exclusivity[:_]JD$/i.test(t));
  const isNew = newArrivalIds.has(p.id);

  // images: put the merchandised rollover image second
  const rollover = p.tags.find((t) => t.startsWith("Rollover_Img:encoded:"));
  let images = p.images.map((im) => ({
    url: im.src,
    width: im.width,
    height: im.height,
    altText: `${brand} ${model}${colourway ? " in " + colourway : ""}`,
  }));
  if (rollover) {
    const ru = decodeURIComponent(rollover.replace("Rollover_Img:encoded:", "")).split("?")[0];
    const idx = images.findIndex((im) => im.url.split("?")[0] === ru);
    if (idx > 1) images = [images[0], images[idx], ...images.filter((_, k) => k !== 0 && k !== idx)];
  }

  // variants: one per size (JD lists each colourway as its own product)
  const sizeIdx = p.options.findIndex((o) => /size/i.test(o.name));
  const variants = p.variants
    .map((v) => {
      const rawSize = String((sizeIdx >= 0 ? v[`option${sizeIdx + 1}`] : v.option1) ?? "One Size").trim();
      const size = APPAREL_LABEL[rawSize.toUpperCase()] ?? rawSize;
      const r = hash(v.id);
      // demo inventory: deterministic per variant
      const qty = !v.available ? 0 : r < 0.18 ? 1 + Math.floor(r * 15) : 4 + Math.floor(r * 20);
      const cmp = Number(v.compare_at_price || 0);
      return {
        id: `gid://shopify/ProductVariant/${v.id}`,
        title: size,
        sku: v.sku,
        availableForSale: v.available,
        quantityAvailable: qty,
        selectedOptions: [
          { name: "Colour", value: colourway || colourFamily },
          { name: "Size", value: size },
        ],
        price: money(v.price),
        compareAtPrice: cmp > Number(v.price) ? money(cmp) : null,
      };
    })
    .sort((a, b) => sizeKey(a.title) - sizeKey(b.title));

  const prices = variants.map((v) => Number(v.price.amount));
  const cmps = variants.map((v) => Number(v.compareAtPrice?.amount ?? 0));

  // description: split benefit bullets from story copy
  const html = p.body_html ?? "";
  const bullets = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim()).filter(Boolean);
  const story = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim()).filter((s) => s.length > 30);

  // demo reviews for ~65% of products
  const rr = hash("rating" + p.id);
  const reviews = rr < 0.65 ? { rating: Math.round((4 + hash("r2" + p.id) * 0.9) * 10) / 10, count: 3 + Math.floor(hash("r3" + p.id) * 240) } : null;

  return {
    id: `gid://shopify/Product/${p.id}`,
    handle: p.handle,
    title: p.title,
    brand,
    model,
    colourway: colourway || colourFamily,
    colourFamily,
    group: group ?? null,
    gender,
    department: dept,
    category,
    productType,
    productClass,
    style,
    waterproof,
    subClass,
    sizeType,
    exclusive,
    isNew,
    publishedAt: p.published_at,
    styleCode: tagValue(p.tags, "Vendor Style") ?? "",
    features: bullets,
    story,
    images,
    featuredImage: images[0],
    variants,
    priceRange: { minVariantPrice: money(Math.min(...prices)), maxVariantPrice: money(Math.max(...prices)) },
    compareAtPriceRange: { maxVariantPrice: money(Math.max(...cmps)) },
    reviews,
  };
});

// sibling colourways: same brand + model + gender (JD lists each colourway as its own product)
const keyOf = (p) => `${p.brand}|${p.model}|${p.gender}`.toLowerCase();
const groups = new Map();
for (const p of products) {
  const k = keyOf(p);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(p);
}
for (const list of groups.values()) for (const p of list) p.siblings = list.filter((q) => q !== p).map((q) => q.handle);

products.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), source: "https://jdsports.ca", products }, null, 0));

const by = (k) => products.reduce((m, p) => ((m[p[k]] = (m[p[k]] ?? 0) + 1), m), {});
console.log(`wrote ${products.length} products → ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log(by("category"), by("gender"));
console.log("on sale:", products.filter((p) => Number(p.compareAtPriceRange.maxVariantPrice.amount) > 0).length);
console.log("multi-colour groups:", [...groups.values()].filter((l) => l.length > 1).length);
