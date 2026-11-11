import { describe, expect, it } from "vitest";
import raw from "./questoes_140.json";
import { orderQuestions, scoreExam, validateBank } from "./logic";
import { CEFR_ORDER, LETTERS } from "./types";

describe("supplied full exam bank", () => {
  const result = validateBank(raw);
  it("has exactly 140 unique valid questions split 50/40/50", () => {
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(140);
    expect(new Set(result.questions.map((q) => q.id)).size).toBe(140);
    expect(["listening", "structure", "reading"].map((s) => result.questions.filter((q) => q.section === s).length)).toEqual([50, 40, 50]);
  });
  it("preserves every supplied answer key and all four explanations", () => {
    for (const source of raw.questions) {
      const q = result.questions.find((q) => q.id === source.id);
      expect(q?.correct).toBe(source.correctAnswer);
      expect(LETTERS).toContain(q?.correct);
      for (const l of LETTERS) {
        expect(q?.options[l]).toBe(source.options[l]);
        expect(l === q?.correct ? q.explanation : q?.wrongExplanations[l]).toBe(source.explanations[l]);
      }
    }
  });
  it("links each of the 20 assets to exactly five corresponding questions", () => {
    for (const asset of raw.assets) {
      const ids = raw.questions.filter((q) => q.assetId === asset.id).map((q) => q.id);
      expect(ids).toHaveLength(5);
      for (const id of ids) {
        const q = result.questions.find((q) => q.id === id);
        if (asset.section === "Listening") { expect(q?.audioId).toBe(asset.id); expect(q?.transcript).toBe(asset.script); }
        else expect(q?.passage).toBe(asset.text);
      }
    }
  });
  it("orders each section from A1 to C2", () => {
    for (const section of ["listening", "structure", "reading"]) {
      const levels = orderQuestions(result.questions).filter((q) => q.section === section).map((q) => CEFR_ORDER.indexOf(q.cefr));
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    }
  });
  it("scores all 140 keys at 100%, blanks at zero, and one wrong answer at 139", () => {
    const answers = Object.fromEntries(result.questions.map((q) => [q.id, q.correct]));
    const full = scoreExam(result.questions, answers);
    expect([full.correct, full.total, full.pct]).toEqual([140, 140, 100]);
    expect(scoreExam(result.questions, {}).correct).toBe(0);
    const first = result.questions[0];
    if (!first) throw new Error("Missing bank");
    const wrong = LETTERS.find((l) => l !== first.correct);
    expect(scoreExam(result.questions, { ...answers, [first.id]: wrong }).correct).toBe(139);
    expect(Object.values(full.bySection).map((s) => s.correct)).toEqual([50, 40, 50]);
    expect(Object.values(full.byCefr).map((s) => s.correct)).toEqual([15, 20, 28, 34, 27, 16]);
  });
});