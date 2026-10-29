"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardProduct, CardSwatch, CardVariant } from "@/lib/types";
import { shopifyImage } from "@/lib/format";
import { availabilityNote, toMerchandise } from "@/lib/merch";
import { useStore } from "@/components/providers/StoreProvider";
import { Badge, FavouriteButton, Price, ProductImage, pickBadge } from "./bits";
import { BagIcon, CheckIcon, CloseIcon, PlusIcon, StarIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { BRAND_LOGOS, BrandLogo } from "@/components/ui/BrandLogo";
import { COLOUR_SWATCH } from "@/lib/filters";

export function ProductCard({ product, priority, sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw" }: { product: CardProduct; priority?: boolean; sizes?: string }) {
  const [activeHandle, setActiveHandle] = useState(product.handle);
  const active: CardSwatch | CardProduct = product.swatches.find((s) => s.handle === activeHandle) ?? product;
  const [quickOpen, setQuickOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const soldOut = !active.variants.some((v) => v.available);
  const badge = pickBadge({ price: active.price, compareAt: active.compareAt, isNew: product.isNew, soldOut });
  const stock = soldOut ? null : stockTag(active.variants);
  const label = `${product.brand} ${product.model}`;
  const href = `/products/${active.handle}`;
  const swatches = product.swatches;

  return (
    <article className="relative flex flex-col">
      {/* Hover behaviour (alt image, Quick Buy) is scoped to the image only */}
      <div className="group/img relative" onMouseLeave={() => setQuickOpen(false)}>
        <Link href={href} className="block" aria-label={`${label}, ${active.colourway}`}>
          <ProductImage src={active.image} alt={`${label} in ${active.colourway}`} sizes={sizes} priority={priority} />
          {active.hoverImage && (
            // Alternate angle on hover (desktop only), swapped instantly — no cross-fade
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopifyImage(active.hoverImage, 720)}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none absolute inset-0 hidden h-full w-full bg-image object-cover md:group-hover/img:block"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {badge && <Badge {...badge} />}
          {stock && (
            <span className="inline-flex h-6 items-center gap-1.5 bg-white px-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
              {stock}
            </span>
          )}
        </div>
        <FavouriteButton handle={active.handle} label={label} className="absolute right-0 top-0 text-ink hover:text-sale" />

        {/* Brand mark sits on the image instead of taking a text line */}
        <span className={`pointer-events-none absolute bottom-3 left-3 text-ink transition-opacity ${quickOpen ? "opacity-0" : "md:group-hover/img:opacity-0"}`}>
          <BrandLogo brand={product.brand} className={BRAND_LOGOS[product.brand] ? "h-7 w-7" : "text-[11px] tracking-[0.04em]"} />
        </span>

        {/* Desktop quick buy */}
        {!soldOut && (
          <div className="pointer-events-none absolute inset-2 hidden flex-col justify-end md:flex [&>*]:pointer-events-auto">
            {quickOpen ? (
              <QuickBuyPanel product={product} swatch={active} onClose={() => setQuickOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="btn h-10 min-h-0 w-full bg-white text-[13px] text-ink opacity-0 shadow-sm transition-opacity hover:bg-ink hover:text-white focus-visible:opacity-100 group-hover/img:opacity-100"
              >
                Quick Buy
                <span className="sr-only"> {label}</span>
              </button>
            )}
          </div>
        )}
        {/* Mobile quick buy */}
        {!soldOut && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={`Quick buy ${label}`}
            className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center bg-white text-ink shadow-sm md:hidden"
          >
            <PlusIcon size={18} />
          </button>
        )}
      </div>

      <div className="pt-3">
        <Link href={href} className="block">
          <span className="sr-only">{product.brand} </span>
          <h3 className="truncate text-[14px] font-semibold leading-snug hover:underline hover:underline-offset-2" title={product.model}>
            {product.model}
          </h3>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">{active.colourway}</p>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price price={active.price} compareAt={active.compareAt} size="sm" showSaving={false} />
          {product.reviews && (
            <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums">
              <StarIcon size={12} />
              {product.reviews.rating.toFixed(1)}
              <span className="font-normal text-muted">({product.reviews.count})</span>
              <span className="sr-only"> out of 5, {product.reviews.count} reviews</span>
            </span>
          )}
        </div>
        {swatches.length > 1 && (
          <div className="mt-2.5 flex items-center gap-2" role="group" aria-label={`${swatches.length} colours`}>
            {swatches.slice(0, 5).map((s) => (
              <button
                key={s.handle}
                type="button"
                onClick={() => setActiveHandle(s.handle)}
                aria-label={`Show colour ${s.colourway}`}
                aria-pressed={s.handle === activeHandle}
                title={s.colourway}
                className={`grid h-5 w-5 place-items-center rounded-full ${s.handle === activeHandle ? "ring-1 ring-ink ring-offset-2" : "hover:ring-1 hover:ring-line-strong hover:ring-offset-2"}`}
              >
                <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: COLOUR_SWATCH[s.colourFamily] ?? "#bbb" }} />
              </button>
            ))}
            <span className="t-meta text-[11.5px]">{swatches.length} colours</span>
          </div>
        )}
      </div>

      <Overlay open={sheetOpen} onClose={() => setSheetOpen(false)} side="bottom" label={`Quick buy ${label}`}>
        <QuickBuySheet product={product} swatch={active} onDone={() => setSheetOpen(false)} />
      </Overlay>
    </article>
  );
}

/** Factual stock tag from variant inventory — only shown when it's genuinely limited. */
function stockTag(variants: CardVariant[]) {
  const note = availabilityNote(variants);
  if (!note || note.tone !== "warn") return null;
  return note.text.startsWith("Limited") ? "Limited sizes" : note.text.startsWith("Only") ? note.text : "Low stock";
}

function useQuickAdd(product: CardProduct, swatch: CardSwatch | CardProduct) {
  const { addToCart, setCartOpen } = useStore();
  const [added, setAdded] = useState<CardVariant | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const add = (v: CardVariant) => {
    setPending(v.id);
    // brief perceived-latency state so the shopper sees the action register
    setTimeout(() => {
      addToCart(toMerchandise(product, swatch, v), 1, { openDrawer: false });
      setPending(null);
      setAdded(v);
    }, 280);
  };
  return { add, added, pending, openCart: () => setCartOpen(true) };
}

function SizeButtons({ variants, onPick, pending }: { variants: CardVariant[]; onPick: (v: CardVariant) => void; pending: string | null }) {
  return (
    <div className={`grid gap-1 ${variants.length > 12 ? "grid-cols-5" : "grid-cols-4"}`}>
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          disabled={!v.available || !!pending}
          onClick={() => onPick(v)}
          aria-label={v.available ? `Add size ${v.title} to cart${v.qty <= 3 ? `, only ${v.qty} left` : ""}` : `Size ${v.title} sold out`}
          className={`relative h-9 border text-[12px] font-semibold tabular-nums transition-colors ${
            v.available ? "border-line bg-white hover:border-ink hover:bg-ink hover:text-white" : "cursor-not-allowed border-line bg-surface text-subtle line-through decoration-subtle"
          } ${pending === v.id ? "bg-ink text-white" : ""}`}
        >
          {pending === v.id ? <span className="mx-auto block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : v.title}
          {v.available && v.qty <= 3 && pending !== v.id && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />}
        </button>
      ))}
    </div>
  );
}

