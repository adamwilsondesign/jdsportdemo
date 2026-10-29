"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { CartLine, CartMerchandise } from "@/lib/types";
import type { FitInput, SizeSystem } from "@/lib/sizes";

// ---------------------------------------------------------------------------
// Cart — a single authoritative state object. Badge, drawer heading, item
// count, subtotal and free-shipping progress all derive from it, so they can
// never disagree (fixes the "1" badge vs "0 Items" mismatch from the audit).
// ---------------------------------------------------------------------------

type CartState = { lines: CartLine[] };
type CartAction =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; merchandise: CartMerchandise; quantity: number }
  | { type: "qty"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string }
  | { type: "restore"; line: CartLine; index: number }
  | { type: "replace"; lineId: string; merchandise: CartMerchandise };

const MAX_PER_LINE = 10;
const clampQty = (q: number, m: CartMerchandise) => Math.max(1, Math.min(q, MAX_PER_LINE, Math.max(1, m.quantityAvailable)));

function cartReducer(state: CartState, a: CartAction): CartState {
  switch (a.type) {
    case "hydrate":
      return { lines: a.lines };
    case "add": {
      const existing = state.lines.find((l) => l.merchandise.id === a.merchandise.id);
      if (existing) {
        return {
          lines: state.lines.map((l) => (l === existing ? { ...l, quantity: clampQty(l.quantity + a.quantity, l.merchandise) } : l)),
        };
      }
      const line: CartLine = { id: `gid://shopify/CartLine/${Date.now().toString(36)}`, quantity: clampQty(a.quantity, a.merchandise), merchandise: a.merchandise };
      return { lines: [line, ...state.lines] };
    }
    case "qty":
      return { lines: state.lines.map((l) => (l.id === a.lineId ? { ...l, quantity: clampQty(a.quantity, l.merchandise) } : l)) };
    case "remove":
      return { lines: state.lines.filter((l) => l.id !== a.lineId) };
    case "restore": {
      if (state.lines.some((l) => l.id === a.line.id)) return state;
      const lines = [...state.lines];
      lines.splice(Math.min(a.index, lines.length), 0, a.line);
      return { lines };
    }
    case "replace": {
      const target = state.lines.find((l) => l.id === a.lineId);
      if (!target) return state;
      const dupe = state.lines.find((l) => l.id !== a.lineId && l.merchandise.id === a.merchandise.id);
      if (dupe) {
        return {
          lines: state.lines
            .filter((l) => l.id !== a.lineId)
            .map((l) => (l === dupe ? { ...l, quantity: clampQty(l.quantity + target.quantity, l.merchandise) } : l)),
        };
      }
      return { lines: state.lines.map((l) => (l.id === a.lineId ? { ...l, merchandise: a.merchandise, quantity: clampQty(l.quantity, a.merchandise) } : l)) };
    }
  }
}

export type Toast = { id: number; message: string; tone?: "default" | "success"; action?: { label: string; onClick?: () => void; href?: string } };

type Prefs = { sizeSystem: SizeSystem; storeId: string | null; savedSizes: Record<string, string>; alerts: string[]; countryConfirmed: boolean; fit?: FitInput };
const DEFAULT_PREFS: Prefs = { sizeSystem: "US", storeId: null, savedSizes: {}, alerts: [], countryConfirmed: false };

