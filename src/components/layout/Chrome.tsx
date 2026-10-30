"use client";

import Link from "next/link";
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
