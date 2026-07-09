import { describe, expect, it } from "vitest";
import { computeRecognition } from "./recognition";
import { buildRecordCard } from "./recordCard";
import { EMPTY_SESSION, SessionData } from "./session";

const session = (overrides: Partial<SessionData>): SessionData => ({
  ...EMPTY_SESSION,
  ...overrides,
});

const BANNED = /\bshe\b|\bher\b|suffering|likely you have/i;

describe("buildRecordCard (deterministic, no LLM)", () => {
  it("full persona: perimenopausal age, zero-hours worker, heavy periods + fatigue + night sweats + brain fog", () => {
    const data = session({
      ageBand: "45–49",
      menstrualChange: "heavier_or_lighter",
      impacts: { fatigue: "a_lot", night_sweats: "a_lot", brain_fog: "quite_a_bit" },
      heldBack: "I'm on a zero-hours contract so taking time off is hard",
      duration: "About a year",
    });
    const recognition = computeRecognition({
      menstrualChange: data.menstrualChange,
      impacts: data.impacts,
      otherSymptomsPresent: false,
    });
    const card = buildRecordCard(data, recognition);

    // first-person / no third-person, no banned diagnosis language
    const allText = [
      card.acknowledgement.text,
      ...card.symptomLines.map((l) => l.label),
      ...card.recommendations.map((r) => r.text),
    ].join(" ");
    expect(allText).not.toMatch(BANNED);

    // ferritin recommendation present
    expect(card.recommendations.some((r) => r.id === "iron")).toBe(true);
    // phone appointment recommendation present (time/work barrier)
    expect(card.recommendations.some((r) => r.id === "phone-appointment")).toBe(true);
    // confident recognition (core signal present)
    expect(recognition.level).toBe("confident");
    expect(card.acknowledgement.variant).toBe("normal");
  });

  it("red-flag fixture: amber variant renders, booking action first", () => {
    const data = session({
      ageBand: "50–55",
      story: "I've had some bleeding after sex which has worried me",
      impacts: { fatigue: "a_little" },
    });
    const recognition = computeRecognition({
      menstrualChange: data.menstrualChange,
      impacts: data.impacts,
      otherSymptomsPresent: false,
    });
    const card = buildRecordCard(data, recognition);

    expect(card.acknowledgement.variant).toBe("amber");
    expect(card.acknowledgement.text).toMatch(/book an appointment soon/i);
    expect(card.redFlags.length).toBeGreaterThan(0);
    expect(card.recommendations[0]?.id).toBe("book-soon");
    expect(card.acknowledgement.text).not.toMatch(BANNED);
  });

  it("normal variant never mentions booking-first language", () => {
    const data = session({ impacts: { fatigue: "a_little" } });
    const recognition = computeRecognition({
      menstrualChange: data.menstrualChange,
      impacts: data.impacts,
      otherSymptomsPresent: false,
    });
    const card = buildRecordCard(data, recognition);
    expect(card.acknowledgement.variant).toBe("normal");
    expect(card.recommendations[0]?.id).not.toBe("book-soon");
  });
});
