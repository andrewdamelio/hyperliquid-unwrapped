import type { Fill, FundingEntry, InfoFn, InfoRequest, Portfolio, ClearinghouseState, Progress, RawAccount, SpotMeta } from "../types";

export const INFO_URL = "https://api.hyperliquid.xyz/info";

/** Hyperliquid caps userFillsByTime responses at 2000 and only serves the most recent 10k fills. */
const FILLS_PAGE = 2000;
const FILLS_MAX_PAGES = 5;
/** userFunding responses are capped at 500. */
const FUNDING_PAGE = 500;
const FUNDING_MAX_PAGES = 20;

const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Real Info API client with a simple back-off on rate limiting. */
export function createInfoClient(fetchImpl: typeof fetch = fetch.bind(globalThis), url = INFO_URL): InfoFn {
  const info = async (body: InfoRequest, attempt = 0): Promise<any> => {
    const r = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 429 && attempt < 4) {
      await sleep(1200 * (attempt + 1));
      return info(body, attempt + 1);
    }
    if (!r.ok) throw new Error(`Hyperliquid API returned ${r.status}`);
    return r.json();
  };
  return (body) => info(body);
}

/** Page forward through a time-ordered endpoint until a short page comes back. */
async function paginate<T extends { time: number }>(
  fetchPage: (startTime: number) => Promise<T[]>,
  startTime: number,
  pageSize: number,
  maxPages: number,
  onPage?: (total: number, page: number) => void,
): Promise<{ items: T[]; capped: boolean }> {
  const items: T[] = [];
  let start = startTime;
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchPage(start);
    if (!Array.isArray(page) || !page.length) return { items, capped: false };
    items.push(...page);
    onPage?.(items.length, i);
    if (page.length < pageSize) return { items, capped: false };
    start = Math.max(...page.map((x) => x.time)) + 1;
  }
  return { items, capped: true };
}

function dedupeFills(fills: Fill[]): Fill[] {
  const seen = new Set<string>();
  return fills
    .filter((f) => {
      const k = f.tid != null ? String(f.tid) : `${f.hash}${f.oid}${f.time}${f.px}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.time - b.time);
}

/** Pull everything we need for one address. */
export async function fetchAccount(user: string, info: InfoFn, progress: Progress = () => {}): Promise<RawAccount> {
  progress(0.05, "Pulling your fills…");
  const { items: rawFills, capped } = await paginate<Fill>(
    (startTime) => info({ type: "userFillsByTime", user, startTime, aggregateByTime: true }),
    0,
    FILLS_PAGE,
    FILLS_MAX_PAGES,
    (total, i) => progress(0.08 + i * 0.1, `Pulling your fills… ${total.toLocaleString()}`),
  );
  const fills = dedupeFills(rawFills);

  progress(0.6, "Consulting the funding gods…");
  const { items: funding } = await paginate<FundingEntry>(
    (startTime) => info({ type: "userFunding", user, startTime }),
    fills.length ? fills[0].time : 0,
    FUNDING_PAGE,
    FUNDING_MAX_PAGES,
  );

  progress(0.72, "Counting the damage…");
  const [portfolio, state] = await Promise.all([
    info({ type: "portfolio", user }).catch(() => null) as Promise<Portfolio | null>,
    info({ type: "clearinghouseState", user }).catch(() => null) as Promise<ClearinghouseState | null>,
  ]);

  // Spot fills use "@123" style names; resolve them to token names.
  const spotNames: Record<string, string> = {};
  if (fills.some((f) => f.coin.startsWith("@"))) {
    try {
      const sm: SpotMeta = await info({ type: "spotMeta" });
      for (const u of sm.universe) spotNames[u.name] = sm.tokens[u.tokens[0]]?.name ?? u.name;
    } catch {
      /* names fall back to raw ids */
    }
  }

  return { user, fills, funding, portfolio, state, spotNames, capped: capped || rawFills.length >= FILLS_PAGE * FILLS_MAX_PAGES };
}
