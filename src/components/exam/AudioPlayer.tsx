import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioPlayer({ src, transcript, plays, maxPlays, onPlay }: { src?: string | undefined; transcript?: string | undefined; plays: number; maxPlays?: number | undefined; onPlay: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  useEffect(() => () => { if (transcript && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, [transcript]);
  useEffect(() => { setPlaying(false); setProgress(0); setFailed(false); }, [src]);
  const exhausted = maxPlays != null && plays >= maxPlays;

  if (!src && transcript) {
    const speak = () => {
      if (!("speechSynthesis" in window)) { setSpeechError(true); return; }
      const synth = window.speechSynthesis;
      if (playing) { synth.cancel(); setPlaying(false); return; }
      if (exhausted) return;
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.lang = "en-US";
      const voice = synth.getVoices().find((v) => v.lang === "en-US") ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
      if (voice) utterance.voice = voice;
      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => { setPlaying(false); setSpeechError(true); };
      setSpeechError(false); setPlaying(true); onPlay(); synth.speak(utterance);
    };
    return (
      <div className="flex items-center gap-4 rounded-md border bg-card p-4">
        <Button onClick={speak} disabled={!playing && exhausted} aria-label={playing ? "Parar áudio" : "Ouvir áudio"}>
          {playing ? <Pause /> : <Play />} {playing ? "Parar áudio" : "Ouvir áudio"}
        </Button>
        <div className="flex-1 text-xs text-muted-foreground">
          <p>Voz sintetizada em inglês para prática; não é áudio oficial nem reproduz a experiência real do TOEFL.</p>
          <p className="mt-1">Reproduções: {plays}{maxPlays != null ? ` de ${maxPlays}` : ""}</p>
          {speechError && <p role="alert" className="mt-1 text-destructive">Não foi possível reproduzir. Verifique se o navegador oferece voz em inglês e tente novamente.</p>}
        </div>
      </div>
    );
  }

  if (!src || failed)
    return (
      <div className="rounded-md border border-dashed border-gold bg-gold-soft p-4 text-sm">
        <strong>Aviso ao administrador:</strong> o áudio desta questão ainda não foi configurado. Envie o arquivo pela área administrativa.
      </div>
    );

  const toggle = () => {
    const a = ref.current; if (!a) return;
    if (playing) { a.pause(); return; }
    if (a.currentTime === 0 || a.ended) { if (exhausted) return; onPlay(); a.currentTime = 0; }
    void a.play().catch(() => setFailed(true));
  };
  return (
    <div className="flex items-center gap-4 rounded-md border bg-card p-4">
      <audio ref={ref} src={src} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(1); }} onError={() => setFailed(true)}
        onTimeUpdate={(e) => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }} />
      <Button size="icon" onClick={toggle} disabled={!playing && exhausted && (progress === 0 || progress === 1)} aria-label={playing ? "Pausar" : "Reproduzir"}>
        {playing ? <Pause /> : <Play />}
      </Button>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gold transition-all" style={{ width: `${progress * 100}%` }} /></div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Volume2 className="size-3.5" />
          {maxPlays != null ? `Reproduções: ${plays} de ${maxPlays}` : `Reproduções: ${plays}`}</p>
      </div>
    </div>
  );
}
