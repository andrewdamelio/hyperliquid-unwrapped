import { DAY, HOUR, dur } from "../format";

const MEMES = /^(k?PEPE|k?BONK|WIF|k?SHIB|DOGE|POPCAT|BRETT|MEW|k?FLOKI|FARTCOIN|TURBO|PNUT|GOAT|MOODENG|PENGU|TRUMP|SPX|k?NEIRO|CHILLGUY|BOME|MEME)$/i;

export interface ArchetypeInput {
  pnl: number;
  fees: number;
  fundingNet: number;
  liqCount: number;
  winRate: number;
  tradeCount: number;
  medianHold: number;
  favCoin: string | null;
}

/** First matching rule wins, so order = priority. */
export function archetypeFor(s: ArchetypeInput): [string, string] {
  const rules: Array<[boolean, [string, string]]> = [
    [s.liqCount >= 3, ["The Liquidation Speedrunner", `${s.liqCount} liquidations. The engine knows you by name.`]],
    [s.fees > Math.abs(s.pnl) && s.fees > 100, ["The Fee Donor", "Validators thank you for your service."]],
    [s.fundingNet > Math.abs(s.pnl) * 0.3 && s.fundingNet > 100, ["The Funding Farmer", "Gets paid to wait. Annoyingly smart."]],
    [!!s.favCoin && MEMES.test(s.favCoin), ["The Memecoin Mercenary", `Most traded: ${s.favCoin}. No further questions.`]],
    [s.winRate >= 0.65 && s.tradeCount >= 10, ["The Sniper", `${Math.round(s.winRate * 100)}% win rate. Suspiciously good.`]],
    [s.medianHold > 0 && s.medianHold < HOUR, ["The Paper Hands", `Median hold: ${dur(s.medianHold)}. Commitment issues.`]],
    [s.medianHold > 7 * DAY, ["The Diamond Hands", `Median hold: ${dur(s.medianHold)}. Touch grass? Never.`]],
    [s.winRate < 0.35 && s.tradeCount >= 10, ["The Contrarian Indicator", "Do the opposite of this wallet."]],
  ];
  return rules.find(([hit]) => hit)?.[1] ?? ["The Coin Flipper", "Wins some, loses some, pays fees on all of it."];
}
