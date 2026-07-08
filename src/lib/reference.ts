/**
 * Curated reference doc that grounds the LLM when phrasing the GP summary.
 * The LLM never decides the signal — the rules engine does. This doc gives
 * Claude validated framing so the summary reads in language any healthcare
 * professional will recognise, without hallucination.
 *
 * Sources to verify before Day 2 pitch: NICE NG23 (menopause diagnosis and
 * management), NHS perimenopause guidance, MenoScale item framing.
 */

export const CLINICAL_REFERENCE = `
## Recognition framing (from NICE NG23 and NHS guidance — verify wording before pitch)

- NICE NG23 supports diagnosing perimenopause in women over 45 on the basis of
  vasomotor symptoms and irregular periods, WITHOUT laboratory tests.
  Menstrual/cycle change is the core criterion — especially relevant under 45,
  where symptoms are more often dismissed.
- Vasomotor symptoms = hot flushes and night sweats. When present alongside
  cycle change, these are the classic recognition pattern.
- Fatigue, brain fog, mood changes (anxiety, low mood, irritability) and sleep
  disruption are among the MOST COMMON perimenopausal symptoms but are
  non-specific alone — they overlap with thyroid dysfunction, depression,
  burnout, and anaemia. They must never be presented as diagnostic on their own.
- Joint/muscle aches, weight/bloating changes, and palpitations add supporting
  weight. Palpitations should be gently flagged as worth a check in their own
  right — calmly, never alarmingly.
- Perimenopause starts earlier for South Asian women (46–49 vs UK average 51)
  and lasts longer for Black women (~3.5 extra years), often presenting
  differently (e.g. joint pain rather than hot flushes). [Team to verify
  headline stats against a citable primary source before the pitch.]

## Language rules for the summary

- Describe patterns; never diagnose. Preferred formulation: "a pattern worth
  exploring with a GP" / "a signal worth exploring, not a diagnosis."
- Use the word "perimenopause" ONLY when the recognition engine allows it
  (anchor or specific signal present) or when she used the word herself first.
- Use her verbatim words in quotes where provided — they are the heart of the
  document.
- Terms a GP will recognise: "vasomotor symptoms", "menstrual irregularity",
  "cycle change", "symptom duration", "impact on daily functioning".
- Questions worth asking a GP (when a signal is present): whether symptoms
  could be perimenopausal; what the options are (lifestyle, HRT, non-hormonal);
  whether a symptom diary or MenoScale score would help the conversation.
- When NO signal is present: the summary should validate that her symptoms are
  real and worth taking seriously, suggest a GP conversation to explore causes
  (thyroid function, iron levels, mood, sleep), and NOT mention perimenopause.
- Never express alarm. Red-flag-adjacent items (e.g. palpitations) are noted
  calmly as "worth getting checked."
`;
