import Image from "next/image";
import Link from "next/link";
import { Hero, type HeroContent } from "@/components/home/Hero";
import { ProductRow } from "@/components/home/ProductRow";
import { SectionHeading, ShoppableLook } from "@/components/home/HomeModules";
import { getAllProducts, getCollectionDef, getCollectionProducts, getProduct, toCard } from "@/lib/storefront";
import { shopifyImage, slugify } from "@/lib/format";
import { BrandLogo, hasLogo } from "@/components/ui/BrandLogo";
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

/** Big-photography editorial pair: headline, one line of copy, and a named CTA (the only link). */
function EditorialPair({ items, label }: { items: Editorial[]; label: string }) {
  return (
    <section aria-label={label} className="reveal container-jd py-2">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((e) => <EditorialCard key={e.title} e={e} />)}
      </div>
    </section>
  );
}

function EditorialCard({ e }: { e: Editorial }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-image md:aspect-[5/6]">
      <Image src={e.img} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" style={e.position ? { objectPosition: e.position } : undefined} />
      <div className={`absolute inset-x-0 ${e.light ? "top-0 p-6 md:p-10" : "bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 pt-28 text-white md:p-10 md:pt-40"}`}>
        <h3 className="t-h2 max-w-md">{e.title}</h3>
        <p className={`mt-2 max-w-sm text-[14px] ${e.light ? "text-muted" : "text-white/85"}`}>{e.copy}</p>
        <Link href={e.href} className={`btn mt-5 h-11 min-h-0 ${e.light ? "btn-primary" : "btn-yellow"}`}>
          {e.cta}
        </Link>
      </div>
    </div>
  );
}

const BRAND_STAGE = [
  { brand: "Nike", cutout: "/brand-cutouts/nike.webp", product: "Air Max 95 Big Bubble" },
  { brand: "Jordan", cutout: "/brand-cutouts/jordan.webp", product: "Jordan 4 Retro “Fire Red”" },
  { brand: "adidas", cutout: "/brand-cutouts/adidas.webp", product: "Gazelle Indoor" },
  { brand: "New Balance", cutout: "/brand-cutouts/new-balance.webp", product: "880" },
  { brand: "On", cutout: "/brand-cutouts/on.webp", product: "Cloudrunner 3" },
  { brand: "Salomon", cutout: "/brand-cutouts/salomon.webp", product: "XT-6 GTX" },
];

const byHandles = (hs: string[]) => hs.map(getProduct).filter((p): p is Product => !!p);

