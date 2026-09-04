import fs from "node:fs";
import path from "node:path";
import { tolkUdirHttpFeil, velgKompetansemaalsett } from "../src/lib/udir.ts";

const API = "https://data.udir.no/kl06/v201906";
const root = process.cwd();
const dataDir = path.join(root, "src", "data");

type Ref = { kode?: string; "url-data"?: string; tittel?: string; status?: string };
type CompetenceGoal = { kode: string; tittel: unknown; id: string; "sist-endret"?: string };
type GoalSet = {
  kode: string;
  tittel: Array<{ spraak: string; verdi: string }>;
  status?: string;
  "kompetansemaal-overskrift"?: Array<{ spraak: string; verdi: string }>;
  kompetansemaal: Ref[];
  "sist-endret"?: string;
};
type TrainingSubject = {
  "laereplan-referanse"?: Array<{
    kode?: string;
    "tilhoerende-kompetansemaalsett"?: Ref[];
  }>;
};

const subjects = [
  { id: "male1", name: "Markedsføring og ledelse 1", code: "SAM3045", emoji: "📊", laereplanKode: "MFL01-04" },
  { id: "male2", name: "Markedsføring og ledelse 2", code: "SAM3046", emoji: "📈", laereplanKode: "MFL01-04" },
  { id: "entrep1", name: "Entreprenørskap og bedriftsutvikling 1", code: "SAM3063", emoji: "💡", laereplanKode: "ENT01-03" },
  { id: "entrep2", name: "Entreprenørskap og bedriftsutvikling 2", code: "SAM3064", emoji: "🚀", laereplanKode: "ENT01-03" },
  { id: "norsk-hovedmal", name: "Norsk hovedmål", code: "NOR1267", emoji: "✍️", laereplanKode: "NOR01-08" },
  { id: "norsk-muntlig", name: "Norsk muntlig", code: "NOR1269", emoji: "🎙️", laereplanKode: "NOR01-08" },
] as const;

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  const key = process.env.UDIR_API_KEY;
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    const err = new Error(`Udir API svarte ${response.status} for ${url}`) as Error & { status: number };
    err.status = response.status;
    throw err;
  }
  return response.json() as Promise<T>;
}

function harCache(): boolean {
  return fs.existsSync(path.join(dataDir, "kompetansemaal.json"));
}

function skrivMeta(patch: Record<string, unknown>): void {
  const fil = path.join(dataDir, "udir-meta.json");
  const forrige = fs.existsSync(fil)
    ? (JSON.parse(fs.readFileSync(fil, "utf8")) as Record<string, unknown>)
    : {};
  fs.writeFileSync(fil, `${JSON.stringify({ ...forrige, ...patch }, null, 2)}\n`);
}

function norskTekst(items: unknown): string {
  if (typeof items === "string") return items;
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return norskTekst((items as { tekst?: unknown }).tekst);
  }
  if (!Array.isArray(items)) return "";
  const values = items.filter(
    (item): item is { spraak: string; verdi: string } =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as { spraak?: unknown }).spraak === "string" &&
      typeof (item as { verdi?: unknown }).verdi === "string",
  );
  return (
    values.find((item) => item.spraak === "nob")?.verdi ??
    values.find((item) => item.spraak === "default")?.verdi ??
    values[0]?.verdi ??
    ""
  );
}

