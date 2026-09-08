import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AiOverlay,
  AppState,
  FagordStatus,
  Horing,
  Innstillinger,
  PersistedState,
  Prompt,
  Skill,
} from "./types";
import {
  horingTilHendelse,
  observerFagordIState,
  type Hendelse,
  type KoblingAvgjort,
} from "./hendelser";
import { nyId } from "./format";
import { harSupabase, supabase } from "./supabase";
import { lesTilstand as lesSkyTilstand, skrivHendelser as skrivSkyHendelser } from "./supabase-data";
import {
  baseState,
  erGyldigTilstand,
  lagreInnstillinger,
  lastState,
  lesInnstillinger,
  lesUmigrertTilstand,
  mergeState,
  seedAiOverlay,
} from "./store";

export type KoblingTekst = { tekst: string; kildeId: string; tid?: string; side?: number };

type HmrPayload = {
  overlay?: AiOverlay;
  koblingTekster?: Record<string, KoblingTekst>;
  prompts?: Prompt[];
  skills?: Skill[];
};

type StoreApi = {
  state: AppState;
  appendHoring: (horing: Horing) => Promise<void>;
  setFagordStatus: (id: string, status: FagordStatus, sisteFeil?: string) => Promise<void>;
  setInnstillinger: (patch: Partial<Innstillinger>) => void;
  importer: (raw: unknown) => Promise<void>;
  eksporter: () => AppState;
  /** Satt når databasen ikke svarer. Da er ingenting lagret. */
  lagringsfeil: string | null;
  /** Læringsdata som fortsatt ligger i nettleseren og ikke i databasen. */
  umigrert: PersistedState | null;
  /** Tekstbitene koblingene peker på, slik at forslag kan vurderes i UI. */
  koblingTekster: Record<string, KoblingTekst>;
  avgjorKobling: (koblingId: string, bekreftet: boolean) => Promise<void>;
  /** E-posten til den innloggede, eller null. */
  innlogget: string | null;
  loggUt: () => Promise<void>;
  /** Sant når verken sesjon eller lokal API finnes — da må du logge inn. */
  krevInnlogging: boolean;
  klar: boolean;
};

const StoreContext = createContext<StoreApi | null>(null);

const LAGRINGSFEIL =
  "Kunne ikke lagre. Databasen nås gjennom utviklingsserveren — kjører «npm run dev»?";

