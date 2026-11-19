import type { FxKind } from "../moods";
import { pick } from "../format";
import type { Ctx } from "./canvas";
import { H, W, emoji } from "./canvas";

const PARTY_COLORS = ["#3dff8c", "#ffe14d", "#ff6fb5", "#6fd3ff", "#ffffff"];
const GOLD_COLORS = ["#ffd23d", "#ff7ad9", "#7af7ff", "#ffffff", "#b388ff"];

function confetti(ctx: Ctx, r: () => number, n: number, colors: string[]) {
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.globalAlpha = 0.35 + r() * 0.5;
    ctx.translate(r() * W, r() * H);
    ctx.rotate(r() * 6.28);
    ctx.fillStyle = pick(r, colors);
    ctx.fillRect(-9, -4, 14 + r() * 14, 7 + r() * 5);
    ctx.restore();
  }
}

function rain(ctx: Ctx, r: () => number, n: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, l = 30 + r() * 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - l * 0.25, y + l);
    ctx.stroke();
  }
}

function scatter(ctx: Ctx, r: () => number, n: number, set: string[], min = 50, spread = 70, alpha = 0.25) {
  for (let i = 0; i < n; i++) emoji(ctx, pick(r, set), r() * W, r() * H, min + r() * spread, (r() - 0.5) * 0.7, alpha + r() * 0.3);
}

function glow(ctx: Ctx, x: number, y: number, r0: number, r1: number, inner: string, outer: string) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Background effects for a card. `k` (0–1) scales how flashy it gets. */
export function drawFx(ctx: Ctx, fx: FxKind, r: () => number, k: number) {
  ctx.save();
  switch (fx) {
    case "rockets":
      confetti(ctx, r, Math.round(50 + 170 * k), GOLD_COLORS);
      scatter(ctx, r, Math.round(10 + 12 * k), ["🚀", "💰", "💎", "🍾", "🤑", "🔥"], 54);
      glow(ctx, W * 0.8, 150, 10, 700, "rgba(255,210,61,.35)", "rgba(255,210,61,0)");
      break;
    case "confetti":
      confetti(ctx, r, Math.round(50 + 170 * k), PARTY_COLORS);
      scatter(ctx, r, Math.round(6 + 12 * k), ["🎉", "🍾", "💸", "🥳", "🔥"], 54);
      break;
    case "sparkle":
      scatter(ctx, r, 10, ["✨", "💵", "📈"], 40, 40, 0.18);
      break;
    case "drizzle":
      rain(ctx, r, 70, "rgba(180,200,255,.2)");
      break;
    case "rain":
      rain(ctx, r, Math.round(140 + 220 * k), "rgba(180,200,255,.2)");
      scatter(ctx, r, Math.round(5 + 14 * k), ["🌧️", "📉", "😭", "🧻"]);
      glow(ctx, W / 2, H / 2, 300, 900, "rgba(0,0,0,0)", "rgba(0,0,0,.45)");
      break;
    case "skulls":
      rain(ctx, r, Math.round(140 + 220 * k), "rgba(255,90,100,.22)");
      scatter(ctx, r, Math.round(8 + 14 * k), ["💀", "🪦", "⚰️", "📉", "🩸"]);
      glow(ctx, W / 2, H / 2, 300, 900, "rgba(0,0,0,0)", "rgba(120,0,10,.55)");
      break;
  }
  ctx.restore();
}
