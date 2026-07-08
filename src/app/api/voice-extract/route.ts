/**
 * Turns a voice conversation transcript into the same structured SessionData
 * shape the text flow produces — so voice and text share one downstream path:
 * computeRecognition() (rules, safety-critical) + /api/summary (Claude phrases
 * only). This route only EXTRACTS what she explicitly said; it never decides
 * the recognition signal itself.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ALL_SYMPTOMS } from "@/lib/symptoms";

interface TranscriptTurn {
  role: "user" | "ai";
  text: string;
}

const SYMPTOM_IDS = ALL_SYMPTOMS.filter((s) => s.role !== "anchor").map((s) => s.id);

const SYSTEM_PROMPT = `You extract structured data from a transcript of a spoken health conversation. You do NOT diagnose, decide, or infer beyond what she explicitly said.

Safety-critical rule: only mark a symptom as reported if she clearly indicated it applies to HER — not just because the agent asked about it. A question with no clear "yes" is not a reported symptom. When in doubt, leave it out. This extraction feeds a rules engine that decides whether "perimenopause" may ever be mentioned to her — false positives here are a safety issue, not just a data-quality one.

Extract only what was actually said. Use null / empty arrays for anything not covered in the conversation.`;

export async function POST(request: Request) {
  const { transcript } = (await request.json()) as { transcript: TranscriptTurn[] };

  if (!transcript || transcript.length === 0) {
    return Response.json({ error: "empty_transcript" }, { status: 400 });
  }

  const transcriptText = transcript
    .map((t) => `${t.role === "user" ? "HER" : "AGENT"}: ${t.text}`)
    .join("\n");

  const client = new Anthropic({ maxRetries: 5 });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Transcript:\n\n${transcriptText}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              story: { type: ["string", "null"] },
              whatMatters: { type: ["string", "null"] },
              menstrualChange: {
                anyOf: [
                  {
                    type: "string",
                    enum: [
                      "regular",
                      "irregular",
                      "heavier_or_lighter",
                      "closer_together",
                      "skipping",
                      "stopped",
                      "not_sure",
                      "prefer_not_to_say",
                    ],
                  },
                  { type: "null" },
                ],
              },
              symptomsReported: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symptomId: { type: "string", enum: SYMPTOM_IDS },
                    impact: {
                      type: "string",
                      enum: ["not_at_all", "a_little", "quite_a_bit", "a_lot"],
                    },
                  },
                  required: ["symptomId", "impact"],
                  additionalProperties: false,
                },
              },
              bothersMost: {
                type: "array",
                items: { type: "string", enum: [...SYMPTOM_IDS, "menstrual_change"] },
              },
              duration: { type: ["string", "null"] },
              lifeAreas: { type: "array", items: { type: "string" } },
              spokenToAnyone: {
                anyOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }],
              },
              toldVerbatim: { type: ["string", "null"] },
              heldBack: { type: ["string", "null"] },
              gpOneThing: { type: ["string", "null"] },
              ageBand: { type: ["string", "null"] },
              ethnicity: { type: ["string", "null"] },
              language: { type: ["string", "null"] },
              postcodeDistrict: { type: ["string", "null"] },
            },
            required: [
              "story",
              "whatMatters",
              "menstrualChange",
              "symptomsReported",
              "bothersMost",
              "duration",
              "lifeAreas",
              "spokenToAnyone",
              "toldVerbatim",
              "heldBack",
              "gpOneThing",
              "ageBand",
              "ethnicity",
              "language",
              "postcodeDistrict",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text in extraction response");
    }
    const extracted = JSON.parse(textBlock.text);

    const impacts: Record<string, string> = {};
    for (const s of extracted.symptomsReported ?? []) {
      impacts[s.symptomId] = s.impact;
    }

    return Response.json({
      consented: true,
      story: extracted.story,
      whatMatters: extracted.whatMatters,
      menstrualChange: extracted.menstrualChange,
      impacts,
      bothersMost: extracted.bothersMost ?? [],
      duration: extracted.duration,
      lifeAreas: extracted.lifeAreas ?? [],
      spokenToAnyone: extracted.spokenToAnyone,
      toldVerbatim: extracted.toldVerbatim,
      heldBack: extracted.heldBack,
      gpOneThing: extracted.gpOneThing,
      ageBand: extracted.ageBand,
      ethnicity: extracted.ethnicity,
      language: extracted.language,
      postcodeDistrict: extracted.postcodeDistrict,
    });
  } catch (err) {
    console.error("Voice transcript extraction failed:", err);
    return Response.json({ error: "extraction_failed" }, { status: 500 });
  }
}
