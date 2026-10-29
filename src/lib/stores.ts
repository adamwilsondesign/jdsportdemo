// DEMO DATA — JD's store inventory feed isn't public. Locations are illustrative and
// stock is generated deterministically per variant so the experience is stable.

export type Store = { id: string; name: string; area: string; distanceKm: number; hours: string };

export const STORES: Store[] = [
  { id: "tor-dt", name: "JD Toronto Downtown", area: "Toronto, ON", distanceKm: 2.1, hours: "Open today 10am – 9pm" },
  { id: "tor-n", name: "JD Toronto North", area: "North York, ON", distanceKm: 11.4, hours: "Open today 10am – 9pm" },
  { id: "mis", name: "JD Mississauga", area: "Mississauga, ON", distanceKm: 24.8, hours: "Open today 10am – 9pm" },
  { id: "vau", name: "JD Vaughan", area: "Vaughan, ON", distanceKm: 29.3, hours: "Open today 10am – 9pm" },
  { id: "sca", name: "JD Scarborough", area: "Scarborough, ON", distanceKm: 18.6, hours: "Open today 10am – 9pm" },
];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

export function storeStock(variantId: string, storeId: string, onlineAvailable: boolean) {
  const r = hash(variantId + storeId);
  if (r < (onlineAvailable ? 0.3 : 0.65)) return 0;
  return 1 + Math.floor(r * 6);
}

export function stockUpdatedMinutesAgo(variantId: string) {
  return 3 + Math.floor(hash("upd" + variantId) * 40);
}
