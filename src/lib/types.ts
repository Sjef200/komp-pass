export type FagId =
  | "male1"
  | "male2"
  | "entrep1"
  | "entrep2"
  | "norsk-hovedmal"
  | "norsk-muntlig";
export type Karakter = 1 | 2 | 3 | 4 | 5 | 6;
export type Kilde = "claude" | "selv" | "larer" | "ai";
export type FagordStatus = "ny" | "usikker" | "sitter";
export type MaalStatus = "udekket" | "svak" | "ok" | "sterk";
export type AiInnsats = "lav" | "medium" | "hoy" | "maks";
export type PromptKilde = "lokal" | "plattform" | "github";
export type SkillKategori = "plattform" | "fag" | "prompt";
export type UdirStatus = "ok" | "cache" | "rate-limited" | "feil";

export const FAG_IDS: FagId[] = [
  "male1",
  "male2",
  "entrep1",
  "entrep2",
  "norsk-hovedmal",
  "norsk-muntlig",
];

export function erFagId(value: string): value is FagId {
  return (FAG_IDS as string[]).includes(value);
}

export type Fag = {
  id: FagId;
  navn: string;
  kode: string;
  emoji: string;
  apiUrl?: string;
  laereplanKode?: string;
  kompetansemaalsettKode?: string;
  kompetansemaalsettUrl?: string;
  spraak?: string;
  sistEndret?: string;
};

export type Kompetansemaal = {
  id: string;
  fagId: string;
  kortnavn: string;
  tekst: string;
  emoji: string;
  udirKode?: string;
  apiUrl?: string;
  spraak?: string;
  sistEndret?: string;
};

export type Tema = {
  id: string;
  fagId: string;
  navn: string;
  emoji: string;
  maalIds: string[];
  kapittel?: string;
};

export type AiProveniens = {
  modell: string;
  innsats: AiInnsats;
  promptId: string;
  promptNavn: string;
};

export type Horing = {
  id: string;
  temaId: string;
  dato: string;
  karakter: Karakter;
  riktig: string;
  mangler: string;
  kilde: Kilde;
  ai?: AiProveniens;
};

export type Fagord = {
  id: string;
  term: string;
  forklaring: string;
  temaIds: string[];
  status: FagordStatus;
  sisteFeil?: string;
  ai?: AiProveniens;
};

export type SkillReference = {
  id: string;
  navn: string;
  sti: string;
  markdown: string;
};

export type Skill = {
  id: string;
  navn: string;
  beskrivelse: string;
  markdown: string;
  kilde: PromptKilde;
  kildeUrl?: string;
  importert?: string;
  fagIds: FagId[];
  referanser: SkillReference[];
  kategori: SkillKategori;
};

export type SkillKatalogRad = {
  id: string;
  fil: string;
  navn: string;
  beskrivelse: string;
  kilde: PromptKilde;
  kildeUrl?: string;
  importert?: string;
  fagIds?: FagId[];
  kategori?: SkillKategori;
  referanser?: Array<{ id: string; navn: string; sti: string }>;
};

export type Prompt = {
  id: string;
  navn: string;
  beskrivelse: string;
  innhold: string;
  kilde: PromptKilde;
  kildeUrl?: string;
  importert?: string;
  fagIds?: FagId[];
};

export type PromptKatalogRad = {
  id: string;
  fil: string;
  navn: string;
  beskrivelse: string;
  kilde: PromptKilde;
  kildeUrl?: string;
  importert?: string;
  fagIds?: FagId[];
};

export type Innstillinger = {
  aktivtFag: string;
  visEmoji: boolean;
};

export type AiOverlay = {
  horinger?: Horing[];
  fagord?: Fagord[];
  prompts?: Prompt[];
};

export type AppState = {
  fag: Fag[];
  kompetansemaal: Kompetansemaal[];
  temaer: Tema[];
  horinger: Horing[];
  fagord: Fagord[];
  prompts: Prompt[];
  skills: Skill[];
  innstillinger: Innstillinger;
};

export type PersistedState = Partial<AppState>;
