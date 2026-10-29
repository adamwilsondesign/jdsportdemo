"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CardProduct } from "@/lib/types";
import { formatMoney, shopifyImage } from "@/lib/format";
import { ArrowRightIcon, ChevronDown, PlusIcon } from "@/components/ui/Icons";
import { Price } from "@/components/product/bits";

export type Hotspot = { x: number; y: number; product: CardProduct; label: string };

/** Campaign imagery that leads straight into commerce (brief §3.C.2). */
export function ShoppableLook({ image, eyebrow, title, copy, hotspots, cta }: { image: string; eyebrow: string; title: string; copy: string; hotspots: Hotspot[]; cta: { label: string; href: string } }) {
  const [active, setActive] = useState<number | null>(null);
  const total = hotspots.reduce((n, h) => n + h.product.price, 0);
  return (
    <section aria-labelledby="look-title" className="py-12 md:py-20">
      <div className="container-jd grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-image">
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
        <div>
          <p className="t-eyebrow text-muted">{eyebrow}</p>
          <h2 id="look-title" className="t-h1 mt-3">
            {title}
          </h2>
          <p className="t-body mt-4 max-w-md text-muted">{copy}</p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {hotspots.map((h, i) => (
              <li key={h.product.handle} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                <Link href={`/products/${h.product.handle}`} className={`flex items-center gap-4 py-3 transition-colors ${active === i ? "bg-surface" : ""}`}>
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
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href={cta.href} className="btn btn-primary">
              {cta.label}
            </Link>
            <span className="t-meta">Full look {formatMoney(total)} · ships free</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Collapsed SEO copy: indexable, but no longer a wall of scroll (brief §3.C.4). */
export function SeoBlock({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="seo-title" className="container-jd pt-4">
      <div className="max-w-3xl border-t border-line pt-10">
        <h2 id="seo-title" className="t-eyebrow text-muted">
          {title}
        </h2>
        <div id="seo-copy" className={`relative mt-3 overflow-hidden text-[13.5px] leading-relaxed text-muted ${open ? "" : "max-h-[4.6em]"}`}>
          {paragraphs.map((p) => (
            <p key={p.slice(0, 20)} className="mb-3">
              {p}
            </p>
          ))}
          {!open && <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white" />}
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="seo-copy" className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold">
          {open ? "Read less" : "Read more"} <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
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
