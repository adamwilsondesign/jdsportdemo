"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NAV, TOP_BRANDS, type NavItem } from "@/lib/nav";
import { formatMoney, shopifyImage, slugify } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import { JDLogo } from "@/components/ui/Logo";
import { BagIcon, ChevronDown, ChevronRight, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";

export function Header({ brands }: { brands: { name: string; count: number }[] }) {
  const { totalQuantity, hydrated, setCartOpen, favourites } = useStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // hover intent: avoid menus flashing open as the pointer crosses the nav
  const intent = (label: string | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(label), label ? 140 : 200);
  };

  const count = hydrated ? totalQuantity : 0;
  const active = NAV.find((n) => n.label === openMenu);

  return (
    <>
      <header className="on-dark sticky top-0 z-50 bg-ink text-white" onMouseLeave={() => intent(null)}>
        <div className={`container-jd flex items-center gap-4 transition-[height] duration-300 ${compact ? "h-14" : "h-16 md:h-[72px]"}`}>
          <button type="button" className="-ml-2 grid h-11 w-11 place-items-center lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <MenuIcon size={22} />
          </button>
          <Link href="/" aria-label="JD Sports Canada — home" className="shrink-0 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <JDLogo size={compact ? 38 : 44} className="text-white transition-all duration-300" />
          </Link>

          <nav aria-label="Main" className="ml-6 hidden h-full lg:block">
            <ul className="flex h-full items-stretch">
              {NAV.map((item) => (
                <li key={item.label} className="flex" onMouseEnter={() => intent(item.columns ? item.label : null)}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center px-3 text-[13px] font-bold tracking-[0.01em] xl:px-4 ${item.tone === "sale" ? "text-[#ff5a5a]" : "text-white"} after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-jd-yellow after:transition-transform hover:after:scale-x-100 xl:after:inset-x-4 ${openMenu === item.label ? "after:scale-x-100" : ""}`}
                  >
                    {item.label}
                  </Link>
                  {item.columns && (
                    <button
                      type="button"
                      className="sr-only focus:not-sr-only focus:my-auto focus:grid focus:h-6 focus:w-6 focus:place-items-center"
                      aria-expanded={openMenu === item.label}
                      aria-label={`${item.label} menu`}
                      onClick={() => setOpenMenu((m) => (m === item.label ? null : item.label))}
                    >
                      <ChevronDown size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <div className="mr-2 hidden w-[300px] lg:block xl:w-[340px]">
              <SearchBox brands={brands} />
            </div>
            <Link href="/account" className="hidden h-11 w-11 place-items-center md:grid" aria-label="Account">
              <UserIcon />
            </Link>
            <Link href="/favourites" className="relative grid h-11 w-11 place-items-center" aria-label={`Favourites${hydrated && favourites.length ? `, ${favourites.length} saved` : ""}`}>
              <HeartIcon />
              {hydrated && favourites.length > 0 && <span className="absolute right-1.5 top-2 h-2 w-2 rounded-full bg-jd-yellow" aria-hidden />}
            </Link>
            <button type="button" onClick={() => setCartOpen(true)} className="relative -mr-2 grid h-11 w-11 place-items-center" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
              <BagIcon />
              <span
                key={count}
                className={`absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-jd-yellow px-1 text-[10.5px] font-bold text-ink tabular-nums ${count ? "animate-pop" : "opacity-0"}`}
                aria-hidden
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {/* mobile search row — search stays one tap away on small screens */}
        <div className={`container-jd pb-2.5 lg:hidden ${compact ? "hidden" : ""}`}>
          <SearchBox brands={brands} />
        </div>

        {/* Mega menu */}
        {active?.columns && (
          <div className="absolute inset-x-0 top-full hidden animate-fade-in border-t border-white/10 bg-white text-ink shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] lg:block" onMouseEnter={() => intent(active.label)}>
            <MegaMenu item={active} brands={brands} onNavigate={() => setOpenMenu(null)} />
          </div>
        )}
      </header>

      <Overlay open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" label="Menu">
        <MobileMenu brands={brands} onClose={() => setMobileOpen(false)} />
      </Overlay>
    </>
  );
}

function MegaMenu({ item, onNavigate, brands }: { item: NavItem; onNavigate: () => void; brands: { name: string; count: number }[] }) {
  return (
    <div className="container-jd grid grid-cols-[1fr_1fr_1fr_minmax(280px,1.2fr)] gap-10 py-10" onKeyDown={(e) => e.key === "Escape" && onNavigate()}>
      {item.columns!.map((col) => (
        <div key={col.title}>
          <p className="t-eyebrow mb-4 text-muted">{col.title}</p>
          <ul className="space-y-2.5">
            {col.links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} onClick={onNavigate} className="text-[15px] font-medium hover:underline hover:underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {col.title === "Top Brands" && (
            <Link href="/collections/all" onClick={onNavigate} className="link-underline mt-4 inline-block text-[13px] font-bold">
              All {brands.length} brands
            </Link>
          )}
        </div>
      ))}
      {item.feature && (
        <Link href={item.feature.href} onClick={onNavigate} className="group relative block aspect-[4/3] overflow-hidden bg-image">
          <Image src={item.feature.image} alt="" fill sizes="360px" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white">
            <p className="t-eyebrow text-jd-yellow">{item.feature.eyebrow}</p>
            <p className="mt-1 text-lg font-bold leading-tight">{item.feature.title}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold underline underline-offset-4">
              {item.feature.cta} <ChevronRight size={14} />
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

function MobileMenu({ onClose, brands }: { onClose: () => void; brands: { name: string; count: number }[] }) {
  const [level, setLevel] = useState<NavItem | null>(null);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        {level ? (
          <button type="button" onClick={() => setLevel(null)} className="-ml-2 flex h-11 items-center gap-1 px-2 text-sm font-bold">
            <ChevronRight size={16} className="rotate-180" /> Back
          </button>
        ) : (
          <JDLogo size={34} />
        )}
        <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2 grid h-11 w-11 place-items-center" data-autofocus>
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!level ? (
          <ul className="py-2">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.columns ? (
                  <button type="button" onClick={() => setLevel(item)} className="flex h-14 w-full items-center justify-between px-5 text-left text-lg font-bold">
                    {item.label} <ChevronRight size={18} />
                  </button>
                ) : (
                  <Link href={item.href} onClick={onClose} className={`flex h-14 items-center px-5 text-lg font-bold ${item.tone === "sale" ? "text-sale" : ""}`}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li className="mt-4 border-t border-line px-5 pt-6">
              <p className="t-eyebrow mb-3 text-muted">Popular brands</p>
              <div className="flex flex-wrap gap-2">
                {TOP_BRANDS.filter((b) => brands.some((x) => x.name === b)).map((b) => (
                  <Link key={b} href={`/collections/${slugify(b)}`} onClick={onClose} className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold">
                    {b}
                  </Link>
                ))}
              </div>
            </li>
          </ul>
        ) : (
          <div className="animate-fade-in px-5 py-4">
            <Link href={level.href} onClick={onClose} className="t-h2 block py-2">
              Shop all {level.label}
            </Link>
            {level.columns!.map((c) => (
              <div key={c.title} className="mt-5">
                <p className="t-eyebrow mb-2 text-muted">{c.title}</p>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} onClick={onClose} className="flex h-11 items-center text-[15px] font-medium">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line p-4 text-sm font-semibold">
        <Link href="/account" onClick={onClose} className="flex h-11 items-center gap-2">
          <UserIcon size={18} /> Sign in
        </Link>
        <Link href="/favourites" onClick={onClose} className="flex h-11 items-center gap-2">
          <HeartIcon size={18} /> Favourites
        </Link>
        <span className="col-span-2 text-xs font-medium text-muted">English · Français — Prices in CAD</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Predictive search: explicit placeholder + grouped results (brands / categories / products)
// ---------------------------------------------------------------------------

type Indexed = { h: string; b: string; m: string; c: string; i: string; p: number; k: string; a: boolean };
let indexPromise: Promise<Indexed[]> | null = null;

const CATEGORY_LINKS = [
  { label: "Men's Shoes", href: "/collections/mens-footwear", k: "mens men shoes sneakers footwear" },
  { label: "Women's Shoes", href: "/collections/womens-footwear", k: "womens women shoes sneakers footwear" },
  { label: "Hoodies & Sweatshirts", href: "/collections/layers", k: "hoodie hoodies sweatshirt fleece crew" },
  { label: "Winter Outerwear", href: "/collections/outerwear", k: "jacket coat puffer parka outerwear winter" },
  { label: "Basketball Shoes", href: "/collections/basketball", k: "basketball jordan retro" },
  { label: "Running Shoes", href: "/collections/footwear?filter.style=Running", k: "running runner trainers" },
  { label: "Caps & Beanies", href: "/collections/accessories", k: "cap hat beanie new era accessories" },
  { label: "Sale", href: "/collections/sale", k: "sale deals discount clearance" },
];

function SearchBox({ brands }: { brands: { name: string; count: number }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [index, setIndex] = useState<Indexed[] | null>(null);
  const [cursor, setCursor] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const listId = "search-suggestions";

  const load = () => {
    indexPromise ??= fetch("/api/search-index").then((r) => r.json());
    indexPromise.then(setIndex).catch(() => {});
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setFocused(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return { brands: [], cats: [], products: [] as Indexed[] };
    const words = term.split(/\s+/);
    const bs = brands.filter((b) => b.name.toLowerCase().includes(term) || term.includes(b.name.toLowerCase())).slice(0, 3);
    const cs = CATEGORY_LINKS.filter((c) => words.some((w) => w.length > 2 && c.k.includes(w.replace(/s$/, "")))).slice(0, 3);
    const ps = (index ?? [])
      .filter((x) => words.every((w) => x.k.includes(w.replace(/s$/, ""))))
      .sort((a, b) => Number(b.a) - Number(a.a))
      .slice(0, 5);
    return { brands: bs, cats: cs, products: ps };
  }, [term, index, brands]);

  type Option = { key: string; href: string };
  const options: Option[] = [
    ...results.brands.map((b) => ({ key: "b" + b.name, href: `/collections/${slugify(b.name)}` })),
    ...results.cats.map((c) => ({ key: "c" + c.label, href: c.href })),
    ...results.products.map((p) => ({ key: "p" + p.h, href: `/products/${p.h}` })),
  ];
  const showPanel = focused && (term.length > 0 || true);

  const go = (href: string) => {
    setFocused(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={wrap} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (cursor >= 0 && options[cursor]) return go(options[cursor].href);
          if (term) go(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Search products, brands or styles
        </label>
        <div className="flex h-10 items-center bg-white text-ink">
          <SearchIcon size={18} className="ml-3 shrink-0 text-muted" />
          <input
            id="site-search"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(-1);
            }}
            onFocus={() => {
              setFocused(true);
              load();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, options.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, -1));
              } else if (e.key === "Escape") setFocused(false);
            }}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-activedescendant={cursor >= 0 ? `opt-${options[cursor]?.key}` : undefined}
            placeholder="Search products, brands or styles"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[14px] outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="grid h-10 w-10 place-items-center text-muted">
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] animate-fade-in overflow-y-auto bg-white p-4 text-ink shadow-2xl lg:left-auto lg:w-[440px]">
          {!term ? (
            <div>
              <p className="t-eyebrow mb-2.5 text-muted">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {["Air Force 1", "Samba", "XT-6", "Puffer jacket", "Hoodrich", "Jordan 1", "UGG Tasman"].map((s) => (
                  <button key={s} type="button" onClick={() => go(`/search?q=${encodeURIComponent(s)}`)} className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium hover:bg-line">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted">{index ? <>No matches for “{q}”. Try a brand or style, like “Nike” or “hoodie”.</> : "Searching…"}</p>
          ) : (
            <div className="space-y-4">
              {(results.brands.length > 0 || results.cats.length > 0) && (
                <div>
                  <p className="t-eyebrow mb-1.5 text-muted">Brands & categories</p>
                  <ul>
                    {results.brands.map((b) => {
                      const i = options.findIndex((o) => o.key === "b" + b.name);
                      return (
                        <li key={b.name} id={`opt-b${b.name}`} role="option" aria-selected={cursor === i}>
                          <Link href={`/collections/${slugify(b.name)}`} onClick={() => setFocused(false)} className={`flex h-10 items-center justify-between px-2 text-sm font-semibold ${cursor === i ? "bg-surface" : "hover:bg-surface"}`}>
                            <span>
                              {b.name} <span className="font-normal text-muted">· Brand</span>
                            </span>
                            <span className="t-meta">{b.count}</span>
                          </Link>
                        </li>
                      );
                    })}
                    {results.cats.map((c) => {
                      const i = options.findIndex((o) => o.key === "c" + c.label);
                      return (
                        <li key={c.label} id={`opt-c${c.label}`} role="option" aria-selected={cursor === i}>
                          <Link href={c.href} onClick={() => setFocused(false)} className={`flex h-10 items-center px-2 text-sm font-semibold ${cursor === i ? "bg-surface" : "hover:bg-surface"}`}>
                            {c.label} <span className="ml-1 font-normal text-muted">· Category</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {results.products.length > 0 && (
                <div>
                  <p className="t-eyebrow mb-1.5 text-muted">Products</p>
                  <ul>
                    {results.products.map((p) => {
                      const i = options.findIndex((o) => o.key === "p" + p.h);
                      return (
                        <li key={p.h} id={`opt-p${p.h}`} role="option" aria-selected={cursor === i}>
                          <Link href={`/products/${p.h}`} onClick={() => setFocused(false)} className={`flex items-center gap-3 p-2 ${cursor === i ? "bg-surface" : "hover:bg-surface"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shopifyImage(p.i, 120)} alt="" className="h-12 w-12 shrink-0 bg-image object-cover" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold">
                                {p.b} {p.m}
                              </span>
                              <span className="t-meta block truncate">{p.c}</span>
                            </span>
                            <span className="t-price text-[13px]">{formatMoney(p.p)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="btn btn-outline h-10 min-h-0 w-full text-[13px]">
                See all results for “{q.trim()}”
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
