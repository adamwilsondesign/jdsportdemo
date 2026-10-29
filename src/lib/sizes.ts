import type { Category, Gender } from "./types";

export type SizeSystem = "US" | "UK" | "EU" | "CM";
export const SIZE_SYSTEMS: SizeSystem[] = ["US", "UK", "EU", "CM"];

const MEN_EU: Record<string, string> = {
  "3.5": "35.5", "4": "36", "4.5": "36.5", "5": "37.5", "5.5": "38", "6": "38.5", "6.5": "39", "7": "40", "7.5": "40.5", "8": "41", "8.5": "42", "9": "42.5", "9.5": "43",
  "10": "44", "10.5": "44.5", "11": "45", "11.5": "45.5", "12": "46", "12.5": "47", "13": "47.5", "13.5": "48", "14": "48.5", "14.5": "49", "15": "49.5", "16": "50.5", "17": "51.5", "18": "52.5",
};
const WOMEN_EU: Record<string, string> = {
  "4": "34.5", "4.5": "35", "5": "35.5", "5.5": "36", "6": "36.5", "6.5": "37.5", "7": "38", "7.5": "38.5", "8": "39", "8.5": "40", "9": "40.5", "9.5": "41",
  "10": "42", "10.5": "42.5", "11": "43", "11.5": "44", "12": "44.5", "13": "45.5",
};

export function isNumericSize(s: string) {
  return /^\d+(\.5)?$/.test(s);
}

/** Convert a US footwear size to another system. Approximate, as labelled in the UI. */
export function convertSize(us: string, system: SizeSystem, gender: Gender): string {
  if (!isNumericSize(us) || system === "US") return us;
  const n = Number(us);
  const women = gender === "Women";
  if (system === "UK") return String(women ? n - 2.5 : n - 1);
  if (system === "CM") return (women ? 22 + (n - 5) : 25 + (n - 7)).toFixed(1).replace(/\.0$/, "");
  return (women ? WOMEN_EU : MEN_EU)[us] ?? "—";
}

export function sizeLabel(us: string, system: SizeSystem, gender: Gender) {
  if (!isNumericSize(us) || system === "US") return us;
  return convertSize(us, system, gender);
}

export function equivalents(us: string, gender: Gender) {
  if (!isNumericSize(us)) return null;
  return `UK ${convertSize(us, "UK", gender)} · EU ${convertSize(us, "EU", gender)} · ${convertSize(us, "CM", gender)} cm`;
}

/** Size groups keep footwear and apparel sizes from being mixed in one filter list (brief §4.A.2). */
export type SizeGroup = "Shoes" | "Clothing" | "Accessories";
export function sizeGroupOf(category: Category): SizeGroup {
  return category === "Footwear" ? "Shoes" : category === "Clothing" ? "Clothing" : "Accessories";
}

const APPAREL_ORDER = ["3XS", "XXS", "XS", "S/M", "S", "M", "M/L", "L", "L/XL", "XL", "XXL", "3XL", "One Size"];
export function sizeSortKey(s: string) {
  if (isNumericSize(s)) return Number(s);
  const i = APPAREL_ORDER.indexOf(s);
  return i === -1 ? 500 : 100 + i;
}

// ---- Fit recommender ----
// How each brand's lasts typically run vs. true length (+ runs large, − runs small).
export const BRAND_FIT: Record<string, number> = {
  Nike: 0,
  Jordan: 0,
  adidas: 0.25,
  "New Balance": 0,
  ASICS: -0.25,
  Vans: 0.25,
  Converse: 0.5,
  Puma: 0,
  PUMA: 0,
  Reebok: 0,
  On: -0.25,
  HOKA: 0,
  Salomon: -0.25,
  UGG: 0.5,
  "The North Face": 0,
};

// Model-level fit cues (the brief's "true-to-size cue"); default is true to size.
const MODEL_FIT: { test: RegExp; offset: number; note: string }[] = [
  { test: /Air Force 1/i, offset: 0.5, note: "Runs about a half size large" },
  { test: /Samba|Gazelle|Handball|SL72|Campus|Spezial/i, offset: 0.5, note: "Runs about a half size large" },
  { test: /Old Skool|Authentic/i, offset: 0.25, note: "Runs slightly large" },
  { test: /Cloud|XT-6|GEL-/i, offset: -0.25, note: "Runs slightly small — consider a half size up if between sizes" },
  { test: /Dunk/i, offset: 0, note: "Fits true to size, slightly narrow toe box" },
];

export function modelFit(brand: string, model: string) {
  const m = MODEL_FIT.find((f) => f.test.test(model));
  if (m) return m;
  const b = BRAND_FIT[brand] ?? 0;
  if (b >= 0.5) return { test: /./, offset: b, note: "Runs about a half size large" };
  return { test: /./, offset: b, note: "Fits true to size" };
}

export type FitInput = { knownBrand: string; knownSize: number; preference: "snug" | "regular" | "roomy"; width: "narrow" | "regular" | "wide" };

export function recommendSize(input: FitInput, target: { brand: string; model: string }, available: string[]) {
  const known = BRAND_FIT[input.knownBrand] ?? 0;
  const t = modelFit(target.brand, target.model).offset;
  // true foot length in "standard" sizes, then adjust for how the target model runs
  let rec = input.knownSize + known - t;
  if (input.preference === "roomy") rec += 0.5;
  if (input.preference === "snug") rec -= 0.25;
  if (input.width === "wide") rec += 0.25;
  const rounded = Math.round(rec * 2) / 2;
  const numeric = available.filter(isNumericSize).map(Number);
  const nearest = numeric.length ? numeric.reduce((a, b) => (Math.abs(b - rounded) < Math.abs(a - rounded) ? b : a)) : rounded;
  const delta = Math.abs(rec - rounded);
  const sameFamily = input.knownBrand === target.brand || (["Nike", "Jordan"].includes(input.knownBrand) && ["Nike", "Jordan"].includes(target.brand));
  const confidence = sameFamily && delta < 0.2 ? "High" : delta < 0.3 ? "Good" : "Moderate";
  return { size: String(nearest), exact: rounded, confidence };
}
