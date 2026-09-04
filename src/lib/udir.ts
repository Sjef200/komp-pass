import type { UdirStatus } from "./types";

export type UdirMetaStatus = {
  status: UdirStatus;
  feilmelding: string | null;
  hentet?: string;
};

export function tolkUdirHttpFeil(status: number, harCache: boolean): UdirMetaStatus {
  if (status === 429) {
    return {
      status: harCache ? "rate-limited" : "feil",
      feilmelding: harCache
        ? "Udir rate-limitet anonyme kall. Bruker lokal cache."
        : "Udir rate-limitet anonyme kall. Sett UDIR_API_KEY og prøv igjen.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      status: harCache ? "cache" : "feil",
      feilmelding: "Udir krevde API-nøkkel. Bruker lokal cache hvis den finnes. Sett UDIR_API_KEY.",
    };
  }
  return {
    status: harCache ? "cache" : "feil",
    feilmelding: `Udir API svarte ${status}. Bruker lokal cache hvis den finnes.`,
  };
}

export function velgKompetansemaalsett<T extends { kode?: string; status?: string }>(
  sets: T[],
): T | undefined {
  const gyldige = sets.filter((s) => {
    const status = (s.status ?? "").toLowerCase();
    if (!s.kode) return false;
    if (status.includes("utgatt") || status.includes("utgått") || status.includes("expired") || status.includes("opphevet")) {
      return false;
    }
    return true;
  });
  return gyldige[0] ?? sets.find((s) => s.kode);
}
