import Link from "next/link";
import { JDLogo } from "@/components/ui/Logo";
import { ReturnIcon, StoreIcon, TruckIcon, ShieldIcon } from "@/components/ui/Icons";
import { PaymentIcons } from "@/components/ui/PaymentIcons";

const COLS = [
  { title: "Shopping with JD", links: ["Shipping Policy", "Payment Methods", "Sizing Chart", "Store Locator", "Gift Cards"] },
  { title: "Customer Care", links: ["Initiate a Return", "Order Tracking", "FAQ", "Contact Us", "Accessibility"] },
  { title: "Our Company", links: ["About JD", "Careers", "JD Creator Collective", "Privacy Policy", "Terms of Use"] },
  { title: "Brands", links: ["Nike", "Jordan", "adidas", "New Balance", "The North Face", "On", "UGG"] },
];

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export function Footer() {
  return (
    <footer className="on-dark relative mt-24 overflow-hidden bg-ink text-white">
      {/* Brand moment: oversized roundel watermark */}
      <JDLogo
        size={900}
        className="pointer-events-none absolute -bottom-[22%] -right-[8%] h-auto w-[min(900px,85vw)] text-white opacity-[0.07] md:-bottom-[30%] md:-right-[4%]"
      />

      <div className="relative border-b border-white/10">
        <div className="container-jd grid grid-cols-2 gap-6 py-8 text-[13px] md:grid-cols-4">
          {[
            { icon: TruckIcon, t: "Free standard shipping", s: "On orders over $99" },
            { icon: ReturnIcon, t: "Easy returns", s: "Refund within 14 days, exchange within 28" },
            { icon: StoreIcon, t: "Shop in store", s: "Check stock at your local JD" },
            { icon: ShieldIcon, t: "Secure checkout", s: "Shop Pay, PayPal, Afterpay & more" },
          ].map(({ icon: I, t, s }) => (
            <div key={t} className="flex items-start gap-3">
              <I size={22} className="mt-0.5 shrink-0 text-jd-yellow" />
              <div>
                <p className="font-bold">{t}</p>
                <p className="mt-0.5 text-white/60">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-jd relative grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(4,1fr)] [&:has(ul_a:hover)_ul_a:not(:hover)]:opacity-60">
        <div className="max-w-sm">
          <JDLogo size={52} />
          <p className="t-h3 mt-6">Get on the list</p>
          <p className="mt-1 text-sm text-white/65">Release drops, member offers and first dibs on sales. No spam.</p>
          <form className="mt-4 flex" action="/pages/newsletter">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input id="footer-email" type="email" required placeholder="Email address" className="h-12 min-w-0 flex-1 bg-white px-4 text-sm text-ink outline-none placeholder:text-subtle" />
            <button className="btn btn-yellow h-12 min-h-0 px-5">Sign up</button>
          </form>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">{c.title}</p>
            {/* Hover: the hovered link turns yellow, every other footer link recedes */}
            <ul className="space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l}>
                  <Link
                    href={c.title === "Brands" ? `/collections/${slug(l)}` : `/pages/${slug(l)}`}
                    className="text-white transition-[opacity,color] duration-200 hover:text-jd-yellow focus-visible:text-jd-yellow"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-jd flex flex-col gap-4 py-6 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 JD Sports Canada · Concept prototype · Prices in CAD</p>
          <PaymentIcons tone="dark" />
        </div>
      </div>
    </footer>
  );
}
