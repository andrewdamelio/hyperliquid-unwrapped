import { monthStr } from "../format";
import type { Ctx } from "./canvas";
import { FONT_M, GREEN, RED } from "./canvas";

/** Cumulative pnl area chart: green above zero, red below, glowing line. */
export function drawPnlChart(ctx: Ctx, series: Array<[number, number]>, x: number, y: number, w: number, h: number) {
  if (series.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = `500 28px ${FONT_M}`;
    ctx.fillText("not enough history to chart", x + 30, y + h / 2);
    return;
  }
  const t0 = series[0][0], t1 = series[series.length - 1][0];
  const vals = series.map((s) => s[1]);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), span = hi - lo || 1;
  const X = (t: number) => x + ((t - t0) / (t1 - t0 || 1)) * w;
  const Y = (v: number) => y + h - ((v - lo) / span) * h;
  const zero = Y(0);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, zero);
  ctx.lineTo(x + w, zero);
  ctx.stroke();
  ctx.restore();

  const halves: Array<[1 | -1, string, string, string]> = [
    [1, GREEN, "rgba(61,255,140,.45)", "rgba(61,255,140,.03)"],
    [-1, RED, "rgba(255,77,94,.05)", "rgba(255,77,94,.45)"],
  ];
  for (const [sign, color, top, bottom] of halves) {
    ctx.save();
    ctx.beginPath();
    if (sign > 0) ctx.rect(x, y - 10, w, zero - y + 10);
    else ctx.rect(x, zero, w, y + h - zero + 10);
    ctx.clip();

    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.beginPath();
    ctx.moveTo(X(t0), zero);
    for (const [t, v] of series) ctx.lineTo(X(t), Y(v));
    ctx.lineTo(X(t1), zero);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    series.forEach(([t, v], i) => (i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v))));
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();
  }

  const [lt, lv] = series[series.length - 1];
  ctx.beginPath();
  ctx.arc(X(lt), Y(lv), 12, 0, 6.28);
  ctx.fillStyle = lv >= 0 ? GREEN : RED;
  ctx.fill();

  ctx.font = `500 22px ${FONT_M}`;
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillText(monthStr(t0), x, y + h + 40);
  ctx.textAlign = "right";
  ctx.fillText("now", x + w, y + h + 40);
  ctx.textAlign = "left";
}
