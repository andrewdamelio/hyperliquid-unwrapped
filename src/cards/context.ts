import type { Miss, Stats } from "../types";
import type { Mood } from "../moods";

/** Everything a card renderer needs. */
export interface DeckContext {
  S: Stats;
  miss: Miss | null;
  mood: Mood;
  /** 0–1 flashiness of the overall mood */
  k: number;
  /** per-address seed so cards look the same every time */
  seed: number;
  /** seeded random for picking quips */
  r: () => number;
}
