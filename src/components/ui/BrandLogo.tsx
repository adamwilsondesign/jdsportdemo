// Brand marks: JD Sports Canada's own logo files (from jdsports.ca/pages/brands), tight-cropped
// into /public/brand-logos. `ratio` is width / height, used to keep every mark at a similar visual weight.
export const BRAND_LOGOS: Record<string, { src: string; ratio: number }> = {
  adidas: { src: "/brand-logos/adidas.svg", ratio: 1.366 },
  "Criminal Damage": { src: "/brand-logos/criminal-damage.svg", ratio: 5.425 },
  "Fred Perry": { src: "/brand-logos/fred-perry.svg", ratio: 1.835 },
  Hoodrich: { src: "/brand-logos/hoodrich.svg", ratio: 3.898 },
  Jordan: { src: "/brand-logos/jordan.svg", ratio: 1.069 },
  Lacoste: { src: "/brand-logos/lacoste.svg", ratio: 2.03 },
  "Levi's": { src: "/brand-logos/levis.svg", ratio: 2.046 },
  Nike: { src: "/brand-logos/nike.svg", ratio: 2.806 },
  "New Balance": { src: "/brand-logos/new-balance.svg", ratio: 2.082 },
  "New Era": { src: "/brand-logos/new-era.svg", ratio: 1.35 },
  PUMA: { src: "/brand-logos/puma.svg", ratio: 2.015 },
  "Supply & Demand": { src: "/brand-logos/supply-and-demand.svg", ratio: 4.32 },
  "The North Face": { src: "/brand-logos/the-north-face.svg", ratio: 2.143 },
  UGG: { src: "/brand-logos/ugg.svg", ratio: 2.143 },
  Vans: { src: "/brand-logos/vans.svg", ratio: 2.918 },
  ASICS: { src: "/brand-logos/asics.svg", ratio: 3.125 },
  Converse: { src: "/brand-logos/converse.svg", ratio: 1.5 },
  On: { src: "/brand-logos/on.svg", ratio: 0.503 },
  "True Religion": { src: "/brand-logos/true-religion.svg", ratio: 1.304 },
  "Unlike Humans": { src: "/brand-logos/unlike-humans.svg", ratio: 2.308 },
  Salomon: { src: "/brand-logos/salomon.png", ratio: 8.471 },
  Reebok: { src: "/brand-logos/reebok.svg", ratio: 3.571 },
};

export const hasLogo = (brand: string) => brand in BRAND_LOGOS;

/**
 * Renders a brand mark at a consistent optical size: `size` is roughly the side of a square
 * of equivalent area, so wide wordmarks get shorter and compact marks get taller.
 * `tone="light"` inverts the (black) artwork for dark backgrounds.
 */
export function BrandLogo({ brand, size = 32, tone = "dark", className = "" }: { brand: string; size?: number; tone?: "dark" | "light"; className?: string }) {
  const logo = BRAND_LOGOS[brand];
  if (!logo) {
    return <span className={`font-extrabold uppercase leading-none tracking-tight ${tone === "light" ? "text-white" : "text-ink"} ${className}`}>{brand}</span>;
  }
  const h = Math.round(Math.min(size * 1.15, Math.max(size * 0.32, size / Math.sqrt(logo.ratio))));
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG marks
    <img src={logo.src} alt={brand} height={h} width={Math.round(h * logo.ratio)} style={{ height: h, width: "auto" }} className={`${tone === "light" ? "invert" : ""} ${className}`} />
  );
}
