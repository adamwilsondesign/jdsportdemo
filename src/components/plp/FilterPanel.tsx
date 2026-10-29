"use client";

import { useState } from "react";
import { COLOUR_SWATCH, FACET_LABELS, FACET_ORDER, displayValue, type FacetKey, type FacetValue, type Filters } from "@/lib/filters";
import { CheckIcon, ChevronDown, SearchIcon } from "@/components/ui/Icons";

type Facets = Partial<Record<FacetKey, FacetValue[]>>;

export function FilterPanel({ facets, filters, onToggle, defaultOpen = ["availability", "category", "size", "brand"] }: { facets: Facets; filters: Filters; onToggle: (k: FacetKey, v: string) => void; defaultOpen?: FacetKey[] }) {
  return (
    <div className="divide-y divide-line border-b border-line">
      {FACET_ORDER.map((key) => {
        const values = facets[key] ?? [];
        // hide groups with a single non-selectable value (e.g. Category on a single-category collection)
        if (!values.length || (values.length === 1 && !values[0].selected && key !== "availability")) return null;
        return <FacetGroup key={key} k={key} values={values} selected={filters[key] ?? []} onToggle={onToggle} defaultOpen={defaultOpen.includes(key) || !!filters[key]?.length} />;
      })}
    </div>
  );
}

function FacetGroup({ k, values, selected, onToggle, defaultOpen }: { k: FacetKey; values: FacetValue[]; selected: string[]; onToggle: (k: FacetKey, v: string) => void; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const id = `facet-${k}`;

  if (k === "availability") {
    const v = values.find((x) => x.value === "In stock");
    const on = selected.includes("In stock");
    return (
      <div className="py-4">
        <button type="button" role="switch" aria-checked={on} onClick={() => onToggle("availability", "In stock")} className="flex w-full items-center justify-between gap-3 text-left">
          <span>
            <span className="block text-[14px] font-bold">In stock only</span>
            <span className="t-meta">Hide sold-out styles{v ? ` · ${v.count} available` : ""}</span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-line-strong"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </span>
        </button>
      </div>
    );
  }

  const label = FACET_LABELS[k];
  let list = values;
  if (k === "brand" && query) list = list.filter((v) => v.value.toLowerCase().includes(query.toLowerCase()));
  const LIMIT = 8;
  const truncated = (k === "brand" || k === "style") && !query && !showAll && list.length > LIMIT + 2;
  if (truncated) list = list.slice(0, LIMIT);

  return (
    <div className="py-1">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex h-12 w-full items-center justify-between text-left text-[14px] font-bold">
          <span>
            {label}
            {selected.length > 0 && <span className="ml-1.5 font-semibold text-muted">· {selected.length}</span>}
          </span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={id} className="animate-fade-in pb-4">
          {k === "brand" && values.length > 12 && (
            <label className="mb-3 flex h-10 items-center gap-2 border border-line px-3 focus-within:border-ink">
              <SearchIcon size={15} className="text-muted" />
              <span className="sr-only">Search brands</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${values.length} brands`} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
            </label>
          )}
          {k === "size" ? (
            <SizeFacet values={values} onToggle={(v) => onToggle("size", v)} />
          ) : k === "colour" ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
              {list.map((v) => (
                <li key={v.value}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={v.selected}
                    disabled={!v.count && !v.selected}
                    onClick={() => onToggle(k, v.value)}
                    className="flex h-9 w-full items-center gap-2.5 text-left text-[13px] disabled:opacity-35"
                  >
                    <span className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full border ${v.selected ? "border-ink ring-2 ring-ink ring-offset-1" : "border-line-strong"}`} style={{ background: COLOUR_SWATCH[v.value] ?? "#ccc" }}>
                      {v.selected && <CheckIcon size={12} className={["White", "Cream", "Beige", "Yellow", "Silver"].includes(v.value) ? "text-ink" : "text-white"} />}
                    </span>
                    <span className="flex-1">{v.value}</span>
                    <span className="t-meta tabular-nums">{v.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-0.5">
              {list.map((v) => (
                <li key={v.value}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={v.selected}
                    disabled={!v.count && !v.selected}
                    onClick={() => onToggle(k, v.value)}
                    className="group flex min-h-9 w-full items-center gap-3 text-left text-[13.5px] disabled:opacity-35"
                  >
                    <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors ${v.selected ? "border-ink bg-ink text-white" : "border-line-strong bg-white group-hover:border-ink"}`}>
                      {v.selected && <CheckIcon size={12} />}
                    </span>
                    <span className="flex-1">{displayValue(k, v.value)}</span>
                    <span className="t-meta tabular-nums">({v.count})</span>
                  </button>
                </li>
              ))}
              {query && !list.length && <li className="t-meta py-2">No brands match “{query}”.</li>}
            </ul>
          )}
          {truncated && (
            <button type="button" onClick={() => setShowAll(true)} className="link-underline mt-2 text-[13px] font-semibold">
              Show all {values.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Sizes split by Shoes / Clothing / Accessories so numeric and apparel sizes never mix (brief §4.A.2). */
function SizeFacet({ values, onToggle }: { values: FacetValue[]; onToggle: (v: string) => void }) {
  const groups = (["Shoes", "Clothing", "Accessories"] as const).filter((g) => values.some((v) => v.value.startsWith(g + ":")));
  const firstSelected = groups.find((g) => values.some((v) => v.selected && v.value.startsWith(g + ":")));
  const [group, setGroup] = useState<(typeof groups)[number]>(firstSelected ?? groups[0]);
  const list = values.filter((v) => v.value.startsWith(group + ":"));
  return (
    <div>
      {groups.length > 1 && (
        <div role="tablist" aria-label="Size type" className="mb-3 grid grid-flow-col gap-1 bg-surface p-1">
          {groups.map((g) => {
            const n = values.filter((v) => v.selected && v.value.startsWith(g + ":")).length;
            return (
              <button key={g} role="tab" aria-selected={g === group} type="button" onClick={() => setGroup(g)} className={`h-8 text-[12px] font-bold transition-colors ${g === group ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}>
                {g}
                {n > 0 && ` · ${n}`}
              </button>
            );
          })}
        </div>
      )}
      <ul className="grid grid-cols-4 gap-1.5">
        {list.map((v) => (
          <li key={v.value}>
            <button
              type="button"
              role="checkbox"
              aria-checked={v.selected}
              aria-label={`Size ${v.value.split(":")[1]}, ${v.count} styles`}
              disabled={!v.count && !v.selected}
              onClick={() => onToggle(v.value)}
              className={`flex h-12 w-full flex-col items-center justify-center border text-[13px] font-semibold tabular-nums transition-colors disabled:opacity-35 ${
                v.selected ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {v.value.split(":")[1]}
              <span className={`text-[10px] font-medium ${v.selected ? "text-white/70" : "text-muted"}`}>{v.count}</span>
            </button>
          </li>
        ))}
      </ul>
      {group === "Shoes" && <p className="t-meta mt-2">US sizing</p>}
    </div>
  );
}
