"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import { FREE_SHIPPING_THRESHOLD, formatMoney, shopifyImage } from "@/lib/format";
import { CheckIcon, ShieldIcon } from "@/components/ui/Icons";
import { JDLogo } from "@/components/ui/Logo";

/** Demo end-state: where Shopify Checkout would take over from the storefront. */
export function CheckoutHandoff() {
  const { lines, subtotal, savings, totalQuantity, hydrated } = useStore();
  const express = useSearchParams().get("express") === "shop-pay";
  if (!hydrated) return <div className="container-jd py-20"><div className="skeleton mx-auto h-96 max-w-3xl" /></div>;

  return (
    <div className="bg-surface py-12 md:py-20">
      <div className="container-jd">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-ink p-8 text-white md:p-12">
            <div className="flex items-center gap-3">
              <JDLogo size={40} />
              <span className="text-white/40">→</span>
              <span className={`rounded-sm px-2 py-1 text-[12px] font-extrabold ${express ? "bg-shoppay" : "bg-white text-ink"}`}>{express ? "Shop Pay" : "Shopify Checkout"}</span>
            </div>
            <h1 className="t-h1 mt-10">This is where {express ? "Shop Pay" : "Shopify Checkout"} takes over</h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              In production, the cart hands off to Shopify&apos;s hosted checkout with the same line items, so everything below is handled by the platform, not custom code.
            </p>
            <ul className="mt-8 space-y-3 text-[14px]">
              {[
                express ? "One-tap Shop Pay with saved address and payment" : "Guest or signed-in checkout, Shop Pay, PayPal, Apple Pay, Afterpay",
                "Live shipping rates for the shopper's postal code",
                "GST / HST / PST calculated by province",
                "Discount codes and gift cards (kept out of the cart by design)",
                "Order confirmation, tracking and returns flow",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon size={18} className="mt-0.5 shrink-0 text-jd-yellow" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/collections/new-arrivals" className="btn btn-yellow">
                Keep exploring
              </Link>
              <Link href="/cart" className="btn btn-ghost-light">
                Back to cart
              </Link>
            </div>
          </div>

          <aside className="bg-white p-6 md:p-8">
            <h2 className="t-eyebrow">Order summary · {totalQuantity} {totalQuantity === 1 ? "item" : "items"}</h2>
            {lines.length === 0 ? (
              <p className="t-meta mt-4">Your cart is empty — add something to see the hand-off summary.</p>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-line">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 py-3">
                      <span className="relative h-14 w-14 shrink-0 bg-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shopifyImage(l.merchandise.product.image, 120)} alt="" className="h-full w-full object-cover" />
                        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{l.quantity}</span>
                      </span>
                      <span className="min-w-0 flex-1 text-[13px]">
                        <span className="block truncate font-semibold">
                          {l.merchandise.product.brand} {l.merchandise.product.model}
                        </span>
                        <span className="t-meta block truncate">
                          {l.merchandise.product.colourway} · Size {l.merchandise.title}
                        </span>
                      </span>
                      <span className="t-price text-[13px]">{formatMoney(Number(l.merchandise.price.amount) * l.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13.5px]">
                  {savings > 0 && (
                    <div className="flex justify-between text-sale">
                      <dt>Savings</dt>
                      <dd className="t-price">−{formatMoney(savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd className="text-muted">{subtotal >= FREE_SHIPPING_THRESHOLD ? "Free" : "Calculated at checkout"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Tax</dt>
                    <dd className="text-muted">Calculated at checkout</dd>
                  </div>
                  <div className="flex justify-between pt-2 text-[15px] font-bold">
                    <dt>Subtotal</dt>
                    <dd className="t-price">{formatMoney(subtotal)}</dd>
                  </div>
                </dl>
              </>
            )}
            <p className="t-meta mt-6 flex items-center gap-2">
              <ShieldIcon size={16} /> Payments processed securely by Shopify
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
