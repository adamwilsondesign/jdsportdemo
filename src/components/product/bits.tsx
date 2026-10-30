"use client";

import { useState } from "react";
import { formatMoney, percentOff, shopifyImage, shopifySrcSet } from "@/lib/format";
import { HeartIcon, StarIcon } from "@/components/ui/Icons";
import { useStore } from "@/components/providers/StoreProvider";

/** Sale hierarchy (brief §4.B.5): sale price → original → saving, one consistent pattern everywhere. */
export function Price({ price, compareAt, size = "md", showSaving = true }: { price: number; compareAt: number | null; size?: "sm" | "md" | "card" | "lg"; showSaving?: boolean }) {
  const pct = percentOff(price, compareAt);
  const text = size === "lg" ? "text-[26px] md:text-[30px]" : size === "card" ? "text-[15px] md:text-[17px]" : size === "sm" ? "text-[13px]" : "text-sm";
  if (!pct || !compareAt) return <span className={`t-price ${text}`}>{formatMoney(price)}</span>;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${text}`}>
      <span className="t-price text-sale">
        <span className="sr-only">Sale price </span>
        {formatMoney(price)}
      </span>
      <s className="t-price font-normal text-subtle">
        <span className="sr-only">Original price </span>
        {formatMoney(compareAt)}
      </s>
      {showSaving && <span className="text-[11px] font-bold uppercase tracking-wide text-sale">Save {formatMoney(compareAt - price)}</span>}
    </span>
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon size={size} fill="#d4d4d4" className="absolute inset-0" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon size={size} fill="#0a0a0a" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function Rating({ reviews }: { reviews: { rating: number; count: number } | null }) {
  // Reserve the row even when empty so card heights stay aligned (brief §4.B.4)
  if (!reviews) return <div className="h-4" aria-hidden />;
  return (
    <div className="flex h-4 items-center gap-1.5">
      <Stars rating={reviews.rating} />
      <span className="t-meta text-[11px]">
        <span className="sr-only">Rated {reviews.rating} out of 5 from </span>
        {reviews.rating.toFixed(1)} ({reviews.count}
        <span className="sr-only"> reviews</span>)
      </span>
    </div>
  );
}

export type BadgeKind = "sale" | "exclusive" | "new" | "soldout";

/** Controlled badge system — one merchandising badge per card, fixed priority. */
export function pickBadge(p: { price: number; compareAt: number | null; isNew: boolean; exclusive?: boolean; soldOut?: boolean }): { kind: BadgeKind; label: string } | null {
  if (p.soldOut) return { kind: "soldout", label: "Sold out" };
  const pct = percentOff(p.price, p.compareAt);
  if (pct) return { kind: "sale", label: `−${pct}%` };
  if (p.isNew) return { kind: "new", label: "New" };
  return null;
}

export function Badge({ kind, label }: { kind: BadgeKind; label: string }) {
  const cls =
    kind === "sale" ? "bg-sale text-white" : kind === "exclusive" ? "bg-jd-yellow text-ink" : kind === "soldout" ? "bg-white text-muted border border-line" : "bg-white text-ink";
  return (
    <span className={`inline-flex h-6 items-center px-2 text-[10.5px] font-bold uppercase tracking-[0.08em] ${cls}`}>
      {kind === "exclusive" && <span className="sr-only">Exclusive: available only at JD Sports — </span>}
      {label}
    </span>
  );
}

export function FavouriteButton({ handle, label, className = "", size = 20 }: { handle: string; label: string; className?: string; size?: number }) {
  const { isFavourite, toggleFavourite, hydrated } = useStore();
  const on = hydrated && isFavourite(handle);
  const [pulse, setPulse] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from Favourites` : `Save ${label} to Favourites`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setPulse((n) => n + 1);
        toggleFavourite(handle, label);
      }}
      className={`grid h-11 w-11 place-items-center transition-colors ${className}`}
    >
      <span key={pulse} className={pulse ? "animate-pop" : ""}>
        <HeartIcon size={size} filled={on} className={on ? "text-sale" : ""} />
      </span>
    </button>
  );
}

/** Responsive Shopify CDN image with a reserved aspect ratio (no layout shift). */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  aspect = "aspect-square",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  aspect?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-image ${aspect} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Shopify CDN handles resizing via width param */}
      <img
        src={shopifyImage(src, 720)}
        srcSet={shopifySrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete && !loaded) setLoaded(true);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
