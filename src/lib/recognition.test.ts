import { describe, expect, it } from "vitest";
import { computeRecognition, SymptomReport } from "./recognition";

const report = (overrides: Partial<SymptomReport>): SymptomReport => ({
  menstrualChange: null,
  impacts: {},
  ...overrides,
});

describe("the recognition rule (safety-critical)", () => {
  it("anchor alone creates a signal", () => {
    const r = computeRecognition(report({ menstrualChange: "irregular" }));
    expect(r.level).toBe("signal");
    expect(r.mayMentionPerimenopause).toBe(true);
    expect(r.anchorPresent).toBe(true);
  });

  it("every signal-bearing anchor answer creates a signal", () => {
    for (const change of [
      "irregular",
      "heavier_or_lighter",
      "closer_together",
      "skipping",
      "stopped",
    ] as const) {
      const r = computeRecognition(report({ menstrualChange: change }));
      expect(r.mayMentionPerimenopause).toBe(true);
    }
  });

  it("regular / not sure / prefer not to say anchor answers do NOT create a signal", () => {
    for (const change of ["regular", "not_sure", "prefer_not_to_say"] as const) {
      const r = computeRecognition(report({ menstrualChange: change }));
      expect(r.anchorPresent).toBe(false);
      expect(r.mayMentionPerimenopause).toBe(false);
    }
  });

  it("a specific signal alone (hot flushes) creates a signal", () => {
    const r = computeRecognition(report({ impacts: { hot_flushes: "a_little" } }));
    expect(r.level).toBe("signal");
    expect(r.mayMentionPerimenopause).toBe(true);
  });

  it("night sweats alone creates a signal", () => {
    const r = computeRecognition(report({ impacts: { night_sweats: "a_lot" } }));
    expect(r.mayMentionPerimenopause).toBe(true);
  });

  it("the ENTIRE dismissed cluster at maximum impact must NEVER create a signal alone", () => {
    const r = computeRecognition(
      report({
        menstrualChange: "regular",
        impacts: {
          fatigue: "a_lot",
          brain_fog: "a_lot",
          mood: "a_lot",
          sleep: "a_lot",
        },
      }),
    );
    expect(r.level).toBe("ambiguous");
    expect(r.mayMentionPerimenopause).toBe(false);
    expect(r.dismissedPresent).toHaveLength(4);
  });

  it("dismissed + supporting together still never create a signal", () => {
    const r = computeRecognition(
      report({
        impacts: {
          fatigue: "a_lot",
          mood: "a_lot",
          joint_muscle_aches: "a_lot",
          weight_bloating: "a_lot",
          palpitations: "a_lot",
        },
      }),
    );
    expect(r.mayMentionPerimenopause).toBe(false);
    expect(r.level).toBe("ambiguous");
  });

  it("dismissed cluster amplifies but the signal comes from the anchor", () => {
    const r = computeRecognition(
      report({
        menstrualChange: "skipping",
        impacts: { fatigue: "quite_a_bit", brain_fog: "a_little" },
      }),
    );
    expect(r.level).toBe("signal");
    expect(r.dismissedPresent).toEqual(
      expect.arrayContaining(["fatigue", "brain_fog"]),
    );
  });

  it("nothing reported → minimal, no perimenopause mention", () => {
    const r = computeRecognition(report({ menstrualChange: "regular" }));
    expect(r.level).toBe("minimal");
    expect(r.mayMentionPerimenopause).toBe(false);
  });

  it("palpitations present → gentle 'worth getting checked' flag, calm not alarming", () => {
    const r = computeRecognition(report({ impacts: { palpitations: "a_little" } }));
    expect(r.gentleFlags).toHaveLength(1);
    expect(r.gentleFlags[0]).toMatch(/worth getting checked/i);
  });

  it("unknown symptom ids (e.g. excluded symptoms) never influence the signal", () => {
    const r = computeRecognition(
      report({ impacts: { headaches: "a_lot", libido: "a_lot" } as never }),
    );
    expect(r.level).toBe("minimal");
    expect(r.mayMentionPerimenopause).toBe(false);
  });
});
