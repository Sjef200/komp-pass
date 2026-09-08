---
description: Bli hørt i et tema, ett spørsmål om gangen, med karakter og begrunnelse
argument-hint: [fag eller tema]
---

Hør meg. $ARGUMENTS

Følg denne rekkefølgen:

1. Bekreft faget med `list_fag` hvis det ikke er avklart. Ikke anta.
2. Les skillene `muntlig-horing` og `lareplanstyrt-horing` med `hent_skill`. Har faget en fagskill, les den også.
3. Kall `hent_laringslop`. Står noe som «gjennomgått, aldri hørt», begynn der og si når det ble gjennomgått.
4. Ellers `neste_horing`, og ta det øverste.
5. Kall `still_sporsmal`, og still **ett** spørsmål i chatten. Ikke lim inn listen.
6. Vent på svaret mitt. Så: hva som satt, hva som mangler for 6, og karakter med én setnings begrunnelse. Ikke gi et snilt 5.
7. Logg med `logg_horing`. Spørsmålet og svaret mitt skal med ordrett. Resultatet vises under fanen Prøver.
