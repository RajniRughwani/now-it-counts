/**
 * Health summary generation — the screen-vs-LLM split, enforced server-side:
 *
 *   1. The RULES compute the recognition signal (computeRecognition) and the
 *      entire record card (buildRecordCard) — deterministic, no LLM.
 *   2. Claude generates ONLY the "for the group chat" share card. Everything
 *      else on the card (the actual medical-adjacent content) is built from
 *      a fixed template + a fixed recommendation table, never freely
 *      generated, so first-person voice, no-diagnosis language, and reading
 *      level are guaranteed by construction rather than by prompting alone.
 *
 * Session data arrives in the request and is never stored server-side.
 */

import Anthropic from "@anthropic-ai/sdk";
import { computeRecognition, GUIDANCE } from "@/lib/recognition";
import { buildRecordCard, RecordCardData } from "@/lib/recordCard";
import { SessionData } from "@/lib/session";

const SHARE_CARD_SYSTEM_PROMPT = `You write a single short "share with a friend" message for "DOT", a perimenopause recognition companion. This is the ONLY free-generated text in the whole product; everything else on her record is a fixed template.

Hard rules, no exceptions:
- First person only. Never "she", "her", "her account" — this is HER own message, written as if she wrote it herself.
- Never diagnose. Never say "you have perimenopause", "you're suffering from", or "it's likely you have" — those exact patterns and anything equivalent are banned.
- No clinical jargon, no health anxiety, warm and plain, reading age around 9-11.
- 2-3 sentences, e.g. "This is what I've been dealing with, took me 5 minutes, here's the link."`;

interface ShareCardResult {
  shareCard: string;
}

async function generateShareCard(
  data: SessionData,
  gate: string,
): Promise<string | null> {
  const userPrompt = `Write her share-with-a-friend message from this structured session data.

GATE (authoritative, do not override): ${gate}

What matters most to her (verbatim): ${data.whatMatters ?? "(skipped)"}
Her story (verbatim): ${data.story ?? "(skipped)"}
The one thing she wants a healthcare practitioner to understand (verbatim): ${data.gpOneThing ?? "(skipped)"}

Return JSON with one field, "shareCard", containing only the message text. Do not use em dashes; use commas, periods, or colons instead.`;

  try {
    const client = new Anthropic({ maxRetries: 5 });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: SHARE_CARD_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { shareCard: { type: "string" } },
            required: ["shareCard"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const result = JSON.parse(textBlock.text) as ShareCardResult;
    return result.shareCard;
  } catch (err) {
    // The share card is a nice-to-have, not the record itself — a failure
    // here must never take down the whole summary.
    console.error("Share card generation failed:", err);
    return null;
  }
}

export interface SummaryResponse {
  card: RecordCardData;
  shareCard: string | null;
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
    ? `Perimenopause may be named as a possibility, at "${effectiveLevel}" confidence. If you reference it, stay consistent with this line (do not strengthen or soften it): "${guidance}"`
    : `Do NOT use the word "perimenopause" or "menopause" anywhere in your output. Nothing was reported to build guidance on.`;

  // The card itself never touches an LLM — it cannot fail the way a
  // generation call can, so it's computed first and unconditionally.
  const card = buildRecordCard(data, recognition);
  const shareCard = await generateShareCard(data, gate);

  const body: SummaryResponse = { card, shareCard };
  return Response.json(body);
}
