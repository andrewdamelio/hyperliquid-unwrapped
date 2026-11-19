import type { Card, Stats } from "../types";
import type { DeckContext } from "./context";
import { money } from "../format";
import { DIM, FONT_B, FONT_D, FONT_M, GREEN, PAD, RED, W, fit, label, newCard, panel, wrap } from "../render/canvas";

function roast(S: Stats): string {
  if (S.fees > Math.abs(S.pnl)) return `You paid ${money(S.fees, false)} in fees. The exchange thanks you.`;
  if (S.liqCount) return `${S.liqCount} liquidation${S.liqCount > 1 ? "s" : ""}. Leverage is a hell of a drug.`;
  return `Win rate ${Math.round(S.winRate * 100)}%. ${S.winRate > 0.5 ? "Not bad, degen." : "A coin flip would be proud."}`;
}

export function receiptsCard({ S, mood: M, k, seed }: DeckContext): Card {
  const { cv, ctx } = newCard(M, k * 0.5, seed + 8, S.user);
  label(ctx, "the receipts", PAD, 230, M.acc);
  ctx.fillStyle = M.ink;
  ctx.font = `120px ${FONT_D}`;
  ctx.fillText("BY THE NUMBERS", PAD, 370);

  const grid: Array<[string, string, string?]> = [
    ["volume traded", money(S.volume, false)],
    ["trades closed", S.trades.length.toLocaleString()],
    ["fees paid", money(S.fees, false)],
    ["builder fees tipped", money(S.builderFees, false)],
    ["funding", money(S.fundingNet), S.fundingNet >= 0 ? GREEN : RED],
    ["liquidations", String(S.liqCount), S.liqCount ? RED : undefined],
    ["most traded", S.favCoin ? S.favCoin[0] : "—"],
    ["favorite hour", `${String(S.favHour).padStart(2, "0")}:00 UTC`],
  ];
  grid.forEach(([l, v, color], i) => {
    const x = PAD + (i % 2) * 486, y = 430 + Math.floor(i / 2) * 200;
    panel(ctx, x, y, 466, 176, 0.42);
    ctx.font = `500 24px ${FONT_M}`;
    ctx.fillStyle = DIM;
    ctx.fillText(l.toUpperCase(), x + 34, y + 54);
    fit(ctx, v, 400, 76, FONT_D);
    ctx.fillStyle = color ?? M.ink;
    ctx.fillText(v, x + 34, y + 140);
  });

  ctx.font = `700 38px ${FONT_B}`;
  ctx.fillStyle = M.ink;
  wrap(ctx, roast(S), PAD, 1250, W - PAD * 2, 46);
  return { name: "receipts", cv };
}
