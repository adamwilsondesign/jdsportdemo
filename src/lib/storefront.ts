import "server-only";
import catalog from "@/data/catalog.json";
import type { CardProduct, Product } from "./types";
import { COLLECTIONS, brandCollection, type CollectionDef } from "./collections";
import { slugify } from "./format";

// A stand-in for the Shopify Storefront API. Every function here maps 1:1 to a
// Storefront query (product(handle:), collection(handle:){products}, search, productRecommendations)
// so swapping in a live store is a data-layer change only.

const products = catalog.products as unknown as Product[];
const byHandle = new Map(products.map((p) => [p.handle, p]));

export const BRANDS = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));

export function getProduct(handle: string): Product | undefined {
  return byHandle.get(handle);
}

export function getAllProducts() {
  return products;
}

export function getCollectionDef(handle: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.handle === handle) ?? BRANDS.map(brandCollection).find((c) => c.handle === handle);
}

export function getCollectionProducts(def: CollectionDef) {
  return products.filter(def.match);
}

function cardBasics(p: Product) {
  const price = Math.min(...p.variants.map((v) => Number(v.price.amount)));
  const cmp = Number(p.compareAtPriceRange.maxVariantPrice.amount);
  return {
    handle: p.handle,
    colourway: p.colourway,
    colourFamily: p.colourFamily,
    image: p.featuredImage.url,
    hoverImage: p.images[1]?.url ?? null,
    price,
    compareAt: cmp > price ? cmp : null,
    variants: p.variants.map((v) => ({ id: v.id, title: v.title, available: v.availableForSale, qty: v.quantityAvailable })),
  };
}

export function toCard(p: Product): CardProduct {
  return {
    ...cardBasics(p),
    id: p.id,
    brand: p.brand,
    model: p.model,
    category: p.category,
    gender: p.gender,
    style: p.style,
    waterproof: p.waterproof,
    isNew: p.isNew,
    exclusive: p.exclusive,
    publishedAt: p.publishedAt,
    reviews: p.reviews,
    swatches: p.siblings.length ? getColourFamily(p).map(cardBasics) : [],
  };
}

/** The whole colourway family (including p) in a fixed order, so lists never reshuffle on selection. */
export function getColourFamily(p: Product) {
  return [p, ...getSiblings(p)].sort((a, b) => a.id.localeCompare(b.id));
}

export function getSiblings(p: Product) {
  return p.siblings.map((h) => byHandle.get(h)).filter((x): x is Product => !!x);
}

export function searchProducts(q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return products
    .map((p) => {
      const hay = `${p.brand} ${p.model} ${p.colourway} ${p.category} ${p.style} ${p.gender === "Men" ? "mens men's" : p.gender === "Women" ? "womens women's" : ""} ${p.styleCode}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t.replace(/s$/, ""))) return null;
        if (p.brand.toLowerCase().startsWith(t)) score += 3;
        if (p.model.toLowerCase().includes(t)) score += 2;
        score += 1;
      }
      // inventory-aware ranking: demote products with little purchasable stock
      const avail = p.variants.filter((v) => v.availableForSale).length / p.variants.length;
      return { p, score: score + avail };
    })
    .filter((x): x is { p: Product; score: number } => !!x)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

/** One curated "similar" set: same category + style, close in price, different model. */
export function getRecommendations(p: Product, limit = 12) {
  const price = Number(p.priceRange.minVariantPrice.amount);
  return products
    .filter((q) => q.handle !== p.handle && !p.siblings.includes(q.handle) && q.category === p.category && (q.gender === p.gender || q.gender === "Unisex"))
    .map((q) => {
      const qp = Number(q.priceRange.minVariantPrice.amount);
      let s = 0;
      if (q.style === p.style) s += 3;
      if (q.brand === p.brand) s += 1.5;
      s -= Math.abs(qp - price) / 60;
      if (q.variants.some((v) => v.availableForSale)) s += 1;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s)
    .filter((x, i, arr) => arr.findIndex((y) => y.q.model === x.q.model && y.q.brand === x.q.brand) === i)
    .slice(0, limit)
    .map((x) => x.q);
}

/** Distinct "Complete the Look": genuinely complementary categories, not more of the same. */
export function getCompleteTheLook(p: Product, limit = 4) {
  const want: Product["category"][] = p.category === "Footwear" ? ["Clothing", "Accessories"] : p.category === "Clothing" ? ["Clothing", "Footwear"] : ["Footwear", "Clothing"];
  const pool = products.filter((q) => q.handle !== p.handle && want.includes(q.category) && (q.gender === p.gender || q.gender === "Unisex" || p.gender === "Unisex"));
  const scored = pool
    .map((q) => {
      let s = 0;
      if (q.brand === p.brand) s += 3;
      if (q.colourFamily === p.colourFamily) s += 2;
      if (p.category === "Clothing" && q.category === "Clothing" && q.style === p.style) s -= 5; // a hoodie shouldn't suggest more hoodies
      if (p.category === "Clothing" && q.model.split(" ")[0] === p.model.split(" ")[0]) s += 4; // matching sets (e.g. Sirena hoodie + sweatpants)
      if (!q.variants.some((v) => v.availableForSale)) s -= 10;
      s += (parseInt(q.id.slice(-3), 10) % 7) / 10;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s);
  const out: Product[] = [];
  const styles = new Set<string>();
  for (const { q } of scored) {
    if (styles.has(q.style)) continue;
    styles.add(q.style);
    out.push(q);
    if (out.length === limit) break;
  }
  // top up with the next-best picks when there aren't enough distinct styles
  for (const { q } of scored) {
    if (out.length >= limit) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

export function collectionHandleForBrand(brand: string) {
  return slugify(brand);
}
