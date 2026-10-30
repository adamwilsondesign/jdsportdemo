import type { Product } from "@/lib/types";
import { modelFit } from "@/lib/sizes";
import { Stars } from "@/components/product/bits";
import { CheckIcon } from "@/components/ui/Icons";

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

/** Decision support over volume: fit summary, distribution, verified reviews (brief §5.C.6). Demo content. */
export function Reviews({ product }: { product: Product }) {
  const r = product.reviews;
  if (!r) return null;
  const fit = modelFit(product.brand, product.model);
  const footwear = product.category === "Footwear";
  const marker = 50 + Math.max(-1, Math.min(1, fit.offset * 2)) * 35; // 0 = small, 100 = large
  const dist = [5, 4, 3, 2, 1].map((s) => {
    const base = s === 5 ? (r.rating - 3.4) * 0.55 : s === 4 ? 0.28 : s === 3 ? 0.09 : s === 2 ? 0.04 : 0.03;
    return { s, pct: Math.max(0.01, base) };
  });
  const total = dist.reduce((n, d) => n + d.pct, 0);
  const recommend = Math.round(80 + (r.rating - 4) * 18);
  const sizes = product.variants.map((v) => v.title);
  const sample = [
    {
      name: "Jordan T.",
      where: "Toronto, ON",
      size: sizes[Math.floor(hash(product.id + "a") * sizes.length)],
      stars: 5,
      title: footwear ? "Exactly what I wanted" : "Great fit, heavy fabric",
      body: footwear
        ? `Comfortable straight out of the box. ${fit.offset > 0 ? "I went half a size down from my usual and they fit perfectly." : "Took my usual size and the fit is spot on."}`
        : "Quality feels premium and it held up after a few washes. Sized as expected.",
    },
    {
      name: "Priya S.",
      where: "Calgary, AB",
      size: sizes[Math.floor(hash(product.id + "b") * sizes.length)],
      stars: 4,
      title: "Looks even better in person",
      body: footwear ? "The colourway is great. Took a couple of wears to break in around the heel." : "Love the colour. Slightly longer in the body than I expected, which works for layering.",
    },
  ];

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="container-jd scroll-mt-28 py-14">
      <h2 id="reviews-title" className="t-h2">
        Reviews
      </h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
        <div>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-extrabold leading-none tabular-nums">{r.rating.toFixed(1)}</p>
            <div className="pb-1">
              <Stars rating={r.rating} size={16} />
              <p className="t-meta mt-1">{r.count} verified reviews</p>
            </div>
          </div>
          <ul className="mt-5 space-y-1.5">
            {dist.map((d) => (
              <li key={d.s} className="flex items-center gap-3 text-[12px]">
                <span className="w-3 tabular-nums">{d.s}</span>
                <span className="h-1.5 flex-1 bg-line">
                  <span className="block h-full bg-ink" style={{ width: `${(d.pct / total) * 100}%` }} />
                </span>
                <span className="w-9 text-right tabular-nums text-muted">{Math.round((d.pct / total) * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] font-semibold">{recommend}% would recommend this to a friend</p>

          {footwear && (
            <div className="mt-6 border border-line p-4">
              <p className="text-[13px] font-bold">How it fits</p>
              <div className="relative mt-4 h-1.5 bg-line">
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow" style={{ left: `${marker}%` }} />
              </div>
              <div className="t-meta mt-2 flex justify-between">
                <span>Runs small</span>
                <span>True to size</span>
                <span>Runs large</span>
              </div>
              <p className="mt-3 text-[12.5px]">{fit.note}.</p>
            </div>
          )}
        </div>
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {sample.map((s) => (
              <li key={s.name} className="py-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={s.stars} size={13} />
                  <p className="text-[14px] font-bold">{s.title}</p>
                </div>
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed">{s.body}</p>
                <p className="t-meta mt-3 flex flex-wrap items-center gap-x-3">
                  <span className="font-semibold text-ink">{s.name}</span> {s.where}
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckIcon size={12} /> Verified purchase
                  </span>
                  <span>Size purchased: {s.size}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="t-meta mt-3">Review content is sample data for this prototype.</p>
        </div>
      </div>
    </section>
  );
}
