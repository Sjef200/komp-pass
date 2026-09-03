import { useState, type FormEvent } from "react";
import { parseSkillMarkdown } from "../lib/skill-import";
import type { Prompt } from "../lib/types";

export function Promptbibliotek({
  prompts,
  onImportert,
}: {
  prompts: Prompt[];
  onImportert: (prompts: Prompt[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [lim, setLim] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [apen, setApen] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const dev = import.meta.env.DEV;

  async function hentFraGithub(e: FormEvent) {
    e.preventDefault();
    setFeil(null);
    setStatus(null);
    if (!url.trim()) {
      setFeil("Lim inn en GitHub-lenke.");
      return;
    }
    if (!dev) {
      setFeil("Start appen med npm run dev, eller importer via MCP.");
      return;
    }
    setLaster(true);
    try {
      const res = await fetch("/api/hent-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as { prompts?: Prompt[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fant ingen SKILL.md der.");
      onImportert(data.prompts ?? []);
      setStatus(
        `Hentet ${(data.prompts ?? []).length} prompt${(data.prompts ?? []).length === 1 ? "" : "er"}. Bare SKILL.md er hentet.`,
      );
      setUrl("");
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Kunne ikke hente.");
    } finally {
      setLaster(false);
    }
  }

  function kopier(p: Prompt) {
    void navigator.clipboard.writeText(p.innhold);
    setStatus(`Kopiert «${p.navn}».`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#191C1F]/70">
        Prompter og ferdigheter KI bruker når den hører deg. Lim inn en GitHub-lenke til en
        SKILL.md eller en plugin-mappe.
      </p>

      <form onSubmit={hentFraGithub} className="rounded-2xl bg-white p-4">
        <label className="block text-sm font-medium">
          GitHub-lenke
          <input
            className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/eier/repo/blob/main/SKILL.md"
          />
        </label>
        <button
          type="submit"
          disabled={laster}
          className="mt-3 rounded-lg bg-[#191C1F] px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {laster ? "Henter…" : "Hent fra GitHub"}
        </button>
        {!dev && (
          <p className="mt-2 text-xs text-[#191C1F]/50">
            Start appen med npm run dev, eller importer via MCP.
          </p>
        )}
      </form>

      <div className="rounded-2xl bg-white p-4">
        <label className="block text-sm font-medium">
          Eller lim inn markdown
          <textarea
            className="mt-1 min-h-24 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={lim}
            onChange={(e) => setLim(e.target.value)}
            placeholder="---&#10;name: min-prompt&#10;description: …&#10;---"
          />
        </label>
        <p className="mt-2 text-xs text-[#191C1F]/50">
          Lim inn SKILL.md her hvis GitHub-henting ikke er tilgjengelig. Legg den til i økten,
          eller bruk MCP-verktøyet importer_prompt for å lagre i repoet.
        </p>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[#F6F5F1] px-3 py-2 text-sm"
          onClick={() => {
            if (!lim.trim()) {
              setFeil("Lim inn markdown først.");
              return;
            }
            const parset = parseSkillMarkdown(lim, "limt-prompt");
            const ny: Prompt = {
              id: parset.id,
              navn: parset.navn,
              beskrivelse: parset.beskrivelse,
              innhold: parset.innhold,
              kilde: "lokal",
            };
            const uten = prompts.filter((p) => p.id !== ny.id);
            onImportert([...uten, ny]);
            setLim("");
            setStatus(`Lagt til «${ny.navn}» i økten.`);
            setFeil(null);
          }}
        >
          Legg til i økten
        </button>
      </div>

      {feil && (
        <p className="text-sm text-[#A63A2A]" role="alert">
          {feil}
        </p>
      )}
      {status && <p className="text-sm text-[#2E6B4B]">{status}</p>}

      {prompts.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#191C1F]/60">
          Ingen prompter ennå. Lim inn en GitHub-lenke, eller be KI om å importere med
          verktøyet importer_prompt.
        </p>
      ) : (
        <ul className="space-y-2">
          {prompts.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{p.navn}</p>
                  <p className="mt-1 text-sm text-[#191C1F]/70">{p.beskrivelse}</p>
                  <p className="mt-1 text-xs text-[#191C1F]/45">
                    {p.kilde === "github" ? "GitHub" : "Lokal"}
                    {p.kildeUrl ? (
                      <>
                        {" · "}
                        <a
                          className="underline"
                          href={p.kildeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          kilde
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                    onClick={() => kopier(p)}
                  >
                    Kopier
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                    onClick={() => setApen((id) => (id === p.id ? null : p.id))}
                  >
                    {apen === p.id ? "Skjul" : "Vis"}
                  </button>
                </div>
              </div>
              {apen === p.id && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#F6F5F1] p-3 text-xs leading-relaxed">
                  {p.innhold}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
