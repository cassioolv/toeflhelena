import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateBank, type ValidationResult } from "@/lib/exam/logic";
import { clearBank, loadBank, saveAttempt, saveBank } from "@/lib/exam/store";
import { CEFR_ORDER, CEFR_TARGET, SECTIONS, type Question } from "@/lib/exam/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Administração — TOEFL ITP Helena Edition" },
    { name: "description", content: "Importação e validação do banco de questões." },
    { property: "og:title", content: "Administração — TOEFL ITP Helena Edition" },
    { property: "og:description", content: "Importação e validação do banco de questões." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Admin,
});

const PASS_KEY = "helena.admin.pass";
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [hasPass, setHasPass] = useState<boolean | null>(null);
  const [pass, setPass] = useState("");
  useEffect(() => setHasPass(!!localStorage.getItem(PASS_KEY)), []);
  if (hasPass === null) return null;
  if (!unlocked)
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero px-6">
        <form className="w-full max-w-sm space-y-4 rounded-md bg-card p-8 shadow-elegant"
          onSubmit={async (e) => {
            e.preventDefault(); if (pass.length < 4) { toast.error("Use pelo menos 4 caracteres."); return; }
            const h = await sha(pass);
            if (!hasPass) { localStorage.setItem(PASS_KEY, h); setUnlocked(true); }
            else if (localStorage.getItem(PASS_KEY) === h) setUnlocked(true); else { toast.error("Senha incorreta."); }
          }}>
          <h1 className="text-3xl font-semibold">Administração</h1>
          <p className="text-sm text-muted-foreground">{hasPass ? "Digite a senha de administrador." : "Crie uma senha de administrador para este navegador."}</p>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Senha" autoFocus />
          <Button className="w-full" type="submit">{hasPass ? "Entrar" : "Criar senha"}</Button>
          <Link to="/" className="block text-center text-sm text-muted-foreground underline">Voltar</Link>
        </form>
      </div>
    );
  return <Panel />;
}

function Panel() {
  const [bank, setBank] = useState(() => loadBank());
  const [text, setText] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [media, setMedia] = useState<Record<string, "ok" | "fail" | "…">>({});

  const validate = (raw: string) => {
    try { setResult(validateBank(JSON.parse(raw))); } catch (e) { setResult({ errors: ["JSON inválido: " + (e as Error).message], warnings: [], questions: [] }); }
  };
  const checkMedia = (qs: Question[]) => {
    const urls = [...new Set(qs.map((q) => q.audioUrl).filter(Boolean) as string[])];
    urls.forEach((u) => {
      setMedia((m) => ({ ...m, [u]: "…" }));
      const a = new Audio(); a.preload = "metadata";
      a.onloadedmetadata = () => setMedia((m) => ({ ...m, [u]: "ok" }));
      a.onerror = () => setMedia((m) => ({ ...m, [u]: "fail" }));
      a.src = u;
    });
  };
  const count = (f: (q: Question) => boolean) => bank.questions.filter(f).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-6 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between"><h1 className="text-3xl font-semibold">Administração do banco</h1>
          <Button variant="secondary" asChild><Link to="/">Início</Link></Button></div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <section className="rounded-md border bg-card p-6">
          <h2 className="text-2xl font-semibold">Banco atual {bank.demo && <span className="text-base font-normal text-muted-foreground">— apenas exemplos demonstrativos</span>}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 text-sm">
            <table className="w-full"><tbody>{SECTIONS.map((s) => <tr key={s.id} className="border-b"><td className="py-1">{s.name}</td><td className="text-right tabular-nums">{count((q) => q.section === s.id)} / {s.count}</td></tr>)}</tbody></table>
            <table className="w-full"><tbody>{CEFR_ORDER.map((c) => <tr key={c} className="border-b"><td className="py-1">{c}</td><td className="text-right tabular-nums">{count((q) => q.cefr === c)} / {CEFR_TARGET[c]}</td></tr>)}</tbody></table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => checkMedia(bank.questions)}>Verificar áudios</Button>
            {!bank.demo && <Button variant="outline" onClick={() => { if (confirm("Remover o banco importado e restaurar as 140 questões originais?")) { clearBank(); setBank(loadBank()); } }}>Restaurar banco original</Button>}
            <Button variant="outline" onClick={() => { if (confirm("Apagar a prova em andamento/resultado salvo?")) { saveAttempt(null); toast.success("Tentativa apagada."); } }}>Apagar tentativa salva</Button>
          </div>
          {Object.keys(media).length > 0 && (
            <ul className="mt-4 space-y-1 text-xs">{Object.entries(media).map(([u, s]) => <li key={u} className={s === "fail" ? "text-destructive" : s === "ok" ? "text-success" : ""}>{s === "ok" ? "✓" : s === "fail" ? "✗" : "…"} {u}</li>)}</ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border bg-card p-6">
          <h2 className="text-2xl font-semibold">Importar 140 questões (JSON)</h2>
          <p className="text-sm text-muted-foreground">
            Lista de objetos com: id, section (listening | structure | reading), cefr, prompt, options {"{A,B,C,D}"}, correct, explanation, wrongExplanations, skill,
            e quando necessário passage, evidence, audioId, audioUrl, transcript, maxPlays. A importação só é aceita com exatamente 140 questões na distribuição exigida.
          </p>
          <Input type="file" accept="application/json,.json" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = await f.text(); setText(t); validate(t); } }} />
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="…ou cole o JSON aqui" className="font-mono text-xs" />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => validate(text)}>Validar</Button>
            <Button disabled={!result || result.errors.length > 0}
              onClick={() => { if (result) { saveBank(result.questions); setBank(loadBank()); checkMedia(result.questions); toast.success("Banco importado."); } }}>Importar</Button>
          </div>
          {result && (
            <div className="space-y-2 text-sm">
              {result.errors.length === 0 ? <p className="text-success">✓ Banco válido: {result.questions.length} questões.</p>
                : <ul className="max-h-60 overflow-y-auto rounded-md bg-destructive-soft p-3 text-destructive">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              {result.warnings.length > 0 && <ul className="max-h-40 overflow-y-auto rounded-md bg-gold-soft p-3">{result.warnings.map((e, i) => <li key={i}>⚠ {e}</li>)}</ul>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
