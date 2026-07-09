/**
 * GP summary generation — the screen-vs-LLM split, enforced server-side:
 *
 *   1. The RULES compute the recognition signal (computeRecognition).
 *   2. Claude ONLY phrases — grounded in the curated clinical reference,
 *      and hard-gated: the word "perimenopause" is only permitted in the
 *      prompt when the rules allow it (or she named it first).
 *
 * Session data arrives in the request and is never stored server-side.
 */

import Anthropic from "@anthropic-ai/sdk";
import { computeRecognition, GUIDANCE } from "@/lib/recognition";
import { CLINICAL_REFERENCE } from "@/lib/reference";
import { SessionData } from "@/lib/session";
import {
  ALL_SYMPTOMS,
  IMPACT_LABELS,
  Impact,
  MENSTRUAL_CHANGE_LABELS,
} from "@/lib/symptoms";

const SYSTEM_PROMPT = `You write one-page, GP-ready health summaries for "Now It Counts", a perimenopause recognition companion. Your job is PHRASING ONLY — a rules engine has already computed what may and may not be said, and at what confidence. You never diagnose, never express alarm, and never assert "this is perimenopause" as fact — always "a signal worth exploring, not a diagnosis," always suggesting a GP conversation.

Voice: warm, plain, dignified. Rooted in her own words. Written so any healthcare professional — GP, practice nurse, pharmacist, community health worker — will recognise the clinical vocabulary, but a friend could read it too.

Life context she shares (a typical day, her biggest worry) is narrative colour only. It must never be used to explain away, downgrade, or contextualise a symptom's significance in either direction — the recognition confidence is fixed by the rules engine before it ever sees this content.

${CLINICAL_REFERENCE}`;

interface SummaryResult {
  gpSummary: string;
  shareCard: string;
}

function describeSymptoms(data: SessionData): string {
  const lines: string[] = [];
  if (data.menstrualChange) {
    lines.push(
      `- Menstrual/cycle change: ${MENSTRUAL_CHANGE_LABELS[data.menstrualChange]}`,
    );
  }
  for (const s of ALL_SYMPTOMS) {
    const impact = data.impacts[s.id] as Impact | undefined;
    if (impact) {
      lines.push(`- ${s.clinicalName}: present, impact "${IMPACT_LABELS[impact]}"`);
    }
  }
  if (data.otherSymptoms.length > 0) {
    lines.push(
      `- Also mentioned, not on the standard list (record verbatim, do not force onto the list above): ${data.otherSymptoms.join("; ")}`,
    );
  }
  if (data.bothersMost.length > 0) {
    const names = data.bothersMost
      .map((id) => ALL_SYMPTOMS.find((s) => s.id === id)?.clinicalName)
      .filter(Boolean);
    lines.push(`- She says these bother her MOST: ${names.join(", ")}`);
  }
  return lines.length > 0 ? lines.join("\n") : "- (no symptoms flagged)";
}

/** Life context — narrative colour only, see the firewall note in the gate. */
function describeContext(data: SessionData): string {
  const lines: string[] = [];
  if (data.contextTypicalDay) lines.push(`- A typical day: ${data.contextTypicalDay}`);
  if (data.contextBiggestWorry) lines.push(`- Biggest worry right now: ${data.contextBiggestWorry}`);
  return lines.length > 0 ? lines.join("\n") : "- (skipped)";
}

