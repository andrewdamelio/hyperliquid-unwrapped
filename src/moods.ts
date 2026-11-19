import type { Stats } from "./types";
import { clamp } from "./format";

export type FxKind = "skulls" | "rain" | "drizzle" | "sparkle" | "confetti" | "rockets";
export type MoodKey = "rekt" | "pain" | "cope" | "meh" | "party" | "god";

export interface Mood {
  title: string;
  bg: [string, string];
  acc: string;
  ink: string;
  fx: FxKind;
  emoji: string;
  quips: string[];
}

export const MOODS: Record<MoodKey, Mood> = {
  rekt: { title: "FULLY REKT", bg: ["#2a0004", "#050003"], acc: "#ff2d3d", ink: "#ffe9ea", fx: "skulls", emoji: "💀",
    quips: ["The liquidation engine sends its regards.", "Your PnL chart is a black ski slope.", "Exit liquidity of the year. Congrats?", "Time to touch grass. Lots of grass."] },
  pain: { title: "DOWN BAD", bg: ["#330a10", "#0a0a12"], acc: "#ff4d5e", ink: "#ffeef0", fx: "rain", emoji: "😭",
    quips: ["Buy high, sell low: executed flawlessly.", "The market took your lunch money. And your lunch.", "Down bad, but still here. Respect."] },
  cope: { title: "IT'S JUST A DIP", bg: ["#18202e", "#090b10"], acc: "#8fb0dc", ink: "#eef3fb", fx: "drizzle", emoji: "🫠",
    quips: ["Basically breakeven if you squint.", "Fees ate your gains. Fees always eat.", "Zoom out. No, further. Further."] },
  meh: { title: "TECHNICALLY PROFITABLE", bg: ["#0b2a1c", "#06100b"], acc: "#5ef0a0", ink: "#eafff3", fx: "sparkle", emoji: "😏",
    quips: ["Up only (slightly).", "Beat a savings account. Barely.", "Profitable. Technically. We checked twice."] },
  party: { title: "PARTY TIME", bg: ["#04402a", "#0a0b26"], acc: "#3dff8c", ink: "#efffef", fx: "confetti", emoji: "🎉",
    quips: ["Absolutely cooking.", "Bull market brain: unlocked.", "The funding gods smiled upon you."] },
  god: { title: "GENERATIONAL RUN", bg: ["#4a3200", "#22003f"], acc: "#ffd23d", ink: "#fff8e1", fx: "rockets", emoji: "🚀",
    quips: ["Generational wealth speedrun.", "Screenshot this before it reverts.", "Retire? You just got warmed up."] },
};

/** Pick a mood and an intensity (0–1) from return on deposits, falling back to absolute pnl. */
export function moodFor(S: Pick<Stats, "roi" | "pnl">): [MoodKey, number] {
  const r = S.roi;
  if (r !== null && isFinite(r)) {
    if (r <= -0.5) return ["rekt", clamp(-r, 0.5, 1)];
    if (r <= -0.1) return ["pain", clamp(-r / 0.5, 0.2, 1)];
    if (r < 0) return ["cope", 0.3];
    if (r < 0.1) return ["meh", 0.3];
    if (r < 1) return ["party", clamp(r, 0.25, 1)];
    return ["god", clamp(r / 5, 0.5, 1)];
  }
  const p = S.pnl;
  if (p <= -10000) return ["rekt", 0.8];
  if (p <= -500) return ["pain", 0.6];
  if (p < 0) return ["cope", 0.3];
  if (p < 500) return ["meh", 0.3];
  if (p < 50000) return ["party", 0.7];
  return ["god", 0.9];
}
