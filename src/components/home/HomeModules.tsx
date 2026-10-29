"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CardProduct } from "@/lib/types";
import { formatMoney, shopifyImage } from "@/lib/format";
import { ArrowRightIcon, PlusIcon } from "@/components/ui/Icons";
import { Price } from "@/components/product/bits";

export type Hotspot = { x: number; y: number; product: CardProduct; label: string };

/** Campaign imagery that leads straight into commerce (brief §3.C.2). */
export function ShoppableLook({ image, title, copy, hotspots, cta }: { image: string; title: string; copy: string; hotspots: Hotspot[]; cta: { label: string; href: string } }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section aria-labelledby="look-title" className="reveal py-2">
      {/* Same 2-up grid and gutter as the editorial pair above, so the two rows read as one grid */}
      <div className="container-jd grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-image md:aspect-[5/6]">
          <Image src={image} alt="Model wearing an UGG shearling moto jacket, balloon jeans and Tasman slippers" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          {hotspots.map((h, i) => (
            <Link
              key={h.product.handle}
              href={`/products/${h.product.handle}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${h.label}: ${h.product.brand} ${h.product.model}, ${formatMoney(h.product.price)}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span className={`relative grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-lg transition-transform ${active === i ? "scale-110" : ""}`}>
                <span className="absolute inset-0 animate-ping rounded-full bg-white/60 [animation-duration:2.4s] motion-reduce:hidden" aria-hidden />
                <PlusIcon size={16} className={`relative transition-transform ${active === i ? "rotate-45" : ""}`} />
              </span>
              <span className={`pointer-events-none absolute left-11 top-1/2 hidden w-max -translate-y-1/2 bg-white px-3 py-2 text-[12px] font-semibold shadow-lg transition-opacity md:block ${active === i ? "opacity-100" : "opacity-0"}`}>
                {h.product.model} · {formatMoney(h.product.price)}
              </span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col justify-center bg-surface p-6 md:p-10 lg:p-14">
          <h2 id="look-title" className="t-h1">
            {title}
          </h2>
          <p className="t-body mt-4 max-w-md text-muted">{copy}</p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {hotspots.map((h, i) => (
              <li key={h.product.handle} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                <Link href={`/products/${h.product.handle}`} className={`flex items-center gap-4 px-2 py-3 transition-colors ${active === i ? "bg-white" : ""}`}>
                  <span className="w-5 text-center text-[12px] font-bold tabular-nums text-muted">{i + 1}</span>
                  <span className="h-16 w-16 shrink-0 bg-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shopifyImage(h.product.image, 160)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="t-eyebrow block text-[10px] text-muted">
                      {h.label} · {h.product.brand}
                    </span>
                    <span className="block truncate text-[14px] font-semibold">{h.product.model}</span>
                    <span className="t-meta block truncate">{h.product.colourway}</span>
                  </span>
                  <Price price={h.product.price} compareAt={h.product.compareAt} size="sm" showSaving={false} />
                </Link>
              </li>
            ))}
          </ol>
          <Link href={cta.href} className="btn btn-primary mt-6">
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, link, id }: { eyebrow?: string; title: string; link?: { label: string; href: string }; id: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
      <div>
        {eyebrow && <p className="t-eyebrow mb-2 text-muted">{eyebrow}</p>}
        <h2 id={id} className="t-h2">
          {title}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="group inline-flex items-center gap-1.5 text-[13px] font-bold">
          <span className="link-underline">{link.label}</span>
          <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
