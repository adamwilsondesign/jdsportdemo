import Image from "next/image";
import Link from "next/link";
import { Hero, type HeroSlide } from "@/components/home/Hero";
import { ProductRail } from "@/components/home/ProductRail";
import { SectionHeading, SeoBlock, ShoppableLook } from "@/components/home/HomeModules";
import { getAllProducts, getCollectionDef, getCollectionProducts, getProduct, toCard } from "@/lib/storefront";
import { shopifyImage, slugify } from "@/lib/format";
import { ArrowRightIcon, ReturnIcon, StoreIcon, TruckIcon, LayersIcon } from "@/components/ui/Icons";
import type { Product } from "@/lib/types";

const HERO: HeroSlide[] = [
  {
    id: "brave-the-cold",
    name: "Brave the Cold",
    eyebrow: "Winter outerwear",
    description: "Puffers, parkas and insulated jackets from The North Face, Nike, Supply & Demand and more.",
    desktop: "/campaign/hero-brave-the-cold-d.webp",
    mobile: "/campaign/hero-brave-the-cold-m.webp",
    alt: "Brave the Cold — models in black puffer jackets against a blue studio backdrop",
    ctas: [
      { label: "Shop Men's Outerwear", href: "/collections/outerwear?filter.gender=Men" },
      { label: "Shop Women's Outerwear", href: "/collections/outerwear?filter.gender=Women" },
    ],
  },
  {
    id: "layers",
    name: "Layers on Layers",
    eyebrow: "Hoodies & fleece",
    description: "Oversized hoodies, crews and full-zips from Hoodrich, Nike, Criminal Damage and EA7.",
    desktop: "/campaign/hero-layers-d.webp",
    mobile: "/campaign/hero-layers-m.webp",
    alt: "Layers on Layers — two models in layered streetwear on a city street",
    ctas: [
      { label: "Shop Hoodies & Fleece", href: "/collections/layers" },
      { label: "New Clothing", href: "/collections/new-arrivals?filter.category=Clothing" },
    ],
  },
  {
    id: "get-buckets",
    name: "Get Buckets",
    eyebrow: "Basketball",
    description: "Retros, signature models and court-ready classics from Jordan, Nike and Reebok.",
    desktop: "/campaign/hero-get-buckets-d.webp",
    mobile: "/campaign/hero-get-buckets-m.webp",
    alt: "Get Buckets — a stack of colourful basketball shoes on an indoor court",
    ctas: [
      { label: "Shop Basketball Shoes", href: "/collections/basketball" },
      { label: "Shop Jordan", href: "/collections/jordan" },
    ],
  },
];

const byHandles = (hs: string[]) => hs.map(getProduct).filter((p): p is Product => !!p);

