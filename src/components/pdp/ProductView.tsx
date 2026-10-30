"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { FREE_SHIPPING_THRESHOLD, LOW_STOCK_THRESHOLD, RETURNS_SUMMARY, formatMoney, shopifyImage, shopifySrcSet, slugify } from "@/lib/format";
import { SIZE_SYSTEMS, equivalents, isNumericSize, modelFit, sizeLabel } from "@/lib/sizes";
import { STORES, stockUpdatedMinutesAgo, storeStock } from "@/lib/stores";
import { useStore } from "@/components/providers/StoreProvider";
import { Badge, FavouriteButton, Price, Stars } from "@/components/product/bits";
import { BellIcon, CheckIcon, ChevronDown, ChevronLeft, ChevronRight, InfoIcon, PinIcon, ReturnIcon, RulerIcon, TruckIcon } from "@/components/ui/Icons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { FitFinder, Lightbox, NotifyMe, SizeGuide, StorePicker } from "./Modals";

// JD's buy-now-pay-later partners, using the marks from jdsports.ca (tight-cropped in /public/payment-logos)
const PAY_LATER = [
  { name: "Afterpay", src: "/payment-logos/afterpay.png", h: 17 },
  { name: "Shop Pay", src: "/payment-logos/shoppay.png", h: 18 },
  { name: "Sezzle", src: "/payment-logos/sezzle.png", h: 18 },
  { name: "PayPal", src: "/payment-logos/paypal.png", h: 19 },
];

export type SiblingLite = { handle: string; colourway: string; image: string; sizes: { title: string; available: boolean }[] };

