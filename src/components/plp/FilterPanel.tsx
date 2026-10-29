"use client";

import { useState } from "react";
import { COLOUR_SWATCH, FACET_LABELS, FACET_ORDER, displayValue, type FacetKey, type FacetValue, type Filters } from "@/lib/filters";
import { CheckIcon, ChevronDown, SearchIcon } from "@/components/ui/Icons";

type Facets = Partial<Record<FacetKey, FacetValue[]>>;

export function FilterPanel({ facets, filters, onToggle, defaultOpen = ["availability", "category", "size", "brand"] }: { facets: Facets; filters: Filters; onToggle: (k: FacetKey, v: string) => void; defaultOpen?: FacetKey[] }) {
  return (
    <div className="divide-y divide-line/70">
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
      <div className="pb-4">
        <button type="button" role="switch" aria-checked={on} onClick={() => onToggle("availability", "In stock")} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="text-[13.5px] font-semibold">
            In stock only {v && <span className="ml-1 font-normal text-subtle tabular-nums">{v.count}</span>}
          </span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-line-strong"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </span>
        </button>
      </div>
    );
  }

  const label = FACET_LABELS[k];
  let list = values;
  if (k === "brand" && query) list = list.filter((v) => v.value.toLowerCase().includes(query.toLowerCase()));
  const LIMIT = 7;
  const truncated = (k === "brand" || k === "style") && !query && !showAll && list.length > LIMIT + 2;
  if (truncated) list = list.slice(0, LIMIT);

  return (
    <div>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="group flex h-12 w-full items-center justify-between text-left text-[13.5px] font-semibold">
          <span>
            {label}
            {selected.length > 0 && <span className="ml-1.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10.5px] font-bold text-white tabular-nums">{selected.length}</span>}
          </span>
          <ChevronDown size={15} className={`text-subtle transition-transform duration-200 group-hover:text-ink ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={id} className="animate-fade-in pb-5">
          {k === "brand" && values.length > 12 && (
            <label className="mb-3 flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 focus-within:ring-1 focus-within:ring-ink">
              <SearchIcon size={14} className="text-muted" />
              <span className="sr-only">Search brands</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${values.length} brands`} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle" />
            </label>
          )}
          {k === "size" ? (
            <SizeFacet values={values} onToggle={(v) => onToggle("size", v)} />
          ) : k === "colour" ? (
            <ul className="grid grid-cols-4 gap-x-1 gap-y-3">
              {list.map((v) => (
                <li key={v.value}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={v.selected}
                    aria-label={`${v.value}, ${v.count} styles`}
                    disabled={!v.count && !v.selected}
                    onClick={() => onToggle(k, v.value)}
                    className="group flex w-full flex-col items-center gap-1.5 text-[11.5px] disabled:opacity-30"
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full border border-black/15 transition-shadow ${v.selected ? "ring-2 ring-ink ring-offset-2" : "group-hover:ring-1 group-hover:ring-line-strong group-hover:ring-offset-2"}`}
                      style={{ background: COLOUR_SWATCH[v.value] ?? "#ccc" }}
                    >
                      {v.selected && <CheckIcon size={13} className={["White", "Cream", "Beige", "Yellow", "Silver"].includes(v.value) ? "text-ink" : "text-white"} />}
                    </span>
                    <span className={v.selected ? "font-semibold" : "text-muted"}>{v.value}</span>
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
                    className="group flex h-8 w-full items-center gap-2.5 text-left text-[13px] disabled:opacity-30"
                  >
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${v.selected ? "border-ink bg-ink text-white" : "border-line-strong bg-white group-hover:border-ink"}`}>
                      {v.selected && <CheckIcon size={11} />}
                    </span>
                    <span className={`flex-1 ${v.selected ? "font-semibold" : ""}`}>{displayValue(k, v.value)}</span>
                    <span className="text-[12px] text-subtle tabular-nums">{v.count}</span>
                  </button>
                </li>
              ))}
              {query && !list.length && <li className="t-meta py-2">No brands match “{query}”.</li>}
            </ul>
          )}
          {truncated && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-[12.5px] font-semibold text-muted underline underline-offset-2 hover:text-ink">
              Show all {values.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Sizes split by Shoes / Clothing / Accessories so numeric and apparel sizes never mix. */
function SizeFacet({ values, onToggle }: { values: FacetValue[]; onToggle: (v: string) => void }) {
  const groups = (["Shoes", "Clothing", "Accessories"] as const).filter((g) => values.some((v) => v.value.startsWith(g + ":")));
  const firstSelected = groups.find((g) => values.some((v) => v.selected && v.value.startsWith(g + ":")));
  const [group, setGroup] = useState<(typeof groups)[number]>(firstSelected ?? groups[0]);
  const list = values.filter((v) => v.value.startsWith(group + ":"));
  return (
    <div>
      {groups.length > 1 && (
        <div role="tablist" aria-label="Size type" className="mb-3 flex gap-4 border-b border-line">
          {groups.map((g) => {
            const n = values.filter((v) => v.selected && v.value.startsWith(g + ":")).length;
            return (
              <button
                key={g}
                role="tab"
                aria-selected={g === group}
                type="button"
                onClick={() => setGroup(g)}
                className={`-mb-px border-b-2 pb-2 text-[12.5px] font-semibold transition-colors ${g === group ? "border-ink text-ink" : "border-transparent text-subtle hover:text-ink"}`}
              >
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
              title={`${v.count} styles`}
              disabled={!v.count && !v.selected}
              onClick={() => onToggle(v.value)}
              className={`h-9 w-full rounded-[3px] border text-[12.5px] font-semibold tabular-nums transition-colors disabled:opacity-30 ${
                v.selected ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {v.value.split(":")[1]}
            </button>
          </li>
        ))}
      </ul>
      {group === "Shoes" && <p className="mt-2 text-[11.5px] text-subtle">US sizing</p>}
    </div>
  );
}
