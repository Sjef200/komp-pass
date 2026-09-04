import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  appendHoringIState,
  erGyldigTilstand,
  lagreOverlay,
  lastState,
  lesOverlay,
  mergeState,
  baseState,
  seedAiOverlay,
  settFagordIState,
} from "./store";

type HmrPayload = {
  overlay?: AiOverlay;
  prompts?: Prompt[];
  skills?: Skill[];
};

type StoreApi = {
  state: AppState;
  appendHoring: (horing: Horing) => void;
  setFagordStatus: (id: string, status: FagordStatus, sisteFeil?: string) => void;
  setInnstillinger: (patch: Partial<Innstillinger>) => void;
  importer: (raw: unknown) => void;
  eksporter: () => AppState;
  settPromptsFraDisk: (prompts: Prompt[]) => void;
  settBibliotekFraDisk: (prompts: Prompt[], skills?: Skill[]) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

function skriv(next: AppState): AppState {
  lagreOverlay(next);
  return next;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [aiOverlay, setAiOverlay] = useState<AiOverlay>(() => seedAiOverlay());
  const [diskSkills, setDiskSkills] = useState<Skill[] | null>(null);
  const [state, setState] = useState<AppState>(() => lastState(seedAiOverlay()));

  const byggPaNytt = useCallback((overlay: AiOverlay, skills?: Skill[]) => {
    setAiOverlay(overlay);
    if (skills) setDiskSkills(skills);
    const base = baseState();
    if (skills) base.skills = skills;
    else if (diskSkills) base.skills = diskSkills;
    setState(mergeState(base, lesOverlay(), overlay));
  }, [diskSkills]);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onOverlay = (data: HmrPayload) => {
      const overlay: AiOverlay = {
        ...(data.overlay ?? {}),
        prompts: data.prompts ?? data.overlay?.prompts,
      };
      byggPaNytt(overlay, data.skills);
    };
    hot.on("mfl:ai-overlay", onOverlay);
    return () => {
      hot.dispose(() => undefined);
    };
  }, [byggPaNytt]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let avbrutt = false;
    Promise.all([
      fetch("/api/prompts").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/skills").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([prompts, skills]: [Prompt[] | null, Skill[] | null]) => {
        if (avbrutt) return;
        setAiOverlay((prev) => {
          const next = { ...prev, prompts: Array.isArray(prompts) ? prompts : prev.prompts };
          const base = baseState();
          if (Array.isArray(skills)) {
            setDiskSkills(skills);
            base.skills = skills;
          }
          setState(mergeState(base, lesOverlay(), next));
          return next;
        });
      })
      .catch(() => {
        /* preview uten middleware */
      });
    return () => {
      avbrutt = true;
    };
  }, []);

  const appendHoring = useCallback((horing: Horing) => {
    setState((prev) => skriv(appendHoringIState(prev, horing)));
  }, []);

  const setFagordStatus = useCallback(
    (id: string, status: FagordStatus, sisteFeil?: string) => {
      setState((prev) => skriv(settFagordIState(prev, id, { status, sisteFeil })));
    },
    [],
  );

  const setInnstillinger = useCallback((patch: Partial<Innstillinger>) => {
    setState((prev) =>
      skriv({
        ...prev,
        innstillinger: { ...prev.innstillinger, ...patch },
      }),
    );
  }, []);

  const importer = useCallback(
    (raw: unknown) => {
      if (!erGyldigTilstand(raw)) {
        throw new Error("Filen ser ikke ut som en MFL-tilstand.");
      }
      const next = mergeState(baseState(), raw as PersistedState, aiOverlay);
      setState(skriv(next));
    },
    [aiOverlay],
  );

  const settPromptsFraDisk = useCallback((prompts: Prompt[]) => {
    setAiOverlay((prev) => {
      const next = { ...prev, prompts };
      const base = baseState();
      if (diskSkills) base.skills = diskSkills;
      setState(mergeState(base, lesOverlay(), next));
      return next;
    });
  }, [diskSkills]);

  const settBibliotekFraDisk = useCallback((prompts: Prompt[], skills?: Skill[]) => {
    if (skills) setDiskSkills(skills);
    setAiOverlay((prev) => {
      const next = { ...prev, prompts };
      const base = baseState();
      if (skills) base.skills = skills;
      else if (diskSkills) base.skills = diskSkills;
      setState(mergeState(base, lesOverlay(), next));
      return next;
    });
  }, [diskSkills]);

  const eksporter = useCallback(() => state, [state]);

  const value = useMemo(
    () => ({
      state,
      appendHoring,
      setFagordStatus,
      setInnstillinger,
      importer,
      eksporter,
      settPromptsFraDisk,
      settBibliotekFraDisk,
    }),
    [
      state,
      appendHoring,
      setFagordStatus,
      setInnstillinger,
      importer,
      eksporter,
      settPromptsFraDisk,
      settBibliotekFraDisk,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore må brukes inni StoreProvider");
  return ctx;
}
