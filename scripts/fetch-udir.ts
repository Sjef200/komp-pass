import fs from "node:fs";
import path from "node:path";

const API = "https://data.udir.no/kl06/v201906";
const root = process.cwd();
const dataDir = path.join(root, "src", "data");

type Ref = { kode?: string; "url-data"?: string; tittel?: string };
type CompetenceGoal = { kode: string; tittel: unknown; id: string };
type GoalSet = {
  kode: string;
  tittel: Array<{ spraak: string; verdi: string }>;
  "kompetansemaal-overskrift"?: Array<{ spraak: string; verdi: string }>;
  kompetansemaal: Ref[];
};
type TrainingSubject = {
  "laereplan-referanse"?: Array<{
    "tilhoerende-kompetansemaalsett"?: Ref[];
  }>;
};

const subjects = [
  { id: "male1", name: "Markedsføring og ledelse 1", code: "SAM3045", emoji: "📊" },
  { id: "male2", name: "Markedsføring og ledelse 2", code: "SAM3046", emoji: "📈" },
  { id: "entrep1", name: "Entreprenørskap og bedriftsutvikling 1", code: "SAM3063", emoji: "💡" },
  { id: "entrep2", name: "Entreprenørskap og bedriftsutvikling 2", code: "SAM3064", emoji: "🚀" },
  { id: "norsk-hovedmal", name: "Norsk hovedmål", code: "NOR1267", emoji: "✍️" },
  { id: "norsk-muntlig", name: "Norsk muntlig", code: "NOR1269", emoji: "🎙️" },
] as const;

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Udir API svarte ${response.status} for ${url}`);
  }
  return response.json() as Promise<T>;
}

function norskTekst(
  items: unknown,
): string {
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
  return values.find((item) => item.spraak === "nob")?.verdi ??
    values.find((item) => item.spraak === "default")?.verdi ??
    values[0]?.verdi ??
    "";
}

async function main(): Promise<void> {
  const fag = subjects.map(({ id, name, code, emoji }) => ({
    id,
    navn: name,
    kode: code,
    emoji,
    apiUrl: `${API}/fagkoder/${code}`,
  }));

  const goalSets = new Map<string, GoalSet>();
  const kompetansemaal: Array<{
    id: string;
    fagId: string;
    kortnavn: string;
    tekst: string;
    emoji: string;
    udirKode: string;
    apiUrl: string;
  }> = [];

  for (const subject of subjects) {
    const fagkode = await get<{
      opplaeringsfag?: Ref[];
      tittel?: Array<{ spraak: string; verdi: string }>;
    }>(`${API}/fagkoder/${subject.code}`);
    const opplaeringskode = fagkode.opplaeringsfag?.[0]?.kode;
    if (!opplaeringskode) throw new Error(`Fant ikke opplæringsfag for ${subject.code}`);

    const opplaeringsfag = await get<TrainingSubject>(
      `${API}/opplaeringsfag/${opplaeringskode}`,
    );
    const sets =
      opplaeringsfag["laereplan-referanse"]?.flatMap(
        (reference) => reference["tilhoerende-kompetansemaalsett"] ?? [],
      ) ?? [];
    const setRef = sets.find((ref) => ref.kode);
    if (!setRef?.kode) throw new Error(`Fant ikke kompetansemålsett for ${subject.code}`);

    let set = goalSets.get(setRef.kode);
    if (!set) {
      set = await get<GoalSet>(
        `${API}/kompetansemaalsett-lk20/${setRef.kode}`,
      );
      goalSets.set(setRef.kode, set);
    }

    for (let index = 0; index < set.kompetansemaal.length; index += 1) {
      const ref = set.kompetansemaal[index];
      if (!ref.kode) continue;
      const goal = await get<CompetenceGoal>(
        `${API}/kompetansemaal-lk20/${ref.kode}`,
      );
      const text = norskTekst(goal.tittel);
      kompetansemaal.push({
        id: `${subject.id}-${String(index + 1).padStart(2, "0")}`,
        fagId: subject.id,
        kortnavn: text.length > 72 ? `${text.slice(0, 69)}…` : text,
        tekst: text,
        emoji: subject.emoji,
        udirKode: goal.kode,
        apiUrl: `${API}/kompetansemaal-lk20/${goal.kode}`,
      });
    }
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "fag.json"),
    `${JSON.stringify(fag, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dataDir, "kompetansemaal.json"),
    `${JSON.stringify(kompetansemaal, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dataDir, "udir-meta.json"),
    `${JSON.stringify(
      {
        api: API,
        hentet: new Date().toISOString(),
        fag: subjects.map((subject) => ({
          id: subject.id,
          fagkode: subject.code,
          apiUrl: `${API}/fagkoder/${subject.code}`,
        })),
        kompetansemaalsett: [...goalSets.values()].map((set) => ({
          kode: set.kode,
          navn: norskTekst(set.tittel),
          apiUrl: `${API}/kompetansemaalsett-lk20/${set.kode}`,
          antall: set.kompetansemaal.length,
        })),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `Hentet ${kompetansemaal.length} kompetansemål for ${subjects.length} fag fra Udir Grep.`,
  );
}

await main();
