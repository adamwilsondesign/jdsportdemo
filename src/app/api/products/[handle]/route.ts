import { NextResponse } from "next/server";
import { getAllProducts, getCompleteTheLook, getColourFamily, getProduct, toCard } from "@/lib/storefront";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ handle: p.handle }));
}

// Storefront-style product query used by client features (cart variant editing, favourites).
export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = getProduct(handle);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    card: toCard(p),
    siblings: getColourFamily(p).map(toCard),
    completeTheLook: getCompleteTheLook(p, 6).map(toCard),
  });
}
