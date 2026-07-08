/**
 * Now It Counts — Recognition-first symptom set.
 *
 * Encodes the PRD Artifact exactly: 11 recognition symptoms across four roles,
 * chosen for RECOGNITION value, not severity coverage. This is deliberately
 * NOT MenoScale — MenoScale is an onward action, not the template.
 *
 * Wording is a draft — verify with community + a clinical read of NICE NG23.
 */

export type SymptomRole = "anchor" | "specific" | "dismissed" | "supporting";

/** Single impact scale — presence before depth; she rates only what she taps. */
export type Impact = "not_at_all" | "a_little" | "quite_a_bit" | "a_lot";

export const IMPACT_LABELS: Record<Impact, string> = {
  not_at_all: "Not at all",
  a_little: "A little",
  quite_a_bit: "Quite a bit",
  a_lot: "A lot",
};

/** Anchor answer options — NICE core criterion, asked in its own gentle moment. */
export type MenstrualChange =
  | "regular"
  | "irregular"
  | "heavier_or_lighter"
  | "closer_together"
  | "skipping"
  | "stopped"
  | "not_sure"
  | "prefer_not_to_say";

export const MENSTRUAL_CHANGE_LABELS: Record<MenstrualChange, string> = {
  regular: "Still regular",
  irregular: "Irregular",
  heavier_or_lighter: "Heavier or lighter",
  closer_together: "Closer together",
  skipping: "Skipping months",
  stopped: "Stopped",
  not_sure: "Not sure",
  prefer_not_to_say: "Prefer not to say",
};

/** Anchor answers that count as a genuine cycle-change signal. */
export const MENSTRUAL_CHANGE_SIGNAL: ReadonlySet<MenstrualChange> = new Set([
  "irregular",
  "heavier_or_lighter",
  "closer_together",
  "skipping",
  "stopped",
] as MenstrualChange[]);

export interface SymptomDef {
  id: string;
  role: SymptomRole;
  /** Behind-the-scenes clinical name (for the GP summary). */
  clinicalName: string;
  /** Exactly how it appears on screen — warm, conversational. */
  screenWording: string;
  /** Short friendly label for chips/rating rows. */
  shortLabel: string;
  /** Extra gentle flag shown/spoken when present (e.g. palpitations). */
  gentleFlag?: string;
}

/**
 * ANCHOR — the strongest single signal. Asked in its own gentle moment,
 * NOT skippable (though "prefer not to say" is always offered).
 * NICE core criterion — the linchpin, especially under 45.
 * MenoScale omits this; it's our diagnostic layer.
 */
export const ANCHOR: SymptomDef = {
  id: "menstrual_change",
  shortLabel: "Period changes",
  role: "anchor",
  clinicalName: "Menstrual / cycle change",
  screenWording: "Have your periods changed at all recently?",
};

/**
 * SPECIFIC SIGNALS — point clearly at perimenopause. Not the most common,
 * but when present they strongly suggest peri. Kept for diagnostic weight
 * and GP credibility.
 */
export const SPECIFIC: SymptomDef[] = [
  {
    id: "hot_flushes",
    shortLabel: "Hot flushes",
    role: "specific",
    clinicalName: "Hot flushes",
    screenWording: "Any sudden hot flushes?",
  },
  {
    id: "night_sweats",
    shortLabel: "Night sweats",
    role: "specific",
    clinicalName: "Night sweats",
    screenWording: "Waking up hot or drenched at night?",
  },
];

/**
 * THE DISMISSED CLUSTER — her emotional core. Most common and most
 * misattributed ("just stress"). LEAD the conversation with these.
 * They amplify a signal but do NOT create one alone.
 */
export const DISMISSED: SymptomDef[] = [
  {
    id: "fatigue",
    shortLabel: "Feeling drained",
    role: "dismissed",
    clinicalName: "Fatigue",
    screenWording: "Been feeling drained — exhausted, no energy?",
  },
  {
    id: "brain_fog",
    shortLabel: "Brain fog",
    role: "dismissed",
    clinicalName: "Brain fog / memory",
    screenWording: "Brain not quite keeping up — foggy, forgetful, losing words?",
  },
  {
    id: "mood",
    shortLabel: "Mood",
    role: "dismissed",
    clinicalName: "Mood (anxiety / low / irritable)",
    screenWording: "How's your head been — anxious, low, snappy, tearful?",
  },
  {
    id: "sleep",
    shortLabel: "Sleep",
    role: "dismissed",
    clinicalName: "Sleep problems",
    screenWording: "How's sleep — trouble getting to sleep, or waking in the night?",
  },
];

/**
 * SUPPORTING — add weight, worth including. Build the picture and matter
 * for the GP summary, but none alone says peri.
 */
export const SUPPORTING: SymptomDef[] = [
  {
    id: "joint_muscle_aches",
    shortLabel: "Aches & stiffness",
    role: "supporting",
    clinicalName: "Joint / muscle aches",
    screenWording: "Any joint or muscle aches or stiffness?",
  },
  {
    id: "weight_bloating",
    shortLabel: "Weight / bloating",
    role: "supporting",
    clinicalName: "Weight / bloating",
    screenWording: "Weight or bloating changes?",
  },
  {
    id: "palpitations",
    shortLabel: "Heart racing",
    role: "supporting",
    clinicalName: "Palpitations",
    screenWording: "Heart racing or fluttering?",
    gentleFlag: "Worth getting checked by a doctor either way — calmly, no rush.",
  },
];

/** All 11 recognition symptoms (anchor + 2 specific + 4 dismissed + 3 supporting). */
export const ALL_SYMPTOMS: SymptomDef[] = [ANCHOR, ...SPECIFIC, ...DISMISSED, ...SUPPORTING];

/**
 * Deliberately OUT of the recognition screen — real symptoms, but non-specific,
 * late-appearing, or intrusive. They lengthen the flow and cause drop-off
 * without helping recognition. May appear in a fuller view or the GP summary,
 * but they don't drive the signal.
 */
export const EXCLUDED_FROM_RECOGNITION = [
  "skin quality",
  "hair quality",
  "headaches",
  "strength / stamina",
  "vaginal dryness",
  "libido",
  "bladder problems",
] as const;