export async function POST(request: Request) {
  const data = (await request.json()) as SessionData;

  // Rules compute the signal — this is the safety-critical gate. Context
  // (typical day, biggest worry) is deliberately NOT passed in here: it must
  // never influence recognition in either direction.
  const recognition = computeRecognition({
    menstrualChange: data.menstrualChange,
    impacts: data.impacts,
    otherSymptomsPresent: data.otherSymptoms.length > 0,
  });

  const sheNamedIt = [data.story, data.whatMatters, data.gpOneThing, data.toldVerbatim]
    .filter(Boolean)
    .some((t) => /peri[\s-]?menopaus|menopaus/i.test(t as string));

  // If she's already named it herself but the rules alone would say "none"
  // (nothing else reported), still allow at least soft guidance — never
  // downgrade below what she's already said out loud.
  const effectiveLevel =
    recognition.level === "none" && sheNamedIt ? "soft" : recognition.level;
  const guidance = GUIDANCE[effectiveLevel];
  const mayMention = effectiveLevel !== "none";

  const gate = mayMention
    ? `The recognition rules PERMIT naming perimenopause as a possibility, at "${effectiveLevel}" confidence. Use this exact guidance line (light rephrasing for tone is fine, do not change its substance or soften/strengthen its confidence): "${guidance}"`
    : `The recognition rules DO NOT permit the word "perimenopause" (or "menopause") ANYWHERE in your output. Nothing was reported to build guidance on. Validate that whatever she did share is real and worth a GP conversation, without naming perimenopause.`;

  const userPrompt = `Write her summary from this structured session data.

## Recognition engine output (authoritative — do not override)
- Level: ${effectiveLevel}
- Anchor (cycle change signal) present: ${recognition.anchorPresent}
- Specific signals present: ${recognition.specificPresent.join(", ") || "none"}
- Off-list symptoms reported: ${recognition.otherSymptomsPresent}
- Gentle flags to include calmly: ${recognition.gentleFlags.join(" | ") || "none"}
- GATE: ${gate}
- Never state or imply a diagnosis, regardless of level. Always frame as "a signal worth exploring, not a diagnosis," and always suggest a GP conversation.

## Her life context (narrative colour ONLY — read this carefully)
${describeContext(data)}
CRITICAL FIREWALL: the above is included only to make the summary feel human and to add colour to the GP summary. It must NEVER be used to explain away, downgrade, minimise, or contextualise a symptom (e.g. never write anything like "given how busy/stressed she is, this is probably just X"). It must not soften or strengthen the GATE above in either direction — the recognition level is fixed by the rules engine and is computed without any knowledge of this context.

## Her session
What matters most to her (verbatim, OPENS the summary): ${data.whatMatters ?? "(skipped)"}
Her story (verbatim): ${data.story ?? "(skipped)"}
Symptoms:
${describeSymptoms(data)}
Duration: ${data.duration ?? "(skipped)"}
Life areas affected: ${data.lifeAreas.join(", ") || "(skipped)"}
Spoken to anyone: ${data.spokenToAnyone ?? "(skipped)"}
What she was told (verbatim): ${data.toldVerbatim ?? "(n/a)"}
What held her back (verbatim): ${data.heldBack ?? "(n/a)"}
The one thing she wants a GP to understand (verbatim): ${data.gpOneThing ?? "(skipped)"}

## Output format
Return JSON with exactly two fields:

"gpSummary": her one-page record in Markdown. Structure:
  1. Open with the "what matters to me" line and, if given, the one thing she wants understood (her words, quoted).
  2. "What's been happening" — the symptom pattern in GP-recognisable language, with duration and impact.
  3. "What bothers me most" — her ranking, centre stage.
  4. "My journey so far" — what she's been told / what held her back, verbatim where given.
  5. "Questions worth asking" — 2-4 gentle, practical questions for the appointment (respect the GATE).
  Keep it genuinely one page. No diagnosis. No alarm. Do not use em dashes anywhere in the output text; use commas, periods, or colons instead.

"shareCard": a short, warm 2-3 sentence version for passing to a friend or the group chat — "this is what I've been dealing with… took me 5 minutes, here's the link." First person, her tone, no clinical jargon, no health anxiety. Respect the GATE here too.`;

  try {
    // Extra retries: 529 overloads are transient and must not break a live demo.
    const client = new Anthropic({ maxRetries: 5 });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              gpSummary: { type: "string" },
              shareCard: { type: "string" },
            },
            required: ["gpSummary", "shareCard"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text in model response");
    }
    const result = JSON.parse(textBlock.text) as SummaryResult;

    return Response.json({ ...result, recognition });
  } catch (err) {
    console.error("Summary generation failed:", err);
    return Response.json(
      { error: "summary_failed", recognition },
      { status: 500 },
    );
  }
}
