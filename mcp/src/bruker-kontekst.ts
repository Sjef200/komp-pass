import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Hvem forespørselen gjelder. Over stdio er det alltid deg, og da holder
 * sesjonsfila. Over HTTP kan flere være innom samtidig, og da må tokenet
 * følge den enkelte forespørselen — ellers ville én brukers klient svart
 * på en annens kall, og RLS ville beskyttet feil person.
 */
export type Bruker = { token: string; id?: string; epost?: string };

const lager = new AsyncLocalStorage<Bruker>();

export function medBruker<T>(bruker: Bruker, fn: () => Promise<T>): Promise<T> {
  return lager.run(bruker, fn);
}

export function aktivBruker(): Bruker | undefined {
  return lager.getStore();
}
