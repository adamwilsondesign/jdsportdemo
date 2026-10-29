import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView, type SiblingLite } from "@/components/pdp/ProductView";
import { Reviews } from "@/components/pdp/Reviews";
import { ProductRow } from "@/components/home/ProductRow";
import { ProductCard } from "@/components/product/ProductCard";
import { getAllProducts, getColourFamily, getCompleteTheLook, getProduct, getRecommendations, toCard } from "@/lib/storefront";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const p = getProduct((await params).handle);
  if (!p) return {};
  return {
    title: `${p.brand} ${p.model} — ${p.colourway}`,
    description: p.features[0] ?? p.story[0],
    openGraph: { images: [p.featuredImage.url] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();

  const siblings: SiblingLite[] = getColourFamily(product).map((s) => ({
    handle: s.handle,
    colourway: s.colourway,
    image: s.featuredImage.url,
    sizes: s.variants.map((v) => ({ title: v.title, available: v.availableForSale })),
  }));
  const look = getCompleteTheLook(product, 4).map(toCard);
  const similar = getRecommendations(product, 12).map(toCard);

  // Shopify-style structured data for rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model}`,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.styleCode,
    color: product.colourway,
    image: product.images.slice(0, 4).map((i) => i.url),
    ...(product.reviews ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.reviews.rating, reviewCount: product.reviews.count } } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CAD",
      lowPrice: product.priceRange.minVariantPrice.amount,
      highPrice: product.priceRange.maxVariantPrice.amount,
      availability: product.variants.some((v) => v.availableForSale) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense>
        <ProductView key={product.handle} product={product} siblings={siblings} />
      </Suspense>

      {/* Distinct "Complete the Look" — complementary categories, not more of the same (brief §5.C.4) */}
      {look.length > 0 && (
        <section aria-labelledby="ctl-title" className="container-jd mt-16 border-t border-line pt-14">
          <h2 id="ctl-title" className="t-h2">
            Complete the Look
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {look.map((p) => (
              <li key={p.handle}>
                <ProductCard product={p} sizes="(min-width:1024px) 23vw, 48vw" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Reviews product={product} />

      {/* One curated similar-products carousel instead of repeated "You Might Like" modules */}
      <div className="border-t border-line">
        <ProductRow id="similar" title="You Might Also Like" products={similar} viewAll={{ href: `/collections/${product.category === "Footwear" ? "footwear" : product.category === "Clothing" ? "clothing" : "accessories"}?filter.style=${encodeURIComponent(product.style).replace(/%20/g, "+")}`, count: similar.length }} />
      </div>
    </>
  );
}
