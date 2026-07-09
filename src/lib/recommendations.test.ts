import { describe, expect, it } from "vitest";
import { computeRecommendations } from "./recommendations";
import { EMPTY_SESSION, SessionData } from "./session";

const session = (overrides: Partial<SessionData>): SessionData => ({
  ...EMPTY_SESSION,
  ...overrides,
});

describe("computeRecommendations (fixed mapping, never free-generated)", () => {
  it("heavy/irregular periods + fatigue -> ferritin recommendation", () => {
    const recs = computeRecommendations(
      session({
        menstrualChange: "heavier_or_lighter",
        impacts: { fatigue: "a_lot", night_sweats: "a_little", brain_fog: "a_little" },
      }),
    );
    expect(recs.some((r) => r.id === "iron")).toBe(true);
    expect(recs.find((r) => r.id === "iron")?.text).toMatch(/ferritin/i);
  });

  it("fatigue + mood + brain fog -> thyroid recommendation", () => {
    const recs = computeRecommendations(
      session({
        impacts: { fatigue: "a_lot", anxiety: "quite_a_bit", brain_fog: "a_little" },
      }),
    );
    expect(recs.some((r) => r.id === "thyroid")).toBe(true);
  });

  it("stated time/work barrier -> phone appointment recommendation", () => {
    const recs = computeRecommendations(
      session({ heldBack: "Hard to get time off work for appointments" }),
    );
    expect(recs.some((r) => r.id === "phone-appointment")).toBe(true);
  });

  it("night sweats or sleep trouble -> a free start-tonight action", () => {
    const recs = computeRecommendations(session({ impacts: { night_sweats: "a_lot" } }));
    expect(recs.some((r) => r.id === "cooler-room")).toBe(true);
  });

  it("never exceeds 4 items", () => {
    const recs = computeRecommendations(
      session({
        menstrualChange: "irregular",
        heldBack: "work hours make it hard",
        impacts: {
          fatigue: "a_lot",
          anxiety: "a_lot",
          brain_fog: "a_lot",
          night_sweats: "a_lot",
          sleep: "a_lot",
        },
      }),
    );
    expect(recs.length).toBeLessThanOrEqual(4);
  });

  it("phrasing is always 'ask about / worth checking', never 'you have / you need'", () => {
    const recs = computeRecommendations(
      session({
        menstrualChange: "irregular",
        heldBack: "work hours",
        impacts: { fatigue: "a_lot", anxiety: "a_lot", brain_fog: "a_lot", night_sweats: "a_lot" },
      }),
    );
    for (const rec of recs) {
      expect(rec.text).not.toMatch(/you have|you need|take \w+mg/i);
    }
  });
});