export default function HomePage() {
  const all = getAllProducts();
  const newArrivals = getCollectionProducts(getCollectionDef("new-arrivals")!).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const newFootwear = newArrivals.filter((p) => p.category === "Footwear");
  const newClothing = newArrivals.filter((p) => p.category === "Clothing");
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

  const brandTiles = ["Nike", "Jordan", "adidas", "New Balance", "Hoodrich", "The North Face", "Salomon", "On"].map((b) => {
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

  return (
    <>
      <Hero slides={HERO} />

      {/* Service reassurance, surfaced during consideration (brief §3.C.3) */}
      <section aria-label="Shopping benefits" className="border-b border-line">
        <div className="container-jd no-scrollbar flex gap-8 overflow-x-auto py-4 text-[12.5px] md:justify-between">
          {[
            { I: TruckIcon, t: "Free standard shipping over $99", href: "/pages/shipping" },
            { I: ReturnIcon, t: "Refunds within 14 days, exchanges within 28", href: "/pages/returns" },
            { I: StoreIcon, t: "Check stock at your local JD", href: "/pages/store-locator" },
            { I: LayersIcon, t: "Pay in 4 with Afterpay", href: "/pages/payment-methods" },
          ].map(({ I, t, href }) => (
            <Link key={t} href={href} className="flex shrink-0 items-center gap-2 font-semibold hover:underline hover:underline-offset-4">
              <I size={18} /> {t}
            </Link>
          ))}
        </div>
      </section>

      {/* Shop by Category — explicit heading (brief §3.A.3) */}
      <section aria-labelledby="cat-title" className="container-jd pt-12 md:pt-16">
        <SectionHeading id="cat-title" title="Shop by Category" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6 md:gap-4">
          {categories.map((c) => (
            <Link key={c.label} href={c.href} className="group w-[42%] shrink-0 snap-start md:w-auto">
              <div className="relative aspect-square overflow-hidden bg-image">
                <Image src={c.image} alt="" fill unoptimized={c.image.startsWith("http")} sizes="(min-width:1024px) 16vw, (min-width:768px) 30vw, 42vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <p className="mt-3 flex items-center justify-between text-[14px] font-bold">
                {c.label} <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />
              </p>
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
              <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-jd-yellow transition-transform duration-500 group-hover:scale-x-100" />
            </div>
            <p className="mt-3 flex items-center justify-between text-[14px] font-bold text-sale">
              Sale <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />
            </p>
            <p className="t-meta">{sale.length} styles reduced</p>
          </Link>
        </div>
      </section>

      {/* Persistent, clearly labelled New Arrivals row (brief §3.B.4) */}
      <ProductRail
        id="new"
        eyebrow="Just landed"
        title="New Arrivals"
        tabs={[
          { label: "All", products: dedupe(newArrivals).filter((p) => p.category !== "Accessories").slice(0, 16).map(toCard), viewAll: { href: "/collections/new-arrivals", count: newArrivals.length } },
          { label: "Footwear", products: dedupe(newFootwear).slice(0, 16).map(toCard), viewAll: { href: "/collections/new-arrivals?filter.category=Footwear", count: newFootwear.length } },
          { label: "Clothing", products: dedupe(newClothing).slice(0, 16).map(toCard), viewAll: { href: "/collections/new-arrivals?filter.category=Clothing", count: newClothing.length } },
        ]}
      />

      {/* Editorial — consistent label / headline / named CTA pattern (brief §3.C.5) */}
      <section aria-labelledby="edit-title" className="container-jd py-4">
        <h2 id="edit-title" className="sr-only">
          Featured stories
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { img: "/campaign/edit-adidas.webp", light: false, eyebrow: "adidas Originals", title: "Terrace classics, fresh colourways", copy: "Samba, SL72 and Gazelle — the low-profile icons of the season.", cta: "Shop adidas Originals", href: "/collections/adidas?filter.category=Footwear" },
            { img: "/campaign/edit-new-release.webp", light: true, eyebrow: "New release", title: "Jordan 1 High OG “Game Royal”", copy: "Black and royal leather on the silhouette that started it all.", cta: "Shop the Jordan 1 High OG", href: "/products/jordan-1-high-og-black-multi-color" },
          ].map((e) => (
            <Link key={e.title} href={e.href} className="group relative block aspect-[4/5] overflow-hidden bg-image md:aspect-[5/6]">
              <Image src={e.img} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className={`object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035] ${e.light ? "object-[50%_75%]" : ""}`} />
              <div className={`absolute inset-x-0 ${e.light ? "top-0 p-6 md:p-10" : "bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 pt-28 text-white md:p-10 md:pt-40"}`}>
                <p className={`t-eyebrow ${e.light ? "text-muted" : "text-jd-yellow"}`}>{e.eyebrow}</p>
                <p className="t-h2 mt-2 max-w-md">{e.title}</p>
                <p className={`mt-2 max-w-sm text-[14px] ${e.light ? "text-muted" : "text-white/85"}`}>{e.copy}</p>
                <span className={`btn mt-5 h-11 min-h-0 ${e.light ? "btn-primary" : "btn-yellow"}`}>{e.cta}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ShoppableLook
        image="/campaign/edit-ugg.webp"
        eyebrow="Shop the look"
        title="Cozy, city-ready"
        copy="A shearling moto jacket, balloon-leg denim and the Tasman slipper — every piece in the shot is in stock and ready to ship."
        hotspots={hotspots}
        cta={{ label: "Shop UGG", href: "/collections/ugg" }}
      />

      {/* Only at JD — signature yellow moment, exclusivity explained in text, not just a badge (brief §4.B.8) */}
      <ProductRail
        id="exclusive"
        tone="yellow"
        eyebrow="Exclusive colourways · You won't find these anywhere else in Canada"
        title="Only at JD"
        tabs={[{ label: "All", products: dedupe(exclusives).slice(0, 14).map(toCard), viewAll: { href: "/collections/only-at-jd", count: exclusives.length } }]}
      />

      {/* Shop by Brand */}
      <section aria-labelledby="brand-title" className="container-jd py-12 md:py-16">
        <SectionHeading id="brand-title" title="Shop by Brand" link={{ label: "All brands", href: "/collections/all" }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {brandTiles.map((b) => (
            <Link key={b.brand} href={`/collections/${slugify(b.brand)}`} className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-image p-4 md:p-5">
              {b.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shopifyImage(b.image, 500)} alt="" loading="lazy" className="absolute -right-[6%] bottom-[-4%] h-[86%] w-auto transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-[1.04]" />
              )}
              <p className="relative text-lg font-extrabold uppercase leading-none tracking-tight md:text-2xl">{b.brand}</p>
              <p className="relative t-meta font-semibold text-ink">
                {b.count} styles <span aria-hidden>→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ProductRail
        id="sale"
        eyebrow="Prices as marked — no code needed"
        title="Sale: Up to 60% Off"
        tabs={[
          { label: "All", products: [...sale].sort((a, b) => Number(b.compareAtPriceRange.maxVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount) - (Number(a.compareAtPriceRange.maxVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount))).slice(0, 14).map(toCard), viewAll: { href: "/collections/sale", count: sale.length } },
          { label: "Footwear", products: sale.filter((p) => p.category === "Footwear").slice(0, 14).map(toCard), viewAll: { href: "/collections/sale?filter.category=Footwear", count: sale.filter((p) => p.category === "Footwear").length } },
          { label: "Clothing", products: sale.filter((p) => p.category === "Clothing").slice(0, 14).map(toCard), viewAll: { href: "/collections/sale?filter.category=Clothing", count: sale.filter((p) => p.category === "Clothing").length } },
        ]}
      />

      {/* Store module */}
      <section aria-labelledby="store-title" className="container-jd py-8">
        <div className="grid overflow-hidden bg-ink text-white md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="t-eyebrow text-jd-yellow">JD near you</p>
            <h2 id="store-title" className="t-h2 mt-3">
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

      <SeoBlock
        title="JD Sports: Now in Canada"
        paragraphs={[
          "JD Sports has everything you need to elevate your everyday casual look to eye-catching new heights. Shop the latest footwear from brands like Nike, adidas, Vans and Puma that deliver performance, style and comfort to fit your on-the-go lifestyle.",
          "If you're looking for athletic slides, basketball sneakers, casual shoes, running gear and everything in between, JD Sports has you covered. Whether you're training for your next race, refreshing your gym to street look, or just snagging some comfy kicks for everyday, there's something for everyone at JD.",
          "Don't forget men's, women's, and kids' athletic clothing to match. With sportswear like joggers, hoodies, leggings and so much more, JD Sports is more than just a sneaker store. Break some necks every season, all year long, in the latest and greatest apparel and accessories from the brands you love.",
        ]}
      />
    </>
  );
}
