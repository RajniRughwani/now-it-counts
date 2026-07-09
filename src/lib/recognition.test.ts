import { describe, expect, it } from "vitest";
import { computeRecognition, SymptomReport } from "./recognition";

const report = (overrides: Partial<SymptomReport>): SymptomReport => ({
  menstrualChange: null,
  impacts: {},
  ...overrides,
});

describe("the recognition rule (safety-critical)", () => {
  it("anchor alone creates confident guidance", () => {
    const r = computeRecognition(report({ menstrualChange: "irregular" }));
    expect(r.level).toBe("confident");
    expect(r.mayMentionPerimenopause).toBe(true);
    expect(r.anchorPresent).toBe(true);
    expect(r.guidance).toMatch(/consistent with perimenopause/i);
  });

  it("every signal-bearing anchor answer creates confident guidance", () => {
    for (const change of [
      "irregular",
      "heavier_or_lighter",
      "closer_together",
      "skipping",
      "stopped",
    ] as const) {
      const r = computeRecognition(report({ menstrualChange: change }));
      expect(r.level).toBe("confident");
      expect(r.mayMentionPerimenopause).toBe(true);
    }
  });

  it("regular / not sure / prefer not to say anchor answers do NOT create a core signal", () => {
    for (const change of ["regular", "not_sure", "prefer_not_to_say"] as const) {
      const r = computeRecognition(report({ menstrualChange: change }));
      expect(r.anchorPresent).toBe(false);
      expect(r.level).not.toBe("confident");
    }
  });

  it("a specific signal alone (hot flushes) creates confident guidance", () => {
    const r = computeRecognition(report({ impacts: { hot_flushes: "a_little" } }));
    expect(r.level).toBe("confident");
    expect(r.mayMentionPerimenopause).toBe(true);
  });

  it("night sweats alone creates confident guidance", () => {
    const r = computeRecognition(report({ impacts: { night_sweats: "a_lot" } }));
    expect(r.level).toBe("confident");
    expect(r.mayMentionPerimenopause).toBe(true);
  });

  it("the ENTIRE dismissed cluster at maximum impact must NEVER reach confident alone", () => {
    const r = computeRecognition(
      report({
        menstrualChange: "regular",
        impacts: {
          fatigue: "a_lot",
          brain_fog: "a_lot",
          anxiety: "a_lot",
          low_mood_irritability: "a_lot",
          sleep: "a_lot",
        },
      }),
    );
    expect(r.level).toBe("soft");
    expect(r.mayMentionPerimenopause).toBe(true);
    expect(r.guidance).toMatch(/among other things/i);
    expect(r.dismissedPresent).toHaveLength(5);
  });

  it("dismissed + supporting together still never reach confident, but do allow soft guidance", () => {
    const r = computeRecognition(
      report({
        impacts: {
          fatigue: "a_lot",
          anxiety: "a_lot",
          joint_aches: "a_lot",
          weight_bloating: "a_lot",
          urinary: "a_lot",
          palpitations: "a_lot",
        },
      }),
    );
    expect(r.level).toBe("soft");
    expect(r.mayMentionPerimenopause).toBe(true);
  });

  it("off-list symptoms alone allow soft guidance but never confident", () => {
    const r = computeRecognition(report({ otherSymptomsPresent: true }));
    expect(r.level).toBe("soft");
    expect(r.mayMentionPerimenopause).toBe(true);
    expect(r.anchorPresent).toBe(false);
    expect(r.specificPresent).toHaveLength(0);
  });

  it("dismissed cluster amplifies but the signal comes from the anchor", () => {
    const r = computeRecognition(
      report({
        menstrualChange: "skipping",
        impacts: { fatigue: "quite_a_bit", brain_fog: "a_little" },
      }),
    );
    expect(r.level).toBe("confident");
    expect(r.dismissedPresent).toEqual(
      expect.arrayContaining(["fatigue", "brain_fog"]),
    );
  });

  it("nothing reported → none, no guidance line names perimenopause", () => {
    const r = computeRecognition(report({ menstrualChange: "regular" }));
    expect(r.level).toBe("none");
    expect(r.mayMentionPerimenopause).toBe(false);
    expect(r.guidance).not.toMatch(/perimenopause/i);
  });

  it("palpitations present → gentle 'worth getting checked' flag, calm not alarming", () => {
    const r = computeRecognition(report({ impacts: { palpitations: "a_little" } }));
    expect(r.gentleFlags).toHaveLength(1);
    expect(r.gentleFlags[0]).toMatch(/worth getting checked/i);
  });

  it("unknown symptom ids slipped into impacts (not the off-list flag) never influence the signal", () => {
    const r = computeRecognition(
      report({ impacts: { headaches: "a_lot", libido: "a_lot" } as never }),
    );
    expect(r.level).toBe("none");
    expect(r.mayMentionPerimenopause).toBe(false);
  });
});
