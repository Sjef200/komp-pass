import { useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { parseSkillMarkdown } from "../lib/skill-import";
import type { FagId, Prompt, Skill } from "../lib/types";

function kildeEtikett(kilde: string): string {
  if (kilde === "plattform") return "Plattform";
  if (kilde === "github") return "GitHub";
  return "Lokal";
}

function fagEtikett(fagIds: FagId[] | undefined, alleFag: { id: string; kode: string }[]): string {
  if (!fagIds || fagIds.length === 0) return "Alle fag";
  return fagIds
    .map((id) => alleFag.find((f) => f.id === id)?.kode ?? id)
    .join(" · ");
}

export function Promptbibliotek({
  prompts,
  skills,
  fag,
  onImportert,
}: {
  prompts: Prompt[];
  skills: Skill[];
  fag: { id: string; kode: string; navn: string }[];
  onImportert: (prompts: Prompt[], skills?: Skill[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [lim, setLim] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [apen, setApen] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);
  const skillFilRef = useRef<HTMLInputElement>(null);
  const dev = import.meta.env.DEV;
  const egenSkillsUrl = `${window.location.origin}/skills`;

  const plattform = skills.filter((s) => s.kategori === "plattform");
  const fagSkills = skills.filter((s) => s.kategori !== "plattform");
  const promptBare = prompts.filter((p) => !skills.some((s) => s.id === p.id));

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
      const data = (await res.json()) as { prompts?: Prompt[]; skills?: Skill[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fant ingen /skills på den URL-en.");
      onImportert(data.prompts ?? [], data.skills);
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

  async function importerSkillFil(file: File) {
    setFeil(null);
    setStatus(null);
    if (!dev) {
      setFeil("Start appen med npm run dev for å importere .skill-filer.");
      return;
    }
    setLaster(true);
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch("/api/importer-skill-fil", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });
      const data = (await res.json()) as { prompts?: Prompt[]; skills?: Skill[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kunne ikke lese .skill-filen.");
      onImportert(data.prompts ?? prompts, data.skills);
      setStatus(`Importert «${file.name}». Scripts i pakken er ignorert.`);
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Kunne ikke importere filen.");
    } finally {
      setLaster(false);
    }
  }

  function kopier(tekst: string, navn: string) {
    void navigator.clipboard.writeText(tekst);
    setStatus(`Kopiert «${navn}».`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#191C1F]/70">
        Skills forteller KI hvordan den skal velge fag, høre deg mot læreplanen og logge.
        Lim inn URL-en til plattformen — vi henter <code className="rounded bg-white px-1">/skills</code>
        — eller last opp en <code className="rounded bg-white px-1">.skill</code>-pakke.
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
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={laster}
            className="rounded-lg bg-[#191C1F] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {laster ? "Henter…" : "Hent /skills"}
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#F6F5F1] px-3 py-2 text-sm"
            onClick={() => skillFilRef.current?.click()}
          >
            Last opp .skill
          </button>
          <input
            ref={skillFilRef}
            type="file"
            accept=".skill,application/zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importerSkillFil(file);
            }}
          />
        </div>
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

      <Seksjon tittel="Slik bruker KI plattformen">
        {plattform.length === 0 ? (
          <p className="text-sm text-[#191C1F]/60">Ingen plattform-skills lastet.</p>
        ) : (
          <ul className="space-y-2">
            {plattform.map((s) => (
              <SkillKort
                key={s.id}
                skill={s}
                fag={fag}
                apen={apen === s.id}
                onToggle={() => setApen((id) => (id === s.id ? null : s.id))}
                onKopier={kopier}
                apenRef={apen}
                setApen={setApen}
              />
            ))}
          </ul>
        )}
      </Seksjon>

      <Seksjon tittel="Fagskills og referanser">
        {fagSkills.length === 0 ? (
          <p className="text-sm text-[#191C1F]/60">Ingen fagskills ennå. Last opp en .skill-pakke.</p>
        ) : (
          <ul className="space-y-2">
            {fagSkills.map((s) => (
              <SkillKort
                key={s.id}
                skill={s}
                fag={fag}
                apen={apen === s.id}
                onToggle={() => setApen((id) => (id === s.id ? null : s.id))}
                onKopier={kopier}
                apenRef={apen}
                setApen={setApen}
              />
            ))}
          </ul>
        )}
      </Seksjon>

      {promptBare.length > 0 && (
        <Seksjon tittel="Øvrige prompter">
          <ul className="space-y-2">
            {promptBare.map((p) => (
              <li key={p.id} className="rounded-2xl bg-white px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{p.navn}</p>
                    <p className="mt-1 text-sm text-[#191C1F]/70">{p.beskrivelse}</p>
                    <p className="mt-1 text-xs text-[#191C1F]/45">
                      {kildeEtikett(p.kilde)}
                      {p.fagIds?.length ? ` · ${fagEtikett(p.fagIds, fag)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                      onClick={() => kopier(p.innhold, p.navn)}
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
        </Seksjon>
      )}
    </div>
  );
}

function Seksjon({ tittel, children }: { tittel: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
        {tittel}
      </h2>
      {children}
    </section>
  );
}

function SkillKort({
  skill,
  fag,
  apen,
  onToggle,
  onKopier,
  apenRef,
  setApen,
}: {
  skill: Skill;
  fag: { id: string; kode: string }[];
  apen: boolean;
  onToggle: () => void;
  onKopier: (tekst: string, navn: string) => void;
  apenRef: string | null;
  setApen: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <li className="rounded-2xl bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{skill.navn}</p>
          <p className="mt-1 text-sm text-[#191C1F]/70">{skill.beskrivelse}</p>
          <p className="mt-1 text-xs text-[#191C1F]/45">
            {kildeEtikett(skill.kilde)} · {fagEtikett(skill.fagIds, fag)}
            {skill.referanser.length > 0 ? ` · ${skill.referanser.length} referanser` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
            onClick={() => onKopier(skill.markdown, skill.navn)}
          >
            Kopier
          </button>
          <button type="button" className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm" onClick={onToggle}>
            {apen ? "Skjul" : "Vis"}
          </button>
        </div>
      </div>
      {apen && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#F6F5F1] p-3 text-xs leading-relaxed">
          {skill.markdown}
        </pre>
      )}
      {skill.referanser.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-[#191C1F]/8 pt-3">
          {skill.referanser.map((r) => {
            const refKey = `${skill.id}:${r.id}`;
            const vis = apenRef === refKey;
            return (
              <li key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">{r.navn}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-[#F6F5F1] px-2 py-1 text-xs"
                      onClick={() => onKopier(r.markdown, r.navn)}
                    >
                      Kopier
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-[#F6F5F1] px-2 py-1 text-xs"
                      onClick={() => setApen((id) => (id === refKey ? null : refKey))}
                    >
                      {vis ? "Skjul" : "Vis"}
                    </button>
                  </div>
                </div>
                {vis && (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#F6F5F1] p-3 text-xs leading-relaxed">
                    {r.markdown}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
