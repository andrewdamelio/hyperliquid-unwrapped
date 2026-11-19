import type { Card } from "../types";
import { clamp, shortAddr } from "../format";
import { toast } from "./toast";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

const blobOf = (cv: HTMLCanvasElement) => new Promise<Blob>((ok, fail) => cv.toBlob((b) => (b ? ok(b) : fail(new Error("toBlob failed"))), "image/png"));

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

/** Instagram-style story viewer with tap/swipe navigation, share and save. */
export function createStoryViewer(onClose: () => void) {
  let deck: Card[] = [];
  let urls: string[] = [];
  let idx = 0;
  let user = "";

  const fileName = (c: Card) => `hyper-unwrapped-${shortAddr(user).replace("…", "")}-${c.name}.png`;

  function show(i: number) {
    idx = clamp(i, 0, deck.length - 1);
    $<HTMLImageElement>("#cardImg").src = urls[idx];
    $("#prog").innerHTML = deck.map((_, j) => `<i data-j="${j}" class="${j < idx ? "done" : j === idx ? "on" : ""}"></i>`).join("");
    $("#count").textContent = `${idx + 1} / ${deck.length}`;
  }

  const isOpen = () => $("#story").style.display === "block";

  $("#prog").addEventListener("click", (e) => {
    const j = (e.target as HTMLElement).dataset.j;
    if (j != null) show(Number(j));
  });
  $("#tapL").onclick = $("#prev").onclick = () => show(idx - 1);
  $("#tapR").onclick = $("#next").onclick = () => show(idx + 1);
  addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  });
  let touchX: number | null = null;
  $("#stage").addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  $("#stage").addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  $("#save").onclick = async () => {
    try {
      download(await blobOf(deck[idx].cv), fileName(deck[idx]));
      toast("Saved");
    } catch {
      toast("Long-press the card to save it");
    }
  };
  $("#saveAll").onclick = async () => {
    try {
      for (const c of deck) {
        download(await blobOf(c.cv), fileName(c));
        await new Promise((ok) => setTimeout(ok, 250));
      }
      toast(`Saved ${deck.length} cards`);
    } catch {
      toast("Long-press each card to save it");
    }
  };
  $("#share").onclick = async () => {
    try {
      const f = new File([await blobOf(deck[idx].cv)], fileName(deck[idx]), { type: "image/png" });
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], text: "My Hyperliquid, unwrapped 👀" });
      else {
        download(f, f.name);
        toast("Sharing not supported here, saved instead");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast("Long-press the card to save it");
    }
  };
  $("#again").onclick = () => {
    $("#story").style.display = "none";
    onClose();
  };

  return {
    open(cards: Card[], forUser: string) {
      deck = cards;
      user = forUser;
      urls = cards.map((c) => c.cv.toDataURL("image/png"));
      $("#story").style.display = "block";
      show(0);
    },
  };
}
