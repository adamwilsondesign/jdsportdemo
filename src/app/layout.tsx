import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar, Toaster } from "@/components/layout/Chrome";
import { CartDrawer } from "@/components/cart/Cart";
import { BRANDS, getAllProducts } from "@/lib/storefront";

// Montserrat (OFL, self-hosted variable font) is the closest freely-licensed match to JD's Gotham.
// Self-hosting keeps builds free of a Google Fonts network dependency. Swap the file for JD's
// licensed Gotham in production.
const brandFont = localFont({
  src: "./fonts/Montserrat-Variable-latin.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-brand",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "JD Sports Canada | Sneakers, Clothing & Accessories", template: "%s | JD Sports Canada" },
  description: "Shop the latest sneakers, clothing and accessories from Nike, Jordan, adidas, New Balance and more. Free standard shipping on orders over $99.",
};

export const viewport: Viewport = { themeColor: "#0a0a0a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const counts = new Map<string, number>();
  for (const p of getAllProducts()) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  const brands = BRANDS.map((name) => ({ name, count: counts.get(name) ?? 0 }));

  return (
    <html lang="en-CA" className={brandFont.variable}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-[300] bg-jd-yellow px-4 py-3 font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <StoreProvider>
          <AnnouncementBar />
          <Header brands={brands} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
