export type SectionId = "listening" | "structure" | "reading";
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Letter = "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  section: SectionId;
  cefr: Cefr;
  prompt: string;
  options: Record<Letter, string>;
  correct: Letter;
  explanation: string;
  /** Why each wrong option is wrong (exactly the three incorrect letters). */
  wrongExplanations: Partial<Record<Letter, string>>;
  skill: string;
  /** Reading passage or Structure context. */
  passage?: string;
  /** Exact excerpt of the passage that supports the answer (Reading review highlight). */
  evidence?: string;
  /** Listening: audio URL, shared by questions with the same audioId. */
  audioId?: string;
  audioUrl?: string;
  transcript?: string;
  maxPlays?: number;
  demo?: boolean;
}

export const SECTIONS: { id: SectionId; name: string; minutes: number; count: number }[] = [
  { id: "listening", name: "Listening Comprehension", minutes: 35, count: 50 },
  { id: "structure", name: "Structure and Written Expression", minutes: 25, count: 40 },
  { id: "reading", name: "Reading Comprehension", minutes: 55, count: 50 },
];

export const CEFR_ORDER: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const CEFR_TARGET: Record<Cefr, number> = { A1: 15, A2: 20, B1: 28, B2: 34, C1: 27, C2: 16 };
export const LETTERS: Letter[] = ["A", "B", "C", "D"];
export const TOTAL_QUESTIONS = 140;
