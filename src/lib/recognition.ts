/**
 * Constella — the recognition rule (safety-critical).
 *
 * Rules compute the signal; the LLM only phrases. Non-hallucinating by design.
 *
 * Recognition only surfaces "this looks like perimenopause" when she has the
 * ANCHOR (period changes) OR a SPECIFIC signal (hot flushes / night sweats).
 * The dismissed cluster amplifies a signal but must never create one alone —
 * those symptoms without a peri-specific signal are genuinely ambiguous
 * (thyroid, depression, burnout, anaemia).
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

/** What she reported: presence + impact for each symptom she tapped. */
export interface SymptomReport {
  /** Anchor answer — always collected (may be "prefer_not_to_say"). */
  menstrualChange: MenstrualChange | null;
  /** symptom id -> impact, only for symptoms she said are present. */
  impacts: Record<string, Impact>;
}

export type RecognitionLevel =
  | "signal" // anchor or specific present — worth exploring with a GP
  | "ambiguous" // dismissed/supporting only — real, but genuinely ambiguous
  | "minimal"; // little or nothing reported

export interface RecognitionResult {
  level: RecognitionLevel;
  anchorPresent: boolean;
  specificPresent: string[]; // ids of specific signals present
  dismissedPresent: string[]; // ids — amplify only, never create
  supportingPresent: string[]; // ids — add weight, never create
  /**
   * True only when level === "signal". This is THE gate the UI and the
   * summary prompt must respect: perimenopause is never named as a
   * possibility unless this is true (unless she names it first).
   */
  mayMentionPerimenopause: boolean;
  /** Non-alarming flags to carry into the GP summary (e.g. palpitations). */
  gentleFlags: string[];
}

const SPECIFIC_IDS = new Set(SPECIFIC.map((s) => s.id));
const DISMISSED_IDS = new Set(DISMISSED.map((s) => s.id));
const SUPPORTING_IDS = new Set(SUPPORTING.map((s) => s.id));

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

  // THE RULE: anchor OR specific creates a signal. Nothing else can.
  const hasSignal = anchorPresent || specificPresent.length > 0;
  const hasAnything =
    hasSignal || dismissedPresent.length > 0 || supportingPresent.length > 0;

  const level: RecognitionLevel = hasSignal
    ? "signal"
    : hasAnything
      ? "ambiguous"
      : "minimal";

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
    mayMentionPerimenopause: level === "signal",
    gentleFlags,
  };
}
