import type { Fill, Trade } from "../types";

const EPS = 1e-12;

/** Human name for a coin: resolves spot "@123" ids, HIP-3 "dex:TICKER" and "BASE/QUOTE" pairs. */
export function coinName(coin: string, spotNames: Record<string, string> = {}): string {
  const c = String(coin);
  if (spotNames[c]) return spotNames[c];
  if (c.includes(":")) return c.split(":")[1];
  if (c.includes("/")) return c.split("/")[0];
  return c;
}

/** Fee in USDC. Spot buys can be charged in the base token, so convert at the fill price. */
export function feeUsd(f: Fill): number {
  const fee = Number(f.fee || 0);
  return f.feeToken && f.feeToken !== "USDC" ? fee * Number(f.px) : fee;
}

export const isLiquidationOf = (f: Fill, user: string) =>
  !!f.liquidation && String(f.liquidation.liquidatedUser ?? "").toLowerCase() === user.toLowerCase();

function openTrade(f: Fill, name: string, side: 1 | -1, size: number): Trade {
  const p = Number(f.px);
  return { coin: f.coin, name, side, openTime: f.time, pnl: 0, inSz: size, inNotional: size * p, outSz: 0, outNotional: 0, maxSz: size, liq: false };
}

/**
 * Rebuild position lifecycles from fills.
 *
 * A trade starts when a position opens from flat (or when we first see an existing position)
 * and ends when it returns to flat. A fill that flips the position closes the current trade
 * and opens a new one with the remainder. Realized pnl and fees are attributed to the trade
 * they occur in.
 */
export function reconstructTrades(fills: Fill[], user: string, name: (coin: string) => string = (c) => c) {
  const closed: Trade[] = [];
  const open: Record<string, Trade> = {};

  for (const f of [...fills].sort((a, b) => a.time - b.time)) {
    const sz = Number(f.sz);
    const p = Number(f.px);
    const signed = f.side === "B" ? sz : -sz;
    const start = Number(f.startPosition || 0);
    const after = start + signed;

    let t: Trade | undefined = open[f.coin];
    // History can begin mid-position: treat what we first see as already open.
    if (!t && Math.abs(start) > EPS) t = open[f.coin] = openTrade(f, name(f.coin), start > 0 ? 1 : -1, Math.abs(start));

    const reducing = !!t && Math.sign(signed) !== t.side;
    if (!t) t = open[f.coin] = { ...openTrade(f, name(f.coin), signed > 0 ? 1 : -1, 0) };

    t.pnl += Number(f.closedPnl || 0) - feeUsd(f);
    if (isLiquidationOf(f, user)) t.liq = true;

    if (!reducing) {
      t.inSz += sz;
      t.inNotional += sz * p;
      t.maxSz = Math.max(t.maxSz, Math.abs(after));
      continue;
    }

    const closeSz = Math.min(sz, Math.abs(start));
    t.outSz += closeSz;
    t.outNotional += closeSz * p;

    const flat = Math.abs(after) < EPS;
    const flipped = !flat && Math.sign(after) !== Math.sign(start);
    if (flat || flipped) {
      t.closeTime = f.time;
      t.entry = t.inNotional / (t.inSz || 1);
      t.exit = t.outNotional / (t.outSz || 1);
      closed.push(t);
      delete open[f.coin];
      if (flipped) open[f.coin] = openTrade(f, t.name, after > 0 ? 1 : -1, Math.abs(after));
    }
  }

  return { closed, open: Object.values(open) };
}
