import type { Candle, InfoFn, Miss, Stats } from "../types";
import { DAY, HOUR } from "../format";

const WINDOW = 30 * DAY;
const CANDIDATES = 8;

/**
 * Biggest miss: for your largest exits, how much further did price run in your
 * direction within 30 days? Missed = (best price after exit − exit price) × size closed.
 */
export async function findMiss(S: Stats, info: InfoFn, now = Date.now()): Promise<Miss | null> {
  const cands = S.trades
    .filter((t) => t.outSz > 0 && t.closeTime)
    .sort((a, b) => b.outNotional - a.outNotional)
    .slice(0, CANDIDATES);

  let best: Miss | null = null;
  for (const t of cands) {
    const end = Math.min(t.closeTime! + WINDOW, now);
    if (end - t.closeTime! < HOUR) continue;
    try {
      const cs: Candle[] = await info({ type: "candleSnapshot", req: { coin: t.coin, interval: "4h", startTime: t.closeTime!, endTime: end } });
      if (!Array.isArray(cs) || !cs.length) continue;
      const ext = t.side > 0 ? Math.max(...cs.map((c) => Number(c.h))) : Math.min(...cs.map((c) => Number(c.l)));
      const missed = (t.side > 0 ? ext - t.exit! : t.exit! - ext) * t.outSz;
      if (missed > 0 && (!best || missed > best.missed)) best = { trade: t, ext, missed };
    } catch {
      /* skip coins without candles */
    }
  }
  return best;
}
