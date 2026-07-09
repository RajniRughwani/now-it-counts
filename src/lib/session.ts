/**
 * Session data — lives in memory (and sessionStorage) only. No backend,
 * no accounts, one-tap deletion. Data minimisation by default.
 */

import { Impact, MenstrualChange } from "./symptoms";

export interface SessionData {
  consented: boolean;

  // Part 0 — context (optional, verbatim, STORAGE/summary only — see
  // recognition.ts: this must never feed the recognition signal).
  contextTypicalDay: string | null;
  contextBiggestWorry: string | null;

  // Part 1 — her story first (verbatim is research data)
  story: string | null;
  whatMatters: string | null; // opens her GP summary, verbatim

  // Part 2 — symptom check (presence before depth)
  menstrualChange: MenstrualChange | null;
  impacts: Record<string, Impact>;
  /** Anything she reported outside the defined symptom set, verbatim. */
  otherSymptoms: string[];
  bothersMost: string[]; // up to 2 symptom ids — the heart of her GP summary

  // Part 3 — duration & impact
  duration: string | null;
  lifeAreas: string[]; // work, home, relationships…

  // Part 4 — her healthcare journey (the novel data layer)
  spokenToAnyone: "yes" | "no" | null;
  toldVerbatim: string | null; // what she was told — unique data
  heldBack: string | null; // if she hasn't sought help — non-judgemental
  gpOneThing: string | null; // "if your GP could know just one thing…"

  // Part 5 — about her (equity layer, asked LAST, all skippable)
  ageBand: string | null;
  ethnicity: string | null;
  language: string | null;
  postcodeDistrict: string | null;
}

export const EMPTY_SESSION: SessionData = {
  consented: false,
  contextTypicalDay: null,
  contextBiggestWorry: null,
  story: null,
  whatMatters: null,
  menstrualChange: null,
  impacts: {},
  otherSymptoms: [],
  bothersMost: [],
  duration: null,
  lifeAreas: [],
  spokenToAnyone: null,
  toldVerbatim: null,
  heldBack: null,
  gpOneThing: null,
  ageBand: null,
  ethnicity: null,
  language: null,
  postcodeDistrict: null,
};

const KEY = "constella-session";

export function loadSession(): SessionData {
  if (typeof window === "undefined") return EMPTY_SESSION;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...EMPTY_SESSION, ...JSON.parse(raw) } : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

export function saveSession(data: SessionData) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — stay in memory only
  }
}

/** One-tap deletion — real, no reason needed. */
export function deleteEverything() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to delete
  }
}
