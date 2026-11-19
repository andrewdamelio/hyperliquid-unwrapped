import type { Card, Miss, Stats } from "../types";
import type { DeckContext } from "./context";
import { MOODS, moodFor, type MoodKey } from "../moods";
import { hashStr, rng } from "../format";
import { pnlCard } from "./pnl";
import { archetypeCard } from "./archetype";
import { bestTradeCard, worstTradeCard } from "./trade";
import { bestAssetsCard, cursedAssetsCard } from "./assets";
import { missCard } from "./miss";
import { bagsCard } from "./bags";
import { receiptsCard } from "./receipts";

/** Deck order. A renderer returns null to skip its card (e.g. no open positions). */
const DECK: Array<(c: DeckContext) => Card | null> = [
  pnlCard,
  archetypeCard,
  bestTradeCard,
  worstTradeCard,
  bestAssetsCard,
  cursedAssetsCard,
  missCard,
  bagsCard,
  receiptsCard,
];

export function buildDeck(S: Stats, miss: Miss | null): { cards: Card[]; moodKey: MoodKey; k: number } {
  const seed = hashStr(S.user);
  const [moodKey, k] = moodFor(S);
  const ctx: DeckContext = { S, miss, mood: MOODS[moodKey], k, seed, r: rng(seed) };
  const cards = DECK.map((render) => render(ctx)).filter((c): c is Card => c !== null);
  return { cards, moodKey, k };
}
