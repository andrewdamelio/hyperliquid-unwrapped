import { describe, expect, it } from "vitest";
import type { Fill } from "../src/types";
import { coinName, feeUsd, reconstructTrades } from "../src/analysis/trades";

const USER = "0xabc0000000000000000000000000000000000abc";
let tid = 0;
/** Minimal fill builder: side B/A, size, price, position before the fill, realized pnl. */
const fill = (coin: string, side: "B" | "A", sz: number, px: number, start: number, closedPnl = 0, time = ++tid * 1000, extra: Partial<Fill> = {}): Fill => ({
  coin, side, sz: String(sz), px: String(px), startPosition: String(start), closedPnl: String(closedPnl), fee: "0", feeToken: "USDC", time, tid, ...extra,
});

describe("reconstructTrades", () => {
  it("open long then close: one winning trade with entry/exit", () => {
    const { closed, open } = reconstructTrades([fill("BTC", "B", 1, 100, 0), fill("BTC", "A", 1, 110, 1, 10)], USER);
    expect(open).toHaveLength(0);
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ side: 1, pnl: 10, entry: 100, exit: 110 });
  });

  it("short: profit when price falls", () => {
    const { closed } = reconstructTrades([fill("ETH", "A", 2, 50, 0), fill("ETH", "B", 2, 40, -2, 20)], USER);
    expect(closed[0]).toMatchObject({ side: -1, pnl: 20, entry: 50, exit: 40 });
  });

  it("scaling in and partial closes stay one trade until flat", () => {
    const fills = [
      fill("SOL", "B", 1, 100, 0),
      fill("SOL", "B", 1, 120, 1),      // add: avg entry 110
      fill("SOL", "A", 1, 130, 2, 20),  // partial close
      fill("SOL", "A", 1, 140, 1, 30),  // flat
    ];
    const { closed } = reconstructTrades(fills, USER);
    expect(closed).toHaveLength(1);
    expect(closed[0].pnl).toBe(50);
    expect(closed[0].entry).toBe(110);
    expect(closed[0].exit).toBe(135);
    expect(closed[0].maxSz).toBe(2);
  });

  it("a flip closes the long and opens a short with the remainder", () => {
    const fills = [fill("BTC", "B", 1, 100, 0), fill("BTC", "A", 3, 90, 1, -10), fill("BTC", "B", 2, 80, -2, 20)];
    const { closed } = reconstructTrades(fills, USER);
    expect(closed).toHaveLength(2);
    expect(closed[0]).toMatchObject({ side: 1, pnl: -10, exit: 90 });
    expect(closed[1]).toMatchObject({ side: -1, pnl: 20, entry: 90, exit: 80 });
  });

  it("history starting mid-position is treated as an already-open trade", () => {
    const { closed } = reconstructTrades([fill("HYPE", "A", 5, 30, 5, 25)], USER);
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ side: 1, pnl: 25 });
  });

  it("positions still open are returned separately", () => {
    const { closed, open } = reconstructTrades([fill("DOGE", "B", 100, 0.1, 0)], USER);
    expect(closed).toHaveLength(0);
    expect(open).toHaveLength(1);
  });

  it("fees reduce trade pnl", () => {
    const fills = [fill("BTC", "B", 1, 100, 0, 0, undefined, { fee: "0.5" }), fill("BTC", "A", 1, 110, 1, 10, undefined, { fee: "0.5" })];
    expect(reconstructTrades(fills, USER).closed[0].pnl).toBeCloseTo(9);
  });

  it("flags liquidations of this user only", () => {
    const liqMe = fill("ETH", "A", 1, 80, 1, -20, undefined, { liquidation: { liquidatedUser: USER.toUpperCase() } });
    const liqOther = fill("SOL", "A", 1, 80, 1, -20, undefined, { liquidation: { liquidatedUser: "0xsomeoneelse" } });
    const { closed } = reconstructTrades([fill("ETH", "B", 1, 100, 0), liqMe, fill("SOL", "B", 1, 100, 0), liqOther], USER);
    expect(closed.find((t) => t.coin === "ETH")!.liq).toBe(true);
    expect(closed.find((t) => t.coin === "SOL")!.liq).toBe(false);
  });

  it("sorts fills by time before reconstructing", () => {
    const close = fill("BTC", "A", 1, 110, 1, 10, 2000);
    const openF = fill("BTC", "B", 1, 100, 0, 0, 1000);
    expect(reconstructTrades([close, openF], USER).closed).toHaveLength(1);
  });
});

describe("coinName", () => {
  it("resolves spot ids, HIP-3 and pairs", () => {
    expect(coinName("@107", { "@107": "HYPE" })).toBe("HYPE");
    expect(coinName("xyz:TSLA")).toBe("TSLA");
    expect(coinName("PURR/USDC")).toBe("PURR");
    expect(coinName("BTC")).toBe("BTC");
  });
});

describe("feeUsd", () => {
  it("converts base-token fees at the fill price", () => {
    expect(feeUsd(fill("@107", "B", 10, 30, 0, 0, 1, { fee: "0.01", feeToken: "HYPE" }))).toBeCloseTo(0.3);
    expect(feeUsd(fill("BTC", "B", 1, 100, 0, 0, 1, { fee: "0.2" }))).toBeCloseTo(0.2);
  });
});
