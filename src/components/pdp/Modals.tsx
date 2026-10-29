"use client";

import { useEffect, useState } from "react";
import type { Gender, ProductVariant } from "@/lib/types";
import { BRAND_FIT, SIZE_SYSTEMS, convertSize, isNumericSize, modelFit, recommendSize, type FitInput } from "@/lib/sizes";
import { STORES, stockUpdatedMinutesAgo, storeStock } from "@/lib/stores";
import { Overlay } from "@/components/ui/Overlay";
import { BellIcon, CheckIcon, ChevronLeft, ChevronRight, CloseIcon, PinIcon, RulerIcon } from "@/components/ui/Icons";
import { shopifyImage } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";

function ModalHeader({ title, onClose, icon }: { title: string; onClose: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-wide">
        {icon}
        {title}
      </h2>
      <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-11 w-11 place-items-center">
        <CloseIcon />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fit recommender (brief §5.A.1)
// ---------------------------------------------------------------------------
export function FitFinder({
  open,
  onClose,
  brand,
  model,
  gender,
  variants,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  brand: string;
  model: string;
  gender: Gender;
  variants: ProductVariant[];
  onSelect: (size: string) => void;
}) {
  const { prefs, setPrefs } = useStore();
  const saved = prefs.fit;
  const [input, setInput] = useState<FitInput>(saved ?? { knownBrand: "Nike", knownSize: gender === "Women" ? 8 : 10, preference: "regular", width: "regular" });
  const [result, setResult] = useState<ReturnType<typeof recommendSize> | null>(null);
  const brands = Object.keys(BRAND_FIT).filter((b) => b !== "PUMA");
  const sizes = Array.from({ length: 23 }, (_, i) => 4 + i * 0.5);
  const fit = modelFit(brand, model);
  const available = variants.filter((v) => v.availableForSale).map((v) => v.title);
  const recAvailable = result && available.includes(result.size);

  useEffect(() => {
    if (!open) setResult(null);
  }, [open]);

  const explain = () => {
    const k = BRAND_FIT[input.knownBrand] ?? 0;
    const known = k > 0 ? "runs slightly large" : k < 0 ? "runs slightly small" : "fits true to size";
    return `You wear a ${input.knownSize} in ${input.knownBrand}, which ${known}. The ${model} ${fit.note.toLowerCase()}${input.preference !== "regular" ? `, and you prefer a ${input.preference} fit` : ""}${input.width === "wide" ? " with a wider foot" : ""}.`;
  };

  return (
    <Overlay open={open} onClose={onClose} side="center" mobileSide="bottom" label="Find my size">
      <ModalHeader title="Find my size" onClose={onClose} icon={<RulerIcon size={18} />} />
      <div className="overflow-y-auto p-5">
        {!result ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPrefs({ fit: input });
              setResult(recommendSize(input, { brand, model }, variants.map((v) => v.title)));
            }}
            className="space-y-5"
          >
            <p className="t-small text-muted">Tell us about a shoe you already own. We&apos;ll compare how it runs with the {brand} {model}.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="t-eyebrow mb-1.5 block text-[10px]">Brand you wear</span>
                <select value={input.knownBrand} onChange={(e) => setInput({ ...input, knownBrand: e.target.value })} className="h-11 w-full border border-line bg-white px-3 text-sm font-semibold">
                  {brands.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="t-eyebrow mb-1.5 block text-[10px]">Your size (US {gender === "Women" ? "women's" : "men's"})</span>
                <select value={input.knownSize} onChange={(e) => setInput({ ...input, knownSize: Number(e.target.value) })} className="h-11 w-full border border-line bg-white px-3 text-sm font-semibold tabular-nums">
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="t-eyebrow mb-1.5 text-[10px]">How do you like your shoes to fit?</legend>
              <div className="grid grid-cols-3 gap-1 bg-surface p-1">
                {(["snug", "regular", "roomy"] as const).map((p) => (
                  <label key={p} className={`flex h-10 cursor-pointer items-center justify-center text-[13px] font-semibold capitalize ${input.preference === p ? "bg-white shadow-sm" : "text-muted"}`}>
                    <input type="radio" name="pref" className="sr-only" checked={input.preference === p} onChange={() => setInput({ ...input, preference: p })} />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="t-eyebrow mb-1.5 text-[10px]">Foot width</legend>
              <div className="grid grid-cols-3 gap-1 bg-surface p-1">
                {(["narrow", "regular", "wide"] as const).map((w) => (
                  <label key={w} className={`flex h-10 cursor-pointer items-center justify-center text-[13px] font-semibold capitalize ${input.width === w ? "bg-white shadow-sm" : "text-muted"}`}>
                    <input type="radio" name="width" className="sr-only" checked={input.width === w} onChange={() => setInput({ ...input, width: w })} />
                    {w}
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="btn btn-primary w-full">
              Get my size
            </button>
          </form>
        ) : (
          <div className="animate-rise">
            <div className="bg-surface p-6 text-center">
              <p className="t-eyebrow text-muted">We recommend</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums">US {result.size}</p>
              <p className="t-meta mt-1">
                UK {convertSize(result.size, "UK", gender)} · EU {convertSize(result.size, "EU", gender)}
              </p>
              <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${result.confidence === "High" ? "bg-success text-white" : "bg-jd-yellow text-ink"}`}>
                <CheckIcon size={13} /> {result.confidence} confidence
              </p>
            </div>
            <p className="t-small mt-4 text-muted">{explain()}</p>
            {Number(result.size) !== result.exact && <p className="t-small mt-2 text-muted">Closest available size to your exact fit ({result.exact}).</p>}
            <div className="mt-5 grid gap-2">
              {recAvailable ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(result.size);
                    onClose();
                  }}
                  className="btn btn-primary"
                >
                  Select size {result.size}
                </button>
              ) : (
                <p className="bg-surface p-3 text-[13px] font-semibold text-sale">Size {result.size} is sold out in this colour — set a restock alert from the size grid, or try another colour.</p>
              )}
              <button type="button" onClick={() => setResult(null)} className="btn btn-outline">
                Edit my answers
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ---------------------------------------------------------------------------
// Size guide
// ---------------------------------------------------------------------------
export function SizeGuide({ open, onClose, gender, footwear }: { open: boolean; onClose: () => void; gender: Gender; footwear: boolean }) {
  const us = gender === "Women" ? ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"] : ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"];
  const apparel = [
    ["XS", "86–91", "71–76"],
    ["S", "91–97", "76–81"],
    ["M", "97–104", "81–89"],
    ["L", "104–112", "89–97"],
    ["XL", "112–122", "97–107"],
    ["XXL", "122–132", "107–117"],
  ];
  return (
    <Overlay open={open} onClose={onClose} side="right" mobileSide="bottom" label="Size guide">
      <ModalHeader title="Size guide" onClose={onClose} icon={<RulerIcon size={18} />} />
      <div className="overflow-y-auto p-5">
        {footwear ? (
          <>
            <p className="t-small text-muted">{gender === "Women" ? "Women's" : "Men's"} footwear conversions. Measure your foot heel-to-toe in cm and match the CM column.</p>
            <table className="mt-4 w-full text-center text-[13px] tabular-nums">
              <thead>
                <tr className="bg-ink text-white">
                  {SIZE_SYSTEMS.map((s) => (
                    <th key={s} scope="col" className="py-2 font-bold">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {us.map((u) => (
                  <tr key={u} className="border-b border-line even:bg-surface">
                    {SIZE_SYSTEMS.map((s) => (
                      <td key={s} className="py-2">
                        {convertSize(u, s, gender)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <p className="t-small text-muted">Body measurements in cm. Between sizes? Size up for a relaxed fit.</p>
            <table className="mt-4 w-full text-center text-[13px] tabular-nums">
              <thead>
                <tr className="bg-ink text-white">
                  {["Size", "Chest", "Waist"].map((h) => (
                    <th key={h} scope="col" className="py-2 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apparel.map((r) => (
                  <tr key={r[0]} className="border-b border-line even:bg-surface">
                    {r.map((c) => (
                      <td key={c} className="py-2">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ---------------------------------------------------------------------------
// Back-in-stock alert, prefilled with colour + size (brief §5.A.4)
// ---------------------------------------------------------------------------
export function NotifyMe({ open, onClose, variant, label, colourway, image }: { open: boolean; onClose: () => void; variant: ProductVariant | null; label: string; colourway: string; image: string }) {
  const { prefs, setPrefs } = useStore();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (open) setDone(!!variant && prefs.alerts.includes(variant.id));
  }, [open, variant, prefs.alerts]);
  if (!variant) return null;
  return (
    <Overlay open={open} onClose={onClose} side="center" mobileSide="bottom" label="Get a restock alert">
      <ModalHeader title="Restock alert" onClose={onClose} icon={<BellIcon size={18} />} />
      <div className="p-5">
        <div className="flex gap-3 bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImage(image, 160)} alt="" className="h-16 w-16 bg-image object-cover" />
          <div className="text-[13px]">
            <p className="font-semibold">{label}</p>
            <p className="text-muted">{colourway}</p>
            <p className="mt-0.5 font-bold">Size {variant.title}</p>
          </div>
        </div>
        {done ? (
          <div className="mt-5 animate-rise text-center" role="status">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-white">
              <CheckIcon />
            </span>
            <p className="t-h3 mt-3">You&apos;re on the list</p>
            <p className="t-meta mt-1 text-[13px]">We&apos;ll email you once if size {variant.title} comes back in this colour.</p>
            <button type="button" onClick={onClose} className="btn btn-primary mt-5 w-full">
              Done
            </button>
          </div>
        ) : (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              setPrefs({ alerts: [...prefs.alerts, variant.id] });
              setDone(true);
            }}
          >
            <label htmlFor="notify-email" className="t-eyebrow mb-1.5 block text-[10px]">
              Email address
            </label>
            <input id="notify-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full border border-line px-4 text-sm outline-none focus:border-ink" data-autofocus />
            <button type="submit" className="btn btn-primary mt-3 w-full">
              Notify me when it&apos;s back
            </button>
            <p className="t-meta mt-3">One email, no marketing unless you opt in.</p>
          </form>
        )}
      </div>
    </Overlay>
  );
}

// ---------------------------------------------------------------------------
// Store availability (DEMO stock) — preferred store saved across the site (brief §7)
// ---------------------------------------------------------------------------
export function StorePicker({ open, onClose, variant }: { open: boolean; onClose: () => void; variant: ProductVariant | null }) {
  const { prefs, setPrefs } = useStore();
  return (
    <Overlay open={open} onClose={onClose} side="right" mobileSide="bottom" label="Check store availability">
      <ModalHeader title="Store availability" onClose={onClose} icon={<PinIcon size={18} />} />
      <div className="overflow-y-auto p-5">
        <p className="t-small text-muted">{variant ? <>Stock for size <b className="text-ink">{variant.title}</b> near Toronto, ON.</> : "Select a size to see live stock. Showing stores near Toronto, ON."}</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {STORES.map((s) => {
            const qty = variant ? storeStock(variant.id, s.id, variant.availableForSale) : null;
            const chosen = prefs.storeId === s.id;
            return (
              <li key={s.id} className="flex items-start gap-3 py-4">
                <div className="flex-1">
                  <p className="text-[14px] font-bold">
                    {s.name} {chosen && <span className="ml-1 rounded-full bg-jd-yellow px-2 py-0.5 text-[10px] font-bold uppercase">My store</span>}
                  </p>
                  <p className="t-meta">
                    {s.area} · {s.distanceKm} km · {s.hours}
                  </p>
                  {qty !== null && (
                    <p className={`mt-1 text-[12.5px] font-semibold ${qty ? (qty <= 2 ? "text-warn" : "text-success") : "text-muted"}`}>{qty ? (qty <= 2 ? `Low stock — ${qty} left` : "In stock") : "Out of stock"}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrefs({ storeId: s.id });
                    onClose();
                  }}
                  className={`btn h-9 min-h-0 px-3 text-[12px] ${chosen ? "btn-primary" : "btn-outline"}`}
                >
                  {chosen ? "Selected" : "Set as my store"}
                </button>
              </li>
            );
          })}
        </ul>
        {variant && <p className="t-meta mt-3">Store stock updated {stockUpdatedMinutesAgo(variant.id)} min ago. Demo data for this prototype.</p>}
      </div>
    </Overlay>
  );
}

// ---------------------------------------------------------------------------
// Lightbox with zoom
// ---------------------------------------------------------------------------
export function Lightbox({ open, onClose, images, start, alt }: { open: boolean; onClose: () => void; images: string[]; start: number; alt: string }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (open) {
      setI(start);
      setZoom(false);
    }
  }, [open, start]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => (n + 1) % images.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, images.length]);
  return (
    <Overlay open={open} onClose={onClose} side="center" label="Product images" className="!h-[92dvh] !max-h-[92dvh] !max-w-[min(1100px,96vw)]">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <p className="text-[13px] font-semibold tabular-nums">
          {i + 1} / {images.length}
        </p>
        <button type="button" onClick={onClose} aria-label="Close images" className="-mr-2 grid h-11 w-11 place-items-center">
          <CloseIcon />
        </button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-image">
        <button type="button" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Zoom out" : "Zoom in"} className={`absolute inset-0 ${zoom ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shopifyImage(images[i], zoom ? 2048 : 1400)} alt={`${alt} — image ${i + 1}`} className={`mx-auto h-full object-contain transition-transform duration-300 ${zoom ? "scale-[1.8]" : ""}`} />
        </button>
        <button type="button" onClick={() => setI((n) => (n - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white shadow">
          <ChevronLeft />
        </button>
        <button type="button" onClick={() => setI((n) => (n + 1) % images.length)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white shadow">
          <ChevronRight />
        </button>
      </div>
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto p-3">
        {images.map((src, k) => (
          <button key={src} type="button" onClick={() => setI(k)} aria-label={`Image ${k + 1}`} aria-current={k === i} className={`h-16 w-16 shrink-0 bg-image ${k === i ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shopifyImage(src, 160)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </Overlay>
  );
}

export { isNumericSize };
