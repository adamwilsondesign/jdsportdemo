import Link from "next/link";
import { getCollectionDef, getCollectionProducts } from "@/lib/storefront";
import { formatMoney, shopifyImage } from "@/lib/format";
import type { Product } from "@/lib/types";

const pctOff = (p: Product) => {
  const was = Number(p.compareAtPriceRange.maxVariantPrice.amount);
  const now = Number(p.priceRange.minVariantPrice.amount);
  return was > now ? Math.round((1 - now / was) * 100) : 0;
};

/** Full-width sale band between the product recommendations: one headline, three of the deepest
 *  markdowns as proof, and a single CTA (the only link, like the other campaign modules). */
export function SaleBanner() {
  const sale = getCollectionProducts(getCollectionDef("sale")!);
  const picks = [...sale]
    .filter((p) => p.category === "Footwear")
    .sort((a, b) => pctOff(b) - pctOff(a))
    .filter((p, i, arr) => arr.findIndex((q) => q.model === p.model) === i)
    .slice(0, 3);
  const best = Math.max(...sale.map(pctOff));

  return (
    <section aria-labelledby="sale-banner-title" className="container-jd py-6">
      <div className="on-dark relative grid gap-8 overflow-hidden bg-ink p-6 text-white md:grid-cols-[1fr_1.25fr] md:items-center md:p-10 lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgba(255,238,0,0.12),transparent_60%)]" aria-hidden />
        <div className="relative">
          <h2 id="sale-banner-title" className="t-h1">
            Sale: up to <span className="text-jd-yellow">{best}% off</span>
          </h2>
          <p className="t-body mt-3 max-w-md text-white/75">Shoes, clothing and accessories from Nike, adidas, New Balance and more. {sale.length} styles reduced.</p>
          <Link href="/collections/sale" className="btn btn-yellow mt-6">
            Shop the Sale
          </Link>
        </div>
        <ul className="relative grid grid-cols-3 gap-2 md:gap-3" aria-label="Sale highlights">
          {picks.map((p) => (
            <li key={p.handle}>
              <div className="relative aspect-square overflow-hidden bg-image">
                {/* eslint-disable-next-line @next/next/no-img-element -- Shopify CDN thumbnail */}
                <img src={shopifyImage(p.featuredImage.url, 480)} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 bg-sale px-1.5 py-0.5 text-[10.5px] font-bold text-white">−{pctOff(p)}%</span>
              </div>
              <p className="mt-2 truncate text-[12.5px] font-semibold">
                {p.brand} {p.model}
              </p>
              <p className="text-[12.5px] tabular-nums">
                <span className="font-semibold text-[#ff4545]">{formatMoney(Number(p.priceRange.minVariantPrice.amount))}</span>{" "}
                <s className="text-white/50">{formatMoney(Number(p.compareAtPriceRange.maxVariantPrice.amount))}</s>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
