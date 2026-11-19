import "./style.css";
import type { InfoFn } from "./types";
import { createInfoClient, fetchAccount } from "./api/hyperliquid";
import { analyze } from "./analysis/stats";
import { findMiss } from "./analysis/miss";
import { buildDeck } from "./cards";
import { MOODS } from "./moods";
import { loadFonts } from "./render/canvas";
import { createStoryViewer } from "./ui/story";
import { createBackgroundFx } from "./ui/backgroundFx";
import { DEMO_ADDR, demoInfo, type DemoKind } from "./demo/demo";
import { isAddress } from "./format";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const LAST_KEY = "hu:last";

const fx = createBackgroundFx($<HTMLCanvasElement>("#fx"));
const viewer = createStoryViewer(() => {
  $("#landing").style.display = "block";
  fx.set(null);
  scrollTo(0, 0);
});

function setStatus(message: string, isError = false) {
  const s = $("#status");
  s.textContent = message;
  s.classList.toggle("err", isError);
}
function setProgress(p: number | null) {
  $("#bar").style.display = p == null ? "none" : "block";
  $("#bar i").style.width = `${(p ?? 0) * 100}%`;
}

async function unwrap(user: string, info: InfoFn, isDemo: boolean) {
  const btn = $<HTMLButtonElement>("#goBtn");
  btn.disabled = true;
  try {
    const raw = await fetchAccount(user, info, (p, m) => {
      setProgress(p);
      setStatus(m);
    });
    if (!raw.fills.length) throw new Error("No trades found for this address. Either a fresh wallet or a very patient one.");

    const stats = analyze(raw);
    setProgress(0.82);
    setStatus("Measuring your biggest regret…");
    const miss = await findMiss(stats, info);

    setProgress(0.92);
    setStatus("Printing your cards…");
    await loadFonts();
    const { cards, moodKey, k } = buildDeck(stats, miss);

    setProgress(null);
    setStatus("");
    $("#landing").style.display = "none";
    document.documentElement.style.setProperty("--acc", MOODS[moodKey].acc);
    fx.set(MOODS[moodKey].fx, k);
    viewer.open(cards, user);
    scrollTo(0, 0);
    if (!isDemo) {
      try { localStorage.setItem(LAST_KEY, user); } catch { /* private mode */ }
    }
  } catch (e) {
    setProgress(null);
    const msg = (e as Error).message;
    setStatus(/Failed to fetch|NetworkError|Load failed/i.test(msg) ? "Couldn't reach Hyperliquid's API from here. Try again, or try a demo." : msg, true);
  } finally {
    btn.disabled = false;
  }
}

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>("#addr");
  const a = input.value.trim();
  if (!isAddress(a)) {
    input.classList.add("bad");
    setStatus("That's not a valid 0x address.", true);
    return;
  }
  input.classList.remove("bad");
  unwrap(a.toLowerCase(), createInfoClient(), false);
});

document.querySelectorAll<HTMLElement>("[data-demo]").forEach((b) =>
  b.addEventListener("click", () => {
    const kind = b.dataset.demo as DemoKind;
    unwrap(DEMO_ADDR[kind], demoInfo(kind), true);
  }),
);

try {
  const last = localStorage.getItem(LAST_KEY);
  if (last) $<HTMLInputElement>("#addr").value = last;
} catch { /* private mode */ }