function QuickBuyPanel({ product, swatch, onClose }: { product: CardProduct; swatch: CardSwatch | CardProduct; onClose: () => void }) {
  const { add, added, pending, openCart } = useQuickAdd(product, swatch);
  if (added) {
    // Entire confirmation card opens the cart (brief §6.C.5)
    return (
      <button type="button" onClick={openCart} className="flex w-full animate-rise items-center gap-3 bg-ink p-3 text-left text-white shadow-lg">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jd-yellow text-ink">
          <CheckIcon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">Added — size {added.title}</span>
          <span className="block text-[12px] text-white/75">View cart & checkout →</span>
        </span>
      </button>
    );
  }
  return (
    <div className="max-h-full animate-rise overflow-y-auto bg-white p-2.5 shadow-lg" role="group" aria-label="Select a size">
      <div className="mb-2 flex items-center justify-between">
        <span className="t-eyebrow text-[10px]">Select size{product.category === "Footwear" ? ` · ${product.gender === "Women" ? "Women's" : "Men's"} US` : ""}</span>
        <button type="button" onClick={onClose} aria-label="Close quick buy" className="-m-1 grid h-7 w-7 place-items-center text-muted hover:text-ink">
          <CloseIcon size={14} />
        </button>
      </div>
      <SizeButtons variants={swatch.variants} onPick={add} pending={pending} />
      <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden /> 3 or fewer left
      </p>
    </div>
  );
}

function QuickBuySheet({ product, swatch, onDone }: { product: CardProduct; swatch: CardSwatch | CardProduct; onDone: () => void }) {
  const { add, added, pending, openCart } = useQuickAdd(product, swatch);
  return (
    <div className="flex flex-col p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
      <div className="flex gap-3">
        <div className="w-20 shrink-0">
          <ProductImage src={swatch.image} alt="" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-[10px] text-muted">{product.brand}</p>
          <p className="text-sm font-semibold leading-tight">{product.model}</p>
          <p className="t-meta">{swatch.colourway}</p>
          <div className="mt-1">
            <Price price={swatch.price} compareAt={swatch.compareAt} size="sm" />
          </div>
        </div>
        <button type="button" onClick={onDone} aria-label="Close" className="-mr-2 -mt-2 grid h-11 w-11 place-items-center">
          <CloseIcon />
        </button>
      </div>
      {added ? (
        <button
          type="button"
          onClick={() => {
            onDone();
            openCart();
          }}
          className="mt-4 flex w-full animate-rise items-center gap-3 bg-ink p-4 text-left text-white"
        >
          <CheckIcon size={18} className="text-jd-yellow" />
          <span className="flex-1">
            <span className="block text-sm font-bold">Added to cart — size {added.title}</span>
            <span className="block text-xs text-white/75">Tap to view cart & checkout</span>
          </span>
          <BagIcon size={18} />
        </button>
      ) : (
        <>
          <p className="t-eyebrow mb-2 mt-4 text-[10px]">Select size{product.category === "Footwear" ? ` · ${product.gender === "Women" ? "Women's" : "Men's"} US` : ""}</p>
          <SizeButtons variants={swatch.variants} onPick={add} pending={pending} />
          <Link href={`/products/${swatch.handle}`} className="link-underline mt-4 text-center text-sm font-semibold">
            View full details
          </Link>
        </>
      )}
    </div>
  );
}
