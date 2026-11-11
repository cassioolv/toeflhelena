import { CEFR_ORDER, CEFR_TARGET, LETTERS, SECTIONS, TOTAL_QUESTIONS, type Cefr, type Letter, type Question, type SectionId } from "./types";
import { normalizeBank } from "./bank-format";

/** Group by section, then sort by CEFR progression (stable). */
export function orderQuestions(qs: Question[]): Question[] {
  const sIdx = (s: SectionId) => SECTIONS.findIndex((x) => x.id === s);
  return qs
    .map((q, i) => ({ q, i }))
    .sort((a, b) => sIdx(a.q.section) - sIdx(b.q.section) || CEFR_ORDER.indexOf(a.q.cefr) - CEFR_ORDER.indexOf(b.q.cefr) || a.i - b.i)
    .map((x) => x.q);
}

export interface ValidationResult { errors: string[]; warnings: string[]; questions: Question[] }

export function validateBank(raw: unknown, { requireComplete = true } = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalized = normalizeBank(raw);
  const list = Array.isArray(normalized) ? normalized : (normalized as { questions?: unknown })?.questions;
  if (!Array.isArray(list)) return { errors: ["O JSON deve ser uma lista de questões ou { questions: [...] }."], warnings, questions: [] };
  const ids = new Set<string>();
  const prompts = new Set<string>();
  const out: Question[] = [];
  list.forEach((q: any, i) => {
    const tag = `Questão #${i + 1}${q?.id ? ` (${q.id})` : ""}`;
    if (!q || typeof q !== "object") { errors.push(`${tag}: inválida.`); return; }
    if (!q.id || typeof q.id !== "string") errors.push(`${tag}: falta "id".`);
    else if (ids.has(q.id)) errors.push(`${tag}: id duplicado.`);
    else ids.add(q.id);
    if (!SECTIONS.some((s) => s.id === q.section)) errors.push(`${tag}: seção inválida.`);
    if (!CEFR_ORDER.includes(q.cefr)) errors.push(`${tag}: nível CEFR inválido.`);
    if (!q.prompt) errors.push(`${tag}: falta enunciado.`);
    const key = `${q.section}|${String(q.prompt ?? "").trim().toLowerCase()}|${q.passage ?? ""}|${q.audioId ?? ""}`;
    if (q.prompt && prompts.has(key)) errors.push(`${tag}: questão repetida.`);
    prompts.add(key);
    if (!q.options || LETTERS.some((l) => !q.options[l])) errors.push(`${tag}: precisa das quatro alternativas A–D.`);
    if (!LETTERS.includes(q.correct)) errors.push(`${tag}: alternativa correta inválida.`);
    if (!q.explanation) errors.push(`${tag}: falta explicação da correta.`);
    LETTERS.filter((l) => l !== q.correct).forEach((l) => {
      if (!q.wrongExplanations?.[l]) errors.push(`${tag}: falta explicação da alternativa ${l}.`);
    });
    if (!q.skill) errors.push(`${tag}: falta habilidade/tema.`);
    if (q.section === "listening") {
      if (!q.audioUrl && !q.transcript) errors.push(`${tag}: Listening sem áudio ou roteiro para voz sintetizada.`);
      if (!q.transcript) warnings.push(`${tag}: Listening sem transcrição para a revisão.`);
    }
    if (q.section === "reading" && !q.passage) errors.push(`${tag}: Reading sem texto-base.`);
    if (q.evidence && q.passage && !q.passage.includes(q.evidence)) warnings.push(`${tag}: trecho de evidência não encontrado no texto.`);
    out.push(q as Question);
  });
  if (requireComplete) {
    if (out.length !== TOTAL_QUESTIONS) errors.push(`O banco tem ${out.length} questões; são necessárias ${TOTAL_QUESTIONS}.`);
    SECTIONS.forEach((s) => {
      const n = out.filter((q) => q.section === s.id).length;
      if (n !== s.count) errors.push(`${s.name}: ${n} questões (esperado ${s.count}).`);
    });
    CEFR_ORDER.forEach((c) => {
      const n = out.filter((q) => q.cefr === c).length;
      if (n !== CEFR_TARGET[c]) errors.push(`Nível ${c}: ${n} questões (esperado ${CEFR_TARGET[c]}).`);
    });
  }
  return { errors, warnings, questions: errors.length ? [] : orderQuestions(out) };
}

export interface Score {
  total: number; correct: number; pct: number;
  bySection: Record<SectionId, { total: number; correct: number }>;
  byCefr: Record<Cefr, { total: number; correct: number }>;
  bySkill: { skill: string; total: number; correct: number }[];
}

export function scoreExam(qs: Question[], answers: Record<string, Letter | undefined>): Score {
  const bySection = Object.fromEntries(SECTIONS.map((s) => [s.id, { total: 0, correct: 0 }])) as Score["bySection"];
  const byCefr = Object.fromEntries(CEFR_ORDER.map((c) => [c, { total: 0, correct: 0 }])) as Score["byCefr"];
  const skills = new Map<string, { total: number; correct: number }>();
  let correct = 0;
  for (const q of qs) {
    const ok = answers[q.id] === q.correct;
    if (ok) correct++;
    bySection[q.section].total++; byCefr[q.cefr].total++;
    if (ok) { bySection[q.section].correct++; byCefr[q.cefr].correct++; }
    const s = skills.get(q.skill) ?? { total: 0, correct: 0 };
    s.total++; if (ok) s.correct++; skills.set(q.skill, s);
  }
  return {
    total: qs.length, correct, pct: qs.length ? Math.round((correct / qs.length) * 100) : 0,
    bySection, byCefr,
    bySkill: [...skills].map(([skill, v]) => ({ skill, ...v })),
  };
}

/**
 * Diagnostic estimate: the highest CEFR band where she got at least 60% right
 * AND every lower band (with questions) is also at least 60%. Never a certified level.
 */
export function estimateLevel(score: Score): Cefr | "Abaixo de A1" {
  let level: Cefr | "Abaixo de A1" = "Abaixo de A1";
  for (const c of CEFR_ORDER) {
    const b = score.byCefr[c];
    if (!b.total) continue;
    if (b.correct / b.total >= 0.6) level = c; else break;
  }
  return level;
}
