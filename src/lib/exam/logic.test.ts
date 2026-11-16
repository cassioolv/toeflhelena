import { describe, expect, it } from "vitest";
import { DEMO_QUESTIONS } from "./demo";
import { estimateLevel, scoreExam, validateBank, selectExamQuestions } from "./logic";
import staticBank from "./questoes_280.json";
import { CEFR_ORDER, CEFR_TARGET, SECTIONS } from "./types";
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
  
  it("sorteia 140 questões do banco de 280 respeitando as cotas", () => {
    const validated = validateBank(staticBank);

    expect(validated.errors).toEqual([]);
    expect(validated.questions).toHaveLength(280);

    for (let i = 0; i < 10; i++) {
      const exam = selectExamQuestions(validated.questions);

      expect(exam).toHaveLength(140);
      expect(new Set(exam.map((q) => q.id)).size).toBe(140);

      for (const section of SECTIONS) {
        expect(exam.filter((q) => q.section === section.id)).toHaveLength(section.count);
      }

      for (const level of CEFR_ORDER) {
        expect(exam.filter((q) => q.cefr === level)).toHaveLength(CEFR_TARGET[level]);
      }

      for (const section of ["listening", "reading"] as const) {
        const questions = exam.filter((q) => q.section === section);
        const groups = new Map<string, number[]>();

        questions.forEach((q, index) => {
          const key = section === "listening" ? q.audioId ?? q.id : q.passage ?? q.id;
          groups.set(key, [...(groups.get(key) ?? []), index]);
        });

        for (const positions of groups.values()) {
          expect(positions).toHaveLength(5);
          const sorted = [...positions].sort((a, b) => a - b);
          const first = sorted[0] ?? -1;
          expect(sorted).toEqual([first, first + 1, first + 2, first + 3, first + 4]);
        }
      }
    }
  });
});
