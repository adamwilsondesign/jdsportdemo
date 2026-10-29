const METHODS = ["Visa", "Mastercard", "Amex", "PayPal", "Shop Pay", "Apple Pay", "Afterpay"];

/** Text-based payment marks — accessible and crisp at any size (no third-party logo files). */
export function PaymentIcons({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Accepted payment methods">
      {METHODS.map((m) => (
        <li
          key={m}
          className={`flex h-6 items-center rounded-[3px] border px-1.5 text-[9.5px] font-bold tracking-wide ${
            tone === "dark" ? "border-white/20 text-white/80" : m === "Shop Pay" ? "border-shoppay bg-shoppay text-white" : "border-line text-ink"
          }`}
        >
          {m}
        </li>
      ))}
    </ul>
  );
}
