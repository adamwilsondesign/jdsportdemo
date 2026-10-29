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
        promo={
          handle === "only-at-jd" || handle === "sale"
            ? undefined
            : { href: "/collections/only-at-jd", eyebrow: "Only at JD", title: "Exclusive colourways you won't find anywhere else", cta: "Shop exclusives" }
        }
      />
    </Suspense>
  );
}
