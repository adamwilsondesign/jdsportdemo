import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CollectionView } from "@/components/plp/CollectionView";
import { searchProducts, toCard } from "@/lib/storefront";
import { TOP_BRANDS } from "@/lib/nav";
import { slugify } from "@/lib/format";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const results = searchProducts(q).map(toCard);

  if (!results.length) {
    // useful recovery: categories, popular brands, support (brief §7)
    return (
      <div className="container-jd py-16">
        <h1 className="t-h1">{q ? <>No results for “{q}”</> : "Search"}</h1>
        <p className="t-body mt-3 max-w-xl text-muted">Check the spelling, try a more general term, or start from one of these:</p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <div>
            <p className="t-eyebrow mb-3 text-muted">Popular categories</p>
            <ul className="space-y-2 text-[15px] font-semibold">
              {[
                ["Men's Shoes", "/collections/mens-footwear"],
                ["Women's Shoes", "/collections/womens-footwear"],
                ["Hoodies & Fleece", "/collections/layers"],
                ["Winter Outerwear", "/collections/outerwear"],
                ["Sale", "/collections/sale"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link href={h} className="hover:underline">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="t-eyebrow mb-3 text-muted">Popular brands</p>
            <div className="flex flex-wrap gap-2">
              {TOP_BRANDS.map((b) => (
                <Link key={b} href={`/collections/${slugify(b)}`} className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:border-ink">
                  {b}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="t-eyebrow mb-3 text-muted">Need help?</p>
            <p className="text-[14px]">Our team can help you find a style or size.</p>
            <Link href="/pages/contact" className="btn btn-outline mt-4">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <CollectionView key={q} title={`“${q}”`} description={`Results for “${q}” across products and brands — in-stock styles first.`} products={results} defaultSort="featured" breadcrumb={[{ label: "Home", href: "/" }, { label: "Search" }]} />
    </Suspense>
  );
}
