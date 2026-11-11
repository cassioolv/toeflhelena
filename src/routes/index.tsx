import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { newAttempt, useExamData } from "@/lib/exam/store";
import { SECTIONS } from "@/lib/exam/types";
import video from "@/assets/gordao_msn.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome, Helena! — TOEFL ITP Helena Edition" },
      { name: "description", content: "Simulado particular de inglês inspirado no TOEFL ITP Level 1." },
      { property: "og:title", content: "TOEFL ITP — Helena Edition" },
      { property: "og:description", content: "Simulado particular de inglês inspirado no TOEFL ITP Level 1." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { ready, bank, attempt, setAttempt } = useExamData();
  const [phase, setPhase] = useState<"idle" | "video" | "message">("idle");
  const [videoError, setVideoError] = useState(false);
  const [fading, setFading] = useState(false);

  if (!ready) return <div className="min-h-screen bg-hero" />;
  if (attempt?.stage === "exam") return <ExamRunner questions={bank.questions} attempt={attempt} setAttempt={setAttempt} />;

  return (
    <div className="flex min-h-screen flex-col bg-hero text-primary-foreground">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">TOEFL ITP — Helena Edition</p>
        <div className="gold-rule my-6 w-48" />
        <h1 className="text-6xl font-semibold md:text-8xl">Welcome, Helena!</h1>
        <p className="mt-6 max-w-lg text-lg opacity-80">
          Simulado de 140 questões em três seções: Listening, Structure and Written Expression e Reading.
        </p>
        <div className="mt-10 flex gap-8 text-sm opacity-80">
          {SECTIONS.map((s) => <div key={s.id}><p className="font-display text-3xl text-gold">{s.minutes}′</p><p>{s.name.split(" ")[0]}</p></div>)}
        </div>
        <div className="mt-12 flex flex-col items-center gap-4">
          <Button size="lg" variant="secondary" className="h-14 px-10 text-lg" onClick={() => { setFading(false); setVideoError(false); setPhase("video"); }}>Iniciar Simulado</Button>
          {attempt?.stage === "done" && <Link to="/resultado" className="text-sm text-gold underline-offset-4 hover:underline">Ver resultado da última prova</Link>}
        </div>
        {bank.demo && <p className="mt-8 max-w-md text-xs opacity-60">Modo demonstração: o banco definitivo de questões ainda não foi importado.</p>}
      </main>
      <footer className="px-6 py-4 text-center text-xs opacity-50">
        Simulado particular, não oficial e sem vínculo com a ETS. · <Link to="/admin" className="underline">Administração</Link>
      </footer>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className={cn("absolute inset-0 bg-primary/70 backdrop-blur-sm transition-opacity duration-700", phase === "message" && "bg-primary/90")} />
          {phase === "video" && !videoError && (
            <video src={video.url} autoPlay playsInline controls={false} disablePictureInPicture
              onEnded={() => setPhase("message")} onError={() => setVideoError(true)}
              onContextMenu={(e) => e.preventDefault()}
              className={cn("wink-video pointer-events-none relative h-[85vh] max-w-[95vw] object-contain transition-opacity duration-700", fading && "opacity-0")}
              onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration && v.duration - v.currentTime < 0.7) setFading(true); }} />
          )}
          {phase === "video" && videoError && (
            <div className="relative max-w-md space-y-4 rounded-md bg-card p-6 text-foreground">
              <p className="text-sm"><strong>Aviso ao administrador:</strong> o vídeo "gordao msn.mp4" não pôde ser carregado.</p>
              <Button onClick={() => setPhase("message")}>Continuar</Button>
            </div>
          )}
          {phase === "message" && (
            <div className="relative animate-in fade-in zoom-in-95 space-y-8 px-6 text-center duration-700">
              <p className="font-display text-5xl font-semibold">KKKKKK te amo, meu amor! ❤️ Boa prova!</p>
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg" onClick={() => { setAttempt(newAttempt(bank.demo)); setPhase("idle"); }}>Agora é sério!</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
