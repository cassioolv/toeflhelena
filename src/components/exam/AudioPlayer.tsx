import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioPlayer({ src, plays, maxPlays, onPlay }: { src?: string; plays: number; maxPlays?: number; onPlay: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setPlaying(false); setProgress(0); setFailed(false); }, [src]);
  const exhausted = maxPlays != null && plays >= maxPlays;

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
    a.play();
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
