import type { CardProduct } from "./types";
import type { SortKey } from "./collections";
import { percentOff } from "./format";
import { sizeGroupOf, sizeSortKey } from "./sizes";

// Shopify-style filter params: ?filter.brand=Nike&filter.size=Shoes:10&sort_by=price-asc&page=2

export type FacetKey = "availability" | "category" | "gender" | "style" | "brand" | "size" | "colour" | "price" | "discount" | "exclusive" | "feature";

export const FACET_LABELS: Record<FacetKey, string> = {
  availability: "Availability",
  category: "Category",
  gender: "Gender",
  style: "Style",
  brand: "Brand",
  size: "Size",
  colour: "Colour",
  price: "Price",
  discount: "Discount",
  exclusive: "Exclusives",
  feature: "Features",
};

export const FACET_ORDER: FacetKey[] = ["availability", "category", "gender", "style", "size", "brand", "colour", "price", "discount", "exclusive", "feature"];

export type Filters = Partial<Record<FacetKey, string[]>>;

export const PRICE_BUCKETS: { label: string; test: (n: number) => boolean }[] = [
  { label: "Under $75", test: (n) => n < 75 },
  { label: "$75 – $125", test: (n) => n >= 75 && n < 125 },
  { label: "$125 – $175", test: (n) => n >= 125 && n < 175 },
  { label: "$175 – $250", test: (n) => n >= 175 && n < 250 },
  { label: "$250 and up", test: (n) => n >= 250 },
];

export const DISCOUNT_BUCKETS: { label: string; test: (n: number) => boolean }[] = [
  { label: "Up to 30% off", test: (n) => n > 0 && n < 30 },
  { label: "30% – 49% off", test: (n) => n >= 30 && n < 50 },
  { label: "50% off or more", test: (n) => n >= 50 },
];

export const COLOUR_SWATCH: Record<string, string> = {
  Black: "#111111",
  White: "#ffffff",
  Grey: "#9a9a9a",
  Blue: "#2f5fb3",
  Navy: "#1f2a44",
  Red: "#c8102e",
  Green: "#3c7a46",
  Pink: "#f2a7c3",
  Brown: "#7b4b2a",
  Beige: "#d9c7a7",
  Cream: "#f1e8d2",
  Purple: "#6b4c9a",
  Orange: "#ef7d22",
  Yellow: "#ffd400",
  Multi: "conic-gradient(#e33,#fd0,#3b5,#39f,#a3f,#e33)",
  Silver: "linear-gradient(135deg,#eee,#9b9b9b,#eee)",
  Gold: "linear-gradient(135deg,#f6e27a,#b8902f,#f6e27a)",
};

export function parseFilters(sp: URLSearchParams): Filters {
  const f: Filters = {};
  for (const [k, v] of sp.entries()) {
    if (!k.startsWith("filter.")) continue;
    const key = k.slice(7) as FacetKey;
    if (!FACET_LABELS[key]) continue;
    (f[key] ??= []).push(v);
  }
  return f;
}

export function activeCount(f: Filters) {
  return Object.values(f).reduce((n, v) => n + (v?.length ?? 0), 0);
}

const sizeValues = (p: CardProduct, onlyAvailable: boolean) =>
  p.variants.filter((v) => !onlyAvailable || v.available).map((v) => `${sizeGroupOf(p.category)}:${v.title}`);

/** Values a product contributes to each facet. */
function valuesFor(p: CardProduct, key: FacetKey, f: Filters): string[] {
  switch (key) {
    case "availability":
      return p.variants.some((v) => v.available) ? ["In stock"] : [];
    case "category":
      return [p.category];
    case "gender":
      return [p.gender];
    case "style":
      return [p.style];
    case "brand":
      return [p.brand];
    case "size":
      return sizeValues(p, !!f.availability?.length);
    case "colour":
      return [p.colourFamily];
    case "price":
      return PRICE_BUCKETS.filter((b) => b.test(p.price)).map((b) => b.label);
    case "discount": {
      const pct = percentOff(p.price, p.compareAt);
      return DISCOUNT_BUCKETS.filter((b) => b.test(pct)).map((b) => b.label);
    }
    case "exclusive":
      return p.exclusive ? ["Only at JD"] : [];
    case "feature":
      return [...(p.waterproof ? ["Waterproof"] : []), ...(p.isNew ? ["New arrival"] : []), ...(p.compareAt ? ["On sale"] : [])];
  }
}

