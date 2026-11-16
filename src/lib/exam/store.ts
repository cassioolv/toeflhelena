import { useEffect, useState, useCallback } from "react";
import staticBank from "./questoes_140.json";
import { orderQuestions, validateBank } from "./logic";
import { SECTIONS, type Letter, type Question } from "./types";

const BANK_KEY = "helena.bank.v1";
const ATTEMPT_KEY = "helena.attempt.v1";

export interface Attempt {
  stage: "exam" | "done";
  sectionIdx: number;
  /** Absolute deadline (ms epoch) for the current section — survives reloads. */
  sectionEndsAt: number;
  cursor: Record<string, number>;
  answers: Record<string, Letter>;
  flags: Record<string, boolean>;
  plays: Record<string, number>;
  usesDemo: boolean;
  questionIds?: string[];
  finishedAt?: number;
}

export function loadBank(): { questions: Question[]; demo: boolean } {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (raw) {
      const validated = validateBank(JSON.parse(raw));
      if (!validated.errors.length) return { questions: validated.questions, demo: false };
    }
  } catch {}
  return { questions: validateBank(staticBank).questions, demo: false };
}
export function saveBank(qs: Question[]) { localStorage.setItem(BANK_KEY, JSON.stringify(qs)); }
export function clearBank() { localStorage.removeItem(BANK_KEY); }

export function loadAttempt(): Attempt | null {
  try { const r = localStorage.getItem(ATTEMPT_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function saveAttempt(a: Attempt | null) {
  if (a) localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a)); else localStorage.removeItem(ATTEMPT_KEY);
}


export function newAttempt(
  demo: boolean,
  now = Date.now(),
  questionIds: string[] = []
): Attempt {
  const first = SECTIONS[0];
  if (!first) throw new Error("Nenhuma seção configurada.");

  return {
    stage: "exam",
    sectionIdx: 0,
    sectionEndsAt: now + first.minutes * 60_000,
    cursor: {},
    answers: {},
    flags: {},
    plays: {},
    usesDemo: demo,
    questionIds,
  };
}


/** Move to the next section (or finish). Pure, for testing. */
export function advanceSection(a: Attempt, now = Date.now()): Attempt {
  const next = a.sectionIdx + 1;
  const section = SECTIONS[next];
  if (!section) return { ...a, stage: "done", finishedAt: now };
  return { ...a, sectionIdx: next, sectionEndsAt: now + section.minutes * 60_000 };
}

export function useExamData() {
  const [ready, setReady] = useState(false);
  const [bank, setBank] = useState<{ questions: Question[]; demo: boolean }>({ questions: [], demo: true });
  const [attempt, setAttemptState] = useState<Attempt | null>(null);
  useEffect(() => {
    setBank(loadBank());
    const saved = loadAttempt();
    // Old demo answers cannot be scored against the new complete bank.
    if (saved?.usesDemo) { saveAttempt(null); setAttemptState(null); }
    else setAttemptState(saved);
    setReady(true);
  }, []);
  const setAttempt = useCallback((u: Attempt | null | ((a: Attempt | null) => Attempt | null)) => {
    setAttemptState((prev) => { const n = typeof u === "function" ? u(prev) : u; saveAttempt(n); return n; });
  }, []);
  return { ready, bank, attempt, setAttempt };
}
