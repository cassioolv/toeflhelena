import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFinished } from "@/components/exam/useFinished";
import { cn } from "@/lib/utils";
import { CEFR_ORDER, LETTERS, SECTIONS, type Question } from "@/lib/exam/types";

export const Route = createFileRoute("/revisao")({
  head: () => ({ meta: [
    { title: "Revisão — TOEFL ITP Helena Edition" },
    { name: "description", content: "Revisão de cada questão com gabarito e explicações." },
    { property: "og:title", content: "Revisão — TOEFL ITP Helena Edition" },
    { property: "og:description", content: "Revisão de cada questão com gabarito e explicações." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Review,
});

function highlight(passage: string, ev?: string): ReactNode {
  if (!ev || !passage.includes(ev)) return passage;
  const [a, ...rest] = passage.split(ev);
  return <>{a}<mark className="rounded bg-gold-soft px-0.5 ring-1 ring-gold">{ev}</mark>{rest.join(ev)}</>;
}

const sel = "h-9 rounded-md border bg-card px-3 text-sm";

function Review() {
  const { ready, bank, attempt } = useFinished();
  const [res, setRes] = useState("all"); const [sec, setSec] = useState("all"); const [lvl, setLvl] = useState("all");
  if (!ready || !attempt || attempt.stage !== "done") return null;
  
const questionsById = new Map(
  bank.questions.map((q) => [q.id, q])
);

const selectedQuestions = (attempt.questionIds ?? [])
  .map((id) => questionsById.get(id))
  .filter((q): q is (typeof bank.questions)[number] => q !== undefined);


const list = selectedQuestions.filter((q) => {
    const ok = attempt.answers[q.id] === q.correct;
    return (res === "all" || (res === "right" ? ok : !ok)) && (sec === "all" || q.section === sec) && (lvl === "all" || q.cefr === lvl);
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-6 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between"><h1 className="text-3xl font-semibold">Revisão detalhada</h1>
          <Button variant="secondary" asChild><Link to="/resultado">Voltar ao resultado</Link></Button></div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          <select className={sel} value={res} onChange={(e) => setRes(e.target.value)}><option value="all">Todas</option><option value="wrong">Erradas</option><option value="right">Certas</option></select>
          <select className={sel} value={sec} onChange={(e) => setSec(e.target.value)}><option value="all">Todas as seções</option>{SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className={sel} value={lvl} onChange={(e) => setLvl(e.target.value)}><option value="all">Todos os níveis</option>{CEFR_ORDER.map((c) => <option key={c}>{c}</option>)}</select>
          <span className="self-center text-sm text-muted-foreground">{list.length} questão(ões)</span>
        </div>
        {list.map((q) => <Item key={q.id} q={q} n={selectedQuestions.indexOf(q) + 1} chosen={attempt.answers[q.id]} />)}
      </main>
    </div>
  );
}

function Item({ q, n, chosen }: { q: Question; n: number; chosen?: string | undefined }) {
  const ok = chosen === q.correct;
  return (
    <article className="space-y-4 rounded-md border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">#{n}</span>
        <Badge variant="outline">{SECTIONS.find((s) => s.id === q.section)?.name}</Badge>
        <Badge variant="outline">{q.cefr}</Badge><Badge variant="secondary">{q.skill}</Badge>
        {q.demo && <Badge variant="outline">Exemplo</Badge>}
        <span className={cn("ml-auto font-semibold", ok ? "text-success" : "text-destructive")}>{ok ? "Correta" : chosen ? "Incorreta" : "Sem resposta"}</span>
      </div>
      {q.section === "listening" && q.transcript && (
        <details className="rounded-md bg-muted p-4 text-sm"><summary className="cursor-pointer font-medium">Transcrição</summary><p lang="en" className="mt-2 whitespace-pre-line">{q.transcript}</p></details>
      )}
      {q.section === "reading" && q.passage && <p lang="en" className="rounded-md bg-muted p-4 text-sm leading-relaxed whitespace-pre-line">{highlight(q.passage, q.evidence)}</p>}
      <p lang="en" className="text-lg">{q.prompt}</p>
      <ul className="space-y-2">
        {LETTERS.map((l) => {
          const correct = l === q.correct;
          return (
            <li key={l} className={cn("rounded-md border p-3 text-sm", correct && "border-success bg-success-soft", l === chosen && !correct && "border-destructive bg-destructive-soft")}>
              <p lang="en"><strong>{l}.</strong> {q.options[l]} {correct && <span className="text-success">✓ correta</span>} {l === chosen && <span className="text-muted-foreground">(sua resposta)</span>}</p>
              <p className="mt-1 text-muted-foreground">{correct ? q.explanation : q.wrongExplanations[l]}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