function matches(p: CardProduct, f: Filters, skip?: FacetKey) {
  for (const key of FACET_ORDER) {
    if (key === skip) continue;
    const sel = f[key];
    if (!sel?.length) continue;
    const vals = valuesFor(p, key, f);
    if (key === "availability") {
      // In stock: at least one purchasable variant in the selected sizes (or any size)
      const sizes = f.size;
      const ok = p.variants.some((v) => v.available && (!sizes?.length || sizes.includes(`${sizeGroupOf(p.category)}:${v.title}`)));
      if (!ok) return false;
      continue;
    }
    if (!sel.some((s) => vals.includes(s))) return false;
  }
  return true;
}

export function applyFilters(products: CardProduct[], f: Filters) {
  return products.filter((p) => matches(p, f));
}

export type FacetValue = { value: string; count: number; selected: boolean };

/** Disjunctive facet counts: each group counts against every *other* active filter. */
export function computeFacets(products: CardProduct[], f: Filters) {
  const out: Partial<Record<FacetKey, FacetValue[]>> = {};
  for (const key of FACET_ORDER) {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (!matches(p, f, key)) continue;
      for (const v of new Set(valuesFor(p, key, f))) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    for (const s of f[key] ?? []) if (!counts.has(s)) counts.set(s, 0);
    const list = [...counts.entries()].map(([value, count]) => ({ value, count, selected: !!f[key]?.includes(value) }));
    if (key === "price") list.sort((a, b) => PRICE_BUCKETS.findIndex((x) => x.label === a.value) - PRICE_BUCKETS.findIndex((x) => x.label === b.value));
    else if (key === "discount") list.sort((a, b) => DISCOUNT_BUCKETS.findIndex((x) => x.label === a.value) - DISCOUNT_BUCKETS.findIndex((x) => x.label === b.value));
    else if (key === "size") list.sort((a, b) => sizeSortKey(a.value.split(":")[1]) - sizeSortKey(b.value.split(":")[1]));
    else if (key === "brand") list.sort((a, b) => a.value.localeCompare(b.value));
    else list.sort((a, b) => b.count - a.count);
    out[key] = list;
  }
  return out;
}

export function sortProducts(list: CardProduct[], sort: SortKey) {
  const arr = [...list];
  const stockScore = (p: CardProduct) => p.variants.filter((v) => v.available).length / Math.max(1, p.variants.length);
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "discount":
      return arr.sort((a, b) => percentOff(b.price, b.compareAt) - percentOff(a.price, a.compareAt));
    case "rating":
      return arr.sort((a, b) => (b.reviews?.rating ?? 0) * Math.log(2 + (b.reviews?.count ?? 0)) - (a.reviews?.rating ?? 0) * Math.log(2 + (a.reviews?.count ?? 0)));
    default:
      // featured: interleave categories so the grid reads as merchandised, push low-availability down
      return arr.sort((a, b) => stockScore(b) * 0.6 + (b.exclusive ? 0.2 : 0) + (b.isNew ? 0.2 : 0) - (stockScore(a) * 0.6 + (a.exclusive ? 0.2 : 0) + (a.isNew ? 0.2 : 0)));
  }
}

export function displayValue(key: FacetKey, value: string) {
  if (key === "size") {
    const [group, size] = value.split(":");
    return group === "Shoes" ? `Shoe ${size}` : group === "Accessories" ? `Acc. ${size}` : size;
  }
  return value;
}
