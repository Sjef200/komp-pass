import type { Prompt, PromptKatalogRad } from "./types";
import { parseSkillMarkdown } from "./skill-import";
import katalog from "../data/prompts/index.json";
import horingSvake from "../data/prompts/horing-svake-temaer/SKILL.md?raw";
import fagordStatus from "../data/prompts/fagord-status/SKILL.md?raw";

const BODIES: Record<string, string> = {
  "horing-svake-temaer": horingSvake,
  "fagord-status": fagordStatus,
};

export function seedPrompts(): Prompt[] {
  return (katalog.prompts as PromptKatalogRad[]).map((rad) => {
    const raw = BODIES[rad.id] ?? "";
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    return {
      id: rad.id,
      navn: rad.navn,
      beskrivelse: rad.beskrivelse,
      innhold: parset?.innhold ?? "",
      kilde: rad.kilde,
      kildeUrl: rad.kildeUrl,
      importert: rad.importert,
    };
  });
}
