import type { Metadata } from "next";
import Link from "next/link";

const PAGES: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Shipping",
    body: ["Free standard shipping on orders over $99 to Canadian addresses. Exclusions may apply.", "Orders under $99 have shipping calculated at checkout based on your postal code."],
  },
  returns: {
    title: "Returns & Exchanges",
    body: [
      "Items returned within 14 days of purchase are eligible for a full refund. Items returned within 28 days are eligible for an exchange; if the exchange item is unavailable, store credit is issued.",
      "Apparel and accessories must be returned with price tags attached; footwear in its original box.",
    ],
  },
  "payment-methods": {
    title: "Payment Methods",
    body: ["We accept Visa, Mastercard, American Express, PayPal, Shop Pay and Apple Pay.", "Afterpay lets you split eligible orders into 4 interest-free payments."],
  },
  "store-locator": {
    title: "Store Locator",
    body: ["Set a preferred store from any product page to see size availability where you shop. Store locations in this prototype are demo data."],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).slug];
  return { title: p?.title ?? "Information" };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  return (
    <div className="container-jd max-w-3xl py-14">
      <h1 className="t-h1">{page?.title ?? "Coming soon"}</h1>
      <div className="t-body mt-6 space-y-4">
        {(page?.body ?? ["This page is outside the scope of the redesign prototype (Home, collection, product and cart)."]).map((b) => (
          <p key={b}>{b}</p>
        ))}
      </div>
      <Link href="/" className="btn btn-primary mt-8">
        Continue shopping
      </Link>
    </div>
  );
}
