import type { Product } from "./types";
import { slugify } from "./format";

export type CollectionShortcut = { label: string; href: string };

export type CollectionDef = {
  handle: string;
  title: string;
  description: string;
  match: (p: Product) => boolean;
  /** Use-case shortcuts shown above the grid (brief §4.C.5) — never a replacement for filters. */
  shortcuts?: CollectionShortcut[];
  defaultSort?: SortKey;
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "discount" | "rating";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "Biggest Discount" },
  { key: "rating", label: "Top Rated" },
];

const onSale = (p: Product) => Number(p.compareAtPriceRange.maxVariantPrice.amount) > Number(p.priceRange.minVariantPrice.amount);

const footwearShortcuts = (base: string): CollectionShortcut[] => [
  { label: "Lifestyle", href: `/collections/${base}?filter.style=Lifestyle` },
  { label: "Basketball", href: `/collections/${base}?filter.style=Basketball` },
  { label: "Running", href: `/collections/${base}?filter.style=Running` },
  { label: "Court", href: `/collections/${base}?filter.style=Court` },
  { label: "Waterproof", href: `/collections/${base}?filter.feature=Waterproof` },
];

const clothingShortcuts = (base: string): CollectionShortcut[] => [
  { label: "Hoodies & Sweatshirts", href: `/collections/${base}?filter.style=Hoodies+%26+Sweatshirts` },
  { label: "Jackets & Coats", href: `/collections/${base}?filter.style=Jackets+%26+Coats` },
  { label: "Pants & Joggers", href: `/collections/${base}?filter.style=Pants+%26+Joggers` },
  { label: "T-Shirts & Tops", href: `/collections/${base}?filter.style=T-Shirts+%26+Tops` },
];

export const COLLECTIONS: CollectionDef[] = [
  {
    handle: "new-arrivals",
    title: "New Arrivals",
    description: "The latest footwear, clothing and accessories to land at JD — refreshed every week.",
    match: (p) => p.isNew,
    defaultSort: "newest",
    shortcuts: [
      { label: "New Footwear", href: "/collections/new-arrivals?filter.category=Footwear" },
      { label: "New Clothing", href: "/collections/new-arrivals?filter.category=Clothing" },
      { label: "New Accessories", href: "/collections/new-arrivals?filter.category=Accessories" },
      { label: "Only at JD", href: "/collections/new-arrivals?filter.exclusive=Only+at+JD" },
      { label: "Waterproof", href: "/collections/new-arrivals?filter.feature=Waterproof" },
    ],
  },
  { handle: "all", title: "Shop All", description: "Every style in the JD Sports Canada demo catalogue.", match: () => true },
  {
    handle: "mens",
    title: "Men's",
    description: "Men's sneakers, clothing and accessories from the brands that matter.",
    match: (p) => p.gender === "Men",
    shortcuts: [
      { label: "Men's Shoes", href: "/collections/mens-footwear" },
      { label: "Men's Clothing", href: "/collections/mens-clothing" },
      { label: "Hoodies & Sweatshirts", href: "/collections/mens?filter.style=Hoodies+%26+Sweatshirts" },
      { label: "Jackets & Coats", href: "/collections/mens?filter.style=Jackets+%26+Coats" },
    ],
  },
  {
    handle: "womens",
    title: "Women's",
    description: "Women's sneakers, fleece, outerwear and more.",
    match: (p) => p.gender === "Women",
    shortcuts: [
      { label: "Women's Shoes", href: "/collections/womens-footwear" },
      { label: "Women's Clothing", href: "/collections/womens-clothing" },
      { label: "Hoodies & Sweatshirts", href: "/collections/womens?filter.style=Hoodies+%26+Sweatshirts" },
    ],
  },
  { handle: "footwear", title: "Shoes", description: "Sneakers, runners and boots for every day.", match: (p) => p.category === "Footwear", shortcuts: footwearShortcuts("footwear") },
  { handle: "mens-footwear", title: "Men's Shoes", description: "Men's sneakers, runners and boots.", match: (p) => p.category === "Footwear" && p.gender === "Men", shortcuts: footwearShortcuts("mens-footwear") },
  { handle: "womens-footwear", title: "Women's Shoes", description: "Women's sneakers, runners and boots.", match: (p) => p.category === "Footwear" && p.gender === "Women", shortcuts: footwearShortcuts("womens-footwear") },
  { handle: "clothing", title: "Clothing", description: "Fleece, outerwear, tees and track — layered for Canadian weather.", match: (p) => p.category === "Clothing", shortcuts: clothingShortcuts("clothing") },
  { handle: "mens-clothing", title: "Men's Clothing", description: "Men's hoodies, jackets, tees and joggers.", match: (p) => p.category === "Clothing" && p.gender === "Men", shortcuts: clothingShortcuts("mens-clothing") },
  { handle: "womens-clothing", title: "Women's Clothing", description: "Women's hoodies, sweatpants, jackets and denim.", match: (p) => p.category === "Clothing" && p.gender === "Women", shortcuts: clothingShortcuts("womens-clothing") },
  { handle: "accessories", title: "Accessories", description: "Caps, beanies and socks to finish the fit.", match: (p) => p.category === "Accessories" },
  {
    handle: "outerwear",
    title: "Winter Outerwear",
    description: "Puffers, parkas and insulated layers built to brave the cold.",
    match: (p) => p.style === "Jackets & Coats",
  },
  {
    handle: "layers",
    title: "Hoodies & Fleece",
    description: "Hoodies, crews and full-zips for layering season.",
    match: (p) => p.style === "Hoodies & Sweatshirts",
  },
  {
    handle: "basketball",
    title: "Basketball Shoes",
    description: "Retros, signature models and court-inspired lifestyle sneakers.",
    match: (p) => p.style === "Basketball",
  },
  {
    handle: "only-at-jd",
    title: "Only at JD",
    description: "Colourways and collections you won't find anywhere else in Canada.",
    match: (p) => p.exclusive,
  },
  {
    handle: "sale",
    title: "Sale",
    description: "Up to 60% off selected footwear and clothing. Prices as marked — no code needed.",
    match: onSale,
    defaultSort: "discount",
    shortcuts: [
      { label: "Shoes on Sale", href: "/collections/sale?filter.category=Footwear" },
      { label: "Clothing on Sale", href: "/collections/sale?filter.category=Clothing" },
      { label: "50% off or more", href: "/collections/sale?filter.discount=50%25+off+or+more" },
    ],
  },
];

export function brandCollection(brand: string): CollectionDef {
  return {
    handle: slugify(brand),
    title: brand,
    description: `Shop ${brand} footwear, clothing and accessories at JD Sports Canada.`,
    match: (p) => p.brand === brand,
  };
}