type StoreCtx = {
  hydrated: boolean;
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  savings: number;
  addToCart: (m: CartMerchandise, quantity?: number, opts?: { openDrawer?: boolean }) => void;
  updateQuantity: (lineId: string, q: number) => void;
  removeLine: (lineId: string) => void;
  replaceMerchandise: (lineId: string, m: CartMerchandise) => void;
  saveForLater: (lineId: string) => void;
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  lastAddedId: string | null;
  favourites: string[];
  isFavourite: (handle: string) => boolean;
  toggleFavourite: (handle: string, label?: string) => void;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

const Ctx = createContext<StoreCtx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state still works in memory */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, { lines: [] });
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    dispatch({ type: "hydrate", lines: load<CartLine[]>("jd.cart", []) });
    setFavourites(load<string[]>("jd.favourites", []));
    setPrefsState({ ...DEFAULT_PREFS, ...load<Partial<Prefs>>("jd.prefs", {}) });
    setHydrated(true);
  }, []);

  useEffect(() => void (hydrated && save("jd.cart", cart.lines)), [cart.lines, hydrated]);
  useEffect(() => void (hydrated && save("jd.favourites", favourites)), [favourites, hydrated]);
  useEffect(() => void (hydrated && save("jd.prefs", prefs)), [prefs, hydrated]);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      setTimeout(() => dismissToast(id), t.action ? 6500 : 3800);
    },
    [dismissToast],
  );

  const addToCart = useCallback((m: CartMerchandise, quantity = 1, opts?: { openDrawer?: boolean }) => {
    dispatch({ type: "add", merchandise: m, quantity });
    setLastAddedId(m.id);
    if (opts?.openDrawer !== false) setCartOpen(true);
  }, []);

  const linesRef = useRef(cart.lines);
  linesRef.current = cart.lines;

  const removeLine = useCallback(
    (lineId: string) => {
      const index = linesRef.current.findIndex((l) => l.id === lineId);
      const line = linesRef.current[index];
      if (!line) return;
      dispatch({ type: "remove", lineId });
      toast({
        message: `Removed ${line.merchandise.product.brand} ${line.merchandise.product.model} (Size ${line.merchandise.title})`,
        action: { label: "Undo", onClick: () => dispatch({ type: "restore", line, index }) },
      });
    },
    [toast],
  );

  const toggleFavourite = useCallback(
    (handle: string, label?: string) => {
      setFavourites((f) => {
        const has = f.includes(handle);
        if (has) {
          toast({ message: `Removed ${label ?? "item"} from Favourites` });
          return f.filter((h) => h !== handle);
        }
        toast({ message: `Saved ${label ?? "item"} to Favourites`, tone: "success", action: { label: "View", href: "/favourites" } });
        return [handle, ...f];
      });
    },
    [toast],
  );

  const saveForLater = useCallback(
    (lineId: string) => {
      const line = linesRef.current.find((l) => l.id === lineId);
      if (!line) return;
      dispatch({ type: "remove", lineId });
      setFavourites((f) => (f.includes(line.merchandise.product.handle) ? f : [line.merchandise.product.handle, ...f]));
      toast({ message: `Moved ${line.merchandise.product.model} to Favourites`, tone: "success", action: { label: "View", href: "/favourites" } });
    },
    [toast],
  );

  const value = useMemo<StoreCtx>(() => {
    const totalQuantity = cart.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = cart.lines.reduce((n, l) => n + Number(l.merchandise.price.amount) * l.quantity, 0);
    const savings = cart.lines.reduce((n, l) => n + (l.merchandise.compareAtPrice ? (Number(l.merchandise.compareAtPrice.amount) - Number(l.merchandise.price.amount)) * l.quantity : 0), 0);
    return {
      hydrated,
      lines: cart.lines,
      totalQuantity,
      subtotal,
      savings,
      addToCart,
      updateQuantity: (lineId, q) => dispatch({ type: "qty", lineId, quantity: q }),
      removeLine,
      replaceMerchandise: (lineId, m) => dispatch({ type: "replace", lineId, merchandise: m }),
      saveForLater,
      cartOpen,
      setCartOpen,
      lastAddedId,
      favourites,
      isFavourite: (h) => favourites.includes(h),
      toggleFavourite,
      prefs,
      setPrefs: (p) => setPrefsState((cur) => ({ ...cur, ...p })),
      toasts,
      toast,
      dismissToast,
    };
  }, [cart.lines, hydrated, addToCart, removeLine, saveForLater, cartOpen, lastAddedId, favourites, toggleFavourite, prefs, toasts, toast, dismissToast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
