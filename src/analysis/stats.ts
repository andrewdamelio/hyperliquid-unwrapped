import type { CoinStat, OpenPosition, RawAccount, Stats, Trade } from "../types";
import { archetypeFor } from "./archetypes";
import { coinName, feeUsd, isLiquidationOf, reconstructTrades } from "./trades";

/**
 * Headline pnl, chart series and return basis from the `portfolio` endpoint.
 * Basis = the most ever deposited, i.e. max(account value − cumulative pnl) at matching timestamps.
 */
export function portfolioSummary(portfolio: RawAccount["portfolio"]) {
  const all = Array.isArray(portfolio) ? portfolio.find((x) => x[0] === "allTime") : undefined;
  const hist = all?.[1]?.pnlHistory;
  if (!hist?.length) return null;
  const series = hist.map(([t, v]) => [t, Number(v)] as [number, number]);
  const pnlAt = new Map(series);
  let basis = 0;
  for (const [t, v] of all![1].accountValueHistory ?? []) {
    const p = pnlAt.get(t);
    if (p !== undefined) basis = Math.max(basis, Number(v) - p);
  }
  return { series, pnl: series[series.length - 1][1], basis };
}

export function analyze(d: RawAccount): Stats {
  const name = (c: string) => coinName(c, d.spotNames);
  const { closed: trades } = reconstructTrades(d.fills, d.user, name);

  let volume = 0, fees = 0, builderFees = 0, liqCount = 0;
  const byCoin: Record<string, CoinStat> = {};
  const coinVol: Record<string, number> = {};
  const hours = new Array<number>(24).fill(0);

  for (const f of d.fills) {
    const notional = Number(f.sz) * Number(f.px);
    const fee = feeUsd(f);
    const n = name(f.coin);
    volume += notional;
    fees += fee;
    builderFees += Number(f.builderFee || 0);
    hours[new Date(f.time).getUTCHours()]++;
    coinVol[n] = (coinVol[n] || 0) + notional;
    const c = (byCoin[n] ??= { name: n, pnl: 0, vol: 0, trades: 0 });
    c.pnl += Number(f.closedPnl || 0) - fee;
    c.vol += notional;
    if (isLiquidationOf(f, d.user)) liqCount++;
  }
  for (const t of trades) byCoin[t.name].trades++;

  let fundingNet = 0;
  for (const x of d.funding) {
    const usdc = Number(x.delta?.usdc || 0);
    fundingNet += usdc;
    const c = byCoin[name(x.delta?.coin)];
    if (c) c.pnl += usdc;
  }

  // Prefer Hyperliquid's own pnl history (includes fees + funding); fall back to closed trades.
  const summary = portfolioSummary(d.portfolio);
  let pnl: number, series: Array<[number, number]>, basis = 0;
  if (summary) ({ pnl, series, basis } = summary);
  else {
    let run = 0;
    series = trades.map((t) => [t.closeTime!, (run += t.pnl)]);
    pnl = run + fundingNet;
  }
  const roi = basis > 0 ? Math.max(-1, pnl / basis) : null;

  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length ? wins / trades.length : 0;
  let streak = 0, bestStreak = 0;
  for (const t of trades) {
    streak = t.pnl > 0 ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  const holdOf = (t: Trade) => t.closeTime! - t.openTime;
  const holds = trades.map(holdOf).sort((a, b) => a - b);
  const medianHold = holds.length ? holds[Math.floor(holds.length / 2)] : 0;
  const byHold = [...trades].sort((a, b) => holdOf(b) - holdOf(a));

  const coins = Object.values(byCoin);
  const favCoin = (Object.entries(coinVol).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined) ?? null;

  const positions: OpenPosition[] = (d.state?.assetPositions ?? [])
    .map((x) => x.position)
    .filter(Boolean)
    .map((p) => ({
      name: name(p.coin),
      szi: Number(p.szi),
      entry: Number(p.entryPx),
      upnl: Number(p.unrealizedPnl),
      lev: p.leverage?.value,
      liq: p.liquidationPx ? Number(p.liquidationPx) : null,
      value: Number(p.positionValue ?? 0),
    }))
    .sort((a, b) => Math.abs(b.upnl) - Math.abs(a.upnl));

  return {
    user: d.user,
    pnl,
    roi,
    basis,
    series,
    trades,
    sortedTrades: [...trades].sort((a, b) => b.pnl - a.pnl),
    winRate,
    wins,
    bestStreak,
    volume,
    fees,
    builderFees,
    fundingNet,
    liqCount,
    bestCoins: coins.filter((c) => c.pnl > 0).sort((a, b) => b.pnl - a.pnl).slice(0, 3),
    cursed: coins.filter((c) => c.pnl < 0).sort((a, b) => a.pnl - b.pnl).slice(0, 3),
    favCoin,
    favHour: hours.indexOf(Math.max(...hours)),
    positions,
    archetype: archetypeFor({ pnl, fees, fundingNet, liqCount, winRate, tradeCount: trades.length, medianHold, favCoin: favCoin?.[0] ?? null }),
    medianHold,
    longestHold: byHold[0] ?? null,
    shortestHold: byHold.length > 1 ? byHold[byHold.length - 1] : null,
    capped: d.capped,
    firstTime: d.fills.length ? d.fills[0].time : null,
    fillCount: d.fills.length,
  };
}
