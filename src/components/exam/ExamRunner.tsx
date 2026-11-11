import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { advanceSection, type Attempt } from "@/lib/exam/store";
import { LETTERS, SECTIONS, type Question } from "@/lib/exam/types";
import { AudioPlayer } from "./AudioPlayer";

const fmt = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

export function ExamRunner({ questions, attempt, setAttempt }: { questions: Question[]; attempt: Attempt; setAttempt: (u: (a: Attempt | null) => Attempt | null) => void }) {
  const navigate = useNavigate();
  const section = SECTIONS[attempt.sectionIdx] ?? SECTIONS.find((s) => s.id === "listening");
  if (!section) throw new Error("Nenhuma seção configurada.");
  const qs = useMemo(() => questions.filter((q) => q.section === section.id), [questions, section.id]);
  const idx = Math.min(attempt.cursor[section.id] ?? 0, Math.max(qs.length - 1, 0));
  const q = qs[idx];
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  const remaining = attempt.sectionEndsAt - now;

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (remaining <= 0) setAttempt((a) => (a && a.sectionIdx === attempt.sectionIdx ? advanceSection(a) : a));
  }, [remaining <= 0, attempt.sectionIdx]);
  useEffect(() => { if (attempt.stage === "done") navigate({ to: "/resultado" }); }, [attempt.stage]);
  useEffect(() => { setConfirm(false); }, [attempt.sectionIdx]);

  const patch = (fn: (a: Attempt) => Attempt) => setAttempt((a) => (a ? fn(a) : a));
  const go = (i: number) => patch((a) => ({ ...a, cursor: { ...a.cursor, [section.id]: i } }));
  const answered = qs.filter((x) => attempt.answers[x.id]).length;
  const flaggedCount = qs.filter((x) => attempt.flags[x.id]).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-elegant">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Seção {attempt.sectionIdx + 1} de 3</p>
            <h1 className="text-2xl font-semibold">{section.name}</h1>
          </div>
          <div className={cn("flex items-center gap-2 rounded-md border border-sidebar-border px-4 py-2 font-mono text-xl tabular-nums", remaining < 5 * 60_000 && "border-gold text-gold")}>
            <Clock className="size-5" /> {fmt(remaining)}
          </div>
        </div>
        <div className="h-1 bg-sidebar-accent"><div className="h-full bg-gold transition-all" style={{ width: `${qs.length ? (answered / qs.length) * 100 : 0}%` }} /></div>
      </header>

      {attempt.usesDemo && (
        <div className="bg-gold-soft px-6 py-2 text-center text-sm">Modo demonstração: apenas questões de exemplo. O banco definitivo de 140 questões ainda não foi importado.</div>
      )}

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_260px]">
        {q ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Questão {idx + 1} de {qs.length}</span>
              <Button variant={attempt.flags[q.id] ? "default" : "outline"} size="sm"
                onClick={() => patch((a) => ({ ...a, flags: { ...a.flags, [q.id]: !a.flags[q.id] } }))}>
                <Flag /> {attempt.flags[q.id] ? "Marcada para revisão" : "Marcar para revisão"}
              </Button>
            </div>
            {q.section === "listening" && (
              <AudioPlayer key={q.audioId ?? q.id} src={q.audioUrl} transcript={q.transcript} maxPlays={q.maxPlays} plays={attempt.plays[q.audioId ?? q.id] ?? 0}
                onPlay={() => patch((a) => ({ ...a, plays: { ...a.plays, [q.audioId ?? q.id]: (a.plays[q.audioId ?? q.id] ?? 0) + 1 } }))} />
            )}
            {q.passage && q.section === "reading" && (
              <article lang="en" className="max-h-80 overflow-y-auto rounded-md border bg-card p-6 leading-relaxed whitespace-pre-line">{q.passage}</article>
            )}
            <div lang="en" className="rounded-md border bg-card p-6 shadow-elegant">
              <p className="text-lg leading-relaxed">{q.prompt}</p>
              <div className="mt-6 space-y-3" role="radiogroup">
                {LETTERS.map((l) => {
                  const sel = attempt.answers[q.id] === l;
                  return (
                    <button key={l} role="radio" aria-checked={sel}
                      onClick={() => patch((a) => ({ ...a, answers: { ...a.answers, [q.id]: l } }))}
                      className={cn("flex w-full items-start gap-4 rounded-md border p-4 text-left transition-colors hover:border-gold", sel && "border-primary bg-secondary ring-1 ring-primary")}>
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold", sel && "border-primary bg-primary text-primary-foreground")}>{l}</span>
                      <span className="pt-0.5">{q.options[l]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" disabled={idx === 0} onClick={() => go(idx - 1)}><ChevronLeft /> Anterior</Button>
              {idx < qs.length - 1 ? <Button onClick={() => go(idx + 1)}>Próxima <ChevronRight /></Button>
                : <Button onClick={() => setConfirm(true)}>Finalizar seção</Button>}
            </div>
          </section>
        ) : (
          <section className="rounded-md border bg-card p-8 text-center">
            <p className="text-muted-foreground">Nenhuma questão cadastrada nesta seção.</p>
            <Button className="mt-4" onClick={() => setConfirm(true)}>Ir para a próxima seção</Button>
          </section>
        )}

        <aside className="space-y-4">
          <div className="rounded-md border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Navegação</p>
            <div className="grid grid-cols-5 gap-2">
              {qs.map((x, i) => (
                <button key={x.id} onClick={() => go(i)} aria-label={`Questão ${i + 1}`}
                  className={cn("relative h-9 rounded border text-sm tabular-nums", attempt.answers[x.id] && "bg-secondary", i === idx && "border-primary ring-1 ring-primary")}>
                  {i + 1}
                  {attempt.flags[x.id] && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-gold" />}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Respondidas: {answered} / {qs.length}</p>
              <p>Marcadas para revisão: {flaggedCount}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setConfirm(true)}>Finalizar seção</Button>
        </aside>
      </main>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar {section.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {answered} de {qs.length} questões{flaggedCount ? ` e tem ${flaggedCount} marcada(s) para revisão` : ""}. Depois de finalizar, não será possível voltar a esta seção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar revisando</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAttempt((a) => (a ? advanceSection(a) : a))}>
              {attempt.sectionIdx === SECTIONS.length - 1 ? "Finalizar prova" : "Finalizar seção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
