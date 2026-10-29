import type { CardProduct, CardSwatch, CardVariant, CartMerchandise } from "./types";
import { LOW_STOCK_THRESHOLD } from "./format";

export function toMerchandise(card: CardProduct, swatch: CardSwatch | CardProduct, v: CardVariant): CartMerchandise {
  return {
    id: v.id,
    title: v.title,
    price: { amount: swatch.price.toFixed(2), currencyCode: "CAD" },
    compareAtPrice: swatch.compareAt ? { amount: swatch.compareAt.toFixed(2), currencyCode: "CAD" } : null,
    quantityAvailable: v.qty,
    product: {
      handle: swatch.handle,
      brand: card.brand,
      model: card.model,
      colourway: swatch.colourway,
      category: card.category,
      image: swatch.image,
    },
  };
}

/** Factual availability line for cards — derived only from variant inventory (brief §1.5). */
export function availabilityNote(variants: CardVariant[]): { text: string; tone: "warn" | "muted" | "sold" } | null {
  const avail = variants.filter((v) => v.available);
  if (!avail.length) return { text: "Sold out", tone: "sold" };
  if (variants.length === 1) {
    const q = avail[0].qty;
    return q <= LOW_STOCK_THRESHOLD ? { text: `Only ${q} left`, tone: "warn" } : null;
  }
  const low = avail.filter((v) => v.qty <= LOW_STOCK_THRESHOLD);
  if (avail.length / variants.length < 0.4) return { text: `Limited sizes · ${avail.length} of ${variants.length} available`, tone: "warn" };
  if (low.length >= 2) return { text: `Low stock in ${low.length} sizes`, tone: "warn" };
  return null;
}
