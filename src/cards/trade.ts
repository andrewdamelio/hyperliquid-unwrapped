import type { Card, Trade } from "../types";
import type { DeckContext } from "./context";
import { MOODS } from "../moods";
import { clamp, dateStr, dur, money, pick, px } from "../format";
import { DIM, FONT_B, FONT_D, FONT_M, GREEN, PAD, RED, W, fit, headline, label, newCard, panel, pill, quote } from "../render/canvas";

const BEST_QUIPS = ["Called it. Insufferable now.", "Main character energy.", "Frame it. Put it on the fridge.", "This is the one you tell people about."];
const LIQ_QUIPS = ["Leverage: the gift that keeps on taking.", "Stop loss? Never heard of her."];
const WORST_QUIPS = ["We don't talk about this one.", "Character-building experience.", "The market said no. Loudly."];

function tradeCard(ctx0: DeckContext, t: Trade, best: boolean): Card {
  const { S, seed, r } = ctx0;
  const P = best ? MOODS.party : MOODS.pain;
  const k = clamp(Math.abs(t.pnl) / (Math.abs(S.pnl) + 1), 0.3, 1);
  const { cv, ctx } = newCard(P, k, seed + (best ? 2 : 3), S.user);

  label(ctx, best ? "best trade" : "worst trade", PAD, 230, P.acc);
  const cs = fit(ctx, t.name, W - PAD * 2, 260, FONT_D);
  ctx.fillStyle = P.ink;
  ctx.fillText(t.name, PAD, 270 + cs * 0.92);

  let y = 270 + cs * 0.92 + 90;
  const w = pill(ctx, t.side > 0 ? "LONG" : "SHORT", PAD, y, t.side > 0 ? GREEN : RED, "#0a0a0a");
  if (t.liq) pill(ctx, "LIQUIDATED 💀", PAD + w + 14, y, "#000", RED);

  const ps = fit(ctx, money(t.pnl), W - PAD * 2, 200, FONT_D);
  headline(ctx, money(t.pnl), PAD, y + 60 + ps, W - PAD * 2, 200, P.acc, 24);
  y = y + 60 + ps + 70;

  panel(ctx, PAD, y, W - PAD * 2, 230);
  const rows: Array<[string, string]> = [
    ["entry → exit", `${px(t.entry)} → ${px(t.exit)}`],
    ["held", dur(t.closeTime! - t.openTime)],
    ["closed", dateStr(t.closeTime!)],
  ];
  rows.forEach(([l, v], i) => {
    ctx.font = `500 26px ${FONT_M}`;
    ctx.fillStyle = DIM;
    ctx.fillText(l.toUpperCase(), PAD + 40, y + 60 + i * 66);
    ctx.textAlign = "right";
    ctx.font = `700 36px ${FONT_B}`;
    ctx.fillStyle = P.ink;
    ctx.fillText(v, W - PAD - 40, y + 62 + i * 66);
    ctx.textAlign = "left";
  });

  const q = best ? pick(r, BEST_QUIPS) : t.liq ? pick(r, LIQ_QUIPS) : pick(r, WORST_QUIPS);
  quote(ctx, q, Math.min(y + 330, 1220), P.ink);
  return { name: best ? "best-trade" : "worst-trade", cv };
}

export function bestTradeCard(c: DeckContext): Card | null {
  const t = c.S.sortedTrades[0];
  return t && t.pnl > 0 ? tradeCard(c, t, true) : null;
}

export function worstTradeCard(c: DeckContext): Card | null {
  const t = c.S.sortedTrades[c.S.sortedTrades.length - 1];
  return t && t.pnl < 0 ? tradeCard(c, t, false) : null;
}
