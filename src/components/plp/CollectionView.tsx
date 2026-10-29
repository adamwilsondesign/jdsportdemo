"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CardProduct } from "@/lib/types";
import { SORTS, type CollectionShortcut, type SortKey } from "@/lib/collections";
import { FACET_LABELS, activeCount, applyFilters, computeFacets, displayValue, parseFilters, sortProducts, type FacetKey } from "@/lib/filters";
import { plural } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel } from "./FilterPanel";
import { Overlay } from "@/components/ui/Overlay";
import { ArrowUpIcon, ChevronDown, CloseIcon, FilterIcon } from "@/components/ui/Icons";

const PAGE_SIZE = 24;

export function CollectionView({
  title,
  description,
  products,
  shortcuts,
  defaultSort = "featured",
  breadcrumb,
  promo,
}: {
  title: string;
  description?: string;
  products: CardProduct[];
  shortcuts?: CollectionShortcut[];
  defaultSort?: SortKey;
  breadcrumb: { label: string; href?: string }[];
  promo?: { href: string; eyebrow: string; title: string; cta: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const sort = (sp.get("sort_by") as SortKey) || defaultSort;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const [sidebar, setSidebar] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const gridTop = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => sortProducts(applyFilters(products, filters), sort), [products, filters, sort]);
  const facets = useMemo(() => computeFacets(products, filters), [products, filters]);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const nActive = activeCount(filters);

  // ---- URL state (Shopify-style params) so back/forward and shared links restore the view ----
  const update = useCallback(
    (mut: (p: URLSearchParams) => void, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const p = new URLSearchParams(sp.toString());
      mut(p);
      if (opts.resetPage) p.delete("page");
      const qs = p.toString();
      setBusy(true);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, pathname, router],
  );
  useEffect(() => setBusy(false), [sp]);

  const toggle = (k: FacetKey, v: string) =>
    update((p) => {
      const key = `filter.${k}`;
      const cur = p.getAll(key);
      p.delete(key);
      (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => p.append(key, x));
    });
  const clearAll = () => update((p) => [...p.keys()].filter((k) => k.startsWith("filter.")).forEach((k) => p.delete(k)));
  const setSort = (s: SortKey) => update((p) => (s === defaultSort ? p.delete("sort_by") : p.set("sort_by", s)));

  // ---- Preserve scroll position when returning from a PDP (brief §4.C.2) ----
  const scrollKey = `plp-scroll:${pathname}?${sp.toString()}`;
  useLayoutEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const saved = sessionStorage.getItem(scrollKey);
    if (saved && (nav?.type === "back_forward" || sessionStorage.getItem("plp-return") === "1")) {
      window.scrollTo(0, Number(saved));
    }
    sessionStorage.removeItem("plp-return");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => sessionStorage.setItem(scrollKey, String(window.scrollY)), 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollKey]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a?.getAttribute("href")?.startsWith("/products/")) {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
        sessionStorage.setItem("plp-return", "1");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [scrollKey]);

  // Back to top visibility
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 1400);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const chips = Object.entries(filters).flatMap(([k, vals]) => (vals ?? []).map((v) => ({ k: k as FacetKey, v })));

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="container-jd pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="t-meta mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumb.map((b, i) => (
              <li key={b.label} className="flex items-center gap-1.5">
                {b.href ? (
                  <Link href={b.href} className="hover:text-ink hover:underline">
                    {b.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink">
                    {b.label}
                  </span>
                )}
                {i < breadcrumb.length - 1 && <span aria-hidden>/</span>}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <h1 className="t-h1">
            {title} <span className="align-top text-[0.45em] font-semibold tracking-normal text-muted tabular-nums">({products.length})</span>
          </h1>
        </div>
        {description && <p className="t-body mt-2 max-w-2xl text-muted">{description}</p>}
        {shortcuts && shortcuts.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {shortcuts.map((s) => {
              const activeShortcut = typeof window !== "undefined" && s.href === `${pathname}?${sp.toString()}`;
              return (
                <Link key={s.label} href={s.href} scroll={false} className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${activeShortcut ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>
                  {s.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky toolbar: result count, filter count, sort (brief §4.A.7) */}
      <div className="sticky top-14 z-30 mt-6 border-y border-line bg-white/95 backdrop-blur">
        <div className="container-jd flex h-14 items-center gap-3">
          <button type="button" onClick={() => setSidebar((s) => !s)} className="hidden h-10 items-center gap-2 text-[13px] font-bold lg:flex" aria-expanded={sidebar} aria-controls="plp-filters">
            <FilterIcon size={18} /> {sidebar ? "Hide filters" : "Show filters"}
            {nActive > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] text-white">{nActive}</span>}
          </button>
          <button type="button" onClick={() => setSheet(true)} className="flex h-10 items-center gap-2 border border-line px-3 text-[13px] font-bold lg:hidden">
            <FilterIcon size={18} /> Filter & sort
            {nActive > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] text-white">{nActive}</span>}
          </button>
          <p className="t-small font-semibold tabular-nums text-muted" aria-live="polite">
            {busy ? "Updating…" : plural(filtered.length, "result")}
          </p>
          <label className="ml-auto hidden items-center gap-2 text-[13px] lg:flex">
            <span className="text-muted">Sort by</span>
            <span className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-10 appearance-none border border-line bg-white pl-3 pr-9 text-[13px] font-semibold outline-none hover:border-ink focus-visible:border-ink">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </span>
          </label>
        </div>
      </div>

      <div className="container-jd mt-6 flex gap-10">
        {/* Desktop sidebar */}
        {sidebar && (
          <aside id="plp-filters" aria-label="Filters" className="no-scrollbar sticky top-[136px] hidden max-h-[calc(100dvh-152px)] w-[256px] shrink-0 self-start overflow-y-auto pb-8 lg:block">
            <FilterPanel facets={facets} filters={filters} onToggle={toggle} />
            {nActive > 0 && (
              <button type="button" onClick={clearAll} className="btn btn-outline mt-4 h-10 min-h-0 w-full text-[13px]">
                Clear all filters
              </button>
            )}
          </aside>
        )}

        <div className="min-w-0 flex-1" ref={gridTop}>
          {/* Active filters as removable chips (brief §4.A.5) */}
          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map(({ k, v }) => (
                <button key={k + v} type="button" onClick={() => toggle(k, v)} className="flex h-8 items-center gap-1.5 rounded-full bg-surface pl-3 pr-2 text-[12.5px] font-semibold hover:bg-line" aria-label={`Remove filter ${FACET_LABELS[k]}: ${displayValue(k, v)}`}>
                  <span className="text-muted">{FACET_LABELS[k]}:</span> {displayValue(k, v)} <CloseIcon size={13} />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="link-underline ml-1 text-[12.5px] font-bold">
                Clear all
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <NoResults chips={chips} onRemove={toggle} onClear={clearAll} />
          ) : (
            <>
              <ul className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 md:gap-y-10 ${sidebar ? "xl:grid-cols-4" : "lg:grid-cols-4 2xl:grid-cols-5"} transition-opacity ${busy ? "opacity-50" : ""}`}>
                {shown.map((p, i) => (
                  <PromoAware key={p.handle} index={i} promo={nActive === 0 ? promo : undefined}>
                    <ProductCard product={p} priority={i < 4} sizes={sidebar ? "(min-width:1280px) 19vw, (min-width:768px) 28vw, 48vw" : "(min-width:1024px) 23vw, (min-width:768px) 31vw, 48vw"} />
                  </PromoAware>
                ))}
              </ul>

              {/* Progressive loading with status instead of a 58-page selector (brief §4.C.1) */}
              <div className="mx-auto mt-14 flex max-w-xs flex-col items-center text-center">
                <p className="t-small font-semibold">
                  Showing {shown.length} of {filtered.length}
                </p>
                <div className="mt-2 h-1 w-full bg-line" role="progressbar" aria-label="Products loaded" aria-valuemin={0} aria-valuemax={filtered.length} aria-valuenow={shown.length}>
                  <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${(shown.length / filtered.length) * 100}%` }} />
                </div>
                {shown.length < filtered.length ? (
                  <button type="button" onClick={() => update((p) => p.set("page", String(page + 1)), { resetPage: false })} className="btn btn-outline mt-5 w-full">
                    Load {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
                  </button>
                ) : (
                  <p className="t-meta mt-4">You&apos;ve seen everything in {title}.</p>
                )}
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
                  <ArrowUpIcon size={14} /> Back to top
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="fixed bottom-5 right-5 z-40 grid h-12 w-12 animate-fade-in place-items-center bg-ink text-white shadow-lg hover:bg-[#2b2b2b]">
          <ArrowUpIcon size={18} />
        </button>
      )}

      {/* Mobile filter sheet: full height, persistent actions, no accidental dismissal (brief §4.A.8) */}
      <Overlay open={sheet} onClose={() => setSheet(false)} side="right" mobileSide="right" label="Filter and sort" dismissOnBackdrop={false} className="!max-w-full md:!max-w-[420px]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <p className="text-[15px] font-extrabold uppercase tracking-wide">
            Filter & sort {nActive > 0 && <span className="text-muted">({nActive})</span>}
          </p>
          <button type="button" onClick={() => setSheet(false)} aria-label="Close filters" className="-mr-2 grid h-11 w-11 place-items-center" data-autofocus>
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div role="radiogroup" aria-labelledby="sheet-sort" className="border-b border-line py-4">
            <p id="sheet-sort" className="mb-3 text-[14px] font-bold">Sort by</p>
            <div className="grid grid-cols-2 gap-2">
              {SORTS.map((s) => (
                <label key={s.key} className={`flex h-11 cursor-pointer items-center justify-center border px-2 text-center text-[12.5px] font-semibold ${sort === s.key ? "border-ink bg-ink text-white" : "border-line"}`}>
                  <input type="radio" name="sort" value={s.key} checked={sort === s.key} onChange={() => setSort(s.key)} className="sr-only" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <FilterPanel facets={facets} filters={filters} onToggle={toggle} defaultOpen={["availability", "category", "size"]} />
        </div>
        <div className="grid shrink-0 grid-cols-[1fr_2fr] gap-2 border-t border-line p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={clearAll} disabled={!nActive} className="btn btn-outline disabled:border-line disabled:text-subtle">
            Clear
          </button>
          <button type="button" onClick={() => setSheet(false)} className="btn btn-primary">
            View {plural(filtered.length, "item")}
          </button>
        </div>
      </Overlay>
    </div>
  );
}

function PromoAware({ index, promo, children }: { index: number; promo?: { href: string; eyebrow: string; title: string; cta: string }; children: React.ReactNode }) {
  return (
    <>
      {promo && index === 7 && (
        <li className="col-span-2 md:col-span-1">
          <Link href={promo.href} className="group flex aspect-[2/1] h-full flex-col justify-between bg-jd-yellow p-5 md:aspect-auto">
            <p className="t-eyebrow">{promo.eyebrow}</p>
            <div>
              <p className="t-h2">{promo.title}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold underline underline-offset-4">{promo.cta} →</p>
            </div>
          </Link>
        </li>
      )}
      <li>{children}</li>
    </>
  );
}

/** Explain which filters caused zero results and offer one-tap recovery (brief §4.C.4). */
function NoResults({ chips, onRemove, onClear }: { chips: { k: FacetKey; v: string }[]; onRemove: (k: FacetKey, v: string) => void; onClear: () => void }) {
  return (
    <div className="border border-line p-8 text-center md:p-14">
      <p className="t-h3">No styles match all of these filters</p>
      <p className="t-meta mx-auto mt-2 max-w-md text-[13px]">Try removing one — the most restrictive are listed first.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {chips.map(({ k, v }) => (
          <button key={k + v} type="button" onClick={() => onRemove(k, v)} className="flex h-9 items-center gap-1.5 rounded-full border border-ink px-4 text-[13px] font-semibold hover:bg-ink hover:text-white">
            Remove {FACET_LABELS[k].toLowerCase()}: {displayValue(k, v)} <CloseIcon size={13} />
          </button>
        ))}
      </div>
      <button type="button" onClick={onClear} className="btn btn-primary mt-6">
        Clear all filters
      </button>
    </div>
  );
}
