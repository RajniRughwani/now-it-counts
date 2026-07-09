import { describe, expect, it } from "vitest";
import { detectRedFlags } from "./redFlags";

describe("detectRedFlags (best-effort keyword match, safety-critical)", () => {
  it("detects bleeding after sex", () => {
    const matches = detectRedFlags("I've had some bleeding after sex a couple of times");
    expect(matches.some((m) => m.id === "post_coital_bleeding")).toBe(true);
  });

  it("detects bleeding between periods", () => {
    const matches = detectRedFlags("I get spotting between periods most months");
    expect(matches.some((m) => m.id === "intermenstrual_bleeding")).toBe(true);
  });

  it("detects heavy bleeding soaking through hourly", () => {
    const matches = detectRedFlags("it's soaking through a pad within an hour some days");
    expect(matches.some((m) => m.id === "intermenstrual_bleeding")).toBe(true);
  });

  it("detects postmenopausal bleeding", () => {
    const matches = detectRedFlags(
      "my periods stopped two years ago but I started bleeding again last week",
    );
    expect(matches.some((m) => m.id === "postmenopausal_bleeding")).toBe(true);
  });

  it("detects unexplained weight loss", () => {
    const matches = detectRedFlags("I've lost weight without trying and don't know why");
    expect(matches.some((m) => m.id === "unexplained_weight_loss")).toBe(true);
  });

  it("returns nothing for ordinary symptom descriptions", () => {
    const matches = detectRedFlags("I've been feeling exhausted and my periods are irregular");
    expect(matches).toHaveLength(0);
  });
});
