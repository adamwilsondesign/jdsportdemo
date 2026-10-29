"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CardProduct } from "@/lib/types";
import { SORTS, type CollectionShortcut, type SortKey } from "@/lib/collections";
import { FACET_LABELS, activeCount, applyFilters, computeFacets, displayValue, parseFilters, sortProducts, type FacetKey } from "@/lib/filters";
import { plural } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel } from "./FilterPanel";
import { Overlay } from "@/components/ui/Overlay";
import { ArrowUpIcon, ChevronDown, CloseIcon, FilterIcon } from "@/components/ui/Icons";

const PAGE_SIZE = 24;

export type PromoCard = { href: string; title: string; cta: string; image?: string };
export type PromoBanner = { href: string; title: string; copy: string; cta: string; image: string };
export type Merchandising = { cards: PromoCard[]; banners: PromoBanner[] };

export function CollectionView({
  title,
  description,
  products,
  shortcuts,
  defaultSort = "featured",
  breadcrumb,
  merch,
}: {
  title: string;
  description?: string;
  products: CardProduct[];
  shortcuts?: CollectionShortcut[];
  defaultSort?: SortKey;
  breadcrumb: { label: string; href?: string }[];
  merch?: Merchandising;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const sort = (sp.get("sort_by") as SortKey) || defaultSort;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  // Filters start hidden; the grid gets the full width until the shopper asks for them
  const [sidebar, setSidebar] = useState(false);
  const [density, setDensity] = useState<"compact" | "large">("compact");
  useEffect(() => {
    try {
      const d = localStorage.getItem("jd.plp-density");
      if (d === "large" || d === "compact") setDensity(d);
    } catch {}
  }, []);
  const chooseDensity = (d: "compact" | "large") => {
    setDensity(d);
    try {
      localStorage.setItem("jd.plp-density", d);
    } catch {}
  };
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => sortProducts(applyFilters(products, filters), sort), [products, filters, sort]);
  const facets = useMemo(() => computeFacets(products, filters), [products, filters]);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const nActive = activeCount(filters);
  const hasMore = shown.length < filtered.length;

  // ---- URL state (Shopify-style params) so back/forward and shared links restore the view ----
  const update = useCallback(
    (mut: (p: URLSearchParams) => void, opts: { resetPage?: boolean; quiet?: boolean } = { resetPage: true }) => {
      const p = new URLSearchParams(sp.toString());
      mut(p);
      if (opts.resetPage) p.delete("page");
      const qs = p.toString();
      if (!opts.quiet) setBusy(true);
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

  // ---- Infinite scroll: load the next batch as the shopper nears the end of the grid ----
  const sentinel = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  useEffect(() => {
    loading.current = false;
  }, [page]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !loading.current) {
          loading.current = true;
          update((p) => p.set("page", String(page + 1)), { resetPage: false, quiet: true });
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, page, update]);

  // ---- Preserve scroll position when returning from a PDP ----
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

  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 1400);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Shortcuts that add filters to *this* collection become quick filters in the toolbar
  const quickFilters = (shortcuts ?? [])
    .map((sc) => {
      const u = new URL(sc.href, "https://jd.local");
      const params = [...u.searchParams.entries()].filter(([k]) => k.startsWith("filter."));
      if (u.pathname !== pathname || !params.length) return null;
      const active = params.every(([k, v]) => sp.getAll(k).includes(v));
      return { label: sc.label, params, active };
    })
    .filter((q): q is { label: string; params: [string, string][]; active: boolean } => !!q);
  const toggleQuick = (q: (typeof quickFilters)[number]) =>
    update((p) => {
      for (const [k, v] of q.params) {
        const cur = p.getAll(k);
        p.delete(k);
        (q.active ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== v), v]).forEach((x) => p.append(k, x));
      }
    });

  const chips = Object.entries(filters).flatMap(([k, vals]) => (vals ?? []).map((v) => ({ k: k as FacetKey, v })));
  const applied =
    chips.length > 0 ? (
      <div className="pb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[13px] font-semibold">Applied</p>
          <button type="button" onClick={clearAll} className="text-[12.5px] font-semibold text-muted underline underline-offset-2 hover:text-ink">
            Clear all
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map(({ k, v }) => (
            <button key={k + v} type="button" onClick={() => toggle(k, v)} className="flex h-7 items-center gap-1 rounded-full bg-ink pl-3 pr-2 text-[12px] font-semibold text-white hover:bg-[#333]" aria-label={`Remove filter ${FACET_LABELS[k]}: ${displayValue(k, v)}`}>
              {displayValue(k, v)} <CloseIcon size={12} />
            </button>
          ))}
        </div>
      </div>
    ) : null;

  // ---- Grid slots: products, interleaved promo cards and full-row banners ----
  // Banners only land after 12 slots so rows are complete at 2, 3 and 4 columns.
  const showMerch = !!merch && nActive === 0;
  const slots: ReactNode[] = [];
  let slot = 0;
  let card = 0;
  let banner = 0;
  shown.forEach((p, i) => {
    if (showMerch && merch.cards[card] && (slot === 4 || slot === 19 || slot === 31)) {
      slots.push(<PromoTile key={`promo-${card}`} promo={merch.cards[card]} />);
      card++;
      slot++;
    }
    slots.push(
      <li key={p.handle}>
        <ProductCard product={p} priority={i < 3} sizes={density === "large" ? "(min-width:640px) 48vw, 100vw" : sidebar ? "(min-width:768px) 28vw, 48vw" : "(min-width:1024px) 23vw, (min-width:768px) 31vw, 48vw"} />
      </li>,
    );
    slot++;
    if (showMerch && merch.banners[banner] && slot % 12 === 0 && slot >= 12 && i < shown.length - 1 && (slot === 12 || slot === 36)) {
      slots.push(<PromoBannerRow key={`banner-${banner}`} banner={merch.banners[banner]} />);
      banner++;
    }
  });

  return (
    <div className="pb-8">
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
        <h1 className="t-h1">{title}</h1>
        {description && <p className="t-body mt-2 max-w-2xl text-muted">{description}</p>}
      </div>

      {/* Sticky filter bar: filter toggle, count, quick filters, sort — all in one row */}
      <div className="sticky top-14 z-30 mt-6 border-y border-line bg-white/95 backdrop-blur">
        <div className="container-jd flex h-14 items-center gap-3">
          <button type="button" onClick={() => setSidebar((s) => !s)} className="hidden h-10 shrink-0 items-center gap-2 text-[13px] font-bold lg:flex" aria-expanded={sidebar} aria-controls="plp-filters">
            <FilterIcon size={18} /> {sidebar ? "Hide filters" : "Show filters"}
            {nActive > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] text-white">{nActive}</span>}
          </button>
          <button type="button" onClick={() => setSheet(true)} className="flex h-10 shrink-0 items-center gap-2 border border-line px-3 text-[13px] font-bold lg:hidden">
            <FilterIcon size={18} /> Filter & sort
            {nActive > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] text-white">{nActive}</span>}
          </button>
          <p className="hidden shrink-0 text-[13px] font-semibold tabular-nums text-muted lg:block" aria-live="polite">
            {busy ? "Updating…" : plural(filtered.length, "result")}
          </p>
          {quickFilters.length > 0 && (
            <div className="no-scrollbar -mr-4 flex min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden pr-4 lg:ml-3 lg:mr-0 lg:border-l lg:border-line lg:pl-5 lg:pr-0">
              {quickFilters.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  aria-pressed={q.active}
                  onClick={() => toggleQuick(q)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${q.active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
                >
                  {q.label}
                  {q.active && <CloseIcon size={12} />}
                </button>
              ))}
            </div>
          )}
          <div role="radiogroup" aria-label="Grid size" className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-4">
            {(["compact", "large"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={density === d}
                aria-label={d === "compact" ? "Compact grid" : "Large grid"}
                onClick={() => chooseDensity(d)}
                className={`grid h-9 w-9 place-items-center transition-colors ${density === d ? "text-ink" : "text-subtle hover:text-ink"}`}
              >
                <DensityIcon cols={d === "compact" ? 4 : 2} active={density === d} />
              </button>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-[13px] lg:flex">
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

      <div className="container-jd mt-8 flex gap-10">
        {sidebar && (
          <aside id="plp-filters" aria-label="Filters" className="no-scrollbar sticky top-[136px] hidden max-h-[calc(100dvh-152px)] w-[248px] shrink-0 self-start overflow-y-auto pb-8 lg:block">
            {/* Applied filters live in the sidebar, so toggling never pushes the grid down */}
            {applied}
            <FilterPanel facets={facets} filters={filters} onToggle={toggle} />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <NoResults chips={chips} onRemove={toggle} onClear={clearAll} />
          ) : (
            <>
              <ul
                className={`grid gap-x-3 gap-y-10 sm:gap-x-4 md:gap-y-12 ${
                  density === "large" ? "grid-cols-1 sm:grid-cols-2 md:gap-x-6" : `grid-cols-2 md:grid-cols-3 ${sidebar ? "" : "lg:grid-cols-4"}`
                } transition-opacity duration-300 ${busy ? "opacity-50" : ""}`}
              >
                {slots.map((s, i) => (
                  <Fragment key={i}>{s}</Fragment>
                ))}
              </ul>

              {/* Infinite scroll status */}
              <div ref={sentinel} className="mx-auto mt-14 flex max-w-xs flex-col items-center text-center" aria-live="polite">
                {hasMore ? (
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" aria-hidden /> Loading more styles…
                  </p>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold">You&apos;ve seen all {plural(filtered.length, "style")}</p>
                    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
                      <ArrowUpIcon size={14} /> Back to top
                    </button>
                  </>
                )}
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

      {/* Mobile filter sheet: full height, persistent actions, no accidental dismissal */}
      <Overlay open={sheet} onClose={() => setSheet(false)} side="right" mobileSide="right" label="Filter and sort" dismissOnBackdrop={false} className="!max-w-full md:!max-w-[420px]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <p className="text-[15px] font-extrabold uppercase tracking-wide">
            Filter & sort {nActive > 0 && <span className="text-muted">({nActive})</span>}
          </p>
          <button type="button" onClick={() => setSheet(false)} aria-label="Close filters" className="-mr-2 grid h-11 w-11 place-items-center" data-autofocus>
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          {applied}
          <div role="radiogroup" aria-labelledby="sheet-sort" className="border-b border-line pb-5">
            <p id="sheet-sort" className="mb-3 text-[13px] font-semibold">
              Sort by
            </p>
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

function PromoTile({ promo }: { promo: PromoCard }) {
  return (
    <li className="col-span-full sm:col-span-1">
      <div className="relative flex h-[260px] flex-col justify-end overflow-hidden bg-ink p-5 text-white sm:h-full sm:min-h-[260px]">
        {promo.image && (
          <>
            <Image src={promo.image} alt="" fill sizes="(min-width:768px) 30vw, 100vw" className="object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
          </>
        )}
        <div className="relative">
          <p className="t-h2">{promo.title}</p>
          <Link href={promo.href} className="btn btn-yellow mt-4 h-10 min-h-0 px-4 text-[13px]">
            {promo.cta}
          </Link>
        </div>
      </div>
    </li>
  );
}

function PromoBannerRow({ banner }: { banner: PromoBanner }) {
  return (
    <li className="col-span-full">
      <div className="relative flex aspect-[4/5] items-end overflow-hidden bg-ink text-white sm:aspect-[2400/950]">
        <Image src={banner.image} alt="" fill sizes="(min-width:1024px) 90vw, 100vw" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
        <div className="relative flex w-full flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <div className="max-w-lg">
            <p className="t-h2">{banner.title}</p>
            <p className="mt-2 text-[14px] text-white/85">{banner.copy}</p>
          </div>
          <Link href={banner.href} className="btn btn-yellow h-11 min-h-0 self-start md:self-auto">
            {banner.cta}
          </Link>
        </div>
      </div>
    </li>
  );
}

function DensityIcon({ cols, active }: { cols: 2 | 4; active: boolean }) {
  const cells = cols === 4 ? [0, 1, 2, 3].flatMap((x) => [0, 1].map((y) => ({ x: 2 + x * 5, y: 4 + y * 8, w: 3.5, h: 6.5 }))) : [0, 1].map((x) => ({ x: 3 + x * 9.5, y: 4, w: 8, h: 14.5 }));
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

/** Explain which filters caused zero results and offer one-tap recovery. */
function NoResults({ chips, onRemove, onClear }: { chips: { k: FacetKey; v: string }[]; onRemove: (k: FacetKey, v: string) => void; onClear: () => void }) {
  return (
    <div className="border border-line p-8 text-center md:p-14">
      <p className="t-h3">No styles match all of these filters</p>
      <p className="t-meta mx-auto mt-2 max-w-md text-[13px]">Try removing one of them.</p>
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