export function ProductView({ product, siblings }: { product: Product; siblings: SiblingLite[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { addToCart, prefs, setPrefs, hydrated } = useStore();
  const footwear = product.category === "Footwear";
  const sizeKey = `${product.gender}-${product.category}`;
  const label = `${product.brand} ${product.model}`;

  // ---- selected size: URL → (fallback) remembered size, kept across colour changes (brief §5.A.2) ----
  const urlSize = sp.get("size");
  const [size, setSize] = useState<string | null>(urlSize);
  const [carriedOver, setCarriedOver] = useState<string | null>(null);
  useEffect(() => {
    if (!hydrated || size) return;
    const remembered = prefs.savedSizes[sizeKey];
    if (remembered && product.variants.some((v) => v.title === remembered && v.availableForSale)) setSize(remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  useEffect(() => {
    // arriving from a colour swatch with ?size= that isn't available here — explain instead of silently dropping
    if (urlSize && !product.variants.some((v) => v.title === urlSize && v.availableForSale)) {
      setCarriedOver(urlSize);
      setSize(null);
    }
  }, [urlSize, product.variants]);

  const variant = product.variants.find((v) => v.title === size) ?? null;
  const price = Number((variant ?? product.variants[0]).price.amount);
  const cmpRaw = (variant ?? product.variants[0]).compareAtPrice;
  const compareAt = cmpRaw ? Number(cmpRaw.amount) : null;
  const system = footwear ? prefs.sizeSystem : "US";

  const choose = (v: ProductVariant) => {
    setSize(v.title);
    setCarriedOver(null);
    setError(false);
    setPrefs({ savedSizes: { ...prefs.savedSizes, [sizeKey]: v.title } });
    const p = new URLSearchParams(sp.toString());
    p.set("size", v.title);
    router.replace(`${pathname}?${p}`, { scroll: false });
  };

  // ---- add to cart with explicit states ----
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");
  const [error, setError] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const add = () => {
    if (!variant) {
      setError(true);
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setState("loading");
    setTimeout(() => {
      addToCart({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        quantityAvailable: variant.quantityAvailable,
        product: { handle: product.handle, brand: product.brand, model: product.model, colourway: product.colourway, category: product.category, image: product.featuredImage.url },
      });
      setState("added");
      setTimeout(() => setState("idle"), 2200);
    }, 450);
  };

  // ---- modals ----
  const [fitOpen, setFitOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notifyFor, setNotifyFor] = useState<ProductVariant | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // ---- sticky mobile purchase bar (brief §5.C.7) ----
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting || e.boundingClientRect.top > 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fit = modelFit(product.brand, product.model);
  const benefits = product.features.slice(0, 3).map(shortBenefit);
  const remaining = FREE_SHIPPING_THRESHOLD - price;
  const store = STORES.find((s) => s.id === prefs.storeId) ?? null;
  const storeQty = variant && store ? storeStock(variant.id, store.id, variant.availableForSale) : null;
  const allSoldOut = !product.variants.some((v) => v.availableForSale);
  const pct = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  // alternate colours that DO have the shopper's size (recovery for unavailable variants, brief §5.C.8)
  const altForSize = (s: string) => siblings.filter((x) => x.handle !== product.handle && x.sizes.some((z) => z.title === s && z.available));
  const wanted = carriedOver ?? (allSoldOut ? prefs.savedSizes[sizeKey] : null);

  const images = product.images.map((i) => i.url);

  return (
    <>
      <div className="container-jd pt-4 md:pt-6">
        <nav aria-label="Breadcrumb" className="t-meta mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink hover:underline">Home</Link> /
            </li>
            <li>
              <Link href={`/collections/${product.gender === "Women" ? "womens" : "mens"}-${footwear ? "footwear" : "clothing"}`} className="hover:text-ink hover:underline">
                {product.gender === "Women" ? "Women's" : "Men's"} {footwear ? "Shoes" : product.category}
              </Link>{" "}
              /
            </li>
            <li>
              <Link href={`/collections/${slugify(product.brand)}`} className="hover:text-ink hover:underline">{product.brand}</Link> /
            </li>
            <li aria-current="page" className="text-ink">{product.model}</li>
          </ol>
        </nav>
      </div>

      <div className="container-jd grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,1fr)] lg:gap-12 xl:gap-16">
        {/* ---------------- Gallery ---------------- */}
        <section aria-label={`${label} images`} className="relative lg:sticky lg:top-[88px] lg:self-start">
          {pct > 0 && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 lg:right-4 lg:top-4">
              <Badge kind="sale" label={`−${pct}%`} />
            </span>
          )}
          <MobileGallery images={images} alt={label} onOpen={setLightbox} />
          <DesktopGallery images={images} alt={`${label}, ${product.colourway}`} onOpen={setLightbox} />
        </section>

        {/* ---------------- Buy box: brand → name → size → price → CTA → details ---------------- */}
        <section aria-label="Product details and purchase" className="min-w-0 lg:pt-1">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/collections/${slugify(product.brand)}`} className="inline-block text-ink hover:opacity-70" aria-label={`More from ${product.brand}`}>
              <BrandLogo brand={product.brand} size={68} className="text-[18px] tracking-[0.06em]" />
            </Link>
            {product.reviews && (
              <a href="#reviews" className="flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline">
                <Stars rating={product.reviews.rating} size={12} />
                {product.reviews.rating.toFixed(1)} <span className="font-normal text-muted">({product.reviews.count})</span>
              </a>
            )}
          </div>
          <h1 className="mt-3 text-[26px] font-bold leading-[1.1] tracking-tight md:text-[30px]">{product.model}</h1>
          <p className="mt-2 text-[15px] text-muted md:text-[16px]">{product.colourway}</p>
          {product.exclusive && (
            <p className="mt-2 text-[12.5px]">
              <b>Only at JD</b> <span className="text-muted">— exclusive colourway</span>
            </p>
          )}

          {/* Colour */}
          {siblings.length > 1 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Colours">
              {siblings.map((s) => {
                const soldOut = !s.sizes.some((z) => z.available);
                const current = s.handle === product.handle;
                return (
                  <li key={s.handle}>
                    <Link
                      href={`/products/${s.handle}${size ? `?size=${encodeURIComponent(size)}` : ""}`}
                      scroll={false}
                      aria-current={current}
                      aria-label={`${s.colourway}${soldOut ? " (sold out)" : ""}`}
                      title={s.colourway}
                      className={`relative block h-[76px] w-[76px] overflow-hidden bg-image transition-shadow duration-200 ${current ? "ring-2 ring-ink ring-offset-2" : "ring-1 ring-line hover:ring-ink"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shopifyImage(s.image, 200)} alt="" className={`h-full w-full object-cover ${soldOut ? "opacity-40" : ""}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Size — one compact, horizontally scrollable row */}
          <div ref={sizesRef} className="mt-5 scroll-mt-32">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold" id="size-label">
                  Size{footwear && <span className="hidden sm:inline"> · {product.gender === "Women" ? "Women's" : "Men's"}</span>}
                </p>
                {footwear && (
                  <div role="radiogroup" aria-label="Sizing system" className="flex">
                    {SIZE_SYSTEMS.map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={system === s} onClick={() => setPrefs({ sizeSystem: s })} className={`h-6 px-1.5 text-[11px] font-bold ${system === s ? "text-ink underline underline-offset-4" : "text-subtle hover:text-ink"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[12px] font-semibold">
                {footwear && (
                  <button type="button" onClick={() => setFitOpen(true)} className="flex items-center gap-1 underline underline-offset-4">
                    <RulerIcon size={13} /> Find my size
                  </button>
                )}
                <button type="button" onClick={() => setGuideOpen(true)} className="text-muted underline underline-offset-4 hover:text-ink">
                  Size guide
                </button>
              </div>
            </div>

            <SizeRow
              variants={product.variants}
              selected={size}
              anchor={footwear ? (product.gender === "Women" ? "6" : "8") : null}
              label={(v) => sizeLabel(v.title, system, product.gender)}
              alerts={prefs.alerts}
              onPick={choose}
              onSoldOut={setNotifyFor}
              shake={error}
            />

            <div className="mt-2 min-h-[20px] text-[12.5px]" aria-live="polite">
              {error && !variant ? (
                <p className="font-semibold text-sale">Select a size to add this to your cart.</p>
              ) : variant ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  {variant.quantityAvailable <= LOW_STOCK_THRESHOLD ? (
                    <span className="font-bold text-warn">
                      Only {variant.quantityAvailable} left in size {variant.title}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-success">
                      <CheckIcon size={13} /> In stock
                    </span>
                  )}
                  {footwear && isNumericSize(variant.title) && <span className="text-muted">{equivalents(variant.title, product.gender)}</span>}
                </p>
              ) : footwear ? (
                <p className="flex items-center gap-1.5 text-muted">
                  <InfoIcon size={13} /> {fit.note}
                </p>
              ) : null}
            </div>

            {wanted && (
              <div className="mt-2 animate-fade-in bg-surface p-3 text-[12.5px]" role="status">
                <p className="font-semibold">
                  Size {wanted} is sold out in {product.colourway}.
                </p>
                {altForSize(wanted).length > 0 ? (
                  <p className="mt-1 text-muted">
                    Available in size {wanted} in:{" "}
                    {altForSize(wanted).map((a, i) => (
                      <span key={a.handle}>
                        {i > 0 && ", "}
                        <Link href={`/products/${a.handle}?size=${encodeURIComponent(wanted)}`} className="font-semibold text-ink underline underline-offset-2">
                          {a.colourway}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-1 text-muted">Pick another size or tap a sold-out size for a restock alert.</p>
                )}
              </div>
            )}
          </div>

          {/* Price, then the CTA directly beneath it */}
          <div className="mt-4">
            <Price price={price} compareAt={compareAt} size="lg" />
            <p className="mt-1 text-[12.5px] text-muted">
              or 4 interest-free payments of <b className="text-ink">{formatMoney(Math.round((price / 4) * 100) / 100)}</b> with <b className="text-ink">Afterpay</b>
            </p>
            {/* Same BNPL options and marks as jdsports.ca */}
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[12.5px]">
                Buy Now, Pay Later installments available.{" "}
                <Link href="/pages/buy-now-pay-later" className="link-underline font-semibold">
                  Learn more
                </Link>
              </p>
              <ul className="mt-2.5 flex items-center justify-between gap-x-3 sm:justify-start sm:gap-x-7" aria-label="Buy now, pay later options">
                {PAY_LATER.map((m) => (
                  <li key={m.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static marks */}
                    <img src={m.src} alt={m.name} height={m.h} style={{ height: m.h, width: "auto" }} loading="lazy" />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div ref={ctaRef} className="mt-4 flex gap-2">
            {allSoldOut ? (
              <button type="button" onClick={() => setNotifyFor(product.variants[0])} className="btn btn-primary h-14 flex-1 text-[15px]">
                <BellIcon size={18} /> Sold out — get a restock alert
              </button>
            ) : (
              <button type="button" onClick={add} disabled={state === "loading"} className={`btn h-14 flex-1 text-[15px] ${state === "added" ? "bg-success text-white" : "btn-primary"}`} aria-live="polite">
                {state === "loading" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Adding to cart" />
                ) : state === "added" ? (
                  <>
                    <CheckIcon size={18} /> Added to cart
                  </>
                ) : (
                  <>Add to Cart{variant ? ` · Size ${variant.title}` : ""}</>
                )}
              </button>
            )}
            <FavouriteButton handle={product.handle} label={label} className="!h-14 !w-14 border border-line hover:border-ink" size={22} />
          </div>

          {/* Key benefits below the CTA */}
          {benefits.length > 0 && (
            <ul className="mt-6 space-y-1.5 text-[13.5px]">
              {benefits.map((b) => (
                <li key={b} className="flex gap-2.5">
                  <CheckIcon size={16} className="mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          <ul className="mt-6 divide-y divide-line border-y border-line text-[13px]">
            <li className="flex items-start gap-3 py-3.5">
              <TruckIcon size={20} className="mt-px shrink-0" />
              <div>
                {remaining <= 0 ? <p className="font-semibold">Qualifies for free standard shipping</p> : <p className="font-semibold">Add {formatMoney(remaining)} more for free standard shipping</p>}
                <p className="t-meta">Shipping is calculated at checkout for orders under $99.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 py-3.5">
              <ReturnIcon size={20} className="mt-px shrink-0" />
              <div>
                <p className="font-semibold">{RETURNS_SUMMARY}</p>
                <Link href="/pages/returns" className="t-meta underline underline-offset-2">
                  Return policy
                </Link>
              </div>
            </li>
            <li className="flex items-start gap-3 py-3.5">
              <PinIcon size={20} className="mt-px shrink-0" />
              <div className="flex-1">
                {!store ? (
                  <>
                    <p className="font-semibold">Check in-store availability</p>
                    <button type="button" onClick={() => setStoreOpen(true)} className="t-meta underline underline-offset-2">
                      Choose a store near you
                    </button>
                  </>
                ) : !variant ? (
                  <>
                    <p className="font-semibold">Select a size to see stock at {store.name}</p>
                    <button type="button" onClick={() => setStoreOpen(true)} className="t-meta underline underline-offset-2">
                      Change store
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">
                      {storeQty ? <span className={storeQty <= 2 ? "text-warn" : "text-success"}>{storeQty <= 2 ? `Low stock at ${store.name}` : `In stock at ${store.name}`}</span> : <span>Not in stock at {store.name}</span>}
                    </p>
                    <p className="t-meta">
                      Size {variant.title} · updated {stockUpdatedMinutesAgo(variant.id)} min ago ·{" "}
                      <button type="button" onClick={() => setStoreOpen(true)} className="underline underline-offset-2">
                        {storeQty ? "Other stores" : "Check other stores"}
                      </button>
                    </p>
                  </>
                )}
              </div>
            </li>
          </ul>

          <Details product={product} />
        </section>
      </div>

      {/* Sticky purchase bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur transition-transform duration-300 lg:hidden ${ctaVisible ? "translate-y-full" : "translate-y-0"}`}
        aria-hidden={ctaVisible}
      >
        <div className="flex items-center gap-3 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImage(product.featuredImage.url, 120)} alt="" className="h-11 w-11 shrink-0 bg-image object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold">{product.model}</p>
            <p className="text-[12px]">
              <span className={`t-price ${compareAt ? "text-sale" : ""}`}>{formatMoney(price)}</span>
              <span className="text-muted"> · {variant ? `Size ${variant.title}` : "No size selected"}</span>
            </p>
          </div>
          <button type="button" tabIndex={ctaVisible ? -1 : 0} onClick={add} className={`btn h-11 min-h-0 px-4 text-[13px] ${state === "added" ? "bg-success text-white" : "btn-primary"}`}>
            {state === "added" ? "Added ✓" : variant ? "Add to Cart" : "Select size"}
          </button>
        </div>
      </div>

      <FitFinder open={fitOpen} onClose={() => setFitOpen(false)} brand={product.brand} model={product.model} gender={product.gender} variants={product.variants} onSelect={(s) => {
        const v = product.variants.find((x) => x.title === s);
        if (v) choose(v);
      }} />
      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} gender={product.gender} footwear={footwear} />
      <NotifyMe open={!!notifyFor} onClose={() => setNotifyFor(null)} variant={notifyFor} label={label} colourway={product.colourway} image={product.featuredImage.url} />
      <StorePicker open={storeOpen} onClose={() => setStoreOpen(false)} variant={variant} />
      <Lightbox open={lightbox !== null} onClose={() => setLightbox(null)} images={images} start={lightbox ?? 0} alt={label} />
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </>
  );
}

/** Thumbnail rail + one large image; click to zoom. No hover zoom, no extra captions. */
function DesktopGallery({ images, alt, onOpen }: { images: string[]; alt: string; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  return (
    <div className="hidden gap-3 lg:flex">
      <ul className="no-scrollbar flex max-h-[min(calc(100dvh-120px),720px)] w-[72px] shrink-0 flex-col gap-2 overflow-y-auto">
        {images.map((src, k) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setI(k)}
              aria-label={`Show image ${k + 1} of ${images.length}`}
              aria-current={k === i}
              className={`block aspect-square w-full overflow-hidden bg-image transition-opacity duration-200 ${k === i ? "opacity-100" : "opacity-45 hover:opacity-80"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shopifyImage(src, 160)} alt="" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative min-w-0 flex-1">
        <button type="button" onClick={() => onOpen(i)} className="block w-full cursor-zoom-in bg-image" aria-label={`Zoom image ${i + 1} of ${images.length}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={images[i]}
            src={shopifyImage(images[i], 1200)}
            srcSet={shopifySrcSet(images[i], [800, 1200, 1600, 2048])}
            sizes="(min-width:1280px) 50vw, 55vw"
            alt={`${alt} — view ${i + 1}`}
            fetchPriority={i === 0 ? "high" : "auto"}
            className="mx-auto aspect-square max-h-[min(calc(100dvh-120px),720px)] w-full animate-fade-in object-contain"
          />
        </button>
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <button type="button" onClick={() => setI((n) => (n - 1 + images.length) % images.length)} aria-label="Previous image" className="grid h-10 w-10 place-items-center bg-white/90 hover:bg-white">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => setI((n) => (n + 1) % images.length)} aria-label="Next image" className="grid h-10 w-10 place-items-center bg-white/90 hover:bg-white">
            <ChevronRight size={18} />
          </button>
        </div>
        {/* preload the rest so thumbnail swaps are instant */}
        <div className="hidden" aria-hidden>
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={shopifyImage(src, 1200)} alt="" loading="lazy" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sizes in a single row; scrolls horizontally and opens at the most common sizes. */
function SizeRow({
  variants,
  selected,
  anchor,
  label,
  alerts,
  onPick,
  onSoldOut,
  shake,
}: {
  variants: ProductVariant[];
  selected: string | null;
  anchor: string | null;
  label: (v: ProductVariant) => string;
  alerts: string[];
  onPick: (v: ProductVariant) => void;
  onSoldOut: (v: ProductVariant) => void;
  shake: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-size="${CSS.escape(selected ?? anchor ?? "")}"]`);
    if (target) el.scrollLeft = Math.max(0, target.offsetLeft - (selected ? el.clientWidth / 2 - target.offsetWidth / 2 : 0));
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="relative mt-2.5">
      <div ref={ref} onScroll={measure} role="radiogroup" aria-labelledby="size-label" className={`no-scrollbar flex gap-1.5 overflow-x-auto overflow-y-hidden scroll-smooth ${shake ? "animate-[shake_0.35s]" : ""}`}>
        {variants.map((v) => {
          const isSel = v.title === selected;
          const low = v.availableForSale && v.quantityAvailable <= LOW_STOCK_THRESHOLD;
          if (!v.availableForSale) {
            const alert = alerts.includes(v.id);
            return (
              <button
                key={v.id}
                data-size={v.title}
                type="button"
                onClick={() => onSoldOut(v)}
                aria-label={`Size ${label(v)} sold out — ${alert ? "restock alert set" : "get a restock alert"}`}
                className="relative grid h-11 min-w-[52px] shrink-0 place-items-center border border-dashed border-line-strong px-2 text-[13px] text-subtle hover:border-ink hover:text-ink"
              >
                <span className="line-through decoration-1">{label(v)}</span>
                <BellIcon size={9} className={`absolute right-1 top-1 ${alert ? "text-ink" : ""}`} />
              </button>
            );
          }
          return (
            <button
              key={v.id}
              data-size={v.title}
              type="button"
              role="radio"
              aria-checked={isSel}
              onClick={() => onPick(v)}
              aria-label={`Size ${label(v)}${low ? `, only ${v.quantityAvailable} left` : ""}`}
              className={`relative grid h-11 min-w-[52px] shrink-0 place-items-center border px-2 text-[13.5px] font-semibold tabular-nums transition-colors ${isSel ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
            >
              {label(v)}
              {low && <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${isSel ? "bg-jd-yellow" : "bg-warn"}`} aria-hidden />}
            </button>
          );
        })}
      </div>
      {edges.left && <span className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white" aria-hidden />}
      {edges.right && <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white" aria-hidden />}
    </div>
  );
}

/** Keep a benefit scannable: whole sentence if short, otherwise cut at a natural clause break. */
function shortBenefit(f: string) {
  if (f.length <= 64) return f;
  const breaks = [" with ", " for ", " that ", " while ", ", "].map((b) => f.indexOf(b, 24)).filter((i) => i > 0);
  return breaks.length ? f.slice(0, Math.min(...breaks)) : f;
}

function MobileGallery({ images, alt, onOpen }: { images: string[]; alt: string; onOpen: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  return (
    <div className="relative -mx-8 md:mx-0 lg:hidden">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        aria-roledescription="carousel"
      >
        {images.map((src, k) => (
          <button key={src} type="button" onClick={() => onOpen(k)} className="w-full shrink-0 snap-center bg-image" aria-label={`Open image ${k + 1} of ${images.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shopifyImage(src, 900)} srcSet={shopifySrcSet(src, [480, 720, 900, 1200])} sizes="100vw" alt={`${alt} — view ${k + 1}`} loading={k === 0 ? "eager" : "lazy"} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>
      <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold tabular-nums" aria-live="polite">
        {i + 1} / {images.length}
      </span>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
        {images.map((src, k) => (
          <span key={src} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`} />
        ))}
      </div>
    </div>
  );
}

function careFor(p: Product) {
  const text = `${p.features.join(" ")} ${p.story.join(" ")}`.toLowerCase();
  if (/suede|nubuck/.test(text)) return ["Brush gently with a suede brush to lift the nap.", "Treat with a suede protector spray before first wear.", "Blot spills immediately — avoid soaking or machine washing."];
  if (/leather/.test(text)) return ["Wipe clean with a damp cloth and mild soap.", "Condition leather occasionally to prevent cracking.", "Air dry away from direct heat; stuff with paper to hold shape."];
  if (/mesh|knit|textile|gore-tex|gtx/.test(text)) return ["Remove surface dirt with a soft brush.", "Spot clean with cold water and mild detergent.", "Air dry naturally; don't tumble dry."];
  if (/down|insulat|puffer|padded|nylon|ripstop/.test(text)) return ["Machine wash cold on a gentle cycle, zips closed.", "Tumble dry low with dryer balls to restore loft.", "Do not iron or dry clean."];
  if (/fleece|cotton|jersey|french terry/.test(text)) return ["Machine wash cold, inside out, with similar colours.", "Tumble dry low or hang dry to limit shrinkage.", "Do not bleach; cool iron on reverse if needed."];
  return ["Follow the care label inside the product.", "Spot clean where possible to extend product life."];
}

/** Technical facts separated from story copy (brief §5.B.6), plus care (§5.B.4). */
function Details({ product }: { product: Product }) {
  const sections = useMemo(
    () => [
      {
        id: "details",
        title: "Product details",
        body: (
          <>
            <ul className="list-disc space-y-1.5 pl-4">
              {product.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="t-meta mt-3">
              Style code: {product.styleCode || "—"} · Colour: {product.colourway}
            </p>
          </>
        ),
      },
      ...(product.story.length ? [{ id: "story", title: "The story", body: <div className="space-y-3">{product.story.map((s) => <p key={s.slice(0, 30)}>{s}</p>)}</div> }] : []),
      {
        id: "care",
        title: "Materials & care",
        body: (
          <ul className="list-disc space-y-1.5 pl-4">
            {careFor(product).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ),
      },
      {
        id: "shipping",
        title: "Shipping & returns",
        body: (
          <div className="space-y-2">
            <p>Free standard shipping on orders over $99. Shipping costs and taxes for smaller orders are calculated at checkout.</p>
            <p>Returns: full refund within 14 days, exchange within 28 days. Items must be unworn with tags attached; footwear in the original box.</p>
          </div>
        ),
      },
    ],
    [product],
  );
  const [open, setOpen] = useState<string | null>("details");
  return (
    <div className="mt-6 border-b border-line">
      {sections.map((s) => (
        <div key={s.id} className="border-t border-line">
          <h2>
            <button type="button" aria-expanded={open === s.id} aria-controls={`acc-${s.id}`} onClick={() => setOpen((o) => (o === s.id ? null : s.id))} className="flex h-14 w-full items-center justify-between text-left text-[14px] font-bold">
              {s.title}
              <ChevronDown size={16} className={`transition-transform duration-200 ${open === s.id ? "rotate-180" : ""}`} />
            </button>
          </h2>
          {open === s.id && (
            <div id={`acc-${s.id}`} className="animate-fade-in pb-5 text-[13.5px] leading-relaxed text-ink/85">
              {s.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
