import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/Cart";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return <CartPageView />;
}
