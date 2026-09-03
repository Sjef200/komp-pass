export function formatDato(iso: string): string {
  const day = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function iDagIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nyId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** ISO-uke som YYYY-Www, mandag som ukestart. */
export function isoUkeNokkel(iso: string): string {
  const day = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const date = new Date(`${day}T12:00:00`);
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function ukeEtikett(nokkel: string): string {
  const [year, week] = nokkel.split("-W");
  return `Uke ${Number(week)} ${year}`;
}

export const KILDE_LABEL: Record<string, string> = {
  claude: "Claude",
  selv: "Selv",
  larer: "Lærer",
};
