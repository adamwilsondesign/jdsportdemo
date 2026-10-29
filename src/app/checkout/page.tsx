import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutHandoff } from "@/components/cart/CheckoutHandoff";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutHandoff />
    </Suspense>
  );
}
