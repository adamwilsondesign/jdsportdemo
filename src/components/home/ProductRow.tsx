import Link from "next/link";
import type { CardProduct } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRightIcon } from "@/components/ui/Icons";

/**
 * Homepage product row: a title, the top four products and one "View all" link.
 * Desktop is a static 4-up grid (same as the PLP); small screens scroll horizontally (x-axis only, so
 * vertical page scrolling is never captured by the row).
 */
export function ProductRow({ id, title, products, viewAll }: { id: string; title: string; products: CardProduct[]; viewAll: { href: string; count: number } }) {
  const top = products.slice(0, 4);
  return (
    <section aria-labelledby={`${id}-title`} className="reveal py-12 md:py-16">
      <div className="container-jd">
        <div className="mb-6 flex items-end justify-between gap-6">
          <h2 id={`${id}-title`} className="t-h2">
            {title}
          </h2>
          <Link href={viewAll.href} className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold">
            <span className="link-underline">View all ({viewAll.count})</span>
            <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 sm:gap-4 md:mx-0 md:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {top.map((p, i) => (
            <li key={p.handle} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-auto">
              <ProductCard product={p} priority={i < 2 && id === "new"} sizes="(min-width:1024px) 24vw, (min-width:640px) 31vw, 46vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
