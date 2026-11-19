import type { ClearinghouseState, Fill, FundingEntry, InfoFn, InfoRequest, Portfolio } from "../types";
import { DAY, HOUR, hashStr, rng } from "../format";

export type DemoKind = "god" | "party" | "cope" | "rekt";

/** Fake addresses so demo cards are clearly not a real wallet. */
export const DEMO_ADDR: Record<DemoKind, string> = {
  god: "0x6a0de1d5e1a1c0ffee00000000000000000000aa",
  party: "0x9a77ee00000000000000000000000000beefc0de",
  cope: "0xc0be0000000000000000000000000000000d1d1d",
  rekt: "0xdead000000000000000000000000000000000bad",
};

interface Plan { edge: number; mult: number; n: number; liq: number; size: number; base: number }
const PLANS: Record<DemoKind, Plan> = {
  god: { edge: 0.62, mult: 9, n: 160, liq: 0, size: 1, base: 4000 },
  party: { edge: 0.56, mult: 2.4, n: 220, liq: 0, size: 0.35, base: 40000 },
  cope: { edge: 0.5, mult: 0.9, n: 260, liq: 1, size: 0.15, base: 400000 },
  rekt: { edge: 0.3, mult: 1.6, n: 200, liq: 5, size: 1, base: 150000 },
};

/** [coin, base price, typical size] */
const COINS: Array<[string, number, number]> = [
  ["BTC", 64000, 0.08], ["ETH", 3100, 1.4], ["SOL", 150, 30], ["HYPE", 24, 300],
  ["kPEPE", 0.011, 900000], ["WIF", 2.1, 4000], ["DOGE", 0.16, 60000], ["SUI", 1.8, 5000],
];
const priceAt = (c: [string, number, number], t: number) => c[1] * (1 + 0.35 * Math.sin(t / (37 * DAY) + c[1]) + 0.15 * Math.sin(t / (5 * DAY) + c[2]));

/** Build a deterministic synthetic account and answer Info API requests from it. */
export function demoInfo(kind: DemoKind, now = Date.now()): InfoFn {
  const r = rng(hashStr(kind) + 7);
  const plan = PLANS[kind];
  const t0 = now - 420 * DAY;
  const fills: Fill[] = [];
  const funding: FundingEntry[] = [];
  let tid = 1, t = t0;

  for (let i = 0; i < plan.n; i++) {
    t += (r() * 2.2 + 0.2) * DAY * (420 / plan.n) * 0.45;
    if (t > now - DAY) break;
    const c = COINS[Math.floor(Math.pow(r(), 1.4) * COINS.length)];
    const side = r() < 0.6 ? 1 : -1;
    const entry = priceAt(c, t);
    const sz = c[2] * (0.3 + r() * 2.2) * (r() < 0.05 ? 6 : 1) * plan.size;
    const win = r() < plan.edge;
    const move = (0.01 + r() * 0.12) * (win ? plan.mult * 0.5 : 1) * (win ? 1 : -1);
    const exit = entry * (1 + move * side);
    const hold = (r() < 0.4 ? r() * 0.2 : r() * 6) * DAY;
    const tc = Math.min(t + hold, now - HOUR);
    const liq = !win && plan.liq > 0 && r() < (plan.liq / plan.n) * 3;
    const fee = (p: number) => (sz * p * 0.00045).toFixed(4);

    fills.push({ coin: c[0], px: String(entry), sz: String(sz), side: side > 0 ? "B" : "A", time: Math.round(t), startPosition: "0", dir: side > 0 ? "Open Long" : "Open Short", closedPnl: "0", fee: fee(entry), feeToken: "USDC", builderFee: r() < 0.5 ? (sz * entry * 0.0005).toFixed(4) : undefined, tid: tid++ });
    const closePx = liq ? entry * (1 - side * 0.09) : exit;
    const close: Fill = { coin: c[0], px: String(closePx), sz: String(sz), side: side > 0 ? "A" : "B", time: Math.round(tc), startPosition: String(side * sz), dir: side > 0 ? "Close Long" : "Close Short", closedPnl: String((closePx - entry) * sz * side), fee: fee(closePx), feeToken: "USDC", tid: tid++ };
    if (liq) close.liquidation = { liquidatedUser: DEMO_ADDR[kind], markPx: String(closePx), method: "market" };
    fills.push(close);
    if (r() < 0.5) funding.push({ time: Math.round(t + hold / 2), delta: { type: "funding", coin: c[0], usdc: String((r() - 0.45) * sz * entry * 0.0004 * (hold / DAY)) } });
  }
  fills.sort((a, b) => a.time - b.time);

  let cum = 0;
  const pnlHistory: Array<[number, string]> = [[t0, "0"]];
  const accountValueHistory: Array<[number, string]> = [[t0, String(plan.base)]];
  for (const f of fills) {
    cum += Number(f.closedPnl) - Number(f.fee);
    pnlHistory.push([f.time, String(cum)]);
    accountValueHistory.push([f.time, String(plan.base + cum)]);
  }
  const portfolio: Portfolio = [["allTime", { pnlHistory, accountValueHistory, vlm: "0" }]];
  const state: ClearinghouseState = {
    assetPositions: kind === "rekt" ? [] : [
      { position: { coin: "HYPE", szi: "420", entryPx: "31.2", unrealizedPnl: kind === "cope" ? "-512.4" : "1840.2", leverage: { value: 5 }, positionValue: "13000" } },
      { position: { coin: "ETH", szi: "-2.5", entryPx: "3350", unrealizedPnl: kind === "cope" ? "-220.1" : "690.5", leverage: { value: 10 }, positionValue: "8000" } },
    ],
  };

  return async (body: InfoRequest) => {
    await new Promise((ok) => setTimeout(ok, 40));
    switch (body.type) {
      case "userFillsByTime": return fills.filter((f) => f.time >= body.startTime).slice(0, 2000);
      case "userFunding": return funding.filter((f) => f.time >= body.startTime).slice(0, 500);
      case "portfolio": return portfolio;
      case "clearinghouseState": return state;
      case "candleSnapshot": {
        const c = COINS.find((x) => x[0] === body.req.coin)!;
        const out = [];
        for (let tt = body.req.startTime; tt <= body.req.endTime; tt += 4 * HOUR) {
          const p = priceAt(c, tt);
          out.push({ t: tt, h: p * 1.01, l: p * 0.99 });
        }
        return out;
      }
      default: return [];
    }
  };
}
