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
};

type StoreApi = {
  state: AppState;
  appendHoring: (horing: Horing) => void;
  setFagordStatus: (id: string, status: FagordStatus, sisteFeil?: string) => void;
  setInnstillinger: (patch: Partial<Innstillinger>) => void;
  importer: (raw: unknown) => void;
  eksporter: () => AppState;
  settPromptsFraDisk: (prompts: Prompt[]) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

function skriv(next: AppState): AppState {
  lagreOverlay(next);
  return next;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [aiOverlay, setAiOverlay] = useState<AiOverlay>(() => seedAiOverlay());
  const [state, setState] = useState<AppState>(() => lastState(seedAiOverlay()));

  const byggPaNytt = useCallback((overlay: AiOverlay) => {
    setAiOverlay(overlay);
    setState(mergeState(baseState(), lesOverlay(), overlay));
  }, []);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onOverlay = (data: HmrPayload) => {
      const overlay: AiOverlay = {
        ...(data.overlay ?? {}),
        prompts: data.prompts ?? data.overlay?.prompts,
      };
      byggPaNytt(overlay);
    };
    hot.on("mfl:ai-overlay", onOverlay);
    return () => {
      hot.dispose(() => undefined);
    };
  }, [byggPaNytt]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let avbrutt = false;
    fetch("/api/prompts")
      .then((r) => (r.ok ? r.json() : null))
      .then((prompts: Prompt[] | null) => {
        if (avbrutt || !Array.isArray(prompts)) return;
        setAiOverlay((prev) => {
          const next = { ...prev, prompts };
          setState(mergeState(baseState(), lesOverlay(), next));
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
      setState(mergeState(baseState(), lesOverlay(), next));
      return next;
    });
  }, []);

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
    }),
    [
      state,
      appendHoring,
      setFagordStatus,
      setInnstillinger,
      importer,
      eksporter,
      settPromptsFraDisk,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore må brukes inni StoreProvider");
  return ctx;
}
