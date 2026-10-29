export type NavLink = { label: string; href: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavItem = {
  label: string;
  href: string;
  tone?: "sale";
  columns?: NavColumn[];
  feature?: { image: string; eyebrow: string; title: string; href: string; cta: string };
};

const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, "+");

export const NAV: NavItem[] = [
  {
    label: "New Arrivals",
    href: "/collections/new-arrivals",
    columns: [
      {
        title: "Just Landed",
        links: [
          { label: "All New Arrivals", href: "/collections/new-arrivals" },
          { label: "New Footwear", href: "/collections/new-arrivals?filter.category=Footwear" },
          { label: "New Clothing", href: "/collections/new-arrivals?filter.category=Clothing" },
          { label: "New Accessories", href: "/collections/new-arrivals?filter.category=Accessories" },
        ],
      },
      {
        title: "Shop by Gender",
        links: [
          { label: "New for Men", href: "/collections/new-arrivals?filter.gender=Men" },
          { label: "New for Women", href: "/collections/new-arrivals?filter.gender=Women" },
          { label: "Only at JD", href: "/collections/only-at-jd" },
        ],
      },
      {
        title: "Trending Now",
        links: [
          { label: "Nike Air Force 1", href: "/search?q=air+force+1" },
          { label: "Jordan 1", href: "/search?q=jordan+1" },
          { label: "Salomon XT-6", href: "/search?q=xt-6" },
          { label: "Hoodrich", href: "/collections/hoodrich" },
        ],
      },
    ],
    feature: { image: "/campaign/edit-new-release.webp", eyebrow: "Just dropped", title: "Jordan 1 High OG 'Game Royal'", href: "/products/jordan-1-high-og-black-multi-color", cta: "Shop the Jordan 1" },
  },
  {
    label: "Men",
    href: "/collections/mens",
    columns: [
      {
        title: "Shoes",
        links: [
          { label: "All Men's Shoes", href: "/collections/mens-footwear" },
          { label: "Lifestyle", href: `/collections/mens-footwear?filter.style=Lifestyle` },
          { label: "Basketball", href: `/collections/mens-footwear?filter.style=Basketball` },
          { label: "Running", href: `/collections/mens-footwear?filter.style=Running` },
          { label: "Waterproof", href: `/collections/mens-footwear?filter.feature=Waterproof` },
        ],
      },
      {
        title: "Clothing",
        links: [
          { label: "All Men's Clothing", href: "/collections/mens-clothing" },
          { label: "Hoodies & Sweatshirts", href: `/collections/mens-clothing?filter.style=${enc("Hoodies & Sweatshirts")}` },
          { label: "Jackets & Coats", href: `/collections/mens-clothing?filter.style=${enc("Jackets & Coats")}` },
          { label: "T-Shirts & Tops", href: `/collections/mens-clothing?filter.style=${enc("T-Shirts & Tops")}` },
          { label: "Pants & Joggers", href: `/collections/mens-clothing?filter.style=${enc("Pants & Joggers")}` },
        ],
      },
      {
        title: "Featured",
        links: [
          { label: "New Arrivals", href: "/collections/new-arrivals?filter.gender=Men" },
          { label: "Only at JD", href: "/collections/only-at-jd?filter.gender=Men" },
          { label: "Men's Sale", href: "/collections/sale?filter.gender=Men" },
          { label: "Accessories", href: "/collections/accessories" },
        ],
      },
    ],
    feature: { image: "/campaign/cat-mens-clothing.webp", eyebrow: "Brave the cold", title: "Men's winter outerwear", href: "/collections/outerwear?filter.gender=Men", cta: "Shop Men's Outerwear" },
  },
  {
    label: "Women",
    href: "/collections/womens",
    columns: [
      {
        title: "Shoes",
        links: [
          { label: "All Women's Shoes", href: "/collections/womens-footwear" },
          { label: "Lifestyle", href: `/collections/womens-footwear?filter.style=Lifestyle` },
          { label: "Running", href: `/collections/womens-footwear?filter.style=Running` },
          { label: "Boots & Slippers", href: `/collections/womens-footwear?filter.brand=UGG` },
        ],
      },
      {
        title: "Clothing",
        links: [
          { label: "All Women's Clothing", href: "/collections/womens-clothing" },
          { label: "Hoodies & Sweatshirts", href: `/collections/womens-clothing?filter.style=${enc("Hoodies & Sweatshirts")}` },
          { label: "Pants & Joggers", href: `/collections/womens-clothing?filter.style=${enc("Pants & Joggers")}` },
          { label: "Jackets & Coats", href: `/collections/womens-clothing?filter.style=${enc("Jackets & Coats")}` },
        ],
      },
      {
        title: "Featured",
        links: [
          { label: "New Arrivals", href: "/collections/new-arrivals?filter.gender=Women" },
          { label: "Only at JD", href: "/collections/only-at-jd?filter.gender=Women" },
          { label: "Women's Sale", href: "/collections/sale?filter.gender=Women" },
        ],
      },
    ],
    feature: { image: "/campaign/cat-womens-clothing.webp", eyebrow: "Layer up", title: "Women's puffers & fleece", href: "/collections/womens-clothing", cta: "Shop Women's Clothing" },
  },
  {
    label: "Shoes",
    href: "/collections/footwear",
    columns: [
      {
        title: "Shop by Style",
        links: [
          { label: "All Shoes", href: "/collections/footwear" },
          { label: "Lifestyle", href: "/collections/footwear?filter.style=Lifestyle" },
          { label: "Basketball", href: "/collections/basketball" },
          { label: "Running", href: "/collections/footwear?filter.style=Running" },
          { label: "Court", href: "/collections/footwear?filter.style=Court" },
          { label: "Skate", href: "/collections/footwear?filter.style=Skate" },
        ],
      },
      {
        title: "Shop by Gender",
        links: [
          { label: "Men's Shoes", href: "/collections/mens-footwear" },
          { label: "Women's Shoes", href: "/collections/womens-footwear" },
          { label: "Shoes on Sale", href: "/collections/sale?filter.category=Footwear" },
        ],
      },
      {
        title: "Top Brands",
        links: [
          { label: "Nike", href: "/collections/nike?filter.category=Footwear" },
          { label: "Jordan", href: "/collections/jordan" },
          { label: "adidas", href: "/collections/adidas?filter.category=Footwear" },
          { label: "New Balance", href: "/collections/new-balance" },
          { label: "On", href: "/collections/on" },
        ],
      },
    ],
    feature: { image: "/campaign/edit-on-the-court.webp", eyebrow: "Get buckets", title: "Basketball shoes", href: "/collections/basketball", cta: "Shop Basketball" },
  },
  { label: "Clothing", href: "/collections/clothing" },
  { label: "Accessories", href: "/collections/accessories" },
  { label: "Brands", href: "/collections/all" },
  { label: "Sale", href: "/collections/sale", tone: "sale" },
];

export const TOP_BRANDS = ["Nike", "Jordan", "adidas", "New Balance", "Hoodrich", "The North Face", "On", "Supply & Demand", "Salomon", "UGG", "ASICS", "Criminal Damage"];
