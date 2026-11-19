// ---------- Hyperliquid Info API shapes (only the fields we use) ----------

export interface Fill {
  coin: string;
  px: string;
  sz: string;
  /** "B" = buy, "A" = sell */
  side: "B" | "A";
  time: number;
  /** signed position size before this fill */
  startPosition: string;
  dir?: string;
  closedPnl: string;
  fee: string;
  feeToken?: string;
  builderFee?: string;
  tid?: number;
  hash?: string;
  oid?: number;
  liquidation?: { liquidatedUser?: string; markPx?: string; method?: string };
}

export interface FundingEntry {
  time: number;
  delta: { type?: string; coin: string; usdc: string; szi?: string; fundingRate?: string };
}

/** [timestamp, value-as-string] */
export type HistoryPoint = [number, string];

export type Portfolio = Array<[string, { pnlHistory?: HistoryPoint[]; accountValueHistory?: HistoryPoint[]; vlm?: string }]>;

export interface AssetPosition {
  position: {
    coin: string;
    szi: string;
    entryPx: string;
    unrealizedPnl: string;
    positionValue?: string;
    liquidationPx?: string | null;
    leverage?: { value: number };
  };
}

export interface ClearinghouseState {
  assetPositions: AssetPosition[];
}

export interface SpotMeta {
  tokens: Array<{ name: string }>;
  universe: Array<{ name: string; tokens: [number, number]; index: number }>;
}

export interface Candle {
  t: number;
  h: string | number;
  l: string | number;
}

export type InfoRequest =
  | { type: "userFillsByTime"; user: string; startTime: number; endTime?: number; aggregateByTime?: boolean }
  | { type: "userFunding"; user: string; startTime: number; endTime?: number }
  | { type: "portfolio"; user: string }
  | { type: "clearinghouseState"; user: string }
  | { type: "spotMeta" }
  | { type: "candleSnapshot"; req: { coin: string; interval: string; startTime: number; endTime: number } };

/** Anything that answers Info API requests: the real API, or the demo generator. */
export type InfoFn = (body: InfoRequest) => Promise<any>;

export type Progress = (fraction: number, message: string) => void;

// ---------- Our own model ----------

export interface RawAccount {
  user: string;
  fills: Fill[];
  funding: FundingEntry[];
  portfolio: Portfolio | null;
  state: ClearinghouseState | null;
  spotNames: Record<string, string>;
  /** true when we hit Hyperliquid's 10k-fill history limit */
  capped: boolean;
}

/** One position lifecycle: from flat (or first seen) back to flat, or until it flips. */
export interface Trade {
  coin: string;
  name: string;
  /** 1 = long, -1 = short */
  side: 1 | -1;
  openTime: number;
  closeTime?: number;
  /** realized pnl minus fees */
  pnl: number;
  inSz: number;
  inNotional: number;
  outSz: number;
  outNotional: number;
  maxSz: number;
  entry?: number;
  exit?: number;
  liq: boolean;
}

export interface CoinStat {
  name: string;
  pnl: number;
  vol: number;
  trades: number;
}

export interface OpenPosition {
  name: string;
  szi: number;
  entry: number;
  upnl: number;
  lev?: number;
  liq: number | null;
  value: number;
}

export interface Stats {
  user: string;
  pnl: number;
  /** pnl relative to the most ever deposited; null if unknown */
  roi: number | null;
  basis: number;
  series: Array<[number, number]>;
  trades: Trade[];
  sortedTrades: Trade[];
  winRate: number;
  wins: number;
  bestStreak: number;
  volume: number;
  fees: number;
  builderFees: number;
  fundingNet: number;
  liqCount: number;
  bestCoins: CoinStat[];
  cursed: CoinStat[];
  favCoin: [string, number] | null;
  favHour: number;
  positions: OpenPosition[];
  archetype: [title: string, blurb: string];
  medianHold: number;
  capped: boolean;
  firstTime: number | null;
  fillCount: number;
}

export interface Miss {
  trade: Trade;
  /** the best price reached within 30 days of the exit */
  ext: number;
  missed: number;
}

export interface Card {
  name: string;
  cv: HTMLCanvasElement;
}
