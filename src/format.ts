export const DAY = 864e5;
export const HOUR = 36e5;

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** FNV-1a, used to seed card randomness per address so cards are stable. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 seeded PRNG */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

export function money(n: number, signed = true): string {
  const s = n < 0 ? "-" : signed && n > 0 ? "+" : "";
  const a = Math.abs(n);
  let v: string;
  if (a >= 1e9) v = (a / 1e9).toFixed(2) + "B";
  else if (a >= 1e6) v = (a / 1e6).toFixed(2) + "M";
  else if (a >= 1e5) v = (a / 1e3).toFixed(1) + "K";
  else if (a >= 1000) v = Math.round(a).toLocaleString("en-US");
  else v = a.toFixed(2);
  return s + "$" + v;
}

export const pct = (x: number) =>
  (x > 0 ? "+" : "") + (Math.abs(x) >= 10 ? Math.round(x * 100).toLocaleString("en-US") : (x * 100).toFixed(1)) + "%";

export function px(p: number | string | undefined): string {
  const n = Number(p);
  if (!isFinite(n)) return "—";
  if (n >= 1000) return "$" + Math.round(n).toLocaleString("en-US");
  return "$" + Number(n.toPrecision(5)).toString();
}

export function dur(ms: number): string {
  // Round once at the unit we display, then split, so we never print "24h" or "60m".
  const secs = Math.round(ms / 1000);
  if (secs < 60) return Math.max(1, secs) + "s";
  const mins = Math.round(ms / 6e4);
  if (mins < 60) return mins + "m";
  if (mins < 48 * 60) return Math.floor(mins / 60) + "h " + (mins % 60) + "m";
  const hrs = Math.round(ms / 36e5);
  return Math.floor(hrs / 24) + "d " + (hrs % 24) + "h";
}

export const dateStr = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const monthStr = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });
export const shortAddr = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);
export const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());
