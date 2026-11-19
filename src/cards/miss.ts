import type { Card } from "../types";
import type { DeckContext } from "./context";
import { MOODS } from "../moods";
import { money, pick, px } from "../format";
import { FONT_B, FONT_D, GOLD, PAD, W, emoji, fit, headline, label, newCard, quote, wrap } from "../render/canvas";

export function missCard({ S, miss, seed, r }: DeckContext): Card | null {
  if (!miss) return null;
  const t = miss.trade, P = MOODS.cope;
  const { cv, ctx } = newCard(P, 0.6, seed + 6, S.user);

  label(ctx, "biggest miss", PAD, 230, P.acc);
  ctx.fillStyle = P.ink;
  ctx.font = `120px ${FONT_D}`;
  ctx.fillText("PAPER HANDS", PAD, 370);
  emoji(ctx, "🧻", W - 140, 320, 120, 0.2);

  ctx.font = `700 44px ${FONT_B}`;
  ctx.fillStyle = "rgba(255,255,255,.9)";
  let y = wrap(ctx, `You closed your ${t.name} ${t.side > 0 ? "long" : "short"} at ${px(t.exit)}.`, PAD, 480, W - PAD * 2, 56);
  y = wrap(ctx, `Within 30 days it ${t.side > 0 ? "ran to" : "dumped to"} ${px(miss.ext)}.`, PAD, y + 64, W - PAD * 2, 56);

  label(ctx, "left on the table", PAD, y + 130, "rgba(255,255,255,.6)");
  const ms = fit(ctx, money(miss.missed, false), W - PAD * 2, 220, FONT_D);
  headline(ctx, money(miss.missed, false), PAD, y + 150 + ms, W - PAD * 2, 220, GOLD, 24);

  quote(ctx, pick(r, ["Hindsight is 20/20. Your exits are 20/200.", "You sold the bottom of the top.", "Patience is a virtue. You have other virtues."]), Math.min(y + 150 + ms + 120, 1210), P.ink, 42);
  return { name: "biggest-miss", cv };
}
