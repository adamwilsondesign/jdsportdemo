// Shapes mirror the Shopify Storefront API (Product, ProductVariant, MoneyV2, Image, Cart)
// with a few JD-specific merchandising fields that would live in metafields.

export type Money = { amount: string; currencyCode: "CAD" };

export type ShopifyImage = {
  url: string;
  width: number;
  height: number;
  altText: string;
};

export type Category = "Footwear" | "Clothing" | "Accessories";
export type Gender = "Men" | "Women" | "Unisex";

export type ProductVariant = {
  id: string;
  title: string;
  sku: string;
  availableForSale: boolean;
  quantityAvailable: number;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  compareAtPrice: Money | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  brand: string;
  model: string;
  colourway: string;
  colourFamily: string;
  group: string | null;
  gender: Gender;
  department: string;
  category: Category;
  productType: string;
  productClass: string;
  style: string;
  waterproof: boolean;
  subClass: string;
  sizeType: string;
  exclusive: boolean;
  isNew: boolean;
  publishedAt: string;
  styleCode: string;
  features: string[];
  story: string[];
  images: ShopifyImage[];
  featuredImage: ShopifyImage;
  variants: ProductVariant[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange: { maxVariantPrice: Money };
  reviews: { rating: number; count: number } | null;
  siblings: string[];
};

/** Lean projection used by product cards, rails and the PLP grid. */
export type CardVariant = { id: string; title: string; available: boolean; qty: number };

export type CardSwatch = {
  handle: string;
  colourway: string;
  colourFamily: string;
  image: string;
  hoverImage: string | null;
  price: number;
  compareAt: number | null;
  variants: CardVariant[];
};

export type CardProduct = {
  id: string;
  handle: string;
  brand: string;
  model: string;
  colourway: string;
  colourFamily: string;
  category: Category;
  gender: Gender;
  style: string;
  waterproof: boolean;
  isNew: boolean;
  exclusive: boolean;
  publishedAt: string;
  image: string;
  hoverImage: string | null;
  price: number;
  compareAt: number | null;
  variants: CardVariant[];
  reviews: { rating: number; count: number } | null;
  swatches: CardSwatch[];
};

export type CartMerchandise = {
  id: string;
  title: string; // size
  price: Money;
  compareAtPrice: Money | null;
  quantityAvailable: number;
  product: {
    handle: string;
    brand: string;
    model: string;
    colourway: string;
    category: Category;
    image: string;
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: CartMerchandise;
};

export type Cart = {
  id: string;
  lines: CartLine[];
};
