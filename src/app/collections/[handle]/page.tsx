import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionView } from "@/components/plp/CollectionView";
import { COLLECTIONS } from "@/lib/collections";
import { BRANDS, getCollectionDef, getCollectionProducts, toCard } from "@/lib/storefront";
import { slugify } from "@/lib/format";

export function generateStaticParams() {
  return [...COLLECTIONS.map((c) => c.handle), ...BRANDS.map(slugify)].map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const def = getCollectionDef((await params).handle);
  return def ? { title: def.title, description: def.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const def = getCollectionDef(handle);
  if (!def) notFound();
  const products = getCollectionProducts(def).map(toCard);
  const isBrand = !COLLECTIONS.some((c) => c.handle === handle);

  return (
    <Suspense>
      <CollectionView
        title={def.title}
        description={def.description}
        products={products}
        shortcuts={def.shortcuts}
        defaultSort={def.defaultSort}
        breadcrumb={[{ label: "Home", href: "/" }, ...(isBrand ? [{ label: "Brands", href: "/collections/all" }] : []), { label: def.title }]}
        merch={{
          cards: [
            ...(handle !== "only-at-jd" ? [{ href: "/collections/only-at-jd", title: "Only at JD: colourways you won't find anywhere else", cta: "Shop exclusives" }] : []),
            { href: "/products/jordan-1-high-og-black-multi-color", title: "Jordan 1 High OG “Game Royal”", cta: "Shop the release", image: "/campaign/edit-new-release.webp" },
            ...(handle !== "sale" ? [{ href: "/collections/sale", title: "Sale: up to 60% off", cta: "Shop sale", image: "/campaign/edit-adidas.webp" }] : []),
          ],
          banners: [
            { href: "/collections/basketball", title: "Get buckets", copy: "Signature models, retros and court-ready classics.", cta: "Shop Basketball Shoes", image: "/campaign/hero-get-buckets-d.webp" },
            { href: "/collections/layers", title: "Layers on layers", copy: "Oversized hoodies, crews and full-zips for the cold months.", cta: "Shop Hoodies & Fleece", image: "/campaign/hero-layers-d.webp" },
          ],
        }}
      />
    </Suspense>
  );
}
