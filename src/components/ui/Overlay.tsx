"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Side = "right" | "left" | "bottom" | "center";

const panelClass: Record<Side, { base: string; open: string; closed: string }> = {
  right: { base: "right-0 top-0 h-full w-full max-w-[460px]", open: "translate-x-0", closed: "translate-x-full" },
  left: { base: "left-0 top-0 h-full w-full max-w-[420px]", open: "translate-x-0", closed: "-translate-x-full" },
  bottom: { base: "inset-x-0 bottom-0 max-h-[92dvh] w-full", open: "translate-y-0", closed: "translate-y-full" },
  center: {
    base: "left-1/2 top-1/2 w-[calc(100%-32px)] max-w-[560px] max-h-[88dvh] -translate-x-1/2",
    open: "-translate-y-1/2 opacity-100 scale-100",
    closed: "-translate-y-[46%] opacity-0 scale-[0.98]",
  },
};

/**
 * Accessible overlay (dialog) used by the cart drawer, mobile nav, filter sheet and modals.
 * Escape closes, focus is trapped and restored, page scroll is locked, motion respects reduced-motion.
 * `dismissOnBackdrop={false}` prevents accidental dismissal (brief: mobile filter sheet).
 */
export function Overlay({
  open,
  onClose,
  side = "right",
  label,
  children,
  className = "",
  dismissOnBackdrop = true,
  mobileSide,
  backdrop = "dim",
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  mobileSide?: Side;
  label: string;
  children: ReactNode;
  className?: string;
  dismissOnBackdrop?: boolean;
  backdrop?: "dim" | "blur";
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement;
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = sw ? `${sw}px` : "";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = "";
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? []).filter((el) => el.offsetParent !== null);
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0];
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  if (!mounted) return null;
  const s = panelClass[isMobile && mobileSide ? mobileSide : side];

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${backdrop === "blur" ? "bg-white/70 backdrop-blur-xl" : "bg-black/45"} ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute flex flex-col bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-[var(--ease-drawer)] ${s.base} ${visible ? s.open : s.closed} ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
