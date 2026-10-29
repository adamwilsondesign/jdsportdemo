import Link from "next/link";

export type HeroContent = {
  eyebrow: string;
  headline: string;
  desktop: string;
  mobile: string;
  alt: string;
  cta: { label: string; href: string };
};

/** Single campaign image — no carousel. Kept short so the next section is visible above the fold. */
export function Hero({ content }: { content: HeroContent }) {
  return (
    <section aria-label="Featured campaign" className="relative bg-ink text-white">
      <div className="relative aspect-[4/4.6] overflow-hidden sm:aspect-auto sm:h-[460px] lg:h-[min(560px,calc(100dvh-230px))] lg:min-h-[420px]">
        <picture>
          <source media="(min-width: 640px)" srcSet={content.desktop} />
          <img src={content.mobile} alt={content.alt} fetchPriority="high" loading="eager" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/35 to-transparent sm:h-1/2" />
        <div className="container-jd absolute inset-x-0 bottom-0 pb-6 sm:pb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl animate-rise">
              <p className="t-eyebrow text-jd-yellow">{content.eyebrow}</p>
              <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{content.headline}</h1>
            </div>
            <Link href={content.cta.href} className="btn btn-yellow h-12 self-start md:self-auto">
              {content.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
