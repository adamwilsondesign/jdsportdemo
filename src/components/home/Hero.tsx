"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/Icons";

export type HeroSlide = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  desktop: string;
  mobile: string;
  alt: string;
  ctas: { label: string; href: string }[];
};

const DURATION = 7000;

/**
 * Campaign hero with *named* controls instead of anonymous dots (brief §3.A.4) and
 * destination-specific CTAs (brief §3.A.1). Autoplay pauses on hover/focus, can be paused
 * by the user, and is disabled for reduced-motion.
 */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  const go = useCallback((i: number) => {
    setIndex(i);
    setProgressKey((k) => k + 1);
  }, []);

  const running = !paused && !userPaused && !reduced;
  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => go((index + 1) % slides.length), DURATION);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, index, slides.length, go, progressKey]);

  return (
    <section aria-roledescription="carousel" aria-label="Featured campaigns" className="relative bg-ink text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/9] lg:aspect-[2400/950] lg:max-h-[calc(100dvh-150px)] lg:min-h-[480px] lg:w-full">
        {slides.map((s, i) => (
          <div
            key={s.id}
            id={`hero-${s.id}`}
            role="tabpanel"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${s.name}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}
          >
            <picture>
              <source media="(min-width: 640px)" srcSet={s.desktop} />
              <img
                src={s.mobile}
                alt={s.alt}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${i === index && !reduced ? "scale-[1.04]" : "scale-100"}`}
              />
            </picture>
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:h-1/2" />
            <div className="container-jd absolute inset-x-0 bottom-0 pb-5 sm:pb-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className={`max-w-xl ${i === index ? "animate-rise" : ""}`}>
                  <p className="t-eyebrow text-jd-yellow">{s.eyebrow}</p>
                  {i === 0 ? (
                    <h1 className="mt-2 hidden text-xl font-bold leading-snug sm:block sm:text-2xl">{s.description}</h1>
                  ) : (
                    <p className="mt-2 hidden text-xl font-bold leading-snug sm:block sm:text-2xl">{s.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
                  {s.ctas.map((c, k) => (
                    <Link key={c.href} href={c.href} tabIndex={i === index ? 0 : -1} className={`btn ${k === 0 ? "btn-yellow" : "btn-ghost-light"} h-11 sm:h-12`}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Named campaign controls */}
      <div className="border-t border-white/10 bg-ink">
        <div className="container-jd flex items-stretch">
          <div role="tablist" aria-label="Choose a campaign" className="no-scrollbar flex flex-1 overflow-x-auto">
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-controls={`hero-${s.id}`}
                onClick={() => go(i)}
                className={`group relative min-w-[150px] flex-1 px-1 py-4 text-left transition-colors sm:px-0 ${i === index ? "text-white" : "text-white/55 hover:text-white"}`}
              >
                <span className="absolute inset-x-0 top-0 h-[2px] bg-white/15">
                  <span
                    key={i === index ? progressKey : "idle"}
                    className="block h-full origin-left bg-jd-yellow"
                    style={{
                      transform: i === index ? undefined : "scaleX(0)",
                      animation: i === index && running ? `hero-progress ${DURATION}ms linear forwards` : undefined,
                      ...(i === index && !running ? { transform: "scaleX(1)" } : {}),
                    }}
                  />
                </span>
                <span className="t-eyebrow block text-[10px] tabular-nums opacity-70">0{i + 1}</span>
                <span className="mt-0.5 block text-[13px] font-bold sm:text-sm">{s.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Play campaign slideshow" : "Pause campaign slideshow"}
            className="ml-3 grid w-11 shrink-0 place-items-center text-white/80 hover:text-white"
          >
            {userPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
        </div>
      </div>
      <style>{`@keyframes hero-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </section>
  );
}
