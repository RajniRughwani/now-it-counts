/**
 * DOT — assembles the structured data behind the /summary record card.
 *
 * Everything here is computed deterministically from session data and the
 * recognition result — no LLM involved. The only LLM-generated piece of the
 * whole summary experience is the "For the group chat" share card, kept
 * separate (see /api/summary/route.ts). Fixed templates and a fixed
 * recommendation table (recommendations.ts) instead of free generation
 * means the reading-age-9-11, first-person, no-diagnosis-language rules
 * are guaranteed by construction, not by hoping an LLM follows instructions.
 */

import { RecognitionResult } from "./recognition";
import { computeRecommendations, Recommendation } from "./recommendations";
import { detectRedFlags, RedFlagMatch } from "./redFlags";
import { SessionData } from "./session";
import {
  ALL_SYMPTOMS,
  Impact,
  MENSTRUAL_CHANGE_LABELS,
  SymptomDef,
} from "./symptoms";

export interface SymptomLine {
  label: string;
  frequency: string;
  duration: string;
}

export interface ClinicianRow {
  term: string;
  detail: string;
}

export interface Acknowledgement {
  variant: "normal" | "amber";
  text: string;
}

export interface RecordCardData {
  acknowledgement: Acknowledgement;
  gpOneThing: string | null;
  symptomLines: SymptomLine[];
  lifeImpactLine: string | null;
  clinicianRows: ClinicianRow[];
  ageBand: string | null;
  previouslySeen: boolean | null;
  recommendations: Recommendation[];
  redFlags: RedFlagMatch[];
  date: string;
}

const FREQUENCY_BY_IMPACT: Record<Impact, string> = {
  a_lot: "Most days",
  quite_a_bit: "Often",
  a_little: "Sometimes",
  not_at_all: "Rarely",
};

const DURATION_SHORT: Record<string, string> = {
  "A few weeks": "~weeks",
  "A few months": "~months",
  "About a year": "~1 yr",
  "A couple of years": "~2 yrs",
  "Several years": "~years",
  "Hard to say": "duration unclear",
};

function shortDuration(duration: string | null): string {
  if (!duration) return "duration not shared";
  return DURATION_SHORT[duration] ?? duration;
}

function topSymptomPhrase(data: SessionData, recognition: RecognitionResult): string | null {
  const ids =
    data.bothersMost.length > 0
      ? data.bothersMost
      : [
          ...(recognition.anchorPresent ? ["menstrual_change"] : []),
          ...recognition.specificPresent,
          ...recognition.dismissedPresent,
        ].slice(0, 2);

  const labels = ids
    .map((id) =>
      id === "menstrual_change"
        ? "period changes"
        : ALL_SYMPTOMS.find((s) => s.id === id)?.shortLabel?.toLowerCase(),
    )
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) return null;
  return labels.join(" and ");
}

function buildAcknowledgement(
  data: SessionData,
  recognition: RecognitionResult,
  redFlags: RedFlagMatch[],
): Acknowledgement {
  if (redFlags.length > 0) {
    return {
      variant: "amber",
      text: `Thank you for sharing this. One thing you mentioned, ${redFlags[0].label}, is something doctors want to know about promptly. It's usually treatable, but please book an appointment soon rather than waiting.`,
    };
  }

  const phrase = topSymptomPhrase(data, recognition);
  const ageClause = data.ageBand ? `women in the ${data.ageBand} range` : "women your age";
  const whatClause = phrase ? `What you describe, particularly ${phrase},` : "What you describe";

  return {
    variant: "normal",
    text: `Thank you for sharing this. ${whatClause} matches patterns many ${ageClause} tell us about during perimenopause. You are not going crazy, and you're not making a fuss, this is worth a proper conversation. You are not alone.`,
  };
}

function buildSymptomLines(data: SessionData): SymptomLine[] {
  const duration = shortDuration(data.duration);
  const impactRank: Record<Impact, number> = {
    a_lot: 3,
    quite_a_bit: 2,
    a_little: 1,
    not_at_all: 0,
  };

  const defined: SymptomLine[] = [];

  if (data.menstrualChange && data.menstrualChange !== "regular" && data.menstrualChange !== "prefer_not_to_say") {
    defined.push({
      label: MENSTRUAL_CHANGE_LABELS[data.menstrualChange],
      frequency: "Every cycle",
      duration,
    });
  }

  const rankedSymptoms = ALL_SYMPTOMS.filter((s: SymptomDef) => s.role !== "anchor")
    .map((s) => ({ symptom: s, impact: data.impacts[s.id] }))
    .filter((x): x is { symptom: SymptomDef; impact: Impact } => x.impact !== undefined)
    .sort((a, b) => impactRank[b.impact] - impactRank[a.impact]);

  for (const { symptom, impact } of rankedSymptoms) {
    defined.push({
      label: symptom.shortLabel,
      frequency: FREQUENCY_BY_IMPACT[impact],
      duration,
    });
  }

  const offList: SymptomLine[] = data.otherSymptoms.map((text) => ({
    label: text,
    frequency: "Mentioned",
    duration,
  }));

  return [...defined, ...offList];
}

function buildClinicianRows(data: SessionData): ClinicianRow[] {
  const duration = shortDuration(data.duration);
  const rows: ClinicianRow[] = [];

  if (data.menstrualChange && data.menstrualChange !== "prefer_not_to_say") {
    rows.push({
      term: "Menstrual / cycle change",
      detail: `${MENSTRUAL_CHANGE_LABELS[data.menstrualChange]}, ${duration}`,
    });
  }

  const impactLabel: Record<Impact, string> = {
    a_lot: "severe",
    quite_a_bit: "moderate",
    a_little: "mild",
    not_at_all: "not present",
  };

  for (const s of ALL_SYMPTOMS) {
    const impact = data.impacts[s.id] as Impact | undefined;
    if (impact) {
      rows.push({ term: s.clinicalName, detail: `${duration}, ${impactLabel[impact]}` });
    }
  }

  return rows;
}

function buildLifeImpactLine(data: SessionData): string | null {
  if (data.lifeAreas.length === 0) return null;
  return `This has been affecting my ${data.lifeAreas.join(", ")}.`;
}

export function buildRecordCard(data: SessionData, recognition: RecognitionResult): RecordCardData {
  const freeText = [
    data.story,
    data.whatMatters,
    data.gpOneThing,
    data.toldVerbatim,
    data.heldBack,
    ...data.otherSymptoms,
  ]
    .filter(Boolean)
    .join("\n");

  const redFlags = detectRedFlags(freeText);

  // Red flags reorder "What would help you" with booking first — never
  // silently folded into the regular recommendation ordering.
  const recommendations =
    redFlags.length > 0
      ? [
          {
            id: "book-soon",
            text: "Book an appointment soon rather than waiting, this is worth checking promptly.",
          },
          ...computeRecommendations(data),
        ].slice(0, 4)
      : computeRecommendations(data);

  return {
    acknowledgement: buildAcknowledgement(data, recognition, redFlags),
    gpOneThing: data.gpOneThing,
    symptomLines: buildSymptomLines(data),
    lifeImpactLine: buildLifeImpactLine(data),
    clinicianRows: buildClinicianRows(data),
    ageBand: data.ageBand,
    previouslySeen: data.spokenToAnyone === null ? null : data.spokenToAnyone === "yes",
    recommendations,
    redFlags,
    date: new Date().toISOString().slice(0, 10),
  };
}
