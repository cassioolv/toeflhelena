import { LETTERS, type Question } from "./types";

/** Accept the supplied assets/questions format and the existing admin format. */
export function normalizeBank(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const bank = raw as { assets?: unknown; questions?: unknown };
  if (!Array.isArray(bank.assets) || !Array.isArray(bank.questions)) return raw;
  const assets = new Map(bank.assets.map((asset) => [asset.id, asset]));
  return bank.questions.map((q) => {
    const asset = assets.get(q.assetId);
    return {
      id: q.id,
      section: typeof q.section === "string" ? q.section.toLowerCase() : q.section,
      cefr: q.level,
      prompt: q.question,
      options: q.options,
      correct: q.correctAnswer,
      explanation: q.explanations?.[q.correctAnswer],
      wrongExplanations: Object.fromEntries(LETTERS.filter((l) => l !== q.correctAnswer).map((l) => [l, q.explanations?.[l]])),
      skill: q.skill,
      passage: asset?.text ?? undefined,
      evidence: q.reviewEvidence,
      audioId: q.section === "Listening" ? q.assetId : undefined,
      audioUrl: asset?.audioUrl ?? undefined,
      transcript: asset?.script ?? undefined,
    } satisfies Partial<Question>;
  });
}