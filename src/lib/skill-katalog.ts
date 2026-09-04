import type { FagId, Prompt, PromptKatalogRad, Skill, SkillKatalogRad } from "./types";
import { parseSkillMarkdown } from "./skill-import";
import promptKatalog from "../data/prompts/index.json";
import skillKatalog from "../data/skills/index.json";

const bodies = import.meta.glob("../data/{skills,prompts}/**/*.md", {
  query: "?raw",
  eager: true,
  import: "default",
}) as Record<string, string>;

function finnBody(relFraData: string): string {
  const nøkkel = Object.keys(bodies).find((k) =>
    k.replaceAll("\\", "/").endsWith(`/data/${relFraData}`) ||
    k.replaceAll("\\", "/").endsWith(relFraData),
  );
  return nøkkel ? String(bodies[nøkkel]) : "";
}

export function seedPrompts(): Prompt[] {
  return (promptKatalog.prompts as PromptKatalogRad[]).map((rad) => {
    const raw = finnBody(`prompts/${rad.fil}`);
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    return {
      id: rad.id,
      navn: rad.navn,
      beskrivelse: rad.beskrivelse,
      innhold: parset?.innhold ?? "",
      kilde: rad.kilde,
      kildeUrl: rad.kildeUrl,
      importert: rad.importert,
      fagIds: rad.fagIds,
    };
  });
}

export function seedSkills(): Skill[] {
  return (skillKatalog.skills as SkillKatalogRad[]).map((rad) => {
    const raw = finnBody(`skills/${rad.fil}`);
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    const referanser = (rad.referanser ?? []).map((ref) => {
      const refRaw = finnBody(`skills/${ref.sti}`);
      return {
        id: ref.id,
        navn: ref.navn,
        sti: ref.sti,
        markdown: refRaw,
      };
    });
    return {
      id: rad.id,
      navn: rad.navn,
      beskrivelse: rad.beskrivelse,
      markdown: parset?.innhold ?? "",
      kilde: rad.kilde,
      kildeUrl: rad.kildeUrl,
      importert: rad.importert,
      fagIds: (rad.fagIds ?? []) as FagId[],
      referanser,
      kategori: rad.kategori ?? "plattform",
    };
  });
}

export function skillsSomPrompts(skills: Skill[]): Prompt[] {
  return skills.map((s) => ({
    id: s.id,
    navn: s.navn,
    beskrivelse: s.beskrivelse,
    innhold: s.markdown,
    kilde: s.kilde,
    kildeUrl: s.kildeUrl,
    importert: s.importert,
    fagIds: s.fagIds,
  }));
}
