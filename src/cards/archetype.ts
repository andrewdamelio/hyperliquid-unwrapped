import type { Card } from "../types";
import type { DeckContext } from "./context";
import { dur } from "../format";
import { DIM, FONT_B, FONT_D, FONT_M, PAD, W, fit, label, newCard, panel, wrap } from "../render/canvas";

export function archetypeCard({ S, mood: M, k, seed }: DeckContext): Card {
  const { cv, ctx } = newCard(M, k * 0.7, seed + 1, S.user);
  label(ctx, "your trader archetype", PAD, 230, M.acc);

  const words = S.archetype[0].toUpperCase().split(" ");
  const size = words.length > 3 ? 130 : 160;
  let y = 230 + size;
  ctx.fillStyle = M.ink;
  for (const w of words) {
    const s = fit(ctx, w, W - PAD * 2, size, FONT_D);
    ctx.fillText(w, PAD, y);
    y += s + 6;
  }

  ctx.font = `700 46px ${FONT_B}`;
  ctx.fillStyle = "rgba(255,255,255,.85)";
  wrap(ctx, S.archetype[1], PAD, y + 40, W - PAD * 2, 56);

  panel(ctx, PAD, 1050, W - PAD * 2, 200);
  const stats: Array<[string, string]> = [
    ["win rate", `${Math.round(S.winRate * 100)}%`],
    ["best streak", `${S.bestStreak}W`],
    ["median hold", S.medianHold ? dur(S.medianHold) : "—"],
  ];
  stats.forEach(([l, v], i) => {
    const x = PAD + 40 + i * 310;
    ctx.font = `500 24px ${FONT_M}`;
    ctx.fillStyle = DIM;
    ctx.fillText(l.toUpperCase(), x, 1120);
    ctx.font = `70px ${FONT_D}`;
    ctx.fillStyle = M.acc;
    ctx.fillText(v, x, 1210);
  });
  return { name: "archetype", cv };
}
