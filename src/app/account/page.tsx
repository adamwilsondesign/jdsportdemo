import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Sign in" };

/** Explains the value of signing in before asking for it (brief §7). Sign-in itself is out of POC scope. */
export default function AccountPage() {
  return (
    <div className="container-jd grid max-w-5xl gap-10 py-14 md:grid-cols-2">
      <div>
        <h1 className="t-h1">Sign in</h1>
        <p className="t-body mt-3 text-muted">Accounts are handled by Shopify customer accounts in production — sign-in is not part of this prototype.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
      <div className="bg-surface p-8">
        <p className="t-eyebrow">Why sign in</p>
        <ul className="mt-4 space-y-3 text-[15px]">
          {["Favourites saved across all your devices", "Order tracking and easy returns", "Faster checkout with saved details", "Your size, sizing system and store remembered", "Restock alerts and early release access"].map((t) => (
            <li key={t} className="flex gap-3">
              <CheckIcon size={18} className="mt-0.5 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
