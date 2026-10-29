"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CardProduct } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRightIcon, ChevronLeft, ChevronRight } from "@/components/ui/Icons";

type Tab = { label: string; products: CardProduct[]; viewAll: { href: string; count: number } };

/**
 * Carousel with visible state: position, total and a clean end state (brief §3.B.5),
 * a named "View All" link per tab (§3.B.1), and keyboard-reachable controls.
 */
export function ProductRail({ title, eyebrow, tabs, tone = "light", id }: { title: string; eyebrow?: string; tabs: Tab[]; tone?: "light" | "yellow"; id: string }) {
  const [tabIndex, setTabIndex] = useState(0);
  const tab = tabs[tabIndex];
  const scroller = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ first: 1, last: 4, atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-item]");
    const w = card ? card.offsetWidth + 16 : el.clientWidth;
    const first = Math.round(el.scrollLeft / w) + 1;
    const visible = Math.max(1, Math.floor((el.clientWidth + 16) / w));
    setPos({ first, last: Math.min(tab.products.length, first + visible - 1), atStart: el.scrollLeft < 8, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, [tab.products.length]);

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    measure();
    const el = scroller.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [tabIndex, measure]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const bg = tone === "yellow" ? "bg-jd-yellow" : "";
  return (
    <section aria-labelledby={`${id}-title`} className={`${bg} ${tone === "yellow" ? "py-12 md:py-16" : "py-12 md:py-16"}`}>
      <div className="container-jd">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            {eyebrow && <p className={`t-eyebrow mb-2 ${tone === "yellow" ? "text-ink" : "text-muted"}`}>{eyebrow}</p>}
            <h2 id={`${id}-title`} className="t-h2">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href={tab.viewAll.href} className="group inline-flex items-center gap-1.5 text-[13px] font-bold">
              <span className="link-underline">
                View all {tab.label !== "All" ? tab.label.toLowerCase() : ""} ({tab.viewAll.count})
              </span>
              <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          {tabs.length > 1 ? (
            <div role="tablist" aria-label={`${title} categories`} className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {tabs.map((t, i) => (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={i === tabIndex}
                  onClick={() => setTabIndex(i)}
                  className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                    i === tabIndex ? "bg-ink text-white" : tone === "yellow" ? "bg-white/60 hover:bg-white" : "bg-surface hover:bg-line"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="hidden items-center gap-3 md:flex">
            <span className="t-small font-semibold tabular-nums" aria-live="polite">
              {pos.first}–{pos.last} <span className={tone === "yellow" ? "" : "text-muted"}>of {tab.products.length}</span>
            </span>
            <button type="button" onClick={() => page(-1)} disabled={pos.atStart} aria-label={`Previous ${title} products`} className="grid h-10 w-10 place-items-center border border-ink/80 transition-colors hover:bg-ink hover:text-white disabled:border-black/15 disabled:text-black/25 disabled:hover:bg-transparent">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => page(1)} disabled={pos.atEnd} aria-label={`Next ${title} products`} className="grid h-10 w-10 place-items-center border border-ink/80 transition-colors hover:bg-ink hover:text-white disabled:border-black/15 disabled:text-black/25 disabled:hover:bg-transparent">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div ref={scroller} onScroll={measure} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:scroll-px-0 md:px-0" role="tabpanel">
          {tab.products.map((p, i) => (
            <div key={p.handle} data-rail-item className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-12px)] xl:w-[calc(20%-12.8px)]">
              <ProductCard product={p} priority={i < 2 && id === "new"} sizes="(min-width:1280px) 19vw, (min-width:1024px) 24vw, (min-width:640px) 31vw, 46vw" />
            </div>
          ))}
          {/* explicit end state */}
          <Link href={tab.viewAll.href} data-rail-item className={`flex w-[46%] shrink-0 snap-start flex-col items-center justify-center gap-3 text-center sm:w-[31%] lg:w-[calc(25%-12px)] xl:w-[calc(20%-12.8px)] ${tone === "yellow" ? "bg-ink text-white" : "bg-surface"} aspect-square`}>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-jd-yellow text-ink">
              <ArrowRightIcon size={20} />
            </span>
            <span className="px-4 text-sm font-bold">
              See all {tab.viewAll.count} {tab.label !== "All" ? tab.label.toLowerCase() : "styles"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
