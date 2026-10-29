"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardProduct, CardSwatch, CardVariant } from "@/lib/types";
import { shopifyImage } from "@/lib/format";
import { availabilityNote, toMerchandise } from "@/lib/merch";
import { useStore } from "@/components/providers/StoreProvider";
import { Badge, FavouriteButton, Price, ProductImage, Rating, pickBadge } from "./bits";
import { BagIcon, CheckIcon, CloseIcon, PlusIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";

export function ProductCard({ product, priority, sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw" }: { product: CardProduct; priority?: boolean; sizes?: string }) {
  const [activeHandle, setActiveHandle] = useState(product.handle);
  const active: CardSwatch | CardProduct = product.swatches.find((s) => s.handle === activeHandle) ?? product;
  const [quickOpen, setQuickOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const soldOut = !active.variants.some((v) => v.available);
  const badge = pickBadge({ price: active.price, compareAt: active.compareAt, exclusive: product.exclusive, isNew: product.isNew, soldOut });
  const note = availabilityNote(active.variants);
  const label = `${product.brand} ${product.model}`;
  const href = `/products/${active.handle}`;
  const swatches = product.swatches;
  const extraColours = swatches.length - 1;

  return (
    <article className="group/card relative flex flex-col" onMouseLeave={() => setQuickOpen(false)}>
      <div className="relative">
        <Link href={href} className="block" aria-label={`${label}, ${active.colourway}`}>
          <ProductImage src={active.image} alt={`${label} in ${active.colourway}`} sizes={sizes} priority={priority} />
          {active.hoverImage && (
            // Alternate angle on hover (desktop only) — the merchandised rollover image from JD's data
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopifyImage(active.hoverImage, 720)}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 md:block md:group-hover/card:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex gap-1">{badge && <Badge {...badge} />}</div>
        <FavouriteButton handle={active.handle} label={label} className="absolute right-0 top-0 text-ink hover:text-sale" />

        {/* Desktop quick buy: sizes in place, scroll position untouched (brief §3.B.3) */}
        {!soldOut && (
          <div className="pointer-events-none absolute inset-2 hidden flex-col justify-end md:flex [&>*]:pointer-events-auto">
            {quickOpen ? (
              <QuickBuyPanel product={product} swatch={active} onClose={() => setQuickOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="btn h-10 min-h-0 w-full translate-y-1 bg-white/95 text-[13px] text-ink opacity-0 shadow-sm backdrop-blur transition-all hover:bg-ink hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100"
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

      <div className="flex flex-1 flex-col pt-3">
        <Link href={href} className="flex flex-1 flex-col">
          <span className="t-eyebrow text-[10.5px] text-muted">{product.brand}</span>
          <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-[13.5px] font-semibold leading-[1.25] group-hover/card:underline group-hover/card:underline-offset-2 md:text-sm">
            {product.model}
          </h3>
          <span className="t-meta mt-0.5 line-clamp-1 text-[12px]">{active.colourway}</span>
          <div className="mt-2 min-h-[20px]">
            <Price price={active.price} compareAt={active.compareAt} size="sm" />
          </div>
        </Link>
        {/* swatches — reserved row so cards align even with a single colour */}
        <div className="mt-2 flex h-6 items-center gap-1.5">
          {swatches.length > 1 && (
            <>
              {swatches.slice(0, 4).map((s) => (
                <button
                  key={s.handle}
                  type="button"
                  onMouseEnter={() => setActiveHandle(s.handle)}
                  onFocus={() => setActiveHandle(s.handle)}
                  onClick={() => setActiveHandle(s.handle)}
                  aria-label={`Show colour ${s.colourway}`}
                  aria-pressed={s.handle === activeHandle}
                  className={`relative h-6 w-6 overflow-hidden bg-image transition-shadow ${s.handle === activeHandle ? "ring-1 ring-ink ring-offset-1" : "ring-1 ring-transparent hover:ring-line-strong"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shopifyImage(s.image, 80)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
              <span className="t-meta ml-0.5 text-[11px]">{extraColours === 1 ? "+1 colour" : `+${extraColours} colours`}</span>
            </>
          )}
        </div>

        <div className="mt-1.5">
          <Rating reviews={product.reviews} />
        </div>
        <div className="mt-1 h-4 text-[11.5px] font-semibold" aria-live="polite">
          {note && <span className={note.tone === "warn" ? "text-warn" : "text-muted"}>{note.text}</span>}
        </div>
      </div>

      <Overlay open={sheetOpen} onClose={() => setSheetOpen(false)} side="bottom" label={`Quick buy ${label}`}>
        <QuickBuySheet product={product} swatch={active} onDone={() => setSheetOpen(false)} />
      </Overlay>
    </article>
  );
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
