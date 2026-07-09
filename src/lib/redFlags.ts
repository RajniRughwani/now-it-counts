/**
 * DOT — red-flag detection (safety-critical, best-effort).
 *
 * These four patterns (NICE red flags for possible gynaecological cancer)
 * are NOT currently asked as dedicated questions in either the voice or text
 * flow — there is no structured field for them. Until that's added, this is
 * a best-effort keyword match over whatever free text she's given (her
 * story, what matters to her, what she was told, anything off-list). This
 * WILL miss red flags described in words that don't match these patterns —
 * it is not a substitute for a dedicated question and should be replaced by
 * one. Never invert this: only ADD an amber flag on a match, never suppress
 * or downgrade a flag because of anything else in the text.
 */

export interface RedFlagMatch {
  id: string;
  /** Short human label used in the amber acknowledgement message. */
  label: string;
}

const RED_FLAG_PATTERNS: { id: string; label: string; pattern: RegExp }[] = [
  {
    id: "post_coital_bleeding",
    label: "bleeding after sex",
    pattern: /bleed(?:ing)?\s+(after|during)\s+sex|bleed(?:ing)?\s+after\s+intercourse/i,
  },
  {
    id: "intermenstrual_bleeding",
    label: "bleeding between periods",
    pattern: /(bleed(?:ing)?|spotting)\s+between\s+(my\s+)?periods|soak(?:ing|ed)?\s+through.*hour/i,
  },
  {
    id: "postmenopausal_bleeding",
    label: "bleeding after periods had stopped",
    pattern: /bleed(?:ing)?\s+again\s+after|bleed(?:ing)?\s+(a\s+)?(year|\d+\s*months?)\s+after.*(stopped|no periods)|periods?\s+(had\s+)?stopped.*(now\s+)?bleed/i,
  },
  {
    id: "unexplained_weight_loss",
    label: "unexplained weight loss",
    pattern: /(lost|losing)\s+weight\s+(without trying|unexpectedly|for no reason|and (don'?t|do not) know why)|unexplained weight loss/i,
  },
];

export function detectRedFlags(freeText: string): RedFlagMatch[] {
  const matches: RedFlagMatch[] = [];
  for (const rf of RED_FLAG_PATTERNS) {
    if (rf.pattern.test(freeText)) matches.push({ id: rf.id, label: rf.label });
  }
  return matches;
}
