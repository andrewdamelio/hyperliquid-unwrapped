import type { FxKind } from "../moods";

interface Particle { x: number; y: number; v: number; r: number; s: number; c: string }

/** Animated confetti or rain behind the page, matching the card mood. */
export function createBackgroundFx(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let parts: Particle[] = [];
  let mode: FxKind | null = null;
  let raf = 0;

  const isParty = () => mode === "confetti" || mode === "rockets" || mode === "sparkle";

  function frame() {
    const dpr = devicePixelRatio;
    const w = (canvas.width = innerWidth * dpr);
    const h = (canvas.height = innerHeight * dpr);
    ctx.clearRect(0, 0, w, h);
    const party = isParty();
    for (const p of parts) {
      p.y += p.v * (party ? 1 : 4);
      p.r += p.s;
      if (p.y > 1.05) {
        p.y = -0.05;
        p.x = Math.random();
      }
      const x = p.x * w, y = p.y * h;
      if (party) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.r);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = p.c;
        ctx.fillRect(-5 * dpr, -2.5 * dpr, 10 * dpr, 5 * dpr);
        ctx.restore();
      } else {
        ctx.strokeStyle = mode === "skulls" ? "rgba(255,80,90,.35)" : "rgba(170,190,255,.25)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4 * dpr, y + 22 * dpr);
        ctx.stroke();
      }
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    set(next: FxKind | null, intensity = 0.5) {
      mode = next;
      cancelAnimationFrame(raf);
      if (!next || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const colors = next === "rockets" ? ["#ffd23d", "#ff7ad9", "#7af7ff", "#fff"] : ["#3dff8c", "#ffe14d", "#ff6fb5", "#6fd3ff"];
      const n = Math.round((isParty() ? 60 : 90) * (0.4 + intensity));
      parts = Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        v: 0.0006 + Math.random() * 0.002,
        r: Math.random() * 6.28,
        s: (Math.random() - 0.5) * 0.08,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
      frame();
    },
  };
}
