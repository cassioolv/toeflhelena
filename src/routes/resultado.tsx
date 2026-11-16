import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { useFinished } from "@/components/exam/useFinished";
import { estimateLevel, scoreExam } from "@/lib/exam/logic";
import { CEFR_ORDER, SECTIONS } from "@/lib/exam/types";

export const Route = createFileRoute("/resultado")({
  head: () => ({ meta: [
    { title: "Resultado — TOEFL ITP Helena Edition" },
    { name: "description", content: "Desempenho por seção e nível CEFR no simulado." },
    { property: "og:title", content: "Resultado — TOEFL ITP Helena Edition" },
    { property: "og:description", content: "Desempenho por seção e nível CEFR no simulado." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Result,
});

const TIPS: Record<string, string> = {
  listening: "Ouça podcasts acadêmicos (ex.: aulas abertas) e pratique anotar ideia principal e detalhes sem transcrição.",
  structure: "Revise tempos verbais, concordância, orações relativas, paralelismo e inversões; faça exercícios curtos diários.",
  reading: "Leia textos acadêmicos curtos, identificando ideia principal, vocabulário em contexto e inferências.",
};

function Result() {
  const { ready, bank, attempt, setAttempt } = useFinished();
  if (!ready || !attempt || attempt.stage !== "done") return null;
  

const questionsById = new Map(
  bank.questions.map((q) => [q.id, q])
);

const selectedQuestions = (attempt.questionIds ?? [])
  .map((id) => questionsById.get(id))
  .filter((q): q is (typeof bank.questions)[number] => q !== undefined);

const s = scoreExam(selectedQuestions, attempt.answers);


  const level = estimateLevel(s);
  const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
  const sectionData = SECTIONS.map((x) => ({ name: x.name.split(" ")[0], pct: pct(s.bySection[x.id].correct, s.bySection[x.id].total) }));
  const cefrData = CEFR_ORDER.map((c) => ({ name: c, pct: pct(s.byCefr[c].correct, s.byCefr[c].total), total: s.byCefr[c].total })).filter((d) => d.total);
  const skills = [...s.bySkill].sort((a, b) => b.correct / b.total - a.correct / a.total);
  const strong = skills.filter((k) => k.correct / k.total >= 0.7).slice(0, 5);
  const weak = skills.filter((k) => k.correct / k.total < 0.6).reverse().slice(0, 5);
  const weakSections = SECTIONS.filter((x) => pct(s.bySection[x.id].correct, s.bySection[x.id].total) < 70);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero px-6 py-14 text-center text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Resultado do simulado</p>
        <h1 className="mt-3 text-6xl font-semibold">{s.correct} <span className="text-3xl opacity-70">/ {s.total}</span></h1>
        <p className="mt-2 text-xl">{s.pct}% de acertos</p>
        <p className="mt-2 text-sm opacity-80">{s.total - s.correct} erros (incluindo questões sem resposta)</p>
        {attempt.usesDemo && <p className="mt-4 text-sm opacity-70">Resultado de demonstração ({s.total} questões de exemplo, não 140).</p>}
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {SECTIONS.map((x) => (
            <div key={x.id} className="rounded-md border bg-card p-5">
              <p className="text-sm text-muted-foreground">{x.name}</p>
              <p className="mt-1 font-display text-4xl font-semibold">{s.bySection[x.id].correct}<span className="text-xl text-muted-foreground"> / {s.bySection[x.id].total}</span></p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[{ t: "Acertos por seção (%)", d: sectionData }, { t: "Acertos por nível CEFR (%)", d: cefrData }].map((c) => (
            <div key={c.t} className="rounded-md border bg-card p-5">
              <h2 className="mb-4 text-2xl font-semibold">{c.t}</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={c.d}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="pct" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-gold bg-gold-soft p-6">
          <h2 className="text-2xl font-semibold">Estimativa diagnóstica: {level}</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Calculada como o nível mais alto em que você acertou pelo menos 60%, desde que os níveis anteriores também tenham atingido 60%.
            <strong> Não é uma nota oficial do TOEFL ITP nem um nível CEFR certificado.</strong> A prova não é calibrada estatisticamente; use o resultado apenas como orientação de estudo.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-md border bg-card p-5"><h2 className="text-2xl font-semibold">Pontos fortes</h2>
            <ul className="mt-3 space-y-1 text-sm">{strong.length ? strong.map((k) => <li key={k.skill}>{k.skill} — {k.correct}/{k.total}</li>) : <li className="text-muted-foreground">Nenhuma habilidade com 70% ou mais.</li>}</ul></div>
          <div className="rounded-md border bg-card p-5"><h2 className="text-2xl font-semibold">Dificuldades</h2>
            <ul className="mt-3 space-y-1 text-sm">{weak.length ? weak.map((k) => <li key={k.skill}>{k.skill} — {k.correct}/{k.total}</li>) : <li className="text-muted-foreground">Nenhuma habilidade abaixo de 60%.</li>}</ul></div>
        </div>
        <div className="rounded-md border bg-card p-5"><h2 className="text-2xl font-semibold">Recomendações de estudo</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {(weakSections.length ? weakSections : SECTIONS).map((x) => <li key={x.id}><strong>{x.name}:</strong> {TIPS[x.id]}</li>)}
            {weak.length > 0 && <li>Priorize: {weak.map((k) => k.skill).join(", ")}.</li>}
          </ul></div>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/revisao">Revisão detalhada</Link></Button>
          <Button variant="outline" onClick={() => { if (confirm("Apagar este resultado e voltar ao início?")) setAttempt(null); }}>Nova tentativa</Button>
        </div>
      </main>
    </div>
  );
}
