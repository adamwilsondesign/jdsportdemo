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
import { BrandLogo } from "@/components/ui/BrandLogo";
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
      <div className="group/img relative overflow-hidden" onMouseLeave={() => setQuickOpen(false)}>
        <Link href={href} className="block" aria-label={`${label}, ${active.colourway}`}>
          <ProductImage src={active.image} alt={`${label} in ${active.colourway}`} sizes={sizes} priority={priority} />
          {active.hoverImage && (
            // Alternate angle: preloaded off-screen-free (opacity 0), then a short cross-fade on hover
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopifyImage(active.hoverImage, 720)}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 hidden h-full w-full bg-image object-cover opacity-0 transition-opacity duration-300 ease-out md:block md:group-hover/img:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <div className="pointer-events-none absolute left-2 top-2">
            <Badge {...badge} />
          </div>
        )}
        <FavouriteButton handle={active.handle} label={label} className="absolute right-0 top-0 text-ink hover:text-sale" />

        {/* Bottom edge: brand mark left, stock signal right */}
        <span className={`pointer-events-none absolute bottom-3 left-3 transition-opacity duration-200 ${quickOpen ? "opacity-0" : ""}`}>
          <BrandLogo brand={product.brand} size={30} className="text-[11px] tracking-[0.04em]" />
        </span>
        {stock && (
          <span
            className={`pointer-events-none absolute bottom-3 right-14 flex items-center gap-1.5 text-[11px] font-semibold text-ink transition-opacity duration-200 md:right-3 ${quickOpen ? "opacity-0" : "md:group-hover/img:opacity-0"}`}
          >
            <span className="h-2 w-2 rounded-full bg-warn sm:h-1.5 sm:w-1.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">{stock}</span>
          </span>
        )}

        {/* Desktop quick buy: a square + that expands into the size menu */}
        {!soldOut && (
          <div className="pointer-events-none absolute inset-2 hidden items-end justify-end md:flex [&>*]:pointer-events-auto">
            {quickOpen ? (
              <QuickBuyPanel product={product} swatch={active} onClose={() => setQuickOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                aria-label={`Quick buy ${label}`}
                className="grid h-10 w-10 translate-y-1 place-items-center bg-white text-ink opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-[opacity,transform,background-color,color] duration-200 ease-out hover:bg-ink hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/img:translate-y-0 group-hover/img:opacity-100"
              >
                <PlusIcon size={18} />
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
            className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center bg-white text-ink shadow-sm active:scale-95 md:hidden"
          >
            <PlusIcon size={18} />
          </button>
        )}
      </div>

      <div className="pt-3">
        <Link href={href} className="group/title block">
          <span className="sr-only">{product.brand} </span>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] md:text-[17px] decoration-1 underline-offset-2 group-hover/title:underline" title={product.model}>
              {product.model}
            </h3>
            <span className="shrink-0">
              <Price price={active.price} compareAt={active.compareAt} size="card" showSaving={false} />
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-[13px] text-muted md:text-[14px]">{active.colourway}</p>
            {product.reviews && (
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums">
                <StarIcon size={11} />
                {product.reviews.rating.toFixed(1)}
                <span className="font-normal text-muted">({product.reviews.count})</span>
                <span className="sr-only"> out of 5, {product.reviews.count} reviews</span>
              </span>
            )}
          </div>
        </Link>
        {swatches.length > 1 && (
          // Short colour bars butted together: white border keeps dark colours visible on black, yellow marks the selection
          <div className="mt-2 flex items-center" role="group" aria-label={`${swatches.length} colours`}>
            {swatches.slice(0, 5).map((s) => (
              <button
                key={s.handle}
                type="button"
                onClick={() => setActiveHandle(s.handle)}
                aria-label={`Show colour ${s.colourway}`}
                aria-pressed={s.handle === activeHandle}
                title={s.colourway}
                className="group/sw relative py-2"
              >
                <span
                  className={`block h-[6px] w-12 border transition-colors ${s.handle === activeHandle ? "relative z-10 border-jd-yellow" : "border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)] group-hover/sw:border-jd-yellow/60"}`}
                  style={{ background: COLOUR_SWATCH[s.colourFamily] ?? "#bbb" }}
                />
              </button>
            ))}
            <span className="t-meta ml-3 text-[11.5px]">{swatches.length} colours</span>
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
    // Entire confirmation card opens the cart
    return (
      <button type="button" onClick={openCart} className="flex w-full origin-bottom-right animate-[qb-in_260ms_var(--ease-out-soft)_both] items-center gap-3 bg-ink p-3 text-left text-white shadow-lg">
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
    <div className="relative max-h-full w-full origin-bottom-right animate-[qb-in_260ms_var(--ease-out-soft)_both] overflow-y-auto bg-white p-3 theme-light shadow-[0_10px_30px_rgba(0,0,0,0.16)]" role="group" aria-label="Select a size">
      <div className="mb-2.5 flex items-center justify-between pr-8">
        <span className="text-[12px] font-semibold">Select size{product.category === "Footwear" ? <span className="font-normal text-muted"> · {product.gender === "Women" ? "Women's" : "Men's"} US</span> : null}</span>
      </div>
      {/* the + becomes the × in the panel's top-right corner */}
      <button type="button" onClick={onClose} aria-label="Close quick buy" className="absolute right-1 top-1 grid h-9 w-9 place-items-center text-ink transition-transform duration-300 hover:rotate-90">
        <CloseIcon size={16} />
      </button>
      <SizeButtons variants={swatch.variants} onPick={add} pending={pending} />
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
