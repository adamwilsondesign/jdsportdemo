import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/storefront";

// Lightweight predictive-search index (Shopify's /search/suggest equivalent).
export const dynamic = "force-static";

export function GET() {
  const items = getAllProducts().map((p) => ({
    h: p.handle,
    b: p.brand,
    m: p.model,
    c: p.colourway,
    i: p.featuredImage.url,
    p: Number(p.priceRange.minVariantPrice.amount),
    k: `${p.brand} ${p.model} ${p.colourway} ${p.style} ${p.category} ${p.gender}`.toLowerCase(),
    a: p.variants.some((v) => v.availableForSale),
  }));
  return NextResponse.json(items);
}
