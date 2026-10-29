export const FREE_SHIPPING_THRESHOLD = 99;
export const RETURNS_SUMMARY = "Full refund within 14 days, exchange within 28 days";
export const LOW_STOCK_THRESHOLD = 3;

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const cadWhole = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

/** $165 for whole dollars, $41.25 otherwise — mirrors Shopify's money_without_trailing_zeros. */
export function formatMoney(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return Number.isInteger(n) ? cadWhole.format(n) : cad.format(n);
}

export function percentOff(price: number, compareAt: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function plural(n: number, one: string, many = one + "s") {
  return `${n.toLocaleString("en-CA")} ${n === 1 ? one : many}`;
}

/** Shopify CDN transform: append width so we never ship 2048px images to a 300px card. */
export function shopifyImage(url: string, width: number) {
  if (!url.includes("cdn.shopify.com")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${width}`;
}

export function shopifySrcSet(url: string, widths = [360, 540, 720, 900, 1200, 1600]) {
  return widths.map((w) => `${shopifyImage(url, w)} ${w}w`).join(", ");
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
