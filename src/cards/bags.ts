import type { Card } from "../types";
import type { DeckContext } from "./context";
import { MOODS } from "../moods";
import { money } from "../format";
import { FONT_D, FONT_M, GREEN, PAD, RED, W, label, newCard, panel } from "../render/canvas";

export function bagsCard({ S, seed }: DeckContext): Card | null {
  if (!S.positions.length) return null;
  const up = S.positions.reduce((s, p) => s + p.upnl, 0);
  const P = up >= 0 ? MOODS.meh : MOODS.cope;
  const { cv, ctx } = newCard(P, 0.4, seed + 7, S.user);

  label(ctx, "current bags", PAD, 230, P.acc);
  ctx.fillStyle = P.ink;
  ctx.font = `120px ${FONT_D}`;
  ctx.fillText(up >= 0 ? "STILL COOKING" : "STILL HOLDING", PAD, 370);
  ctx.font = `500 30px ${FONT_M}`;
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.fillText(`unrealized ${money(up)}`, PAD, 430);

  S.positions.slice(0, 5).forEach((p, i) => {
    const y = 480 + i * 150;
    panel(ctx, PAD, y, W - PAD * 2, 126, 0.45);
    ctx.font = `64px ${FONT_D}`;
    ctx.fillStyle = P.ink;
    ctx.fillText(p.name, PAD + 40, y + 84);
    ctx.font = `700 26px ${FONT_M}`;
    ctx.fillStyle = p.szi > 0 ? GREEN : RED;
    ctx.fillText(`${p.szi > 0 ? "LONG" : "SHORT"}${p.lev ? ` ${p.lev}x` : ""}`, 464, y + 76);
    ctx.textAlign = "right";
    ctx.font = `60px ${FONT_D}`;
    ctx.fillStyle = p.upnl >= 0 ? GREEN : RED;
    ctx.fillText(money(p.upnl), W - PAD - 40, y + 84);
    ctx.textAlign = "left";
  });
  return { name: "current-bags", cv };
}
