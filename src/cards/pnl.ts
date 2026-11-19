import type { Card } from "../types";
import type { DeckContext } from "./context";
import { money, monthStr, pct, pick } from "../format";
import { FONT_D, FONT_M, PAD, W, emoji, fit, headline, label, newCard, panel, pill, quote } from "../render/canvas";
import { drawPnlChart } from "../render/chart";

/** Cover: mood title, all-time pnl, return on deposits, pnl chart. */
export function pnlCard({ S, mood: M, k, seed, r }: DeckContext): Card {
  const { cv, ctx } = newCard(M, k, seed, S.user);
  emoji(ctx, M.emoji, W - 150, 250, 150, 0.12);

  const ts = fit(ctx, M.title, W - 300, 120, FONT_D);
  ctx.fillStyle = M.acc;
  ctx.fillText(M.title, PAD, 230 + (120 - ts) / 2);

  label(ctx, "all-time pnl", PAD, 330, "rgba(255,255,255,.65)");
  const ps = fit(ctx, money(S.pnl), W - PAD * 2, 230, FONT_D);
  headline(ctx, money(S.pnl), PAD, 560 - (230 - ps) / 2, W - PAD * 2, 230, M.ink, 30 * k, M.acc);

  if (S.roi !== null && isFinite(S.roi)) pill(ctx, `${pct(S.roi)} return on deposits`, PAD, 650, M.acc, "#0a0a0a");

  panel(ctx, PAD, 700, W - PAD * 2, 380);
  drawPnlChart(ctx, S.series, PAD + 40, 740, W - PAD * 2 - 80, 270);

  // Quote may wrap to two lines; keep the stats line clear of it and above the footer.
  const quoteEnd = quote(ctx, pick(r, M.quips), 1160, M.ink, 44);

  ctx.font = `500 26px ${FONT_M}`;
  ctx.fillStyle = "rgba(255,255,255,.6)";
  const since = S.firstTime ? `degen since ${monthStr(S.firstTime)} · ` : "";
  ctx.fillText(`${since}${S.trades.length.toLocaleString()} trades${S.capped ? " (last 10k fills)" : ""}`, PAD, Math.min(Math.max(quoteEnd + 60, 1240), 1262));
  return { name: "pnl", cv };
}
