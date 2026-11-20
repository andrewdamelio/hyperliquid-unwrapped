import type { Card, Trade } from "../types";
import type { DeckContext } from "./context";
import { MOODS } from "../moods";
import { dur, money, pick } from "../format";
import { DIM, FONT_B, FONT_D, FONT_M, GREEN, PAD, RED, W, emoji, fit, label, newCard, panel, quote } from "../render/canvas";

const DIAMOND_QUIPS = ["Married it.", "Set it and forgot the password.", "Patience of a monk. Or just asleep."];
const PAPER_QUIPS = ["Blink and you'd miss it.", "Commitment issues, but make it trading.", "In and out. Like a heist, but worse."];

function holdBlock(ctx: CanvasRenderingContext2D, t: Trade, y: number, diamond: boolean, quip: string, ink: string) {
  panel(ctx, PAD, y, W - PAD * 2, 380, 0.45);
  emoji(ctx, diamond ? "💎" : "🧻", W - PAD - 90, y + 90, 100, diamond ? -0.15 : 0.2);

  label(ctx, diamond ? "diamond hands · longest hold" : "paper hands · shortest hold", PAD + 40, y + 70, diamond ? "#7af7ff" : "#ffe1a8");
  const held = dur(t.closeTime! - t.openTime);
  fit(ctx, held, W - PAD * 2 - 240, 150, FONT_D);
  ctx.fillStyle = ink;
  ctx.fillText(held, PAD + 40, y + 220);

  ctx.font = `700 34px ${FONT_B}`;
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fillText(`${t.name} ${t.side > 0 ? "long" : "short"}`, PAD + 40, y + 285);
  ctx.textAlign = "right";
  fit(ctx, money(t.pnl), 380, 64, FONT_D);
  ctx.fillStyle = t.pnl >= 0 ? GREEN : RED;
  ctx.fillText(money(t.pnl), W - PAD - 40, y + 285);
  ctx.textAlign = "left";

  ctx.font = `500 30px ${FONT_M}`;
  ctx.fillStyle = DIM;
  ctx.fillText(`“${quip}”`, PAD + 40, y + 355);
}

/** Longest vs shortest hold. Needs at least two closed trades. */
export function holdsCard({ S, seed, r }: DeckContext): Card | null {
  const long = S.longestHold, short = S.shortestHold;
  if (!long || !short || long === short) return null;
  const P = MOODS.cope;
  const { cv, ctx } = newCard({ ...P, bg: ["#0d1a2e", "#120a1c"] }, 0.3, seed + 9, S.user);

  label(ctx, "hold times", PAD, 230, "#7af7ff");
  fit(ctx, "DIAMOND VS PAPER", W - PAD * 2, 120, FONT_D);
  ctx.fillStyle = P.ink;
  ctx.fillText("DIAMOND VS PAPER", PAD, 360);

  holdBlock(ctx, long, 400, true, pick(r, DIAMOND_QUIPS), P.ink);
  holdBlock(ctx, short, 810, false, pick(r, PAPER_QUIPS), P.ink);

  const ratio = (long.closeTime! - long.openTime) / Math.max(1, short.closeTime! - short.openTime);
  if (ratio >= 10) {
    const x = Intl.NumberFormat("en-US", { notation: ratio >= 1e5 ? "compact" : "standard", maximumFractionDigits: 0 }).format(ratio);
    quote(ctx, `Your longest hold was ${x}× your shortest.`, 1250, P.ink, 34);
  }
  return { name: "hold-times", cv };
}