async function postHendelser(hendelser: Hendelse[]): Promise<Hendelse[]> {
  const res = await fetch("/api/hendelser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hendelser }),
  });
  if (!res.ok) {
    const kropp = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(kropp?.error ?? LAGRINGSFEIL);
  }
  const kropp = (await res.json()) as { hendelser?: Hendelse[] };
  return kropp.hendelser ?? [];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [aiOverlay, setAiOverlay] = useState<AiOverlay>(() => seedAiOverlay());
  const [diskSkills, setDiskSkills] = useState<Skill[] | null>(null);
  const [state, setState] = useState<AppState>(() => lastState(seedAiOverlay()));
  const [lagringsfeil, setLagringsfeil] = useState<string | null>(null);
  const [umigrert] = useState<PersistedState | null>(() => lesUmigrertTilstand());
  const [koblingTekster, setKoblingTekster] = useState<Record<string, KoblingTekst>>({});
  const [innlogget, setInnlogget] = useState<string | null>(null);
  // null = ennå ukjent. Avgjør om vi kan falle tilbake til lokal drift.
  const [harApi, setHarApi] = useState<boolean | null>(null);
  const [klar, setKlar] = useState(false);
  const skills = useRef<Skill[] | null>(null);

  useEffect(() => {
    skills.current = diskSkills;
  }, [diskSkills]);

  const byggPaNytt = useCallback((overlay: AiOverlay, nyeSkills?: Skill[]) => {
    setAiOverlay(overlay);
    if (nyeSkills) setDiskSkills(nyeSkills);
    const base = baseState();
    const brukSkills = nyeSkills ?? skills.current;
    if (brukSkills) base.skills = brukSkills;
    setState(mergeState(base, lesInnstillinger(), overlay));
  }, []);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onOverlay = (data: HmrPayload) => {
      if (data.koblingTekster) setKoblingTekster(data.koblingTekster);
      byggPaNytt(
        {
          ...(data.overlay ?? {}),
          prompts: data.prompts ?? data.overlay?.prompts,
        },
        data.skills,
      );
    };
    hot.on("mfl:ai-overlay", onOverlay);
    return () => {
      hot.dispose(() => undefined);
    };
  }, [byggPaNytt]);

  const lastFraSky = useCallback(async () => {
    const { hendelser, kilder, koblingTekster: tekster } = await lesSkyTilstand();
    setKoblingTekster(tekster);
    byggPaNytt({ hendelser, kilder });
  }, [byggPaNytt]);

  const lastFraApi = useCallback(async (): Promise<boolean> => {
    const res = await fetch("/api/tilstand").catch(() => null);
    if (!res?.ok) return false;
    // Utplassert svarer SPA-fallbacken 200 med HTML på ukjente stier. Uten
    // denne sjekken ville json() kastet, og appen blitt stående på «Laster».
    if (!res.headers.get("content-type")?.includes("application/json")) return false;
    const data = (await res.json()) as HmrPayload & {
      hendelser?: Hendelse[];
      kilder?: AiOverlay["kilder"];
    };
    if (data.koblingTekster) setKoblingTekster(data.koblingTekster);
    byggPaNytt(
      {
        hendelser: data.hendelser ?? [],
        kilder: data.overlay?.kilder ?? data.kilder,
        prompts: data.prompts,
      },
      Array.isArray(data.skills) ? data.skills : undefined,
    );
    return true;
  }, [byggPaNytt]);

  /**
   * Sesjon vinner over lokal API. Uten begge deler må du logge inn — det er
   * derfor den utplasserte siden ikke er åpen for alle.
   */
  useEffect(() => {
    let avbrutt = false;

    async function start() {
      let epost: string | null = null;
      if (harSupabase()) {
        const { data } = await supabase().auth.getSession();
        epost = data.session?.user.email ?? null;
      }
      if (avbrutt) return;
      setInnlogget(epost);

      if (epost) {
        await lastFraSky().catch(() => undefined);
        if (!avbrutt) {
          setHarApi(true);
          setKlar(true);
        }
        return;
      }
      const svarte = await lastFraApi();
      if (avbrutt) return;
      setHarApi(svarte);
      setKlar(true);
    }

    // Uansett hva som feiler skal porten vises, ikke en evig lasteskjerm.
    void start().catch(() => {
      if (!avbrutt) setKlar(true);
    });

    if (!harSupabase()) return () => { avbrutt = true; };
    const { data: lytter } = supabase().auth.onAuthStateChange((_h, sesjon) => {
      const epost = sesjon?.user.email ?? null;
      setInnlogget(epost);
      if (epost) void lastFraSky().catch(() => undefined);
    });
    return () => {
      avbrutt = true;
      lytter.subscription.unsubscribe();
    };
  }, [lastFraApi, lastFraSky]);

  const lagre = useCallback(
    async (hendelser: Hendelse[]) => {
      try {
        if (innlogget) {
          await skrivSkyHendelser(hendelser);
          await lastFraSky();
        } else {
          const alle = await postHendelser(hendelser);
          byggPaNytt({ ...aiOverlay, hendelser: alle });
        }
        setLagringsfeil(null);
      } catch (e) {
        setLagringsfeil(e instanceof Error ? e.message : LAGRINGSFEIL);
      }
    },
    [aiOverlay, byggPaNytt, innlogget, lastFraSky],
  );

  const appendHoring = useCallback(
    async (horing: Horing) => {
      const tema = state.temaer.find((t) => t.id === horing.temaId);
      if (!tema) {
        setLagringsfeil(`Ukjent tema: ${horing.temaId}`);
        return;
      }
      await lagre([horingTilHendelse(horing, tema.fagId)]);
    },
    [lagre, state.temaer],
  );

  const setFagordStatus = useCallback(
    async (id: string, status: FagordStatus, sisteFeil?: string) => {
      const neste = observerFagordIState(state, id, status, sisteFeil);
      const observasjon = neste.hendelser.at(-1);
      if (!observasjon) return;
      await lagre([observasjon]);
    },
    [lagre, state],
  );

  const avgjorKobling = useCallback(
    async (koblingId: string, bekreftet: boolean) => {
      const kobling = state.koblinger.find((k) => k.id === koblingId);
      if (!kobling) return;
      const hendelse: KoblingAvgjort = {
        id: nyId("k-avgjort"),
        type: "kobling-avgjort",
        tid: new Date().toISOString(),
        fagId: kobling.fagId,
        kilde: "selv",
        koblingId,
        bekreftet,
      };
      await lagre([hendelse]);
    },
    [lagre, state.koblinger],
  );

  const setInnstillinger = useCallback((patch: Partial<Innstillinger>) => {
    setState((prev) => {
      const innstillinger = { ...prev.innstillinger, ...patch };
      lagreInnstillinger(innstillinger);
      return { ...prev, innstillinger };
    });
  }, []);

  const importer = useCallback(
    async (raw: unknown) => {
      if (!erGyldigTilstand(raw)) {
        throw new Error("Filen ser ikke ut som en MFL-tilstand.");
      }
      const inn = raw as PersistedState;
      const temaer = state.temaer;
      const fraHoringer = (inn.horinger ?? []).flatMap((h) => {
        const tema = temaer.find((t) => t.id === h.temaId);
        return tema ? [horingTilHendelse(h, tema.fagId)] : [];
      });
      const hendelser = [...fraHoringer, ...(inn.hendelser ?? [])];
      if (hendelser.length === 0) {
        setLagringsfeil("Filen inneholdt ingen høringer eller hendelser å importere.");
        return;
      }
      await lagre(hendelser);
    },
    [lagre, state.temaer],
  );

  const loggUt = useCallback(async () => {
    if (harSupabase()) await supabase().auth.signOut();
    setInnlogget(null);
    setKoblingTekster({});
    byggPaNytt({ hendelser: [], kilder: [] });
  }, [byggPaNytt]);

  const eksporter = useCallback(() => state, [state]);

  const krevInnlogging = harSupabase() && !innlogget && harApi === false;

  const value = useMemo(
    () => ({
      state,
      appendHoring,
      setFagordStatus,
      setInnstillinger,
      importer,
      eksporter,
      lagringsfeil,
      umigrert,
      koblingTekster,
      avgjorKobling,
      innlogget,
      loggUt,
      krevInnlogging,
      klar,
    }),
    [
      state,
      appendHoring,
      setFagordStatus,
      setInnstillinger,
      importer,
      eksporter,
      lagringsfeil,
      umigrert,
      koblingTekster,
      avgjorKobling,
      innlogget,
      loggUt,
      krevInnlogging,
      klar,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore må brukes inni StoreProvider");
  return ctx;
}
