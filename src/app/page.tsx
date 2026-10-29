import Image from "next/image";
import Link from "next/link";
import { Hero, type HeroContent } from "@/components/home/Hero";
import { ProductRow } from "@/components/home/ProductRow";
import { SectionHeading, ShoppableLook } from "@/components/home/HomeModules";
import { getAllProducts, getCollectionDef, getCollectionProducts, getProduct, toCard } from "@/lib/storefront";
import { shopifyImage, slugify } from "@/lib/format";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { Product } from "@/lib/types";

const HERO: HeroContent = {
  eyebrow: "Winter outerwear",
  headline: "Puffers, parkas and insulated jackets from The North Face, Nike, Supply & Demand and more.",
  desktop: "/campaign/hero-brave-the-cold-d.webp",
  mobile: "/campaign/hero-brave-the-cold-m.webp",
  alt: "Brave the Cold — models in black puffer jackets against a blue studio backdrop",
  cta: { label: "Shop Outerwear", href: "/collections/outerwear" },
};

type Editorial = { img: string; light?: boolean; position?: string; title: string; copy: string; cta: string; href: string };

/** Big-photography editorial pair: headline, one line of copy, named CTA. */
function EditorialPair({ items, label }: { items: Editorial[]; label: string }) {
  return (
    <section aria-label={label} className="container-jd py-4">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((e) => (
          <Link key={e.title} href={e.href} className="group relative block aspect-[4/5] overflow-hidden bg-image md:aspect-[5/6]">
            <Image src={e.img} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" style={e.position ? { objectPosition: e.position } : undefined} />
            <div className={`absolute inset-x-0 ${e.light ? "top-0 p-6 md:p-10" : "bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 pt-28 text-white md:p-10 md:pt-40"}`}>
              <h3 className="t-h2 max-w-md">{e.title}</h3>
              <p className={`mt-2 max-w-sm text-[14px] ${e.light ? "text-muted" : "text-white/85"}`}>{e.copy}</p>
              <span className={`btn mt-5 h-11 min-h-0 ${e.light ? "btn-primary" : "btn-yellow"}`}>{e.cta}</span>
            </div>
            <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

const byHandles = (hs: string[]) => hs.map(getProduct).filter((p): p is Product => !!p);

export default function HomePage() {
  const all = getAllProducts();
  const newArrivals = getCollectionProducts(getCollectionDef("new-arrivals")!).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  // one card per model family keeps the rail varied
  const dedupe = (list: Product[]) => list.filter((p, i, arr) => arr.findIndex((q) => q.model === p.model && q.brand === p.brand) === i);
  const sale = getCollectionProducts(getCollectionDef("sale")!);
  const exclusives = getCollectionProducts(getCollectionDef("only-at-jd")!).filter((p) => p.category !== "Accessories");

  const count = (pred: (p: Product) => boolean) => all.filter(pred).length;
  const categories = [
    { label: "Men's Shoes", href: "/collections/mens-footwear", image: "/campaign/cat-mens-shoes.webp", n: count((p) => p.category === "Footwear" && p.gender === "Men") },
    { label: "Women's Shoes", href: "/collections/womens-footwear", image: "/campaign/cat-womens-shoes.webp", n: count((p) => p.category === "Footwear" && p.gender === "Women") },
    { label: "Men's Clothing", href: "/collections/mens-clothing", image: "/campaign/cat-mens-clothing.webp", n: count((p) => p.category === "Clothing" && p.gender === "Men") },
    { label: "Women's Clothing", href: "/collections/womens-clothing", image: "/campaign/cat-womens-clothing.webp", n: count((p) => p.category === "Clothing" && p.gender === "Women") },
    { label: "Caps & Accessories", href: "/collections/accessories", image: shopifyImage(getProduct("new-era-toronto-maple-leafs-9forty-a-frame-chrome-black")?.featuredImage.url ?? all.find((p) => p.category === "Accessories")!.featuredImage.url, 800), n: count((p) => p.category === "Accessories") },
  ];

  const brandTiles = ["Nike", "Jordan", "adidas", "New Balance", "The North Face", "PUMA"].map((b) => {
    const list = all.filter((p) => p.brand === b);
    const hero = list.find((p) => p.category === "Footwear" && p.variants.some((v) => v.availableForSale)) ?? list[0];
    return { brand: b, count: list.length, image: hero?.featuredImage.url };
  });

  const ugg = byHandles(["ugg-finnian-luxefluff-moto-jacket-chestnut", "levis-womens-middy-balloon-twisted-vibe-indigo", "ugg-womens-tasman-ii-black"]).map(toCard);
  const hotspots = [
    { x: 40, y: 40, label: "Jacket" },
    { x: 57, y: 62, label: "Jeans" },
    { x: 56, y: 83, label: "Slippers" },
  ].map((h, i) => ({ ...h, product: ugg[i] }));

  const byDiscount = [...sale].sort((a, b) => Number(b.compareAtPriceRange.maxVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount) - (Number(a.compareAtPriceRange.maxVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount)));

  return (
    <>
      <Hero content={HERO} />

      <section aria-labelledby="cat-title" className="container-jd pt-12 md:pt-16">
        <SectionHeading id="cat-title" title="Shop by Category" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto overflow-y-hidden px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6 md:gap-4">
          {categories.map((c) => (
            <Link key={c.label} href={c.href} className="group w-[42%] shrink-0 snap-start md:w-auto">
              <div className="relative aspect-square overflow-hidden bg-image">
                <Image src={c.image} alt="" fill unoptimized={c.image.startsWith("http")} sizes="(min-width:1024px) 16vw, (min-width:768px) 30vw, 42vw" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
              </div>
              <p className="mt-3 text-[14px] font-bold">{c.label}</p>
              <p className="t-meta">{c.n} styles</p>
            </Link>
          ))}
          <Link href="/collections/sale" className="group w-[42%] shrink-0 snap-start md:w-auto">
            <div className="relative grid aspect-square place-items-center overflow-hidden bg-ink p-4 text-center">
              <div>
                <p className="t-eyebrow text-jd-yellow">Up to</p>
                <p className="text-[clamp(2.75rem,5vw,4rem)] font-extrabold leading-none text-white">60%</p>
                <p className="t-eyebrow mt-1 text-white">off</p>
              </div>
              <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
            </div>
            <p className="mt-3 text-[14px] font-bold text-sale">Sale</p>
            <p className="t-meta">{sale.length} styles reduced</p>
          </Link>
        </div>
      </section>

      <ProductRow id="new" title="New Arrivals" products={dedupe(newArrivals).filter((p) => p.category !== "Accessories").map(toCard)} viewAll={{ href: "/collections/new-arrivals", count: newArrivals.length }} />

      <EditorialPair
        label="Featured stories"
        items={[
          { img: "/campaign/edit-adidas.webp", title: "Terrace classics, fresh colourways", copy: "Samba, SL72 and Gazelle — the low-profile icons of the season.", cta: "Shop adidas Originals", href: "/collections/adidas?filter.category=Footwear" },
          { img: "/campaign/edit-new-release.webp", light: true, position: "50% 75%", title: "Jordan 1 High OG “Game Royal”", copy: "Black and royal leather on the silhouette that started it all.", cta: "Shop the Jordan 1 High OG", href: "/products/jordan-1-high-og-black-multi-color" },
        ]}
      />

      <ShoppableLook
        image="/campaign/edit-ugg.webp"
        title="Cozy, city-ready"
        copy="A shearling moto jacket, balloon-leg denim and the Tasman slipper — every piece in the shot is in stock and ready to ship."
        hotspots={hotspots}
        cta={{ label: "Shop UGG", href: "/collections/ugg" }}
      />

      <ProductRow id="exclusive" title="Only at JD" products={dedupe(exclusives).map(toCard)} viewAll={{ href: "/collections/only-at-jd", count: exclusives.length }} />

      <EditorialPair
        label="More stories"
        items={[
          { img: "/campaign/edit-on-the-court.webp", title: "Built for the court", copy: "Signature models, retros and hoops-ready lifestyle pairs from Jordan, Nike and Reebok.", cta: "Shop Basketball Shoes", href: "/collections/basketball" },
          { img: "/campaign/hero-layers-m.webp", position: "50% 30%", title: "Layers on layers", copy: "Oversized hoodies, crews and full-zips from Hoodrich, Nike, Criminal Damage and EA7.", cta: "Shop Hoodies & Fleece", href: "/collections/layers" },
        ]}
      />

      {/* Shop by Brand — logos, full-bleed product, one dramatic row */}
      <section aria-labelledby="brand-title" className="container-jd py-12 md:py-16">
        <SectionHeading id="brand-title" title="Shop by Brand" link={{ label: "All brands", href: "/collections/all" }} />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto overflow-y-hidden px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6 md:gap-4">
          {brandTiles.map((b) => (
            <Link key={b.brand} href={`/collections/${slugify(b.brand)}`} aria-label={`Shop ${b.brand}, ${b.count} styles`} className="group relative block aspect-[4/5] w-[42%] shrink-0 snap-start overflow-hidden bg-image md:w-auto">
              {b.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shopifyImage(b.image, 600)} alt="" loading="lazy" className="absolute inset-0 h-full w-full scale-[1.45] object-cover object-center" />
              )}
              <BrandLogo brand={b.brand} className="absolute left-4 top-4 h-14 w-14 text-ink md:h-16 md:w-16" />
              <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <ProductRow id="sale" title="Sale: Up to 60% Off" products={byDiscount.map(toCard)} viewAll={{ href: "/collections/sale", count: sale.length }} />

      {/* Store module */}
      <section aria-labelledby="store-title" className="container-jd py-8">
        <div className="grid overflow-hidden bg-ink text-white md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <h2 id="store-title" className="t-h2">
              See what&apos;s in stock at your store
            </h2>
            <p className="mt-3 max-w-md text-[14px] text-white/75">Set a preferred store once and we&apos;ll show live size availability on every product page.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pages/store-locator" className="btn btn-yellow">
                Find a store
              </Link>
              <Link href="/products/nike-air-force-1-07-lv8-smoke-grey-light-bone" className="btn btn-ghost-light">
                Try it on a product
              </Link>
            </div>
          </div>
          <div className="relative min-h-[180px] md:min-h-[300px]">
            <Image src="/campaign/store-banner.webp" alt="JD Sports store front" fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover object-[80%_50%]" />
          </div>
        </div>
      </section>
    </>
  );
}
