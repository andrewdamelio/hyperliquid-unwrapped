import type { Mood } from "../moods";
import { rng, shortAddr } from "../format";
import { drawFx } from "./fx";

/** Cards are 4:5, the size Instagram/X stories handle well. */
export const W = 1080;
export const H = 1350;
export const PAD = 64;

export const FONT_D = "Anton, Impact, sans-serif";
export const FONT_B = "'Space Grotesk', system-ui, sans-serif";
export const FONT_M = "'JetBrains Mono', ui-monospace, monospace";
const FONT_EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export const DIM = "rgba(255,255,255,.55)";
export const GREEN = "#3dff8c";
export const RED = "#ff4d5e";
export const GOLD = "#ffd23d";

export type Ctx = CanvasRenderingContext2D;

/** Wait for web fonts so canvas text doesn't fall back. */
export function loadFonts(): Promise<unknown> {
  return Promise.all([
    document.fonts.load(`100px Anton`),
    document.fonts.load(`700 40px "Space Grotesk"`),
    document.fonts.load(`500 20px "JetBrains Mono"`),
    document.fonts.load(`700 20px "JetBrains Mono"`),
  ]).catch(() => undefined);
}

/** Shrink the font until `text` fits in `maxW`. Returns the size used. */
export function fit(ctx: Ctx, text: string, maxW: number, size: number, family: string, weight = ""): number {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > 12) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

/** Word-wrap with the current font. Returns the y of the last line. */
export function wrap(ctx: Ctx, text: string, x: number, y: number, maxW: number, lineHeight: number): number {
  let line = "";
  let yy = y;
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
    } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Dark translucent panel so text stays readable over effects. */
export function panel(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.42) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  rrect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function emoji(ctx: Ctx, e: string, x: number, y: number, size: number, rot = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `${size}px ${FONT_EMOJI}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, 0, 0);
  ctx.restore();
}

export function label(ctx: Ctx, text: string, x: number, y: number, color: string) {
  ctx.font = `700 30px ${FONT_M}`;
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), x, y);
}

/** Rounded badge. Returns its width. */
export function pill(ctx: Ctx, text: string, x: number, y: number, bg: string, fg: string): number {
  ctx.font = `700 30px ${FONT_B}`;
  const w = ctx.measureText(text).width + 44;
  ctx.fillStyle = bg;
  rrect(ctx, x, y - 40, w, 58, 29);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(text, x + 22, y);
  return w;
}

/** Big display text, auto-fitted, optionally glowing. */
export function headline(ctx: Ctx, text: string, x: number, y: number, maxW: number, size: number, color: string, glow = 0, glowColor = color): number {
  const s = fit(ctx, text, maxW, size, FONT_D);
  ctx.save();
  ctx.fillStyle = color;
  if (glow) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
  return s;
}

/** Quote line in body font. */
export function quote(ctx: Ctx, text: string, y: number, color: string, size = 44) {
  ctx.font = `700 ${size}px ${FONT_B}`;
  ctx.fillStyle = color;
  return wrap(ctx, `“${text}”`, PAD, y, W - PAD * 2, size * 1.22);
}

/** A blank card: mood background, effects, header and footer. */
export function newCard(mood: Mood, intensity: number, seed: number, user: string) {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const r = rng(seed);

  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, mood.bg[0]);
  g.addColorStop(1, mood.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  for (let x = 30; x < W; x += 54) for (let y = 30; y < H; y += 54) ctx.fillRect(x, y, 3, 3);

  drawFx(ctx, mood.fx, r, intensity);

  ctx.textBaseline = "alphabetic";
  ctx.font = `44px ${FONT_D}`;
  ctx.fillStyle = mood.ink;
  ctx.fillText("HYPER", PAD, 104);
  const w = ctx.measureText("HYPER").width;
  ctx.fillStyle = mood.acc;
  ctx.fillText("UNWRAPPED", PAD + w + 6, 104);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = `500 28px ${FONT_M}`;
  ctx.fillText(shortAddr(user), W - PAD, 100);
  ctx.textAlign = "left";
  ctx.font = `500 22px ${FONT_M}`;
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.fillText("hyperliquid · not financial advice", PAD, H - 50);

  return { cv, ctx, r };
}
