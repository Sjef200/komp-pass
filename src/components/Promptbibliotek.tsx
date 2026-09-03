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
  const egenSkillsUrl = `${window.location.origin}/skills`;

  async function hentFraPlattform(e: FormEvent) {
    e.preventDefault();
    setFeil(null);
    setStatus(null);
    if (!url.trim()) {
      setFeil("Lim inn URL-en til plattformen.");
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
      if (!res.ok) throw new Error(data.error ?? "Fant ingen /skills på den URL-en.");
      onImportert(data.prompts ?? []);
      setStatus(
        `Hentet ${(data.prompts ?? []).length} skill${(data.prompts ?? []).length === 1 ? "" : "s"} fra /skills.`,
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
        Prompter og ferdigheter KI bruker når den hører deg. Lim inn URL-en til plattformen — vi
        henter <code className="rounded bg-white px-1">/skills</code> og pluginene der, slik Claude
        gjør med en ferdighetskatalog.
      </p>

      <div className="rounded-2xl bg-white p-4">
        <p className="text-sm font-medium">Denne plattformens skills</p>
        <p className="mt-1 break-all font-mono text-xs text-[#191C1F]/70">{egenSkillsUrl}</p>
        <button
          type="button"
          className="mt-2 rounded-lg bg-[#F6F5F1] px-3 py-1.5 text-sm"
          onClick={() => {
            void navigator.clipboard.writeText(egenSkillsUrl);
            setStatus("Kopiert /skills-URL. Gi den til Claude, så hentes pluginene.");
          }}
        >
          Kopier URL
        </button>
      </div>

      <form onSubmit={hentFraPlattform} className="rounded-2xl bg-white p-4">
        <label className="block text-sm font-medium">
          Plattform-URL
          <input
            className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={window.location.origin}
          />
        </label>
        <button
          type="submit"
          disabled={laster}
          className="mt-3 rounded-lg bg-[#191C1F] px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {laster ? "Henter…" : "Hent /skills"}
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
          Lim inn SKILL.md her hvis du ikke har en plattform-URL. Legg den til i økten, eller bruk
          MCP-verktøyet importer_prompt.
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
          Ingen prompter ennå. Lim inn en plattform-URL, eller be KI om å importere med
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
                    {p.kilde === "plattform"
                      ? "Plattform"
                      : p.kilde === "github"
                        ? "GitHub"
                        : "Lokal"}
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