async function main(): Promise<void> {
  const goalSets = new Map<string, GoalSet>();
  const kompetansemaal: Array<{
    id: string;
    fagId: string;
    kortnavn: string;
    tekst: string;
    emoji: string;
    udirKode: string;
    apiUrl: string;
    spraak: string;
    sistEndret?: string;
  }> = [];
  const fagUt: Array<{
    id: string;
    navn: string;
    kode: string;
    emoji: string;
    apiUrl: string;
    laereplanKode: string;
    kompetansemaalsettKode: string;
    kompetansemaalsettUrl: string;
    spraak: string;
    sistEndret: string;
  }> = [];

  const hentet = new Date().toISOString();

  try {
    for (const subject of subjects) {
      const fagkode = await get<{
        opplaeringsfag?: Ref[];
        tittel?: Array<{ spraak: string; verdi: string }>;
      }>(`${API}/fagkoder/${subject.code}`);
      const opplaeringskode = fagkode.opplaeringsfag?.[0]?.kode;
      if (!opplaeringskode) throw new Error(`Fant ikke opplæringsfag for ${subject.code}`);

      const opplaeringsfag = await get<TrainingSubject>(`${API}/opplaeringsfag/${opplaeringskode}`);
      const sets =
        opplaeringsfag["laereplan-referanse"]?.flatMap(
          (reference) => reference["tilhoerende-kompetansemaalsett"] ?? [],
        ) ?? [];
      const setRef = velgKompetansemaalsett(sets);
      if (!setRef?.kode) throw new Error(`Fant ikke kompetansemålsett for ${subject.code}`);

      let set = goalSets.get(setRef.kode);
      if (!set) {
        set = await get<GoalSet>(`${API}/kompetansemaalsett-lk20/${setRef.kode}`);
        goalSets.set(setRef.kode, set);
      }

      fagUt.push({
        id: subject.id,
        navn: subject.name,
        kode: subject.code,
        emoji: subject.emoji,
        apiUrl: `${API}/fagkoder/${subject.code}`,
        laereplanKode: subject.laereplanKode,
        kompetansemaalsettKode: set.kode,
        kompetansemaalsettUrl: `${API}/kompetansemaalsett-lk20/${set.kode}`,
        spraak: "nob",
        sistEndret: set["sist-endret"] ?? hentet,
      });

      for (let index = 0; index < set.kompetansemaal.length; index += 1) {
        const ref = set.kompetansemaal[index];
        if (!ref.kode) continue;
        const goal = await get<CompetenceGoal>(`${API}/kompetansemaal-lk20/${ref.kode}`);
        const text = norskTekst(goal.tittel);
        kompetansemaal.push({
          id: `${subject.id}-${String(index + 1).padStart(2, "0")}`,
          fagId: subject.id,
          kortnavn: text.length > 72 ? `${text.slice(0, 69)}…` : text,
          tekst: text,
          emoji: subject.emoji,
          udirKode: goal.kode,
          apiUrl: `${API}/kompetansemaal-lk20/${goal.kode}`,
          spraak: "nob",
          sistEndret: goal["sist-endret"],
        });
      }
    }
  } catch (e) {
    const status = typeof e === "object" && e && "status" in e ? Number((e as { status: number }).status) : 0;
    const tolket = status ? tolkUdirHttpFeil(status, harCache()) : {
      status: harCache() ? "feil" as const : "feil" as const,
      feilmelding: e instanceof Error ? e.message : "Ukjent Udir-feil.",
    };
    skrivMeta({
      status: tolket.status,
      feilmelding: tolket.feilmelding,
    });
    console.error(tolket.feilmelding ?? (e instanceof Error ? e.message : "Udir-feil"));
    process.exitCode = harCache() ? 0 : 1;
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "fag.json"), `${JSON.stringify(fagUt, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dataDir, "kompetansemaal.json"),
    `${JSON.stringify(kompetansemaal, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dataDir, "udir-meta.json"),
    `${JSON.stringify(
      {
        api: API,
        hentet,
        status: "ok",
        feilmelding: null,
        kilde: "Udir Grep REST (NLOD)",
        merknad:
          "Anonyme kall kan rate-limites fra september 2026. Appen bruker denne cachen, ikke live API i UI.",
        fag: fagUt.map((f) => ({
          id: f.id,
          fagkode: f.kode,
          laereplanKode: f.laereplanKode,
          kompetansemaalsettKode: f.kompetansemaalsettKode,
          spraak: f.spraak,
          apiUrl: f.apiUrl,
        })),
        kompetansemaalsett: [...goalSets.values()].map((set) => ({
          kode: set.kode,
          navn: norskTekst(set.tittel),
          apiUrl: `${API}/kompetansemaalsett-lk20/${set.kode}`,
          antall: set.kompetansemaal.length,
          spraak: "nob",
        })),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `Hentet ${kompetansemaal.length} kompetansemål for ${subjects.length} fag fra Udir Grep. horinger.json, fagord.json og ai-overlay.json er urørt.`,
  );
}

await main();
