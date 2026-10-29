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
import { BellIcon, CheckIcon, ChevronDown, InfoIcon, PinIcon, ReturnIcon, RulerIcon, TruckIcon, ZoomIcon } from "@/components/ui/Icons";
import { FitFinder, Lightbox, NotifyMe, SizeGuide, StorePicker } from "./Modals";

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

      <div className="container-jd grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] lg:gap-12 xl:gap-16">
        {/* ---------------- Gallery ---------------- */}
        <section aria-label={`${label} images`} className="relative">
          {/* mobile: swipeable with a clear position indicator */}
          <MobileGallery images={images} alt={label} onOpen={setLightbox} />
          {/* desktop: editorial 2-up grid, every image visible, click to zoom */}
          <ul className="hidden grid-cols-2 gap-2 lg:grid">
            {images.map((src, i) => (
              <li key={src} className={i === 0 && images.length % 2 === 1 ? "col-span-2" : ""}>
                <button type="button" onClick={() => setLightbox(i)} className="group relative block w-full cursor-zoom-in overflow-hidden bg-image" aria-label={`Zoom image ${i + 1} of ${images.length}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shopifyImage(src, 1000)}
                    srcSet={shopifySrcSet(src, [600, 900, 1200, 1600])}
                    sizes={i === 0 && images.length % 2 === 1 ? "58vw" : "29vw"}
                    alt={`${label}, ${product.colourway} — view ${i + 1}`}
                    loading={i < 2 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${i === 0 && images.length % 2 === 1 ? "aspect-[2/1.1]" : "aspect-square"}`}
                  />
                  <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    <ZoomIcon size={16} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="t-meta mt-2 hidden lg:block">{images.length} images · click any image to zoom</p>
        </section>

        {/* ---------------- Buy box ---------------- */}
        <section aria-label="Product details and purchase" className="lg:sticky lg:top-[88px] lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {pct > 0 && <Badge kind="sale" label={`−${pct}%`} />}
            {product.exclusive && (
              <span className="group relative">
                <Badge kind="exclusive" label="Only at JD" />
                <span className="t-meta ml-2">Exclusive colourway — not sold by other Canadian retailers</span>
              </span>
            )}
            {!product.exclusive && product.isNew && pct === 0 && <Badge kind="new" label="New arrival" />}
          </div>

          <Link href={`/collections/${slugify(product.brand)}`} className="t-eyebrow mt-4 inline-block text-muted hover:text-ink hover:underline">
            {product.brand}
          </Link>
          <h1 className="mt-1 text-[26px] font-bold leading-[1.1] tracking-tight md:text-[32px]">{product.model}</h1>
          <p className="mt-1.5 text-[14px] text-muted">{product.colourway}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            {product.reviews && (
              <a href="#reviews" className="flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline">
                <Stars rating={product.reviews.rating} size={13} />
                {product.reviews.rating.toFixed(1)} <span className="font-normal text-muted">({product.reviews.count} reviews)</span>
              </a>
            )}
          </div>

          <div className="mt-4">
            <Price price={price} compareAt={compareAt} size="lg" />
            <p className="mt-1.5 text-[12.5px] text-muted">
              or 4 interest-free payments of <b className="text-ink">{formatMoney(Math.round((price / 4) * 100) / 100)}</b> with <b className="text-ink">Afterpay</b>
            </p>
          </div>

          {/* Three decision-relevant benefits near the price (brief §5.B.3) */}
          {benefits.length > 0 && (
            <ul className="mt-5 space-y-1.5 border-y border-line py-4 text-[13.5px]">
              {benefits.map((b) => (
                <li key={b} className="flex gap-2.5">
                  <CheckIcon size={16} className="mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Colour */}
          {siblings.length > 1 && (
            <div className="mt-5">
              <p className="text-[13px] font-bold">
                Colour: <span className="font-normal text-muted">{product.colourway}</span>
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
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
                        className={`relative block h-[68px] w-[68px] overflow-hidden bg-image transition-shadow ${current ? "ring-2 ring-ink ring-offset-2" : "ring-1 ring-line hover:ring-ink"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shopifyImage(s.image, 160)} alt="" className={`h-full w-full object-cover ${soldOut ? "opacity-40" : ""}`} />
                        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-[9px] font-bold uppercase">Sold out</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Size */}
          <div ref={sizesRef} className="mt-6 scroll-mt-32">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold" id="size-label">
                {footwear ? `Select size · ${product.gender === "Women" ? "Women's" : "Men's"} ${system}` : "Select size"}
              </p>
              {footwear && (
                <div role="radiogroup" aria-label="Sizing system" className="flex bg-surface p-0.5">
                  {SIZE_SYSTEMS.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={system === s} onClick={() => setPrefs({ sizeSystem: s })} className={`h-7 px-2.5 text-[11px] font-bold ${system === s ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* fit cue + tools */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
              {footwear && (
                <span className="flex items-center gap-1.5 text-muted">
                  <InfoIcon size={14} /> {fit.note}
                </span>
              )}
              {footwear && (
                <button type="button" onClick={() => setFitOpen(true)} className="flex items-center gap-1 font-bold underline underline-offset-4">
                  <RulerIcon size={14} /> Find my size
                </button>
              )}
              <button type="button" onClick={() => setGuideOpen(true)} className="font-semibold text-muted underline underline-offset-4 hover:text-ink">
                Size guide
              </button>
            </div>

            {wanted && (
              <div className="mt-3 animate-fade-in bg-surface p-3 text-[12.5px]" role="status">
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
                  <p className="mt-1 text-muted">Pick another size or set a restock alert below.</p>
                )}
              </div>
            )}

            <div role="radiogroup" aria-labelledby="size-label" className={`mt-3 grid gap-1.5 ${footwear ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-4"} ${error ? "animate-[shake_0.35s]" : ""}`}>
              {product.variants.map((v) => {
                const selected = v.title === size;
                const low = v.availableForSale && v.quantityAvailable <= LOW_STOCK_THRESHOLD;
                const alert = prefs.alerts.includes(v.id);
                if (!v.availableForSale)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setNotifyFor(v)}
                      aria-label={`Size ${v.title} sold out — ${alert ? "restock alert set" : "get a restock alert"}`}
                      className="relative flex h-12 flex-col items-center justify-center border border-dashed border-line-strong bg-surface text-[13px] text-subtle hover:border-ink hover:text-ink"
                    >
                      <span className="line-through decoration-1">{sizeLabel(v.title, system, product.gender)}</span>
                      <span className="flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-wide">
                        <BellIcon size={10} /> {alert ? "Alert set" : "Notify"}
                      </span>
                    </button>
                  );
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choose(v)}
                    aria-label={`Size ${sizeLabel(v.title, system, product.gender)}${low ? `, only ${v.quantityAvailable} left` : ""}`}
                    className={`relative flex h-12 items-center justify-center border text-[13.5px] font-semibold tabular-nums transition-[background-color,border-color,color] duration-150 ${
                      selected ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
                    }`}
                  >
                    {sizeLabel(v.title, system, product.gender)}
                    {low && <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-jd-yellow" : "bg-warn"}`} aria-hidden />}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden /> {LOW_STOCK_THRESHOLD} or fewer left
              <span className="ml-3 inline-flex items-center gap-1">
                <BellIcon size={11} /> Tap a sold-out size for a restock alert
              </span>
            </p>

            {/* Factual, variant-level urgency only after selection (brief §5.A.3) + inline equivalents (§5.A.6) */}
            <div className="mt-3 min-h-[22px] text-[13px]" aria-live="polite">
              {error && !variant && <p className="font-semibold text-sale">Please select a size to add this to your cart.</p>}
              {variant && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {variant.quantityAvailable <= LOW_STOCK_THRESHOLD ? (
                    <span className="font-bold text-warn">
                      Only {variant.quantityAvailable} left in size {variant.title}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-success">
                      <CheckIcon size={14} /> In stock — ships in 1–2 business days
                    </span>
                  )}
                  {footwear && isNumericSize(variant.title) && <span className="t-meta">US {variant.title} = {equivalents(variant.title, product.gender)}</span>}
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
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

          {/* Reassurance directly under the CTA (brief §5.C.1–3) */}
          <ul className="mt-5 divide-y divide-line border-y border-line text-[13px]">
            <li className="flex items-start gap-3 py-3.5">
              <TruckIcon size={20} className="mt-px shrink-0" />
              <div>
                {remaining <= 0 ? (
                  <p className="font-semibold">Qualifies for free standard shipping</p>
                ) : (
                  <p className="font-semibold">Add {formatMoney(remaining)} more for free standard shipping</p>
                )}
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
                      {storeQty ? (
                        <span className={storeQty <= 2 ? "text-warn" : "text-success"}>{storeQty <= 2 ? `Low stock at ${store.name}` : `In stock at ${store.name}`}</span>
                      ) : (
                        <span>Not in stock at {store.name}</span>
                      )}
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
    <div className="relative -mx-4 md:mx-0 lg:hidden">
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
