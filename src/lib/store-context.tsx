import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState, FagordStatus, Horing, Innstillinger, PersistedState } from "./types";
import {
  appendHoringIState,
  erGyldigTilstand,
  lagreOverlay,
  lastState,
  mergeState,
  baseState,
  settFagordIState,
} from "./store";

type StoreApi = {
  state: AppState;
  appendHoring: (horing: Horing) => void;
  setFagordStatus: (id: string, status: FagordStatus, sisteFeil?: string) => void;
  setInnstillinger: (patch: Partial<Innstillinger>) => void;
  importer: (raw: unknown) => void;
  eksporter: () => AppState;
};

const StoreContext = createContext<StoreApi | null>(null);

function skriv(next: AppState): AppState {
  lagreOverlay(next);
  return next;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => lastState());

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

  const importer = useCallback((raw: unknown) => {
    if (!erGyldigTilstand(raw)) {
      throw new Error("Filen ser ikke ut som en MFL-tilstand.");
    }
    const next = mergeState(baseState(), raw as PersistedState);
    setState(skriv(next));
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
    }),
    [state, appendHoring, setFagordStatus, setInnstillinger, importer, eksporter],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore må brukes inni StoreProvider");
  return ctx;
}
