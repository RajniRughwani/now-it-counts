/**
 * Now It Counts — the recognition rule (safety-critical).
 *
 * Rules compute the signal; the LLM only phrases. Non-hallucinating by design.
 *
 * Recognition ALWAYS gives guidance (never silence, never diagnosis) — but
 * the CONFIDENCE of the language scales with what's present:
 *
 *   - "confident": she has a CORE signal — the anchor (period changes) OR a
 *     specific signal (hot flushes / night sweats). Worth exploring with a GP.
 *   - "soft": no core signal, but SOMETHING was reported — dismissed cluster,
 *     supporting symptoms, and/or symptoms outside the defined set. These are
 *     genuinely ambiguous alone (could be thyroid, mood, sleep, anaemia), so
 *     the guidance is hedged ("among other things") rather than confident,
 *     but perimenopause is still named as a possibility worth raising.
 *   - "none": nothing at all was reported — nothing to build guidance on.
 *
 * Life context (typical day, biggest worry) is NEVER passed into this
 * function and must never affect the signal in either direction — that's
 * the firewall between recording and recognition. See SymptomReport below:
 * it deliberately has no field for context, so it structurally can't leak in.
 *
 * Always "a signal worth exploring, not a diagnosis."
 */

import {
  DISMISSED,
  Impact,
  MENSTRUAL_CHANGE_SIGNAL,
  MenstrualChange,
  SPECIFIC,
  SUPPORTING,
} from "./symptoms";

/** What she reported: presence + impact for each symptom she tapped or named. */
export interface SymptomReport {
  /** Anchor answer — always collected (may be "prefer_not_to_say"). */
  menstrualChange: MenstrualChange | null;
  /** symptom id -> impact, only for symptoms she said are present. */
  impacts: Record<string, Impact>;
  /**
   * Did she report ANY symptom outside the defined set (urinary, headaches,
   * skin, or anything else, captured verbatim elsewhere)? These can push
   * the level from "none" to "soft" but can NEVER create "confident" —
   * only a core signal can do that.
   */
  otherSymptomsPresent?: boolean;
}

export type RecognitionLevel =
  | "confident" // core (anchor or specific) present — worth exploring with a GP
  | "soft" // dismissed/supporting/off-list only — real, but genuinely ambiguous
  | "none"; // nothing reported — nothing to build guidance on

export interface RecognitionResult {
  level: RecognitionLevel;
  anchorPresent: boolean;
  specificPresent: string[]; // ids of specific signals present
  dismissedPresent: string[]; // ids — amplify only, never create
  supportingPresent: string[]; // ids — add weight, never create
  otherSymptomsPresent: boolean;
  /**
   * True whenever level !== "none". This is THE gate the UI and the summary
   * prompt must respect: perimenopause may only be named as a possibility
   * when this is true (or she names it first) — but note it's now true for
   * BOTH "confident" and "soft" levels. The confidence distinction lives in
   * `guidance` below, not in whether perimenopause may be mentioned at all.
   */
  mayMentionPerimenopause: boolean;
  /**
   * The exact, rules-authored guidance line for this level. The summary/voice
   * LLM must use this verbatim (light rephrasing for tone is fine, changing
   * the substance or confidence is not) — this is the hard gate against
   * drifting into diagnosis language or overstating/understating confidence.
   */
  guidance: string;
  /** Non-alarming flags to carry into the GP summary (e.g. palpitations). */
  gentleFlags: string[];
}

const SPECIFIC_IDS = new Set(SPECIFIC.map((s) => s.id));
const DISMISSED_IDS = new Set(DISMISSED.map((s) => s.id));
const SUPPORTING_IDS = new Set(SUPPORTING.map((s) => s.id));

export const GUIDANCE: Record<RecognitionLevel, string> = {
  confident:
    "This pattern is consistent with perimenopause: worth exploring with your GP.",
  soft:
    "These symptoms can sometimes relate to perimenopause, among other things: worth raising with your GP to look into properly.",
  none: "Not enough was shared to point to a pattern, but if anything felt off, it's worth mentioning to your GP.",
};

/** A symptom counts as present if she tapped it, whatever the impact rating. */
function presentIds(report: SymptomReport, ids: Set<string>): string[] {
  return Object.keys(report.impacts).filter((id) => ids.has(id));
}

export function computeRecognition(report: SymptomReport): RecognitionResult {
  const anchorPresent =
    report.menstrualChange !== null &&
    MENSTRUAL_CHANGE_SIGNAL.has(report.menstrualChange);

  const specificPresent = presentIds(report, SPECIFIC_IDS);
  const dismissedPresent = presentIds(report, DISMISSED_IDS);
  const supportingPresent = presentIds(report, SUPPORTING_IDS);
  const otherSymptomsPresent = report.otherSymptomsPresent ?? false;

  // THE RULE: anchor OR specific creates confident guidance. Nothing else can.
  const hasCore = anchorPresent || specificPresent.length > 0;
  const hasAnything =
    hasCore ||
    dismissedPresent.length > 0 ||
    supportingPresent.length > 0 ||
    otherSymptomsPresent;

  const level: RecognitionLevel = hasCore
    ? "confident"
    : hasAnything
      ? "soft"
      : "none";

  const gentleFlags: string[] = [];
  for (const s of SUPPORTING) {
    if (s.gentleFlag && report.impacts[s.id]) gentleFlags.push(s.gentleFlag);
  }

  return {
    level,
    anchorPresent,
    specificPresent,
    dismissedPresent,
    supportingPresent,
    otherSymptomsPresent,
    mayMentionPerimenopause: level !== "none",
    guidance: GUIDANCE[level],
    gentleFlags,
  };
}
