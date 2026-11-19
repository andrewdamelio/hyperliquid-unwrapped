import type { Card, CoinStat } from "../types";
import type { DeckContext } from "./context";
import { MOODS } from "../moods";
import { money, pick } from "../format";
import { DIM, FONT_D, FONT_M, PAD, W, emoji, fit, label, newCard, panel, quote, rrect } from "../render/canvas";

const ROW_Y = 460, ROW_H = 232;

function assetCard(c: DeckContext, list: CoinStat[], good: boolean): Card {
  const { S, seed, r } = c;
  const P = good ? MOODS.party : MOODS.rekt;
  const { cv, ctx } = newCard(P, 0.55, seed + (good ? 4 : 5), S.user);

  label(ctx, good ? "your best assets" : "your cursed assets", PAD, 230, P.acc);
  const head = good ? "MONEY PRINTERS" : "THESE COINS OWE YOU";
  const hs = fit(ctx, head, W - PAD * 2, 120, FONT_D);
  ctx.fillStyle = P.ink;
  ctx.fillText(head, PAD, 260 + hs);

  const medals = good ? ["🥇", "🥈", "🥉"] : ["💀", "🪦", "⚰️"];
  const max = Math.max(...list.map((x) => Math.abs(x.pnl)), 1);
  list.forEach((coin, i) => {
    const y = ROW_Y + i * ROW_H;
    panel(ctx, PAD, y, W - PAD * 2, 206, 0.45);
    emoji(ctx, medals[i], 150, y + 105, 90);

    const ns = fit(ctx, coin.name, 420, 96, FONT_D);
    ctx.fillStyle = P.ink;
    ctx.fillText(coin.name, 230, y + 90 + (96 - ns) / 3);
    ctx.font = `500 24px ${FONT_M}`;
    ctx.fillStyle = DIM;
    ctx.fillText(`${coin.trades} trades · ${money(coin.vol, false)} volume`, 232, y + 150);

    ctx.textAlign = "right";
    fit(ctx, money(coin.pnl), 330, 72, FONT_D);
    ctx.fillStyle = P.acc;
    ctx.fillText(money(coin.pnl), W - PAD - 40, y + 100);
    ctx.textAlign = "left";

    ctx.globalAlpha = 0.85;
    rrect(ctx, 232, y + 170, (W - 336) * (Math.abs(coin.pnl) / max), 12, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  const q = good
    ? pick(r, ["Never selling. (Sold immediately.)", "Your ride-or-dies.", "Loyalty rewarded, for once."])
    : pick(r, ["Blocked. Reported. Still trading it tomorrow.", "Revenge trading enthusiasts only.", "Some coins just hate you specifically."]);
  quote(ctx, q, ROW_Y + list.length * ROW_H + 56, P.ink, 40);
  return { name: good ? "best-assets" : "cursed-assets", cv };
}

export const bestAssetsCard = (c: DeckContext) => (c.S.bestCoins.length ? assetCard(c, c.S.bestCoins, true) : null);
export const cursedAssetsCard = (c: DeckContext) => (c.S.cursed.length ? assetCard(c, c.S.cursed, false) : null);
