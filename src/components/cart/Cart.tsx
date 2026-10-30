"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CardProduct, CartLine } from "@/lib/types";
import { FREE_SHIPPING_THRESHOLD, LOW_STOCK_THRESHOLD, formatMoney, shopifyImage } from "@/lib/format";
import { toMerchandise } from "@/lib/merch";
import { useStore } from "@/components/providers/StoreProvider";
import { Overlay } from "@/components/ui/Overlay";
import { BagIcon, CheckIcon, CloseIcon, EditIcon, HeartIcon, InfoIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/ui/Icons";
import { PaymentIcons } from "@/components/ui/PaymentIcons";
import { Price } from "@/components/product/bits";

// ---------------------------------------------------------------------------
// Free shipping progress — dollar-based, accessible (brief §6.C.2)
// ---------------------------------------------------------------------------
export function FreeShippingProgress({ subtotal, inline }: { subtotal: number; inline?: boolean }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  if (inline)
    // Drawer header: one short line of copy over a hairline progress bar
    return (
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold" aria-live="polite">
          {remaining > 0 ? (
            <>
              <TruckIcon size={15} className="shrink-0" /> <span className="truncate"><span className="t-price">{formatMoney(remaining)}</span> away from free shipping</span>
            </>
          ) : (
            <>
              <CheckIcon size={15} className="shrink-0 text-success" /> <span className="truncate">Your order qualifies for free shipping</span>
            </>
          )}
        </p>
        <div
          className="mt-1.5 h-[3px] overflow-hidden bg-line"
          role="progressbar"
          aria-label="Progress to free standard shipping"
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_THRESHOLD}
          aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
        >
          <div className={`h-full transition-[width] duration-500 ease-[var(--ease-out-soft)] ${remaining > 0 ? "bg-ink" : "bg-success"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  return (
    <div>
      <p className="flex items-center gap-2 text-[13px] font-semibold" aria-live="polite">
        {remaining > 0 ? (
          <>
            <TruckIcon size={18} /> You&apos;re <span className="t-price">{formatMoney(remaining)}</span> away from free standard shipping
          </>
        ) : (
          <>
            <CheckIcon size={18} className="text-success" /> Your order qualifies for free standard shipping
          </>
        )}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden bg-line"
        role="progressbar"
        aria-label="Progress to free standard shipping"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
      >
        <div className={`h-full transition-[width] duration-500 ease-[var(--ease-out-soft)] ${remaining > 0 ? "bg-ink" : "bg-success"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line item
// ---------------------------------------------------------------------------
function LineItem({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { updateQuantity, removeLine, saveForLater, lastAddedId, setCartOpen } = useStore();
  const [editing, setEditing] = useState(false);
  const m = line.merchandise;
  const unit = Number(m.price.amount);
  const cmp = m.compareAtPrice ? Number(m.compareAtPrice.amount) : null;
  const max = Math.min(10, m.quantityAvailable);
  const unavailable = m.quantityAvailable === 0;
  const isNew = lastAddedId === m.id;
  const label = `${m.product.brand} ${m.product.model}`;

  return (
    <li className={`${compact ? "py-5" : "py-5"} ${isNew ? "animate-rise" : ""}`}>
      <div className="flex gap-4">
        <Link href={`/products/${m.product.handle}`} onClick={() => setCartOpen(false)} className={`relative shrink-0 bg-image ${compact ? "h-[120px] w-[96px]" : "h-32 w-32 md:h-40 md:w-40"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImage(m.product.image, 320)} alt="" className="h-full w-full object-cover" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="t-eyebrow text-[10px] text-muted">{m.product.brand}</p>
              <Link href={`/products/${m.product.handle}`} onClick={() => setCartOpen(false)} className="mt-0.5 block text-[15px] font-semibold leading-tight hover:underline">
                {m.product.model}
              </Link>
            </div>
            <div className="text-right">
              <p className="t-price text-[15px]">{formatMoney(unit * line.quantity)}</p>
              {cmp && <s className="t-price block text-[12px] font-normal text-subtle">{formatMoney(cmp * line.quantity)}</s>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-expanded={editing}
            className="mt-1.5 inline-flex w-fit items-center gap-1.5 text-left text-[12.5px] text-muted hover:text-ink"
          >
            <span className="line-clamp-1">
              {m.product.colourway} · <span className="font-semibold text-ink">Size {m.title}</span>
            </span>
            <EditIcon size={13} className="shrink-0" />
            <span className="sr-only">Edit colour or size</span>
          </button>

          {cmp && <p className="mt-1 text-[11.5px] font-bold uppercase tracking-wide text-sale">You save {formatMoney((cmp - unit) * line.quantity)}</p>}
          {unavailable ? (
            <p className="mt-1.5 text-[12px] font-semibold text-sale">No longer available in size {m.title} — choose another size to keep it in your order.</p>
          ) : (
            m.quantityAvailable <= LOW_STOCK_THRESHOLD && <p className="mt-1.5 text-[12px] font-semibold text-warn">Only {m.quantityAvailable} left in size {m.title}</p>
          )}

          <div className={`mt-auto flex items-center justify-between gap-2 ${compact ? "pt-2" : "pt-3"}`}>
            <div className="flex h-9 items-center border border-line" role="group" aria-label={`Quantity for ${label}`}>
              <button type="button" onClick={() => (line.quantity === 1 ? removeLine(line.id) : updateQuantity(line.id, line.quantity - 1))} className="grid h-full w-9 place-items-center hover:bg-surface" aria-label={line.quantity === 1 ? `Remove ${label}` : "Decrease quantity"}>
                <MinusIcon size={14} />
              </button>
              <span className="w-7 text-center text-[13px] font-semibold tabular-nums" aria-live="polite">
                {line.quantity}
              </span>
              <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)} disabled={line.quantity >= max} className="grid h-full w-9 place-items-center hover:bg-surface disabled:text-line-strong disabled:hover:bg-transparent" aria-label="Increase quantity">
                <PlusIcon size={14} />
              </button>
            </div>
            <div className="-mr-2 flex items-center">
              <button type="button" onClick={() => saveForLater(line.id)} aria-label={`Save ${label} for later`} title="Save for later" className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-sale">
                <HeartIcon size={17} />
              </button>
              <button type="button" onClick={() => removeLine(line.id)} aria-label={`Remove ${label}`} title="Remove" className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-ink">
                <TrashIcon size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {editing && <VariantEditor line={line} onDone={() => setEditing(false)} />}
    </li>
  );
}

/** Inline colour/size editing with availability + price revalidation (brief §6.A.1). */
function VariantEditor({ line, onDone }: { line: CartLine; onDone: () => void }) {
  const { replaceMerchandise, toast } = useStore();
  const [data, setData] = useState<{ card: CardProduct; siblings: CardProduct[] } | null>(null);
  const [error, setError] = useState(false);
  const [handle, setHandle] = useState(line.merchandise.product.handle);
  const [size, setSize] = useState(line.merchandise.title);

  useEffect(() => {
    let live = true;
    fetch(`/api/products/${line.merchandise.product.handle}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => live && setData(d))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [line.merchandise.product.handle]);

  if (error) return <p className="mt-3 text-[12px] text-sale">Couldn&apos;t load options. Please try again.</p>;
  if (!data)
    return (
      <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading options">
        <div className="skeleton h-10" />
        <div className="skeleton h-20" />
      </div>
    );

  const current = data.siblings.find((s) => s.handle === handle) ?? data.card;
  const variant = current.variants.find((v) => v.title === size);
  const sizeOk = !!variant?.available;
  const changed = handle !== line.merchandise.product.handle || size !== line.merchandise.title;
  const priceChanged = current.price !== Number(line.merchandise.price.amount);

  return (
    <div className="mt-4 animate-rise border border-line bg-surface/60 p-4">
      {data.siblings.length > 1 && (
        <fieldset>
          <legend className="t-eyebrow mb-2 text-[10px]">
            Colour · <span className="font-semibold normal-case tracking-normal text-muted">{current.colourway}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {data.siblings.map((s) => (
              <button
                key={s.handle}
                type="button"
                onClick={() => setHandle(s.handle)}
                aria-pressed={s.handle === handle}
                aria-label={s.colourway}
                className={`h-12 w-12 overflow-hidden bg-image ${s.handle === handle ? "ring-2 ring-ink ring-offset-1" : "ring-1 ring-line"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shopifyImage(s.image, 120)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="mt-3">
        <legend className="t-eyebrow mb-2 text-[10px]">Size</legend>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
          {current.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={!v.available}
              onClick={() => setSize(v.title)}
              aria-pressed={v.title === size}
              className={`h-9 border text-[12px] font-semibold tabular-nums ${
                v.title === size ? "border-ink bg-ink text-white" : v.available ? "border-line bg-white hover:border-ink" : "border-line bg-white text-subtle line-through"
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>
      </fieldset>
      {!sizeOk && <p className="mt-2 text-[12px] font-semibold text-sale">Size {size} isn&apos;t available in this colour — pick another size.</p>}
      {sizeOk && priceChanged && (
        <p className="mt-2 text-[12px] text-muted">
          Price for this colour: <b className="text-ink">{formatMoney(current.price)}</b>
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!sizeOk || !changed}
          onClick={() => {
            if (!variant) return;
            replaceMerchandise(line.id, toMerchandise(data.card, current, variant));
            toast({ message: `Updated to ${current.colourway}, size ${size}`, tone: "success" });
            onDone();
          }}
          className="btn btn-primary h-10 min-h-0 flex-1 text-[13px]"
        >
          Update item
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline h-10 min-h-0 text-[13px]">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export function CartSummary({ onCheckout, compact }: { onCheckout?: () => void; compact?: boolean }) {
  const { subtotal, savings, totalQuantity, lines } = useStore();
  const [why, setWhy] = useState(false);
  const blocked = lines.some((l) => l.merchandise.quantityAvailable === 0);
  const afterpay = subtotal >= 35 && subtotal <= 2000;
  return (
    <div>
      <dl className={`text-[13.5px] ${compact ? "space-y-1" : "space-y-2"}`}>
        <div className={`justify-between ${compact && !savings ? "hidden" : "flex"}`}>
          <dt>Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})</dt>
          <dd className="t-price">{formatMoney(subtotal + savings)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between font-semibold text-sale">
            <dt>Sale savings</dt>
            <dd className="t-price">−{formatMoney(savings)}</dd>
          </div>
        )}
        {/* Shipping and tax share one line, split by a hairline */}
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="flex items-center justify-between gap-2 pr-4">
            <dt className="flex items-center gap-1">
              Shipping
              <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} aria-label="Why are shipping and tax calculated at checkout?" className="-my-1 grid h-6 w-6 place-items-center text-muted">
                <InfoIcon size={14} />
              </button>
            </dt>
            <dd className="text-right text-muted">{subtotal >= FREE_SHIPPING_THRESHOLD ? <span className="font-semibold text-success">Free</span> : "At checkout"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 pl-4">
            <dt>Tax</dt>
            <dd className="text-muted">TBD</dd>
          </div>
        </div>
        {why && <p className="animate-fade-in bg-surface p-3 text-[12px] text-muted">Shipping rates and GST/HST/PST depend on your delivery address, so we calculate them at checkout once you enter it.</p>}
        <div className={`flex justify-between border-t border-line text-[15px] font-bold ${compact ? "pt-2" : "pt-3"}`}>
          <dt>Estimated total</dt>
          <dd className="t-price">{formatMoney(subtotal)}</dd>
        </div>
      </dl>
      <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        <Link href="/checkout" onClick={onCheckout} aria-disabled={blocked} className={`btn btn-primary px-3 text-[15px] ${blocked ? "pointer-events-none opacity-40" : ""}`}>
          Checkout
        </Link>
        <Link href="/checkout?express=shop-pay" onClick={onCheckout} className="btn bg-shoppay px-3 text-[15px] text-white hover:brightness-110" aria-label="Express checkout with Shop Pay">
          ShopPay
        </Link>
      </div>
      {!compact && <PaymentIcons className="mt-3 justify-center" />}
      {/* Afterpay and returns share one line */}
      <div className={`grid grid-cols-2 items-center gap-3 text-[11px] text-muted sm:flex sm:justify-between sm:whitespace-nowrap ${compact ? "mt-2.5" : "mt-3"}`}>
        <p>{afterpay && <>or 4 interest free payments of <b className="text-ink">{formatMoney(Math.round((subtotal / 4) * 100) / 100)}</b></>}</p>
        <p className="text-right">
          Full refund for 14 days.{" "}
          <Link href="/pages/returns" className="link-underline">
            Details
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete the look — compact, collapsible, genuinely complementary (brief §6.C.1)
// ---------------------------------------------------------------------------
function CompleteTheLook({ handle }: { handle: string }) {
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const { addToCart, lines } = useStore();
  const [added, setAdded] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/products/${handle}`)
      .then((r) => r.json())
      .then((d) => setItems(d.completeTheLook))
      .catch(() => setItems([]));
  }, [handle]);
  const inCart = new Set(lines.map((l) => l.merchandise.product.handle));
  const list = (items ?? []).filter((p) => !inCart.has(p.handle));
  if (items && !list.length) return null;
  return (
    <section aria-label="Complete the look" className="border-t border-line pt-5">
      <h3 className="text-[13px] font-bold">Complete the look</h3>
      <ul className="no-scrollbar -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto overflow-y-hidden scroll-px-5 px-5">
        {!items
          ? [0, 1, 2].map((i) => <li key={i} className="skeleton h-[180px] w-[132px] shrink-0" />)
          : list.slice(0, 6).map((p) => {
              const available = p.variants.filter((x) => x.available);
              // one-size items add straight away; everything else asks for a size first
              const single = p.variants.length === 1 ? available[0] : undefined;
              const done = added === p.handle;
              const open = picking === p.handle;
              return (
                <li key={p.handle} className="w-[132px] shrink-0 snap-start">
                  <div className="relative">
                    <Link href={`/products/${p.handle}`} className="block aspect-square overflow-hidden bg-image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shopifyImage(p.image, 280)} alt="" className="h-full w-full object-cover" />
                    </Link>
                    {available.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (single) {
                            addToCart(toMerchandise(p, p, single), 1, { openDrawer: false });
                            setAdded(p.handle);
                          } else setPicking(open ? null : p.handle);
                        }}
                        aria-label={single ? `Add ${p.brand} ${p.model}` : `Choose a size for ${p.brand} ${p.model}`}
                        aria-expanded={single ? undefined : open}
                        className={`absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center shadow-sm transition-colors ${done ? "bg-success text-white" : open ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink hover:text-white"}`}
                      >
                        {done ? <CheckIcon size={14} /> : <PlusIcon size={14} className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`} />}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 truncate text-[12px] font-semibold">{p.model}</p>
                  <div className="mt-0.5">
                    <Price price={p.price} compareAt={p.compareAt} size="sm" showSaving={false} />
                  </div>
                </li>
              );
            })}
      </ul>
      {(() => {
        const p = list.find((x) => x.handle === picking);
        if (!p) return null;
        return (
          <div className="mt-3 animate-rise border border-line bg-surface p-3" role="group" aria-label={`Select a size for ${p.model}`}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[12px] font-semibold">
                Select size <span className="font-normal text-muted">· {p.model}</span>
              </p>
              <button type="button" onClick={() => setPicking(null)} aria-label="Close size picker" className="-m-2 grid h-9 w-9 shrink-0 place-items-center transition-transform duration-300 hover:rotate-90">
                <CloseIcon size={14} />
              </button>
            </div>
            <div className={`grid gap-1 ${p.variants.length > 12 ? "grid-cols-6" : "grid-cols-5"}`}>
              {p.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.available}
                  onClick={() => {
                    addToCart(toMerchandise(p, p, v), 1, { openDrawer: false });
                    setAdded(p.handle);
                    setPicking(null);
                  }}
                  aria-label={v.available ? `Add size ${v.title}` : `Size ${v.title} sold out`}
                  className={`h-9 border text-[12px] font-semibold tabular-nums transition-colors ${v.available ? "border-line bg-white hover:border-ink hover:bg-ink hover:text-white" : "cursor-not-allowed border-line bg-white text-subtle line-through"}`}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
}

function EmptyCart({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface">
        <BagIcon size={26} />
      </span>
      <p className="t-h3 mt-5">Your cart is empty</p>
      <p className="t-meta mt-1 max-w-[260px] text-[13px]">Free standard shipping on orders over $99. Start with what&apos;s new this week.</p>
      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2">
        <Link href="/collections/new-arrivals" onClick={onClose} className="btn btn-primary">
          Shop New Arrivals
        </Link>
        <Link href="/favourites" onClick={onClose} className="btn btn-outline">
          View Favourites
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer — summary + checkout pinned while lines scroll (brief §6.C.3)
// ---------------------------------------------------------------------------
export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, totalQuantity, subtotal, hydrated } = useStore();
  const close = () => setCartOpen(false);
  return (
    <Overlay open={cartOpen} onClose={close} side="right" label={`Cart, ${hydrated ? totalQuantity : 0} items`}>
      <div className="flex h-16 shrink-0 items-center gap-5 border-b border-line px-5">
        <h2 className="text-[22px] font-extrabold uppercase leading-none tracking-[-0.01em]">Cart</h2>
        <div className="min-w-0 flex-1">{lines.length > 0 && <FreeShippingProgress subtotal={subtotal} inline />}</div>
        <button type="button" onClick={close} aria-label="Close cart" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center transition-transform duration-300 hover:rotate-90" data-autofocus>
          <CloseIcon />
        </button>
      </div>
      {!lines.length ? (
        <EmptyCart onClose={close} />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <LineItem key={l.id} line={l} compact />
              ))}
            </ul>
            <div className="pb-5">
              <CompleteTheLook handle={lines[0].merchandise.product.handle} />
            </div>
          </div>
          <div className="shrink-0 bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.14)]">
            <CartSummary onCheckout={close} compact />
          </div>
        </>
      )}
    </Overlay>
  );
}

export function CartPageView() {
  const { lines, subtotal, hydrated, totalQuantity } = useStore();
  if (!hydrated) return <div className="container-jd py-16"><div className="skeleton h-64" /></div>;
  return (
    <div className="container-jd py-8 md:py-12">
      <h1 className="t-h1">
        Your cart <span className="text-muted">({totalQuantity})</span>
      </h1>
      {!lines.length ? (
        <EmptyCart />
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="border border-line p-4">
              <FreeShippingProgress subtotal={subtotal} />
            </div>
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <LineItem key={l.id} line={l} />
              ))}
            </ul>
          </div>
          <aside className="h-fit border border-line p-6 lg:sticky lg:top-28">
            <h2 className="t-eyebrow mb-4">Order summary</h2>
            <CartSummary />
            <div className="mt-6">
              <CompleteTheLook handle={lines[0].merchandise.product.handle} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
