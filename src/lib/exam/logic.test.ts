import { describe, expect, it } from "vitest";
import { DEMO_QUESTIONS } from "./demo";
import { estimateLevel, scoreExam, validateBank } from "./logic";
import { advanceSection, newAttempt } from "./store";

describe("exam rules", () => {
  it("rejects a bank that is not exactly 140 questions", () => {
    const r = validateBank(DEMO_QUESTIONS);
    expect(r.errors.some((e) => e.includes("140"))).toBe(true);
  });
  it("rejects duplicate ids", () => {
    const r = validateBank([DEMO_QUESTIONS[2], DEMO_QUESTIONS[2]], { requireComplete: false });
    expect(r.errors.some((e) => e.includes("duplicado"))).toBe(true);
  });
  it("scores deterministically from the answer key", () => {
    const s = scoreExam(DEMO_QUESTIONS, { "demo-S1": "C", "demo-S2": "A" });
    expect(s.correct).toBe(1);
    expect(s.bySection.structure).toEqual({ total: 2, correct: 1 });
  });
  it("section timers: listening 35, structure 25, reading 55 minutes", () => {
    const a = newAttempt(true, 0);
    expect(a.sectionEndsAt).toBe(35 * 60_000);
    const b = advanceSection(a, 0);
    expect(b.sectionEndsAt).toBe(25 * 60_000);
    expect(advanceSection(b, 0).sectionEndsAt).toBe(55 * 60_000);
    expect(advanceSection(advanceSection(b, 0), 0).stage).toBe("done");
  });
  it("level estimate stops at the first band below 60%", () => {
    const all = Object.fromEntries(DEMO_QUESTIONS.map((q) => [q.id, q.correct]));
    expect(estimateLevel(scoreExam(DEMO_QUESTIONS, all))).toBe("C1");
    expect(estimateLevel(scoreExam(DEMO_QUESTIONS, {}))).toBe("Abaixo de A1");
  });
});
