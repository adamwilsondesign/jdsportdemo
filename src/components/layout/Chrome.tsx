"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";

/** One marketing message, and the sentence itself is the link (no separate "Details" CTA). */
export function AnnouncementBar() {
  return (
    <div className="bg-jd-yellow text-ink">
      <div className="container-jd flex h-9 items-center justify-between gap-4 text-[12px] font-semibold">
        <div className="hidden w-56 lg:block" aria-hidden />
        <p className="flex-1 truncate text-center">
          <Link href="/pages/shipping" className="underline-offset-4 hover:underline">
            Free standard shipping on orders over $99
          </Link>
        </p>
        <nav aria-label="Utility" className="hidden w-56 justify-end gap-4 whitespace-nowrap text-[11.5px] lg:flex">
          <Link href="/pages/order-tracking" className="hover:underline">Order Tracking</Link>
          <Link href="/pages/store-locator" className="hover:underline">Stores</Link>
          <span>
            <b>EN</b> / <span className="opacity-60">FR</span>
          </span>
        </nav>
      </div>
    </div>
  );
}

/** Replaces the blocking country modal with a compact, remembered confirmation (brief §3.A.5). */
export function CountryNotice() {
  const { prefs, setPrefs, hydrated } = useStore();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!hydrated || prefs.countryConfirmed) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [hydrated, prefs.countryConfirmed]);
  if (!show || prefs.countryConfirmed) return null;
  return (
    <div role="region" aria-label="Shipping country" className="fixed bottom-4 left-4 right-4 z-[90] animate-rise bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:left-auto sm:w-[360px]">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          🇨🇦
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">You&apos;re shopping JD Sports Canada</p>
          <p className="t-meta mt-0.5">Prices in CAD · Shipping to Canadian addresses</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setPrefs({ countryConfirmed: true })} className="btn btn-primary h-9 min-h-0 px-4 text-[12.5px]">
              <CheckIcon size={14} /> Continue
            </button>
            <a href="https://www.jdsports.com" className="btn btn-outline h-9 min-h-0 px-4 text-[12.5px]">
              Change country
            </a>
          </div>
        </div>
        <button type="button" onClick={() => setPrefs({ countryConfirmed: true })} aria-label="Dismiss" className="-mr-2 -mt-2 grid h-9 w-9 place-items-center text-muted">
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-[420px] animate-rise items-center gap-3 bg-ink px-4 py-3 text-sm text-white shadow-xl">
          {t.tone === "success" && <CheckIcon size={16} className="shrink-0 text-jd-yellow" />}
          <span className="flex-1">{t.message}</span>
          {t.action &&
            (t.action.href ? (
              <Link href={t.action.href} onClick={() => dismissToast(t.id)} className="font-bold text-jd-yellow underline underline-offset-4">
                {t.action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick?.();
                  dismissToast(t.id);
                }}
                className="font-bold text-jd-yellow underline underline-offset-4"
              >
                {t.action.label}
              </button>
            ))}
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="-mr-1 grid h-7 w-7 place-items-center text-white/60 hover:text-white">
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
