"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CardProduct } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { ProductCard } from "./ProductCard";
import { HeartIcon } from "@/components/ui/Icons";

/** Guest favourites saved locally; would merge into the customer account on sign-in (brief §7). */
export function FavouritesView() {
  const { favourites, hydrated } = useStore();
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const key = favourites.join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (!favourites.length) return setItems([]);
    Promise.all(favourites.map((h) => fetch(`/api/products/${h}`).then((r) => (r.ok ? r.json() : null))))
      .then((rows) => setItems(rows.filter(Boolean).map((r) => r.card)))
      .catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  return (
    <div className="container-jd py-8 md:py-12">
      <h1 className="t-h1">
        Favourites {items && items.length > 0 && <span className="text-muted">({items.length})</span>}
      </h1>
      <p className="t-meta mt-2 text-[13px]">Saved on this device. Sign in to keep them across devices and get restock alerts.</p>
      {!items ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-square" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 border border-line p-12 text-center">
          <HeartIcon size={28} className="mx-auto" />
          <p className="t-h3 mt-4">No favourites yet</p>
          <p className="t-meta mt-1 text-[13px]">Tap the heart on any product to save it for later.</p>
          <Link href="/collections/new-arrivals" className="btn btn-primary mt-6">
            Shop New Arrivals
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.handle}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
