import { describe, expect, it } from "vitest";
import type { Fill, RawAccount } from "../src/types";
import { analyze, portfolioSummary } from "../src/analysis/stats";
import { archetypeFor } from "../src/analysis/archetypes";
import { moodFor } from "../src/moods";
import { findMiss } from "../src/analysis/miss";
import { DAY, dur } from "../src/format";

const USER = "0xabc0000000000000000000000000000000000abc";
const f = (coin: string, side: "B" | "A", sz: number, px: number, start: number, closedPnl: number, time: number, fee = 0): Fill => ({
  coin, side, sz: String(sz), px: String(px), startPosition: String(start), closedPnl: String(closedPnl), fee: String(fee), feeToken: "USDC", time,
});
const account = (fills: Fill[], extra: Partial<RawAccount> = {}): RawAccount => ({
  user: USER, fills, funding: [], portfolio: null, state: null, spotNames: {}, capped: false, ...extra,
});

describe("portfolioSummary", () => {
  it("uses Hyperliquid's pnl history and max net deposits as basis", () => {
    const s = portfolioSummary([["allTime", {
      pnlHistory: [[1, "0"], [2, "500"], [3, "300"]],
      accountValueHistory: [[1, "1000"], [2, "1500"], [3, "2300"]], // deposits: 1000 → 1000 → 2000
    }]]);
    expect(s).toMatchObject({ pnl: 300, basis: 2000 });
  });
  it("returns null without history", () => expect(portfolioSummary(null)).toBeNull());
});

describe("analyze", () => {
  const fills = [
    f("BTC", "B", 1, 100, 0, 0, 1 * DAY, 1),
    f("BTC", "A", 1, 150, 1, 50, 2 * DAY, 1),
    f("ETH", "A", 1, 100, 0, 0, 3 * DAY),
    f("ETH", "B", 1, 120, -1, -20, 4 * DAY),
    f("SOL", "B", 1, 10, 0, 0, 5 * DAY),
    f("SOL", "A", 1, 12, 1, 2, 6 * DAY),
  ];

  it("computes pnl from closed trades + funding when there is no portfolio", () => {
    const S = analyze(account(fills, { funding: [{ time: 2 * DAY, delta: { coin: "BTC", usdc: "5" } }] }));
    expect(S.trades).toHaveLength(3);
    expect(S.pnl).toBeCloseTo(50 - 2 - 20 + 2 + 5);
    expect(S.roi).toBeNull();
    expect(S.fundingNet).toBe(5);
  });

  it("ranks best and cursed assets and trades", () => {
    const S = analyze(account(fills));
    expect(S.bestCoins.map((c) => c.name)).toEqual(["BTC", "SOL"]);
    expect(S.cursed.map((c) => c.name)).toEqual(["ETH"]);
    expect(S.sortedTrades[0].coin).toBe("BTC");
    expect(S.sortedTrades.at(-1)!.coin).toBe("ETH");
    expect(S.winRate).toBeCloseTo(2 / 3);
    expect(S.bestStreak).toBe(1);
  });

  it("totals volume and fees", () => {
    const S = analyze(account(fills));
    expect(S.volume).toBeCloseTo(100 + 150 + 100 + 120 + 10 + 12);
    expect(S.fees).toBe(2);
  });

  it("finds the longest and shortest holds", () => {
    const S = analyze(account(fills));
    // BTC, ETH and SOL are each held 1 day; add a long one and a quick one
    const S2 = analyze(account([...fills, f("HYPE", "B", 1, 20, 0, 0, 10 * DAY), f("HYPE", "A", 1, 25, 1, 5, 40 * DAY), f("WIF", "B", 1, 2, 0, 0, 50 * DAY), f("WIF", "A", 1, 2, 1, 0, 50 * DAY + 30_000)]));
    expect(S.longestHold).not.toBeNull();
    expect(S2.longestHold!.coin).toBe("HYPE");
    expect(S2.shortestHold!.coin).toBe("WIF");
  });

  it("has no shortest hold with a single trade", () => {
    const S = analyze(account(fills.slice(0, 2)));
    expect(S.longestHold!.coin).toBe("BTC");
    expect(S.shortestHold).toBeNull();
  });

  it("clamps return on deposits at -100%", () => {
    const S = analyze(account(fills, { portfolio: [["allTime", { pnlHistory: [[1, "0"], [2, "-5000"]], accountValueHistory: [[1, "1000"], [2, "-4000"]] }]] }));
    expect(S.roi).toBe(-1);
  });
});

describe("archetypeFor", () => {
  const base = { pnl: 1000, fees: 10, fundingNet: 0, liqCount: 0, winRate: 0.5, tradeCount: 20, medianHold: 3 * 36e5, favCoin: "BTC" };
  it("liquidations take priority", () => expect(archetypeFor({ ...base, liqCount: 4, winRate: 0.9 })[0]).toBe("The Liquidation Speedrunner"));
  it("detects memecoin traders", () => expect(archetypeFor({ ...base, favCoin: "kPEPE" })[0]).toBe("The Memecoin Mercenary"));
  it("detects fee donors", () => expect(archetypeFor({ ...base, fees: 5000 })[0]).toBe("The Fee Donor"));
  it("falls back to coin flipper", () => expect(archetypeFor(base)[0]).toBe("The Coin Flipper"));
});

describe("moodFor", () => {
  it.each([
    [-0.8, "rekt"], [-0.3, "pain"], [-0.05, "cope"], [0.05, "meh"], [0.5, "party"], [3, "god"],
  ])("roi %s → %s", (roi, mood) => expect(moodFor({ roi, pnl: 0 })[0]).toBe(mood));
  it("falls back to absolute pnl", () => expect(moodFor({ roi: null, pnl: 100000 })[0]).toBe("god"));
});

describe("findMiss", () => {
  it("measures how far price ran after a long exit", async () => {
    const S = analyze(account([f("BTC", "B", 2, 100, 0, 0, 0), f("BTC", "A", 2, 110, 2, 20, DAY)]));
    const info = async () => [{ t: DAY, h: "150", l: "105" }, { t: 2 * DAY, h: "130", l: "120" }];
    const miss = await findMiss(S, info, 40 * DAY);
    expect(miss).toMatchObject({ ext: 150, missed: 80 }); // (150 − 110) × 2
  });
  it("returns null when price never beat the exit", async () => {
    const S = analyze(account([f("BTC", "B", 1, 100, 0, 0, 0), f("BTC", "A", 1, 110, 1, 10, DAY)]));
    expect(await findMiss(S, async () => [{ t: DAY, h: "105", l: "90" }], 40 * DAY)).toBeNull();
  });
});

describe("dur", () => {
  it.each([
    [500, "1s"], [42_000, "42s"], [59_600, "1m"], [3_570_000, "1h 0m"], [5 * 36e5 + 59.6 * 6e4, "6h 0m"],
    [5 * DAY + 23.6 * 36e5, "6d 0h"], [47 * DAY + 3 * 36e5, "47d 3h"],
  ])("%s ms → %s", (ms, out) => expect(dur(ms)).toBe(out));
});