export default function HomePage() {
  const all = getAllProducts();
  const newArrivals = getCollectionProducts(getCollectionDef("new-arrivals")!).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  // one card per model family keeps the rail varied
  const dedupe = (list: Product[]) => list.filter((p, i, arr) => arr.findIndex((q) => q.model === p.model && q.brand === p.brand) === i);
  const sale = getCollectionProducts(getCollectionDef("sale")!);
  // rows lead with brands we have marks for, so every card carries a logo
  const logoFirst = (list: Product[]) => [...list].sort((a, b) => Number(hasLogo(b.brand)) - Number(hasLogo(a.brand)));
  const exclusives = getCollectionProducts(getCollectionDef("only-at-jd")!).filter((p) => p.category !== "Accessories");

  const count = (pred: (p: Product) => boolean) => all.filter(pred).length;
  const categories = [
    { label: "Men's Shoes", href: "/collections/mens-footwear", image: "/campaign/cat-mens-shoes.webp", n: count((p) => p.category === "Footwear" && p.gender === "Men") },
    { label: "Women's Shoes", href: "/collections/womens-footwear", image: "/campaign/cat-womens-shoes.webp", n: count((p) => p.category === "Footwear" && p.gender === "Women") },
    { label: "Men's Clothing", href: "/collections/mens-clothing", image: "/campaign/cat-mens-clothing.webp", n: count((p) => p.category === "Clothing" && p.gender === "Men") },
    { label: "Women's Clothing", href: "/collections/womens-clothing", image: "/campaign/cat-womens-clothing.webp", n: count((p) => p.category === "Clothing" && p.gender === "Women") },
    { label: "Caps & Accessories", href: "/collections/accessories", image: shopifyImage(getProduct("new-era-toronto-maple-leafs-9forty-a-frame-chrome-black")?.featuredImage.url ?? all.find((p) => p.category === "Accessories")!.featuredImage.url, 800), n: count((p) => p.category === "Accessories") },
  ];

  const brandTiles = BRAND_STAGE.map((b) => ({ ...b, count: all.filter((p) => p.brand === b.brand).length }));

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

      <section aria-labelledby="cat-title" className="reveal container-jd pt-12 md:pt-16">
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

      <ProductRow id="new" title="New Arrivals" products={logoFirst(dedupe(newArrivals).filter((p) => p.category !== "Accessories")).map(toCard)} viewAll={{ href: "/collections/new-arrivals", count: newArrivals.length }} />

      {/* Shop by Brand — a full-bleed black stage: cut-out hero shoes, white marks */}
      <section aria-labelledby="brand-title" className="on-dark relative mb-12 overflow-hidden bg-ink py-14 text-white md:mb-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,238,0,0.10),transparent_60%)]" aria-hidden />
        <div className="container-jd relative">
          <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
            <h2 id="brand-title" className="t-h1">
              Shop by Brand
            </h2>
            <Link href="/collections/all" className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold">
              <span className="link-underline">All brands</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <ul className="grid grid-cols-2 border-l border-t border-white/12 md:grid-cols-3">
            {brandTiles.map((b) => (
              <li key={b.brand} className="border-b border-r border-white/12">
                <Link href={`/collections/${slugify(b.brand)}`} aria-label={`Shop ${b.brand}, ${b.count} styles`} className="group relative flex aspect-[4/3.4] flex-col justify-between overflow-hidden p-4 md:aspect-[4/3] md:p-7">
                  <span className="pointer-events-none absolute inset-x-[12%] bottom-[16%] h-[34%] rounded-[50%] bg-white/[0.07] blur-2xl transition-opacity duration-500 group-hover:bg-jd-yellow/15" aria-hidden />
                  <BrandLogo brand={b.brand} size={52} tone="light" className="relative self-start" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.cutout}
                    alt=""
                    loading="lazy"
                    className="pointer-events-none absolute left-1/2 top-[54%] w-[84%] -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] drop-shadow-[0_24px_28px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-[58%] group-hover:-rotate-[14deg]"
                  />
                  <span className="relative flex items-end justify-between gap-2 text-[12px]">
                    <span className="hidden text-white/60 sm:inline">{b.product}</span>
                    <span className="font-bold">
                      {b.count} styles <span aria-hidden>→</span>
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

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

      <ProductRow id="exclusive" title="Only at JD" products={logoFirst(dedupe(exclusives)).map(toCard)} viewAll={{ href: "/collections/only-at-jd", count: exclusives.length }} />

      <EditorialPair
        label="More stories"
        items={[
          { img: "/campaign/edit-on-the-court.webp", title: "Built for the court", copy: "Signature models, retros and hoops-ready lifestyle pairs from Jordan, Nike and Reebok.", cta: "Shop Basketball Shoes", href: "/collections/basketball" },
          { img: "/campaign/hero-layers-m.webp", position: "50% 30%", title: "Layers on layers", copy: "Oversized hoodies, crews and full-zips from Hoodrich, Nike, Criminal Damage and EA7.", cta: "Shop Hoodies & Fleece", href: "/collections/layers" },
        ]}
      />

      <ProductRow id="sale" title="Sale: Up to 60% Off" products={byDiscount.map(toCard)} viewAll={{ href: "/collections/sale", count: sale.length }} />

      {/* Store module — edge to edge, flush into the footer */}
      <section aria-labelledby="store-title" className="on-dark -mb-24 mt-12 grid overflow-hidden bg-ink text-white md:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col justify-center px-4 py-12 md:px-[max(24px,calc((100vw-1600px)/2+40px))] md:py-16 lg:pr-16">
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
        <div className="relative min-h-[200px] md:min-h-[340px]">
          <Image src="/campaign/store-banner.webp" alt="JD Sports store front" fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover object-[80%_50%]" />
        </div>
      </section>
    </>
  );
}
