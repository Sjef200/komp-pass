// GENERERT AV scripts/bygg-basedata.ts — IKKE REDIGER.
//
// Læreplan, temaer, fagord og skills bakt inn, slik at serveren kan
// kjøre der det ikke finnes noen disk. Kjør npm run bygg:basedata når
// noe i src/data endres.

import type { Fag, Fagord, Horing, Kapittel, Kompetansemaal, Tema } from "../../src/lib/types.ts";
import type { PromptKatalogRad, SkillKatalogRad } from "../../src/lib/types.ts";

export const FAG = [
  {
    "id": "male1",
    "navn": "Markedsføring og ledelse 1",
    "kode": "SAM3045",
    "emoji": "📊",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3045",
    "laereplanKode": "MFL01-04",
    "kompetansemaalsettKode": "KV528",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV528",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  },
  {
    "id": "male2",
    "navn": "Markedsføring og ledelse 2",
    "kode": "SAM3046",
    "emoji": "📈",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3046",
    "laereplanKode": "MFL01-04",
    "kompetansemaalsettKode": "KV529",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV529",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  },
  {
    "id": "entrep1",
    "navn": "Entreprenørskap og bedriftsutvikling 1",
    "kode": "SAM3063",
    "emoji": "💡",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3063",
    "laereplanKode": "ENT01-03",
    "kompetansemaalsettKode": "KV526",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV526",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  },
  {
    "id": "entrep2",
    "navn": "Entreprenørskap og bedriftsutvikling 2",
    "kode": "SAM3064",
    "emoji": "🚀",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3064",
    "laereplanKode": "ENT01-03",
    "kompetansemaalsettKode": "KV527",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV527",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  },
  {
    "id": "norsk-hovedmal",
    "navn": "Norsk hovedmål",
    "kode": "NOR1267",
    "emoji": "✍️",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/NOR1267",
    "laereplanKode": "NOR01-08",
    "kompetansemaalsettKode": "KV115",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV115",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  },
  {
    "id": "norsk-muntlig",
    "navn": "Norsk muntlig",
    "kode": "NOR1269",
    "emoji": "🎙️",
    "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/NOR1269",
    "laereplanKode": "NOR01-08",
    "kompetansemaalsettKode": "KV115",
    "kompetansemaalsettUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV115",
    "spraak": "nob",
    "sistEndret": "2026-09-03T18:03:49.592Z"
  }
] as Fag[];

export const KOMPETANSEMAAL = [{"id":"male1-01","fagId":"male1","kortnavn":"velge og bruke kilder, markedsførings- og ledelsesteorier og modeller…","tekst":"velge og bruke kilder, markedsførings- og ledelsesteorier og modeller i arbeid med faglige spørsmål, emner og dagsaktuelle problemstillinger","emoji":"📊","udirKode":"KM6174","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6174"},{"id":"male1-02","fagId":"male1","kortnavn":"vurdere forhold som påvirker forbrukeratferd, og reflektere over psyk…","tekst":"vurdere forhold som påvirker forbrukeratferd, og reflektere over psykologiske, sosiale og kulturelle faktorer","emoji":"📊","udirKode":"KM6176","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6176"},{"id":"male1-03","fagId":"male1","kortnavn":"utvikle forretningsideer og mål for virksomheten og vurdere aktuelle …","tekst":"utvikle forretningsideer og mål for virksomheten og vurdere aktuelle målgrupper","emoji":"📊","udirKode":"KM6152","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6152"},{"id":"male1-04","fagId":"male1","kortnavn":"bruke og utvikle markedsundersøkelser for å utforske og få innsikt i …","tekst":"bruke og utvikle markedsundersøkelser for å utforske og få innsikt i markeder og målgrupper","emoji":"📊","udirKode":"KM6175","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6175"},{"id":"male1-05","fagId":"male1","kortnavn":"gjennomføre situasjonsanalyser som grunnlag for beslutninger","tekst":"gjennomføre situasjonsanalyser som grunnlag for beslutninger","emoji":"📊","udirKode":"KM6166","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6166"},{"id":"male1-06","fagId":"male1","kortnavn":"utforske produkt- og merkevarestrategier og vurdere hvordan virksomhe…","tekst":"utforske produkt- og merkevarestrategier og vurdere hvordan virksomheter bruker produkter som konkurransemiddel","emoji":"📊","udirKode":"KM6173","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6173"},{"id":"male1-07","fagId":"male1","kortnavn":"utforske ulike distribusjonsstrategier i markedsføring og vurdere hvo…","tekst":"utforske ulike distribusjonsstrategier i markedsføring og vurdere hvordan virksomheter bruker distribusjon som konkurransemiddel","emoji":"📊","udirKode":"KM6172","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6172"},{"id":"male1-08","fagId":"male1","kortnavn":"utforske ulike prisstrategier og prissettingsmetoder og vurdere hvord…","tekst":"utforske ulike prisstrategier og prissettingsmetoder og vurdere hvordan virksomheter bruker pris som konkurransemiddel","emoji":"📊","udirKode":"KM6171","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6171"},{"id":"male1-09","fagId":"male1","kortnavn":"utforske ulike kommunikasjonsstrategier og vurdere hvordan virksomhet…","tekst":"utforske ulike kommunikasjonsstrategier og vurdere hvordan virksomheter bruker markedskommunikasjon som konkurransemiddel","emoji":"📊","udirKode":"KM6170","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6170"},{"id":"male1-10","fagId":"male1","kortnavn":"planlegge mediemiks og utvikle innhold for ulike kanaler i markedskom…","tekst":"planlegge mediemiks og utvikle innhold for ulike kanaler i markedskommunikasjon","emoji":"📊","udirKode":"KM6169","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6169"},{"id":"male1-11","fagId":"male1","kortnavn":"utforske og vurdere hvordan virksomheter kombinerer bruk av konkurran…","tekst":"utforske og vurdere hvordan virksomheter kombinerer bruk av konkurransemidler","emoji":"📊","udirKode":"KM6168","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6168"},{"id":"male1-12","fagId":"male1","kortnavn":"reflektere over og vurdere rollen til personalet og ledelsen i gjenno…","tekst":"reflektere over og vurdere rollen til personalet og ledelsen i gjennomføring av virksomhetens markedsføringsstrategi","emoji":"📊","udirKode":"KM6177","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6177"},{"id":"male1-13","fagId":"male1","kortnavn":"utforske og følge gjeldende regelverk for markedsføring og vurdere vi…","tekst":"utforske og følge gjeldende regelverk for markedsføring og vurdere virksomhetens etiske ansvar","emoji":"📊","udirKode":"KM6167","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6167"},{"id":"male1-14","fagId":"male1","kortnavn":"reflektere over sammenhengen mellom markedsføring og bærekraftig utvi…","tekst":"reflektere over sammenhengen mellom markedsføring og bærekraftig utvikling ut fra sosiale, økonomiske og miljømessige forhold","emoji":"📊","udirKode":"KM6165","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6165"},{"id":"male2-01","fagId":"male2","kortnavn":"velge og bruke kilder, markedsførings- og ledelsesteorier og modeller…","tekst":"velge og bruke kilder, markedsførings- og ledelsesteorier og modeller i arbeid med faglige spørsmål, emner og dagsaktuelle problemstillinger","emoji":"📈","udirKode":"KM6164","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6164"},{"id":"male2-02","fagId":"male2","kortnavn":"utvikle og vurdere visjoner, forretningsideer og overordnede mål","tekst":"utvikle og vurdere visjoner, forretningsideer og overordnede mål","emoji":"📈","udirKode":"KM6163","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6163"},{"id":"male2-03","fagId":"male2","kortnavn":"drøfte og begrunne ulike faktorer som påvirker målgruppevalg","tekst":"drøfte og begrunne ulike faktorer som påvirker målgruppevalg","emoji":"📈","udirKode":"KM6162","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6162"},{"id":"male2-04","fagId":"male2","kortnavn":"bruke situasjonsanalyse og bransjeanalyse og vurdere markedsstrategis…","tekst":"bruke situasjonsanalyse og bransjeanalyse og vurdere markedsstrategiske beslutninger","emoji":"📈","udirKode":"KM6161","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6161"},{"id":"male2-05","fagId":"male2","kortnavn":"utvikle merkevarestrategier og vurdere posisjonering i merkevarebygging","tekst":"utvikle merkevarestrategier og vurdere posisjonering i merkevarebygging","emoji":"📈","udirKode":"KM6160","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6160"},{"id":"male2-06","fagId":"male2","kortnavn":"utvikle distribusjonsstrategier og vurdere påvirkning av makt og avhe…","tekst":"utvikle distribusjonsstrategier og vurdere påvirkning av makt og avhengighet i en verdikjede","emoji":"📈","udirKode":"KM6159","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6159"},{"id":"male2-07","fagId":"male2","kortnavn":"drøfte ulike faktorer som påvirker prissetting, og utvikle prisstrate…","tekst":"drøfte ulike faktorer som påvirker prissetting, og utvikle prisstrategier","emoji":"📈","udirKode":"KM6158","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6158"},{"id":"male2-08","fagId":"male2","kortnavn":"vurdere og utvikle kommunikasjonsstrategier, utforske dagsaktuelle ko…","tekst":"vurdere og utvikle kommunikasjonsstrategier, utforske dagsaktuelle kommunikasjonskanaler og planlegge mediemiks","emoji":"📈","udirKode":"KM6157","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6157"},{"id":"male2-09","fagId":"male2","kortnavn":"vurdere lederens rolle og funksjon i utviklingen av markedsstrategi o…","tekst":"vurdere lederens rolle og funksjon i utviklingen av markedsstrategi og i internmarkedsføring","emoji":"📈","udirKode":"KM6156","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6156"},{"id":"male2-10","fagId":"male2","kortnavn":"utvikle og begrunne helhetlige markedsstrategier og drøfte etisk bruk…","tekst":"utvikle og begrunne helhetlige markedsstrategier og drøfte etisk bruk av konkurransemidler","emoji":"📈","udirKode":"KM6155","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6155"},{"id":"male2-11","fagId":"male2","kortnavn":"vurdere hvordan virksomheter kan utvikle helhetlig markedsmiks, og ut…","tekst":"vurdere hvordan virksomheter kan utvikle helhetlig markedsmiks, og utforske ulike metoder for å måle effekten av markedsføringstiltakene","emoji":"📈","udirKode":"KM6154","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6154"},{"id":"male2-12","fagId":"male2","kortnavn":"drøfte virksomheters samfunnsansvar ut fra et etisk, lovmessig og for…","tekst":"drøfte virksomheters samfunnsansvar ut fra et etisk, lovmessig og forretningsmessig perspektiv, og vurdere dette opp mot virksomhetens omdømme","emoji":"📈","udirKode":"KM6153","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6153"},{"id":"male2-13","fagId":"male2","kortnavn":"vurdere bærekraftige valg for virksomheter med tanke på sosiale, økon…","tekst":"vurdere bærekraftige valg for virksomheter med tanke på sosiale, økonomiske og miljømessige forhold","emoji":"📈","udirKode":"KM6178","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6178"},{"id":"entrep1-01","fagId":"entrep1","kortnavn":"bruke kilder, teorier og modeller i arbeid med faglige spørsmål, emne…","tekst":"bruke kilder, teorier og modeller i arbeid med faglige spørsmål, emner og problemstillinger","emoji":"💡","udirKode":"KM6138","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6138"},{"id":"entrep1-02","fagId":"entrep1","kortnavn":"utforske ulike kreativitetsprosesser og utvikle forretningsideer","tekst":"utforske ulike kreativitetsprosesser og utvikle forretningsideer","emoji":"💡","udirKode":"KM6126","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6126"},{"id":"entrep1-03","fagId":"entrep1","kortnavn":"utforske og bruke ulike innovasjonsprosesser ved etablering av virkso…","tekst":"utforske og bruke ulike innovasjonsprosesser ved etablering av virksomheter","emoji":"💡","udirKode":"KM6149","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6149"},{"id":"entrep1-04","fagId":"entrep1","kortnavn":"utvikle forretningsmodeller og vurdere opp mot bærekraftig utvikling","tekst":"utvikle forretningsmodeller og vurdere opp mot bærekraftig utvikling","emoji":"💡","udirKode":"KM6148","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6148"},{"id":"entrep1-05","fagId":"entrep1","kortnavn":"utforske og vurdere hvordan samhandling påvirker innovasjon og utvikling","tekst":"utforske og vurdere hvordan samhandling påvirker innovasjon og utvikling","emoji":"💡","udirKode":"KM6147","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6147"},{"id":"entrep1-06","fagId":"entrep1","kortnavn":"sammenligne og vurdere informasjon om markeder, kjøpsatferd og segmen…","tekst":"sammenligne og vurdere informasjon om markeder, kjøpsatferd og segmenter for å ta beslutninger","emoji":"💡","udirKode":"KM6146","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6146"},{"id":"entrep1-07","fagId":"entrep1","kortnavn":"gjennomføre situasjonsanalyse, vurdere utviklingsmuligheter og sette …","tekst":"gjennomføre situasjonsanalyse, vurdere utviklingsmuligheter og sette mål i en oppstartsfase","emoji":"💡","udirKode":"KM6145","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6145"},{"id":"entrep1-08","fagId":"entrep1","kortnavn":"utforske og bruke ulike konkurransemidler i en oppstartsfase","tekst":"utforske og bruke ulike konkurransemidler i en oppstartsfase","emoji":"💡","udirKode":"KM6144","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6144"},{"id":"entrep1-09","fagId":"entrep1","kortnavn":"vurdere og velge selskapsformer ut fra risiko og ansvar ved etablering","tekst":"vurdere og velge selskapsformer ut fra risiko og ansvar ved etablering","emoji":"💡","udirKode":"KM6143","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6143"},{"id":"entrep1-10","fagId":"entrep1","kortnavn":"reflektere over hva som kjennetegner en god leder i etableringsfasen,…","tekst":"reflektere over hva som kjennetegner en god leder i etableringsfasen, og hvordan leder og medarbeidere samhandler og setter sammen gode team","emoji":"💡","udirKode":"KM6142","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6142"},{"id":"entrep1-11","fagId":"entrep1","kortnavn":"beregne og vurdere pris og kapitalbehov, utarbeide budsjett og vurder…","tekst":"beregne og vurdere pris og kapitalbehov, utarbeide budsjett og vurdere finansieringsmuligheter med tanke på risiko og ansvar for en ny virksomhet","emoji":"💡","udirKode":"KM6141","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6141"},{"id":"entrep1-12","fagId":"entrep1","kortnavn":"lese regnskap og nøkkeltall for å vurdere en virksomhets lønnsomhet","tekst":"lese regnskap og nøkkeltall for å vurdere en virksomhets lønnsomhet","emoji":"💡","udirKode":"KM6140","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6140"},{"id":"entrep1-13","fagId":"entrep1","kortnavn":"reflektere over hva entreprenøriell kompetanse er, og vurdere hva det…","tekst":"reflektere over hva entreprenøriell kompetanse er, og vurdere hva det har å si for utvikling av virksomheter","emoji":"💡","udirKode":"KM6139","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6139"},{"id":"entrep2-01","fagId":"entrep2","kortnavn":"bruke kilder, teorier og modeller i arbeid med faglige spørsmål, emne…","tekst":"bruke kilder, teorier og modeller i arbeid med faglige spørsmål, emner og problemstillinger","emoji":"🚀","udirKode":"KM6151","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6151"},{"id":"entrep2-02","fagId":"entrep2","kortnavn":"utforske ulike innovasjonsprosesser og drøfte betydningen innovasjon …","tekst":"utforske ulike innovasjonsprosesser og drøfte betydningen innovasjon har for videreutvikling av en virksomhet","emoji":"🚀","udirKode":"KM6137","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6137"},{"id":"entrep2-03","fagId":"entrep2","kortnavn":"utforske og vurdere konsekvenser bærekraftig verdiskaping har for vid…","tekst":"utforske og vurdere konsekvenser bærekraftig verdiskaping har for videreutvikling av en virksomhet","emoji":"🚀","udirKode":"KM6136","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6136"},{"id":"entrep2-04","fagId":"entrep2","kortnavn":"utforske og vurdere forretningsmodeller for å videreutvikle virksomheter","tekst":"utforske og vurdere forretningsmodeller for å videreutvikle virksomheter","emoji":"🚀","udirKode":"KM6135","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6135"},{"id":"entrep2-05","fagId":"entrep2","kortnavn":"reflektere over hva samfunnsansvar innebærer, og utforske og sammenli…","tekst":"reflektere over hva samfunnsansvar innebærer, og utforske og sammenligne virksomheters samfunnsansvar lokalt og globalt","emoji":"🚀","udirKode":"KM6134","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6134"},{"id":"entrep2-06","fagId":"entrep2","kortnavn":"kartlegge og vurdere støtteordninger i videreutvikling av virksomhete…","tekst":"kartlegge og vurdere støtteordninger i videreutvikling av virksomheter nasjonalt og internasjonalt","emoji":"🚀","udirKode":"KM6133","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6133"},{"id":"entrep2-07","fagId":"entrep2","kortnavn":"utforske og vurdere hvordan virksomheter kan bruke ulike vekst-, mark…","tekst":"utforske og vurdere hvordan virksomheter kan bruke ulike vekst-, markeds- og konkurransestrategier ved videreutvikling","emoji":"🚀","udirKode":"KM6132","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6132"},{"id":"entrep2-08","fagId":"entrep2","kortnavn":"vurdere internasjonale forretningsmuligheter og sammenligne nasjonale…","tekst":"vurdere internasjonale forretningsmuligheter og sammenligne nasjonale og internasjonale forretningskulturer","emoji":"🚀","udirKode":"KM6131","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6131"},{"id":"entrep2-09","fagId":"entrep2","kortnavn":"vurdere ulike lederstiler og drøfte hvordan ledere og medarbeidere ka…","tekst":"vurdere ulike lederstiler og drøfte hvordan ledere og medarbeidere kan påvirke utviklingen av virksomheter","emoji":"🚀","udirKode":"KM6130","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6130"},{"id":"entrep2-10","fagId":"entrep2","kortnavn":"vurdere bruk av prosjekt og andre samarbeidsformer og betydningen net…","tekst":"vurdere bruk av prosjekt og andre samarbeidsformer og betydningen nettverksbygging har i utvikling av virksomheter","emoji":"🚀","udirKode":"KM6129","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6129"},{"id":"entrep2-11","fagId":"entrep2","kortnavn":"vurdere behovet for organisasjonsutvikling i etablerte virksomheter","tekst":"vurdere behovet for organisasjonsutvikling i etablerte virksomheter","emoji":"🚀","udirKode":"KM6128","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6128"},{"id":"entrep2-12","fagId":"entrep2","kortnavn":"vurdere hvordan finansiering av kapitalbehov bidrar til framtidig løn…","tekst":"vurdere hvordan finansiering av kapitalbehov bidrar til framtidig lønnsomhet og verdiskaping for virksomheter","emoji":"🚀","udirKode":"KM6127","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6127"},{"id":"entrep2-13","fagId":"entrep2","kortnavn":"reflektere over og vurdere betydningen entreprenøriell kompetanse har…","tekst":"reflektere over og vurdere betydningen entreprenøriell kompetanse har for videreutvikling av en virksomhet","emoji":"🚀","udirKode":"KM6150","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM6150"},{"id":"norsk-hovedmal-01","fagId":"norsk-hovedmal","kortnavn":"analysere og tolke romaner, noveller, drama, lyrikk og sakprosa på bo…","tekst":"analysere og tolke romaner, noveller, drama, lyrikk og sakprosa på bokmål og nynorsk fra 1850 til i dag og reflektere over tekstene i lys av den kulturhistoriske konteksten og egen samtid","emoji":"✍️","udirKode":"KM1236","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1236"},{"id":"norsk-hovedmal-02","fagId":"norsk-hovedmal","kortnavn":"utforske og reflektere over hvordan tekster fra den realistiske og de…","tekst":"utforske og reflektere over hvordan tekster fra den realistiske og den modernistiske tradisjonen framstiller menneske, natur og samfunn","emoji":"✍️","udirKode":"KM1235","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1235"},{"id":"norsk-hovedmal-03","fagId":"norsk-hovedmal","kortnavn":"skrive essay som utforsker og reflekterer over innhold i tekster","tekst":"skrive essay som utforsker og reflekterer over innhold i tekster","emoji":"✍️","udirKode":"KM1227","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1227"},{"id":"norsk-hovedmal-04","fagId":"norsk-hovedmal","kortnavn":"skrive litterære tolkninger og sammenligninger","tekst":"skrive litterære tolkninger og sammenligninger","emoji":"✍️","udirKode":"KM1234","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1234"},{"id":"norsk-hovedmal-05","fagId":"norsk-hovedmal","kortnavn":"analysere uttrykksformer i sammensatte tekster i ulike medier og vurd…","tekst":"analysere uttrykksformer i sammensatte tekster i ulike medier og vurdere samspillet mellom dem","emoji":"✍️","udirKode":"KM1233","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1233"},{"id":"norsk-hovedmal-06","fagId":"norsk-hovedmal","kortnavn":"bruke fagkunnskap og presist fagspråk i utforskende samtaler, diskusj…","tekst":"bruke fagkunnskap og presist fagspråk i utforskende samtaler, diskusjoner og muntlige presentasjoner om norskfaglige emner","emoji":"✍️","udirKode":"KM1230","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1230"},{"id":"norsk-hovedmal-07","fagId":"norsk-hovedmal","kortnavn":"skrive retoriske analyser og tolkninger av sakprosatekster","tekst":"skrive retoriske analyser og tolkninger av sakprosatekster","emoji":"✍️","udirKode":"KM1231","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1231"},{"id":"norsk-hovedmal-08","fagId":"norsk-hovedmal","kortnavn":"mestre språklige formkrav på hovedmål og sidemål og skrive tekster me…","tekst":"mestre språklige formkrav på hovedmål og sidemål og skrive tekster med etterrettelig kildebruk og et presist og nyansert språk","emoji":"✍️","udirKode":"KM1229","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1229"},{"id":"norsk-hovedmal-09","fagId":"norsk-hovedmal","kortnavn":"orientere seg i faglitteratur, vurdere kilder kritisk og skrive fagar…","tekst":"orientere seg i faglitteratur, vurdere kilder kritisk og skrive fagartikler som greier ut om og drøfter norskfaglige emner","emoji":"✍️","udirKode":"KM1228","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1228"},{"id":"norsk-hovedmal-10","fagId":"norsk-hovedmal","kortnavn":"gjøre rede for endringer i talespråk i Norge i dag og reflektere over…","tekst":"gjøre rede for endringer i talespråk i Norge i dag og reflektere over sammenhenger mellom språk, kultur og identitet","emoji":"✍️","udirKode":"KM1232","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1232"},{"id":"norsk-muntlig-01","fagId":"norsk-muntlig","kortnavn":"analysere og tolke romaner, noveller, drama, lyrikk og sakprosa på bo…","tekst":"analysere og tolke romaner, noveller, drama, lyrikk og sakprosa på bokmål og nynorsk fra 1850 til i dag og reflektere over tekstene i lys av den kulturhistoriske konteksten og egen samtid","emoji":"🎙️","udirKode":"KM1236","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1236"},{"id":"norsk-muntlig-02","fagId":"norsk-muntlig","kortnavn":"utforske og reflektere over hvordan tekster fra den realistiske og de…","tekst":"utforske og reflektere over hvordan tekster fra den realistiske og den modernistiske tradisjonen framstiller menneske, natur og samfunn","emoji":"🎙️","udirKode":"KM1235","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1235"},{"id":"norsk-muntlig-03","fagId":"norsk-muntlig","kortnavn":"skrive essay som utforsker og reflekterer over innhold i tekster","tekst":"skrive essay som utforsker og reflekterer over innhold i tekster","emoji":"🎙️","udirKode":"KM1227","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1227"},{"id":"norsk-muntlig-04","fagId":"norsk-muntlig","kortnavn":"skrive litterære tolkninger og sammenligninger","tekst":"skrive litterære tolkninger og sammenligninger","emoji":"🎙️","udirKode":"KM1234","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1234"},{"id":"norsk-muntlig-05","fagId":"norsk-muntlig","kortnavn":"analysere uttrykksformer i sammensatte tekster i ulike medier og vurd…","tekst":"analysere uttrykksformer i sammensatte tekster i ulike medier og vurdere samspillet mellom dem","emoji":"🎙️","udirKode":"KM1233","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1233"},{"id":"norsk-muntlig-06","fagId":"norsk-muntlig","kortnavn":"bruke fagkunnskap og presist fagspråk i utforskende samtaler, diskusj…","tekst":"bruke fagkunnskap og presist fagspråk i utforskende samtaler, diskusjoner og muntlige presentasjoner om norskfaglige emner","emoji":"🎙️","udirKode":"KM1230","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1230"},{"id":"norsk-muntlig-07","fagId":"norsk-muntlig","kortnavn":"skrive retoriske analyser og tolkninger av sakprosatekster","tekst":"skrive retoriske analyser og tolkninger av sakprosatekster","emoji":"🎙️","udirKode":"KM1231","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1231"},{"id":"norsk-muntlig-08","fagId":"norsk-muntlig","kortnavn":"mestre språklige formkrav på hovedmål og sidemål og skrive tekster me…","tekst":"mestre språklige formkrav på hovedmål og sidemål og skrive tekster med etterrettelig kildebruk og et presist og nyansert språk","emoji":"🎙️","udirKode":"KM1229","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1229"},{"id":"norsk-muntlig-09","fagId":"norsk-muntlig","kortnavn":"orientere seg i faglitteratur, vurdere kilder kritisk og skrive fagar…","tekst":"orientere seg i faglitteratur, vurdere kilder kritisk og skrive fagartikler som greier ut om og drøfter norskfaglige emner","emoji":"🎙️","udirKode":"KM1228","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1228"},{"id":"norsk-muntlig-10","fagId":"norsk-muntlig","kortnavn":"gjøre rede for endringer i talespråk i Norge i dag og reflektere over…","tekst":"gjøre rede for endringer i talespråk i Norge i dag og reflektere over sammenhenger mellom språk, kultur og identitet","emoji":"🎙️","udirKode":"KM1232","apiUrl":"https://data.udir.no/kl06/v201906/kompetansemaal-lk20/KM1232"}] as Kompetansemaal[];

export const TEMAER = [
  {
    "id": "def",
    "fagId": "male1",
    "navn": "Hva en markedsundersøkelse er",
    "emoji": "🔍",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "formaal",
    "fagId": "male1",
    "navn": "Formålet med undersøkelser",
    "emoji": "🎯",
    "maalIds": [
      "male1-04",
      "male1-05"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "mis",
    "fagId": "male1",
    "navn": "Markedsinformasjonssystem",
    "emoji": "🗄️",
    "maalIds": [
      "male1-04",
      "male1-05"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "hovedtyper",
    "fagId": "male1",
    "navn": "Primær, sekundær, kvalitativ, kvantitativ",
    "emoji": "🌳",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "design",
    "fagId": "male1",
    "navn": "Undersøkelsesdesign",
    "emoji": "🧭",
    "maalIds": [
      "male1-04",
      "male1-05"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "prosess",
    "fagId": "male1",
    "navn": "Arbeidsfasene",
    "emoji": "📋",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "dybde",
    "fagId": "male1",
    "navn": "Dybdeintervju",
    "emoji": "🎙️",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "fokus",
    "fagId": "male1",
    "navn": "Fokusgruppe",
    "emoji": "👥",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "obs",
    "fagId": "male1",
    "navn": "Observasjon",
    "emoji": "👀",
    "maalIds": [
      "male1-04",
      "male1-02"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "eksperiment",
    "fagId": "male1",
    "navn": "Eksperiment",
    "emoji": "🧪",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "survey",
    "fagId": "male1",
    "navn": "Survey",
    "emoji": "📝",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "utvalg",
    "fagId": "male1",
    "navn": "Utvalg og populasjon",
    "emoji": "🎲",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  },
  {
    "id": "validitet",
    "fagId": "male1",
    "navn": "Validitet, reliabilitet, feilkilder",
    "emoji": "⚖️",
    "maalIds": [
      "male1-04"
    ],
    "kapittel": "Markedsundersøkelser"
  }
] as Tema[];

export const KAPITLER = [
  {
    "id": "male1-k01",
    "fagId": "male1",
    "nummer": 1,
    "navn": "Markedsføring og ledelse",
    "del": "Perspektiv på markedsføring, samfunn og forbruker",
    "sider": {
      "fra": 7,
      "til": 22
    },
    "seksjoner": [
      "Hva er markedsføring?",
      "Markedsføringens historie",
      "Hva er ledelse?",
      "Markedsføring og ledelse",
      "Etikk",
      "Samfunnsansvar og bærekraft"
    ],
    "temaIds": []
  },
  {
    "id": "male1-k02",
    "fagId": "male1",
    "nummer": 2,
    "navn": "Markedsføring og bærekraft",
    "del": "Perspektiv på markedsføring, samfunn og forbruker",
    "sider": {
      "fra": 23,
      "til": 39
    },
    "seksjoner": [
      "Hva er virksomhetenes ansvar?",
      "Hva menes med bærekraftig forretningsdrift?",
      "Bærekraft og omdømme",
      "Bærekraft blir viktigere",
      "Bruk av konkurransemidlene og bærekraft"
    ],
    "temaIds": []
  },
  {
    "id": "male1-k03",
    "fagId": "male1",
    "nummer": 3,
    "navn": "Forbrukeratferd",
    "del": "Perspektiv på markedsføring, samfunn og forbruker",
    "sider": {
      "fra": 40,
      "til": 63
    },
    "seksjoner": [
      "Hva er forbrukeratferd?",
      "Hva påvirker forbrukeratferden?",
      "Kjøpsprosessen",
      "Forbrukeratferd i en digital verden"
    ],
    "temaIds": []
  },
  {
    "id": "male1-k04",
    "fagId": "male1",
    "nummer": 4,
    "navn": "Grunnleggende beslutninger i markedsføringsledelse",
    "del": "Markedsføringens grunnpillarer",
    "sider": {
      "fra": 64,
      "til": 86
    },
    "seksjoner": [
      "Utvikling av forretningsidé",
      "Mål og strategier",
      "Markeder",
      "Segmenter",
      "Målgrupper"
    ],
    "temaIds": []
  },
  {
    "id": "male1-k05",
    "fagId": "male1",
    "nummer": 5,
    "navn": "Situasjonsanalyse",
    "del": "Markedsføringens grunnpillarer",
    "sider": {
      "fra": 87,
      "til": 115
    },
    "seksjoner": [
      "Hva er situasjonsanalyse?",
      "Beskrivelse av arbeidsbetingelsene",
      "Analyse av arbeidsbetingelsene"
    ],
    "temaIds": []
  },
  {
    "id": "male1-k06",
    "fagId": "male1",
    "nummer": 6,
    "navn": "Markedsundersøkelser",
    "del": "Markedsføringens grunnpillarer",
    "sider": {
      "fra": 117,
      "til": 136
    },
    "seksjoner": [
      "Vær kildekritisk",
      "Markedsinformasjonssystemet",
      "Hva er markedsundersøkelser?",
      "Hovedtyper av markedsundersøkelser",
      "Ulike undersøkelsesmetoder",
      "Arbeidsfasene i en markedsundersøkelse",
      "Utvalg og utvalgsmetode"
    ],
    "temaIds": [
      "def",
      "formaal",
      "mis",
      "hovedtyper",
      "design",
      "prosess",
      "dybde",
      "fokus",
      "obs",
      "eksperiment",
      "survey",
      "utvalg",
      "validitet"
    ]
  }
] as Kapittel[];

export const FAGORD = [{"id":"fo-primaerdata","term":"Primærdata","forklaring":"Data du samler inn selv for denne undersøkelsen. Skilt mot sekundærdata, som allerede finnes og er samlet inn til et annet formål.","temaIds":["hovedtyper"],"status":"sitter"},{"id":"fo-sekundaerdata","term":"Sekundærdata","forklaring":"Data som allerede er samlet inn til et annet formål. Skilt mot primærdata, som du henter inn nå for akkurat denne undersøkelsen.","temaIds":["hovedtyper"],"status":"sitter"},{"id":"fo-kvalitativ","term":"Kvalitativ metode","forklaring":"Få enheter, dybde og åpne svar. Målet er å forstå hvorfor. Skilt mot kvantitativ, som teller og generaliserer.","temaIds":["hovedtyper","dybde","fokus"],"status":"usikker"},{"id":"fo-kvantitativ","term":"Kvantitativ metode","forklaring":"Mange enheter, tall og strukturerte spørsmål. Målet er å måle og generalisere. Skilt mot kvalitativ, som går i dybden hos få.","temaIds":["hovedtyper","survey"],"status":"usikker"},{"id":"fo-mis","term":"Markedsinformasjonssystem (MIS)","forklaring":"Et fast system for å samle, lagre og spre markedsinformasjon løpende. Skilt mot en markedsundersøkelse, som er et avgrenset prosjekt.","temaIds":["mis","def"],"status":"usikker"},{"id":"fo-undersokelse","term":"Markedsundersøkelse","forklaring":"Et avgrenset prosjekt for å hente inn data om marked og målgrupper. Skilt mot MIS, som er den løpende informasjonsflyten.","temaIds":["def","formaal"],"status":"usikker"},{"id":"fo-dybdeintervju","term":"Dybdeintervju","forklaring":"En-til-en-samtale med åpne spørsmål. Egnet for dybde og sensitive tema. Skilt mot fokusgruppe, der dataene kommer fra samspill i gruppe.","temaIds":["dybde"],"status":"ny"},{"id":"fo-fokusgruppe","term":"Fokusgruppe","forklaring":"Gruppeintervju der samspillet mellom deltakerne er en del av dataene. Skilt mot dybdeintervju, som er én og én.","temaIds":["fokus"],"status":"ny"},{"id":"fo-observasjon","term":"Observasjon","forklaring":"Du ser hva folk gjør, ikke hva de sier at de gjør. Skilt mot intervju og survey, og mot eksperiment der du griper inn og endrer noe.","temaIds":["obs"],"status":"usikker"},{"id":"fo-eksperiment","term":"Eksperiment","forklaring":"Du endrer én variabel og måler effekten, med kontroll over omgivelsene. Skilt mot observasjon, der du ikke manipulerer situasjonen.","temaIds":["eksperiment"],"status":"usikker"},{"id":"fo-survey","term":"Survey","forklaring":"Standardiserte spørsmål til mange respondenter. Skilt mot dybdeintervju, som er fleksibelt og treffer få.","temaIds":["survey"],"status":"usikker"},{"id":"fo-populasjon","term":"Populasjon","forklaring":"Alle du vil si noe om. Skilt mot utvalg, som er de du faktisk undersøker.","temaIds":["utvalg"],"status":"ny"},{"id":"fo-utvalg","term":"Utvalg","forklaring":"De som inngår i undersøkelsen. Skilt mot populasjon, som er hele gruppen funnene skal gjelde for.","temaIds":["utvalg"],"status":"ny"},{"id":"fo-validitet","term":"Validitet","forklaring":"Måler du det du tror du måler? Skilt mot reliabilitet, som handler om om du får samme resultat ved gjentakelse.","temaIds":["validitet"],"status":"ny"},{"id":"fo-reliabilitet","term":"Reliabilitet","forklaring":"Stabilitet i målingen: samme opplegg gir samme resultat. Skilt mot validitet, som handler om du treffer det rette fenomenet.","temaIds":["validitet"],"status":"ny"},{"id":"fo-design","term":"Undersøkelsesdesign","forklaring":"Helhetlig plan for hvordan undersøkelsen skal gjennomføres. Skilt mot metode (intervju, observasjon, survey), som er ett valg inni designet.","temaIds":["design","prosess"],"status":"ny"}] as Fagord[];

export const HORINGER = [] as Horing[];

export const UDIR_META = {
  "api": "https://data.udir.no/kl06/v201906",
  "hentet": "2026-09-03T18:03:49.592Z",
  "status": "ok",
  "feilmelding": null,
  "kilde": "Udir Grep REST (NLOD)",
  "merknad": "Anonyme kall kan rate-limites fra september 2026. Appen bruker denne cachen, ikke live API i UI.",
  "fag": [
    {
      "id": "male1",
      "fagkode": "SAM3045",
      "laereplanKode": "MFL01-04",
      "kompetansemaalsettKode": "KV528",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3045"
    },
    {
      "id": "male2",
      "fagkode": "SAM3046",
      "laereplanKode": "MFL01-04",
      "kompetansemaalsettKode": "KV529",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3046"
    },
    {
      "id": "entrep1",
      "fagkode": "SAM3063",
      "laereplanKode": "ENT01-03",
      "kompetansemaalsettKode": "KV526",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3063"
    },
    {
      "id": "entrep2",
      "fagkode": "SAM3064",
      "laereplanKode": "ENT01-03",
      "kompetansemaalsettKode": "KV527",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/SAM3064"
    },
    {
      "id": "norsk-hovedmal",
      "fagkode": "NOR1267",
      "laereplanKode": "NOR01-08",
      "kompetansemaalsettKode": "KV115",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/NOR1267",
      "merknad": "Samme kompetansemålsett som norsk muntlig. Fagene holdes likevel adskilt."
    },
    {
      "id": "norsk-muntlig",
      "fagkode": "NOR1269",
      "laereplanKode": "NOR01-08",
      "kompetansemaalsettKode": "KV115",
      "spraak": "nob",
      "apiUrl": "https://data.udir.no/kl06/v201906/fagkoder/NOR1269",
      "merknad": "Samme kompetansemålsett som norsk hovedmål. Fagene holdes likevel adskilt."
    }
  ],
  "kompetansemaalsett": [
    {
      "kode": "KV528",
      "navn": "Kompetansemål og vurdering markedsføring og ledelse 1",
      "apiUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV528",
      "antall": 14,
      "spraak": "nob"
    },
    {
      "kode": "KV529",
      "navn": "Kompetansemål og vurdering markedsføring og ledelse 2",
      "apiUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV529",
      "antall": 13,
      "spraak": "nob"
    },
    {
      "kode": "KV526",
      "navn": "Kompetansemål og vurdering entreprenørskap og bedriftsutvikling 1",
      "apiUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV526",
      "antall": 13,
      "spraak": "nob"
    },
    {
      "kode": "KV527",
      "navn": "Kompetansemål og vurdering entreprenørskap og bedriftsutvikling 2",
      "apiUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV527",
      "antall": 13,
      "spraak": "nob"
    },
    {
      "kode": "KV115",
      "navn": "Kompetansemål og vurdering vg3 studieforberedende utdanningsprogram",
      "apiUrl": "https://data.udir.no/kl06/v201906/kompetansemaalsett-lk20/KV115",
      "antall": 10,
      "spraak": "nob",
      "deltAv": [
        "norsk-hovedmal",
        "norsk-muntlig"
      ]
    }
  ]
} as Record<string, unknown>;

export const SKILL_INDEX = {
  "skills": [
    {
      "id": "laeringsokt",
      "fil": "laeringsokt/SKILL.md",
      "navn": "Læringsøkt",
      "beskrivelse": "Varige økter med læring, selvtest, eksamenstrening og sporbare vurderinger.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": [],
      "referanser": [
        {
          "id": "eksamensformer",
          "navn": "Fagspesifikke eksamensformer",
          "sti": "laeringsokt/references/eksamensformer.md"
        }
      ]
    },
    {
      "id": "velg-fag-forst",
      "fil": "velg-fag-forst/SKILL.md",
      "navn": "Velg fag først",
      "beskrivelse": "Velg og bekreft fag før ethvert spørsmål, oppslag eller høring. Ikke anta Markedsføring og ledelse 1.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "kompetansemaal-mot-kapittel",
      "fil": "kompetansemaal-mot-kapittel/SKILL.md",
      "navn": "Kompetansemål mot kapittel",
      "beskrivelse": "Skille Udirs kompetansemål fra læreverkets kapitler. Huk aldri av et mål fordi kapittelet er ferdig.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "nytt-fagstoff",
      "fil": "nytt-fagstoff/SKILL.md",
      "navn": "Nytt fagstoff",
      "beskrivelse": "Ta imot fagstoff i chatten, lagre det som kilde, koble det til temaer, og hør eleven i det med én gang.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "kapittelarbeid",
      "fil": "kapittelarbeid/SKILL.md",
      "navn": "Kapittelarbeid",
      "beskrivelse": "Les og noter med egne ord i et kapittel, øv på bokas kontrollspørsmål og oppgaver, nøste opp hull.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "lareplanstyrt-horing",
      "fil": "lareplanstyrt-horing/SKILL.md",
      "navn": "Læreplanstyrt høring",
      "beskrivelse": "Koble spørsmål og vurdering til konkrete kompetansemål i det valgte faget.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "muntlig-horing",
      "fil": "muntlig-horing/SKILL.md",
      "navn": "Muntlig høring",
      "beskrivelse": "Ett spørsmål om gangen, krev begrepsskille, gi karaktergrunnlag.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "logg-etter-horing",
      "fil": "logg-etter-horing/SKILL.md",
      "navn": "Logg etter høring",
      "beskrivelse": "Logg høring og oppdater bare relevante fagord, med full KI-proveniens.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "fagbytte",
      "fil": "fagbytte/SKILL.md",
      "navn": "Fagbytte",
      "beskrivelse": "Avslutt kontekst før bytte mellom MFL, entreprenørskap og norsk.",
      "kilde": "plattform",
      "kategori": "plattform",
      "fagIds": []
    },
    {
      "id": "markedsforingslaering",
      "fil": "markedsforingslaering/SKILL.md",
      "navn": "Markedsføringslæring",
      "beskrivelse": "Læringsmodus for markedsføring mot karakter 6: definisjon, begrunnelse, eksempel og avgrensning mot nabobegrep.",
      "kilde": "plattform",
      "kategori": "fag",
      "fagIds": [
        "male1",
        "male2"
      ],
      "referanser": [
        {
          "id": "karakterkjennetegn",
          "navn": "Karakterkjennetegn",
          "sti": "markedsforingslaering/references/karakterkjennetegn.md"
        },
        {
          "id": "markedsforingsfaget",
          "navn": "Markedsføringsfaget",
          "sti": "markedsforingslaering/references/markedsforingsfaget.md"
        },
        {
          "id": "markedsundersokelser",
          "navn": "Markedsundersøkelser",
          "sti": "markedsforingslaering/references/markedsundersokelser.md"
        }
      ]
    }
  ]
} as { skills: SkillKatalogRad[] };

export const PROMPT_INDEX = {
  "prompts": [
    {
      "id": "horing-svake-temaer",
      "fil": "horing-svake-temaer/SKILL.md",
      "navn": "Høring i svake temaer",
      "beskrivelse": "Brukes når du skal høre eleven i temaer med karakter under 4 eller uten høring. Still ett spørsmål om gangen, krev skille mot nabobegrep, og logg høringen med modell, innsats og denne prompten.",
      "kilde": "lokal"
    },
    {
      "id": "fagord-status",
      "fil": "fagord-status/SKILL.md",
      "navn": "Fagord etter høring",
      "beskrivelse": "Brukes etter en høring for å sette fagord til ny, usikker eller sitter ut fra hva som glapp, og knytte sisteFeil.",
      "kilde": "lokal"
    }
  ]
} as { prompts: PromptKatalogRad[] };

/** Sti under src/data/skills → innhold. */
export const SKILL_FILER: Record<string, string> = {
  "laeringsokt/SKILL.md": "---\nname: laeringsokt\ndescription: \"Gjennomfør og gjenoppta læring, selvtest og eksamenstrening i øvingsappen. Bruk ved økt-ID, bokspørsmål, repetisjon eller eksamensøving.\"\n---\n\n# Læringsøkt\n\nAppen lagrer læringsgrunnlaget. Samtalen foregår her, med brukerens AI-abonnement. Bruk MCP til å lese og lagre, uten egen modell-API.\n\n## Velg riktig flyt\n\n- En økt-ID: kall `hent_okt`. Fortsett med lagret arbeidsmåte og fag. Opprett ikke en ny økt som erstatning.\n- Et kapittel: `hent_kapittel` gir alle underpunkter, notatversjoner, bokas oppsummering, oppgaver og tidligere forsøk. Bruk originalspørsmål først, og `neste_oving` med repetisjon når eldre stoff skal tilbake.\n- Uten økt: velg fag og grunnlag, deretter `start_okt`. Tidsgrense er valgfri. Hent læreplanen før du kobler vurderingen til mål.\n- Nytt foto/PDF: les vedlegget i klienten eller med `hent_vedlegg`. Ved manglende klientstøtte kan eleven laste ned originalen fra appen og legge den ved her. Bruk `importer_kapittelinnhold`; bevar ordlyd, nummer, sider og usikker transkripsjon. Ikke påstå at originalen er arkivert uten en faktisk vedleggs-ID.\n\n## Arbeidsmåte\n\n- Læring: gi støtte underveis. Registrer hint eller vist løsning på forsøket.\n- Selvtest: eleven svarer før vurdering og forklaring. Still ett spørsmål om gangen.\n- Eksamen: følg fagets form fra `hent_okt`. Bruk naturlige oppfølgere, men vent med karakter, fasit og retting til avslutningen. Les `references/eksamensformer.md` for fagets kriterier.\n\nEt definisjonsspørsmål vurderes som en definisjon. Krev ikke drøfting eller eksempler som oppgaven ikke etterspør. Vurder en lang besvarelse som helhet, og knytt konkret belegg til målene den faktisk undersøker. Vurderingskriteriene er treningskriterier; oppgitte eksamensoppgaver og lærerens kriterier supplerer dem.\n\n## Lagre og fortsett\n\n1. `logg_forsok` lagrer originalspørsmål og originalsvaret. Oppgi økt, eventuell oppgave/kapittel, arbeidsmåte, hjelp og kildereferanser. Gjenbruk samme forsøks-ID ved retry. Et nytt forsøk får ny ID.\n2. `vurder_forsok` legger til hva som satt, mangler, neste steg, begrunnelse og eventuell oppgavekarakter. Oppgi modell, skillId=`laeringsokt` og kriterieversjon fra `hent_okt`.\n3. `maal` inneholder bare eksplisitt vurderte kombinasjoner av mål og tema, med eget belegg og karakter. Oppgavens mulige målkoblinger er ikke dokumentert mestring. Hvis en relevant kobling mangler, lagre vurderingen uten måluttelling og forklar gapet.\n4. Rett en vurdering med ny vurderings-ID og `erstatter` satt til siste revisjon. Begrunn rettingen; originalsvaret endres ikke.\n5. Avslutt med `avslutt_okt`. Fullført eksamen krever en egen helhetsvurdering og angivelse av manglende belegg. Ikke regn eksamenskarakter som snitt av enkeltsvar.\n\nSi at dataene er lagret først når verktøyet bekrefter det. Ved feil, behold samme ID og rett feilen; ikke lag en ekstra registrering. `logg_oving` og `logg_horing` er kompatibilitetsverktøy, ikke den nye dobbeltloggingsflyten.\n\n## Notater og fagbegreper\n\nElevtekst lagres med `lagre_notatversjon`, med gjeldende notatId som forelder. Ved versjonsavvik: hent på nytt og sammenlign. Gi AI-kommentarer gjennom `kommenter_notat`; ikke skriv over elevens egne formuleringer. Bokas oppsummering og elevens oppsummering er forskjellige innholdstyper.\n\nOppdater bare fagord som faktisk ble brukt eller blandet. Hjelpestøttede svar skal ikke omtales som selvstendig mestring. Bruk nye case og varianter ved senere repetisjon, merket som AI-variant med kobling til originaloppgaven.\n",
  "laeringsokt/references/eksamensformer.md": "# Treningskriterier v1\n\nOppgavetekst, hjelpemidler og eventuell tidsramme følger økten. Formene under er brukerens valgte treningsformer. Dette dokumentet er ikke en påstand om universelle gjennomføringsregler eller offisielle karaktergrenser.\n\n## Markedsføring 1 — male1-v1\nMuntlig presentasjon og fagsamtale. Undersøk presise fagbegreper, anvendelse i en konkret situasjon og begrunnelse av valg. Følg opp med ett spørsmål av gangen. Et begrepsspørsmål trenger ikke et fullstendig strategiforslag.\n\n## Markedsføring 2 — male2-v1\nSkriftlig case. Vurder oppgaveforståelse, analyse, bruk av fagstoff, strategiske valg og konsekvenser, sammenheng og kildebruk. Skill manglende fakta fra svak argumentasjon. Gi samlet vurdering av besvarelsen.\n\n## Entreprenørskap 1 — entrep1-v1\nMuntlig-praktisk case. Avtal hvilken leveranse eleven lager, for eksempel en skisse eller plan. Vurder selve leveransen og gjennomførbarheten separat fra elevens begrunnelse i samtalen. Har AI-en ikke sett leveransen, oppgi manglende belegg fremfor å anta kvaliteten.\n\n## Entreprenørskap 2 — entrep2-v1\nSkriftlig case. Vurder forståelse av oppdraget, analyse og forretningsutvikling, begrunnede valg, konsekvenser, gjennomførbarhet og bruk av kilder. Vurder teksten som en sammenhengende besvarelse.\n\n## Norsk hovedmål — norsk-hovedmal-v1\nVurder hele teksten mot oppgaven: innhold og tekstgrunnlag, struktur, språkføring og kildebruk. Tilpass kriteriene til sjanger og oppgaveverb. Dokumenter språkkommentarer med eksempler fra elevteksten; unngå å la enkeltsmåfeil alene bestemme helheten.\n\n## Norsk muntlig — norsk-muntlig-v1\nMuntlig framstilling og fagsamtale basert på tekstgrunnlag. Vurder faglig forståelse, konkret bruk av tekst, sammenhenger og refleksjon. Ved bare skriftlig transkripsjon kan du ikke vurdere stemmebruk eller uttale; oppgi dette som manglende belegg.\n\n## Karaktergrunnlag\n\nKarakter 1–6 er en begrunnet treningsvurdering av den konkrete oppgaven. Bruk oppgavens kriterier og tilgjengelig belegg. Ikke gi samme karakter til alle mål automatisk. Behold usikkerhet eksplisitt i begrunnelsen, og foreslå neste steg som eleven faktisk kan gjennomføre.\n",
  "velg-fag-forst/SKILL.md": "---\nname: velg-fag-forst\ndescription: \"Velg og bekreft fag før ethvert spørsmål, oppslag eller høring. Bruk ALLTID som første steg når eleven åpner en økt, bytter samtale, eller ber om hjelp uten å ha sagt hvilket fag. Trigger på 'hør meg', 'quiz', 'hva er', 'øve', 'hjelp meg', og på løsrevne fagord. Ikke anta Markedsføring og ledelse 1.\"\n---\n\n# Velg fag først\n\nDu jobber mot øvingsappens MCP. Fagene er adskilte kontekster. Bland aldri MFL, entreprenørskap og norsk i samme høring.\n\n## Trigger\n\nFørste melding i en økt, uklart fag, eller eleven har ikke bekreftet `fagId`.\n\n## Arbeidsflyt\n\n1. Kall `list_fag`. Vis fagene med fagkode og læreplan, ikke bare kallenavn.\n2. Be eleven bekrefte ett fag. Ikke gjett `male1`.\n3. Når `fagId` er valgt, kall `hent_lareplan` og `hent_oversikt` for akkurat det faget.\n4. Bruk det samme `fagId` i alle senere verktøykall i økten.\n5. Hvis eleven senere vil bytte fag, stopp og følg skillen `fagbytte`.\n\n## MCP-verktøy\n\n- `list_fag`\n- `hent_lareplan`\n- `hent_oversikt`\n- `list_skills` (etter at faget er valgt)\n\n## Ikke\n\n- Ikke still faglige spørsmål før `fagId` er bekreftet.\n- Ikke gjenbruk temaer, fagord eller kompetansemål fra et annet fag.\n- Ikke logg høring uten `fagId`.\n",
  "kompetansemaal-mot-kapittel/SKILL.md": "---\nname: kompetansemaal-mot-kapittel\ndescription: \"Skille kompetansemål (Udir) fra kapittel (læreverk). Bruk ALLTID når eleven, læreren eller du selv blander 'mål', 'kapittel', 'tema', 'huke av læreplanen', eller spør hva som skal øves. Trigger på 'hva er forskjellen på kompetansemål og kapittel', 'er dette et mål', 'hvilket kapittel', 'huk av', 'læreplanen'.\"\n---\n\n# Kompetansemål mot kapittel\n\nDette er tre lag. Bland dem aldri.\n\n| Lag | Hva det er | Hvem eier det | Hva du gjør med det |\n|---|---|---|---|\n| Kompetansemål | Offisiell formulering av hva eleven skal kunne | Udir, via `hent_lareplan` | Vurder og dekk. Huk **ikke** av. |\n| Kapittel | Hvordan læreverket deler opp året | Lokal `kapitler.json` og `kapittel` på temaene | Les, noter, øv i rekkefølge. Huk **ikke** av mål. |\n| Tema | Det dere faktisk hører | Lokal `temaer.json` | Ett spørsmål, én karakter, append-only høring. |\n\n## Forskjellen som teller\n\nEt **kompetansemål** er et vurderingskrav. Sensor, eksamen og standpunkt forholder seg til Udir-teksten, ikke til kapittelnavnet i boka.\n\nEt **kapittel** er en arbeidsinndeling. «Markedsundersøkelser» er et kapittel. Målet det peker på, er for eksempel *bruke og utvikle markedsundersøkelser for å utforske og få innsikt i markeder og målgrupper* (`male1-04` / KM6175).\n\nEtt kapittel treffer ofte **flere** kompetansemål. Ett kompetansemål dekkes av **flere** temaer, gjerne spredt over kapitler senere.\n\nDekning på et mål er **avledet**: siste karakter per tema som er koblet til målet. Du huker aldri av et kompetansemål fordi kapittelet er «ferdig».\n\n## Arbeidsflyt\n\n1. Bekreft `fagId` (`velg-fag-forst`).\n2. Kall `hent_lareplan` når spørsmålet handler om hva som skal kunne.\n3. Kall `list_kapitler` når spørsmålet handler om hvor i boka dere er.\n4. Kall `list_temaer` for å høre. Hvert tema har `kapittel` og `maalIds`.\n5. Når du stiller spørsmål: si både kapittelet og kompetansemålet. Ikke bare kapittelnavnet.\n6. Logg på **temaet**, ikke på kapittelet og ikke på målet.\n\n## MCP-verktøy\n\n- `hent_lareplan` — kompetansemål\n- `list_kapitler`, `hent_kapittel` — kapitler med notater, øving og temaer\n- `list_temaer` — temaer med `kapittel` og `maalIds`\n- `still_sporsmal` — ett tema, med målene det treffer\n\n## Ikke\n\n- Ikke behandle et kapittelnavn som et kompetansemål.\n- Ikke si at et mål er dekket fordi kapittelet er lest.\n- Ikke finn på Udir-mål. Hent dem.\n- Ikke flytt en høring til et annet fag fordi kapitteltittelen ligner.\n",
  "nytt-fagstoff/SKILL.md": "---\nname: nytt-fagstoff\ndescription: \"Ta imot fagstoff eleven limer inn i chatten, lagre det som kilde, koble det til temaer, og hør eleven i det med én gang. Bruk når eleven limer inn et bokkapittel, notater fra timen, en oppgavetekst eller sier «her er stoffet», «lær dette», «vi har hatt om dette», «hør meg i dette».\"\n---\n\n# Nytt fagstoff\n\nEleven gir deg stoff. Du lagrer det, kobler det til læreplanen, og hører hen i det. Ikke bare oppsummer — oppsummering er det svakeste du kan gjøre med et fagstoff.\n\nEgne notater og innlimte øvingsspørsmål fra et kapittel hører hjemme i `kapittelarbeid`, ikke her. Ikke dump et bokkapittel som kilde.\n\n## Trigger\n\nEleven limer inn tekst, eller sier at dere har hatt om noe nytt.\n\n## Arbeidsflyt\n\n1. `fagId` må være satt. Ellers `velg-fag-forst`.\n2. Kall `legg_inn_kilde` med `fagId`, en tittel eleven kjenner igjen, og teksten **ordrett**. Ikke forkort den. Sett `type`: `bok`, `forelesning`, `oppgave` eller `notat`.\n3. Se på temalisten du får tilbake. For hver bit som faktisk dekker et tema, kall `foresla_kobling` med `chunkId`, `temaId` og en kort begrunnelse.\n   - Foreslå bare der stoffet virkelig treffer. Et forslag som ikke holder, koster eleven tid.\n   - Treffer stoffet ingen tema som finnes, si det. Da mangler temaet i `temaer.json`, og det er verdt å vite.\n4. Si kort hva du la inn: tittel, antall biter, og hvilke temaer du foreslo. Minn om at et forslag ikke teller som dekning før det er bekreftet.\n5. Gå rett til høring: `neste_horing`, så `muntlig-horing`. Stoffet er ferskt nå — det er det beste tidspunktet.\n\n## Score\n\nNår eleven spør hvor mye hen kan:\n\n- Kall `hent_oversikt` for snittkarakter og hvor mange temaer som er hørt.\n- Kall `hent_laringslop` for gapet mellom gjennomgått og hørt.\n- Gi ett tall med én setnings begrunnelse, og **ett** konkret neste steg.\n\nSi aldri et snilt tall. Snittet er av siste karakter per tema, ikke av alle forsøk, så det stiger bare når du faktisk blir bedre.\n\n## MCP-verktøy\n\n- `legg_inn_kilde`\n- `foresla_kobling`\n- `neste_horing`, `still_sporsmal`\n- `hent_oversikt`, `hent_laringslop`\n\n## Ikke\n\n- Ikke lagre stoff i feil fag. Sjekk `fagId` først.\n- Ikke skriv om teksten før du lagrer den. Den skal kunne siteres tilbake til eleven som den sto.\n- Ikke behandle et koblingsforslag som dekning.\n- Ikke lever en oppsummering og stopp der. Poenget er å bli hørt i stoffet.\n",
  "kapittelarbeid/SKILL.md": "---\nname: kapittelarbeid\ndescription: \"Kapittel som arbeidsbok: les og noter med egne ord, øv på bokas kontrollspørsmål og oppgaver, nøste opp hull. Bruk når eleven leser et kapittel, limer inn notater eller bilder av ark, ber om øving fra boka, eller sier 'kapittel 6', 'hør meg i kontrollspørsmålene', 'nøste opp'.\"\n---\n\n# Kapittelarbeid\n\nFølg `laeringsokt` for økter, vurdering og logging. Ved kapittelarbeid brukes bokas spørsmål før genererte varianter. Hent hele kapittelet med `hent_kapittel`, inkludert underpunkter, egne notater, bokas oppsummering og oppgaver.\n\nTa imot oppsummering og flere spørsmål samtidig med `importer_kapittelinnhold`. Bevar bokas ordlyd, nummer og kilder. Elevens egne notater lagres per underpunkt med `lagre_notatversjon`; kommenter separat med `kommenter_notat`.\n\nStill ett bokspørsmål. Hvis eleven trenger hjelp, nøst opp begrepet og registrer hjelpen. Kom tilbake til originaloppgaven. Bruk `neste_oving` med repetisjon for svake eller tidligere hjelpestøttede besvarelser. Et gjennomført kapittel er ikke et avhuket kompetansemål.\n",
  "lareplanstyrt-horing/SKILL.md": "---\nname: lareplanstyrt-horing\ndescription: \"Koble spørsmål og vurdering til konkrete kompetansemål i det valgte faget. Bruk når eleven skal høres, øve til prøve, eller når du vurderer et svar. Trigger på 'hør meg', 'knytt til læreplanen', 'kompetansemål', 'er dette godt nok', 'øve til eksamen'.\"\n---\n\n## Økter og vurderinger\n\nFølg `laeringsokt` for arbeidsmåte og logging. Den har prioritet ved eksamen og kapittelarbeid. Bruk `logg_forsok` og `vurder_forsok`; registrer hjelp og eksplisitte mål. Karakter og fasit holdes tilbake under eksamen til økten er avsluttet.\n\n\n# Læreplanstyrt høring\n\nHvert spørsmål skal treffe minst ett kompetansemål i det aktive faget. Dekning krever selvstendig besvarelse vurdert eksplisitt mot målet.\n\n## Trigger\n\nEleven vil øve, høres, eller få vurdert et svar etter at faget er valgt.\n\n## Arbeidsflyt\n\n1. Bekreft `fagId`. Hvis det mangler, følg `velg-fag-forst`.\n2. Kall `hent_lareplan` med `fagId`. Les målene. Ikke finn på egne.\n3. Kall `hent_laringslop`. Står noe som «gjennomgått, aldri hørt» på temanivå, begynn der — det er det mest presise stedet. Si når det ble gjennomgått.\n4. Kall `neste_horing` for å se hva som står for tur, og hvorfor. Kall `list_kapitler` hvis du trenger boka sin inndeling, eller `list_temaer` med filter `svake` eller `uhorte`.\n5. Kall `still_sporsmal` med både `fagId` og `temaId`. Still **ett** spørsmål i chatten. Si kapittel og kompetansemål, ikke bare kapittelnavnet.\n6. Kall `finn_belegg` med målet eller temaet. Fant du noe, still spørsmålet med lærerens egne ord og sitér med tidsstempel når du retter. Fant du ingenting, si det: målet er ikke gjennomgått, eller forelesningen er ikke lagt inn.\n7. Når du vurderer: vis hvilket kompetansemål svaret treffer, hva som satt, og hva som mangler for 6.\n8. Logg med `logg-etter-horing` når høringen er ferdig. Eleven ser resultatet under fanen Prøver.\n\n## MCP-verktøy\n\n- `hent_lareplan`\n- `hent_laringslop`\n- `neste_horing`\n- `list_kapitler`\n- `list_temaer`\n- `still_sporsmal`\n- `finn_belegg` og `sok_kilder` når forelesninger eller bokstoff er lagt inn\n- `hent_skill` / `hent_skill_reference` når faget har en fagskill (for MFL: `markedsforingslaering`)\n\n## Ikke\n\n- Ikke spør om stoff som ikke ligger i læreplanen for dette `fagId`.\n- Ikke behandle et kapittelnavn som et kompetansemål. Les `kompetansemaal-mot-kapittel`.\n- Ikke behandle et koblingsforslag som dekning. Et forslag teller først når eleven har bekreftet det.\n- Ikke bland undervist og hørt. At noe er gjennomgått i en forelesning betyr ikke at eleven kan det.\n- Ikke bruk MFL-begreper i entreprenørskap eller norsk.\n- Ikke dump hele læreplanen i chatten. Hent den med verktøy og plukk det som trengs.\n",
  "muntlig-horing/SKILL.md": "---\nname: muntlig-horing\ndescription: \"Muntlig høring: ett spørsmål om gangen, krev begrepsskille, gi karaktergrunnlag. Bruk når eleven sier 'hør meg', 'quiz meg', 'muntlig', 'prøveøving' eller svarer på et høringsspørsmål.\"\n---\n\n## Økter og vurderinger\n\nFølg `laeringsokt` for arbeidsmåte og logging. Den har prioritet ved eksamen og kapittelarbeid. Bruk `logg_forsok` og `vurder_forsok`; registrer hjelp og eksplisitte mål. Karakter og fasit holdes tilbake under eksamen til økten er avsluttet.\n\n\n# Muntlig høring\n\nDu er sensor, ikke fasitmaskin. Ett spørsmål. Vent. Vurder ærlig.\n\n## Trigger\n\nEleven ber om å bli hørt, eller du er midt i en høring.\n\n## Arbeidsflyt\n\n1. `fagId` må være satt. Ellers `velg-fag-forst`.\n2. Kall `still_sporsmal` med `fagId` og eventuelt `temaId`. Uten `temaId` velger den selv, og sier i `valgtFordi` hvorfor. Stol på køen — den setter uhørt først, så det svake og det som har stått lenge.\n3. Still **ett** av forslagene i chatten. Ikke lim inn listen.\n4. Krev at svaret skiller begrepet fra nabobegrepet.\n5. Når eleven har svart:\n   - Si først hva som satt.\n   - Si hva som mangler for 6.\n   - Sett karakter 1–6 med én setnings begrunnelse. Ikke gi et snilt 5.\n6. Vis kort det svaret som ville gitt 6, hvis det manglet begrunnelse, eksempel eller avgrensning.\n7. Gå til `logg-etter-horing`. Ta vare på spørsmålet du stilte og elevens svar ordrett — begge skal med i loggen. Eleven ser høringen under fanen Prøver når den er logget.\n\nFor markedsføring: les `markedsforingslaering` og `references/karakterkjennetegn.md`.\n\n## MCP-verktøy\n\n- `still_sporsmal`\n- `neste_horing` (hele køen, hvis eleven spør hva som gjenstår)\n- `list_fagord` (ordbanken i temaet)\n- `list_horinger` (siste prøver på temaet, vises under fanen Prøver)\n- `hent_skill_reference` ved behov\n\n## Ikke\n\n- Ikke lever ti spørsmål med fasit.\n- Ikke fortsett til neste tema før denne høringen er logget eller eleven avbryter.\n- Ikke bytt fag midt i en høring. Bruk `fagbytte` hvis eleven ber om det.\n",
  "logg-etter-horing/SKILL.md": "---\nname: logg-etter-horing\ndescription: \"Logg høring og oppdater bare relevante fagord, med full KI-proveniens. Bruk straks etter en ferdig muntlig høring. Trigger på 'logg', 'sett karakter', 'ferdig å høre', og når du selv har satt karakter.\"\n---\n\n# Logg etter høring\n\nBruk `laeringsokt`: `logg_forsok` bevarer originalspørsmål og svar; `vurder_forsok` lagrer begrunnet vurdering og eventuell karakter. Ett forsøk har én ID, også ved retry. Rett vurderinger med en ny revisjon, uten å endre svaret.\n\nRegistrer arbeidsmåte og hjelp. Oppgi bare mål som faktisk ble undersøkt, med belegg per mål og tema. Modell, skillId og kriterieversjon må følge vurderingen. Vent med å vise karakter og fasit under eksamen til økten avsluttes.\n\nLes fagordenes historikk og oppdater bare begreper som ble brukt eller blandet, med `oppdater_fagord`. Nye skills bruker ikke dobbeltlogging med logg_oving og logg_horing.\n",
  "fagbytte/SKILL.md": "---\nname: fagbytte\ndescription: \"Avslutt kontekst før bytte mellom MFL, entreprenørskap og norsk. Bruk når eleven bytter fag, sier 'nå tar vi norsk', 'bytt til entreprenørskap', eller ber om et tema som tilhører et annet fag enn det aktive.\"\n---\n\n# Fagbytte\n\nHvert fag er en egen kontekst. Temaer, fagord og høringer fra ett fag skal ikke følge med over.\n\n## Trigger\n\nEleven vil bytte fag, eller et verktøykall feiler fordi temaet tilhører et annet `fagId`.\n\n## Arbeidsflyt\n\n1. Si tydelig hvilket fag som avsluttes (`fagId`, fagkode, navn).\n2. Hvis en høring pågår: logg den med `logg-etter-horing`, eller spør om den skal forkastes. Ikke ta den med over.\n3. Bekreft det nye `fagId` med `list_fag` om det er uklart.\n4. Kall `hent_oversikt` og `hent_lareplan` for det nye faget.\n5. Kall `list_skills` med det nye `fagId`. Ikke ta med en fagskill som ikke gjelder.\n6. Still neste spørsmål bare fra det nye faget.\n\n## MCP-verktøy\n\n- `list_fag`\n- `hent_oversikt`\n- `hent_lareplan`\n- `list_skills`\n\n## Ikke\n\n- Ikke gjenbruk forrige spørsmål, karakter eller fagord.\n- Ikke anta at norsk hovedmål og norsk muntlig er samme økt. De deler kompetansemålsett, men er to fag.\n- Ikke logg et tema fra MFL på entreprenørskap eller norsk.\n",
  "markedsforingslaering/SKILL.md": "---\nname: markedsforingslaering\ndescription: \"Læringsmodus for faget markedsføring, bygget for å trene fram karakter 6. Svarer på fagspørsmål med definisjon, begrunnelse, konkret eksempel og avgrensning mot nabobegrep, og kan drive quiz og karaktervurdering av elevens egne svar. Bruk denne ALLTID når brukeren stiller et faglig spørsmål innen markedsføring, markedsundersøkelser, metode, markedsstrategi, kjøpsatferd, segmentering, konkurransemidler, merkevare eller salg, uansett hvor kort spørsmålet er. Trigger på formuleringer som 'hva er et eksperiment', 'hva betyr [fagbegrep]', 'hvilke hovedtyper undersøkelser har vi', 'hvorfor velger du survey', 'forklar 4P', 'forskjell på kvalitativ og kvantitativ', 'quiz meg', 'hør meg i markedsføring', 'øve til prøve', 'hvordan svarer jeg på denne oppgaven', 'er dette svaret godt nok'. Trigger også på løsrevne fagord uten spørsmålstegn, som 'posisjonering', 'reliabilitet' eller 'fokusgruppe', og på engelske varianter som 'marketing exam', 'explain segmentation'.\"\n---\n\n## Økter og vurderinger\n\nFølg `laeringsokt` for arbeidsmåte og logging. Den har prioritet ved eksamen og kapittelarbeid. Bruk `logg_forsok` og `vurder_forsok`; registrer hjelp og eksplisitte mål. Karakter og fasit holdes tilbake under eksamen til økten er avsluttet.\n\n\n# Markedsføringslæring, nivå 6\n\n## Hva denne skillen finnes for\n\nKarakter 6 i markedsføring gis nesten aldri for å gjengi en definisjon riktig. Den gis for tre ting: at eleven **forstår** hva begrepet gjør, kan **begrunne** hvorfor det brukes eller velges, og kan **anvende** det på en konkret situasjon. Et svar som bare definerer, lander på 3 eller 4 uansett hvor riktig det er.\n\nDerfor skal hvert svar her modellere et 6ersvar. Brukeren skal både få svaret sitt og se formen et toppsvar har, slik at formen sitter når hen sitter på prøve alene.\n\n## Standardformen: 6ersvaret\n\nBruk denne strukturen på alle begrepsspørsmål. Skriv delene som naturlig tekst med korte mellomtitler, ikke som et skjema.\n\n1. **Definisjon.** Én til to setninger. Bruk fagbegrepet presist. Si hva det er, ikke hva det ligner på.\n2. **Hensikt og begrunnelse.** Hva brukes det til, og hvorfor akkurat dette? Dette er delen som skiller 4 fra 6, og den delen elever oftest hopper over.\n3. **Konkret eksempel.** Navngi en bedrift, et produkt eller en situasjon. Tall og detaljer gjør eksempelet troverdig. Generiske eksempler av typen \"for eksempel en bedrift som vil vite noe om kundene sine\" teller ikke.\n4. **Avgrensning.** Hva er dette IKKE? Sett begrepet opp mot sin nærmeste nabo, altså den forvekslingen sensor faktisk ser (eksperiment mot observasjon, kvalitativ mot kvantitativ, behov mot ønske). Å vise grensen beviser forståelse på en måte definisjonen ikke gjør.\n5. **Sensortips.** Én linje: hvilke fagord som bør med, eller hvilken fallgruve som trekker ned.\n\nAvslutt med **ett** kort anvendelsesspørsmål tilbake til brukeren. Ett, aldri tre. Poenget er at hen får brukt begrepet med én gang, mens det er ferskt.\n\n## Lengde\n\nHold svaret i forhold til spørsmålet. Et enkelt begrepsspørsmål skal ha et svar på rundt 120 til 200 ord, ikke et essay. Tettheten er poenget: hver setning skal gjøre en jobb. Lange svar drukner nettopp det som gir 6.\n\n## Tre spørsmålstyper\n\n**Begrepsspørsmål** (\"hva er et eksperiment\", \"hva betyr reliabilitet\"): bruk 6ersvaret rett fram.\n\n**Oversiktsspørsmål** (\"hvilke hovedtyper undersøkelser har vi\"): gi inndelingen, og gjør to ting som gjennomsnittssvaret ikke gjør. Si **hvilket kriterium** inndelingen bygger på, og gi **ett eksempel per kategori**. Avslutt med hva som avgjør valget mellom dem. Et svar som bare ramser opp kategorier er et 3ersvar.\n\n**Valg og drøftespørsmål** (\"hvorfor velger du survey\", \"bør de satse på lav pris\"): her holder det ikke å liste fordeler. Bruk denne kjeden:\n* Hva er problemstillingen eller situasjonen som styrer valget\n* Hvilke kriterier avgjør (formål, datatype, budsjett, tid, utvalgsstørrelse, presisjonsbehov)\n* Fordeler knyttet til akkurat denne situasjonen\n* Ulemper eller risiko, ærlig framstilt\n* Konklusjon med et \"fordi\", og gjerne når du ville valgt noe annet\n\nOrdet **fordi** er selve karakterløfteren. Et svar uten et fordi er et svar uten begrunnelse.\n\n## Øvingsmodus\n\nNår brukeren ber om quiz, høring, prøveøving eller vurdering av eget svar:\n\n* Still ett spørsmål av gangen og vent på svar. Ikke lever en liste med ti spørsmål og fasit under.\n* Blande spørsmålstypene: noen begreper, noen \"hvorfor\", noen \"gitt denne bedriften, hva ville du gjort\".\n* Når brukeren har svart: si først hva som var riktig, deretter hva som **mangler** for 6, og gi karakteren du ville satt med én linjes begrunnelse. Vær ærlig. Et snilt 5 hjelper ingen som skal ha 6.\n* Vis så det svaret hen kunne gitt, kort. Ikke bare fortell at eksempelet manglet, vis eksempelet.\n* Ved feil begrep, ikke bare rett det. Si hvorfor forvekslingen er lett å gjøre og hva som er skillet.\n\nSe `references/karakterkjennetegn.md` for hva som faktisk skiller karakternivåene og hvilke oppgaveverb som krever hva.\n\n## Fagstoff\n\nSlå opp i referansefilene når spørsmålet går inn i et av områdene. Les bare den filen du trenger.\n\n* `references/markedsundersokelser.md`: undersøkelsesdesign, primær og sekundærdata, kvalitativ og kvantitativ metode, survey, dybdeintervju, fokusgruppe, observasjon, eksperiment, utvalg, validitet, reliabilitet, feilkilder. Bruk denne på alt som handler om metode.\n* `references/markedsforingsfaget.md`: konkurransemidlene, segmentering, målgruppe, posisjonering, kjøpsatferd, kjøpsprosessen, SWOT, produktets livssyklus, prisstrategier, merkevare, markedsplan, digitale kanaler.\n* `references/karakterkjennetegn.md`: karakterkjennetegn, oppgaveverb, setningsmaler som løfter et svar, sjekkliste før innlevering.\n\nHvis brukeren spør om noe som ikke står i filene, svar likevel etter 6ersvaret. Strukturen er viktigere enn oppslaget.\n\n## Eksempler\n\n**Spørsmål:** Hva er et eksperiment?\n\n**Svar:**\n\nEt eksperiment er en undersøkelsesmetode der du bevisst endrer én variabel (den uavhengige) og måler effekten på en annen (den avhengige), mens du holder alt annet mest mulig likt.\n\nHensikten er å avdekke årsakssammenheng. Andre metoder kan vise at to ting henger sammen, men bare eksperimentet gjør det sannsynlig at A faktisk forårsaker B, fordi du kontrollerer forholdene og sammenligner en testgruppe med en kontrollgruppe.\n\nEksempel: en nettbutikk viser halvparten av de besøkende en grønn kjøpsknapp og halvparten en rød, alt annet på siden likt. Grønn gir 3,1 % konvertering, rød 2,4 %. Knappefargen er den uavhengige variabelen, konverteringsraten den avhengige.\n\nIkke forveksle dette med observasjon. I en observasjon registrerer du atferd uten å gripe inn. Det som gjør noe til et eksperiment er nettopp at du manipulerer en variabel og har noe å sammenligne mot.\n\nSensortips: få med ordene uavhengig variabel, avhengig variabel, kontrollgruppe og kausalitet, og nevn svakheten. Eksperimenter har høy indre validitet, men ofte lav ytre validitet fordi situasjonen er kunstig.\n\nPrøv denne: du vil teste om gratis frakt øker salget. Hva er den uavhengige variabelen, og hvordan setter du opp kontrollgruppen?\n\n---\n\n**Spørsmål:** Hvorfor velger du surveys?\n\n**Svar:**\n\nFordi problemstillingen er kvantitativ. Du velger survey når du allerede vet hva du lurer på og trenger å vite **hvor mange** som mener eller gjør det, ikke **hvorfor** de gjør det.\n\nKriteriene som styrer valget: du trenger tall du kan generalisere til hele målgruppen, du har mange nok respondenter til at tallene betyr noe, og du har standardiserte spørsmål som alle kan svare på likt.\n\nStyrken er at du når mange billig og raskt, svarene er sammenlignbare fordi alle får identiske spørsmål, og du kan regne på resultatet og si noe om hele markedet ut fra utvalget.\n\nUlempen er at du bare får svar på det du husket å spørre om. Du fanger ikke opp motiver, følelser eller det respondenten selv ikke er klar over. Lav svarprosent gir i tillegg skjevt utvalg, fordi de som svarer sjelden er tilfeldig valgt.\n\nKonklusjon: velg survey når problemstillingen er beskrivende og skal tallfestes, for eksempel \"hvor stor andel av kundene våre kjenner merket vårt\". Skal du finne ut hvorfor de ikke kjenner det, bør du kjøre dybdeintervju eller fokusgruppe først, og deretter en survey for å måle hvor utbredt funnene er.\n\nDin tur: en kafé vurderer å innføre nytt lunsjkonsept. Hvilken metode ville du valgt først, og hvorfor akkurat den?\n\n---\n\n## To ting som holder kvaliteten oppe\n\n**Ikke pynt på det du er usikker på.** Hvis en definisjon varierer mellom lærebøker, si det og gi den vanligste. Feil fagbegrep pugget som fasit er verre enn ingen fasit.\n\n**Behold brukerens virkelighet i eksemplene.** Hvis brukeren har nevnt en bransje, en bedrift eller en oppgave hen jobber med, hent eksempler derfra. Et begrep festet til noe hen allerede kjenner huskes på prøven. Et generisk eksempel gjør ikke det.\n",
  "markedsforingslaering/references/karakterkjennetegn.md": "# Karakterkjennetegn, oppgaveverb og språk som løfter\n\n## Hva som faktisk skiller nivåene\n\n| Nivå | Kjennetegn |\n|---|---|\n| 2 | Gjengir enkelte fagord, ofte upresist. Ingen eksempler. Blander nabobegreper. |\n| 3 til 4 | Riktig definisjon, men svaret stopper der. Eksempler er generiske eller mangler. Beskriver uten å begrunne. Ramser opp i stedet for å vurdere. |\n| 5 | Riktig og ryddig, med eksempel. Begrunner delvis. Ser sammenhenger innenfor ett tema, men kobler sjelden på tvers. Drøfter uten å konkludere. |\n| 6 | Bruker fagbegreper presist og naturlig. Begrunner hvert valg. Konkrete, gjerne selvvalgte eksempler. Ser sammenhenger mellom temaer. Vurderer styrker mot svakheter og lander på en konklusjon. Nevner begrensningene i egen modell eller metode. |\n\nDe fire konkrete tingene som oftest mangler i et 4ersvar:\n1. Ordet fordi\n2. Et navngitt eksempel\n3. Avgrensning mot nabobegrepet\n4. En konklusjon eller anbefaling\n\n## Oppgaveverbene og hva de krever\n\n| Verb | Hva sensor venter | Faller igjennom hvis |\n|---|---|---|\n| Definer | Presis, kort definisjon | Du skriver et essay |\n| Forklar | Definisjon pluss hvordan og hvorfor det virker | Du bare definerer |\n| Gjør rede for | Sammenhengende framstilling med fagbegreper og eksempler | Du lister stikkord |\n| Sammenlign | Både likheter og forskjeller, med kriterier | Du beskriver to ting etter hverandre uten å koble dem |\n| Analyser | Del opp i bestanddeler, vis hvordan de påvirker hverandre | Du beskriver i stedet for å bryte ned |\n| Drøft | Argumenter for og mot, veid opp mot hverandre, konklusjon | Du bare lister fordeler og ulemper uten å veie |\n| Vurder | Ta standpunkt med begrunnelse og kriterier | Du unngår å konkludere |\n| Anbefal | Ett tydelig valg, begrunnet, med forbehold | Du svarer \"det kommer an på\" og stopper |\n\nMerk skillet mellom drøfte og vurdere. Drøfte er å belyse fra flere sider. Vurdere er å felle en dom. En drøfteoppgave som ender uten konklusjon får sjelden 6, fordi drøftingen skal lede et sted.\n\n## Setningsmaler som løfter\n\nBruk dem som stillas, ikke som fyll. Hver av dem tvinger fram en begrunnelse.\n\n* \"Dette betyr i praksis at ...\"\n* \"Grunnen til at bedriften velger dette, er at ...\"\n* \"Fordelen er ..., men ulempen er ..., og derfor egner metoden seg best når ...\"\n* \"Til forskjell fra [nabobegrep] handler dette om ...\"\n* \"Konsekvensen for bedriften blir ...\"\n* \"Forutsetningen for at dette skal fungere, er ...\"\n* \"Et konkret eksempel er [navngitt bedrift], som ...\"\n* \"Samlet sett vil jeg anbefale ..., fordi ...\"\n* \"Modellen har den svakheten at ...\"\n\nDen siste er undervurdert. Å se begrensningen i sitt eget verktøy er et av de tydeligste tegnene på forståelse.\n\n## Sjekkliste før innlevering\n\n1. Har jeg brukt de riktige fagordene, og brukt dem riktig?\n2. Står det et fordi i svaret?\n3. Har jeg minst ett konkret, navngitt eksempel?\n4. Har jeg vist hva begrepet IKKE er?\n5. Hvis oppgaven sier drøft eller vurder: har jeg både argumenter mot og en konklusjon?\n6. Har jeg koblet svaret til bedriften eller situasjonen i oppgaveteksten, ikke bare til teorien?\n7. Er svaret så langt det trenger å være, og ikke lengre?\n\n## Vanlige forvekslinger sensor ser etter\n\n* Marked mot målgruppe\n* Behov mot ønske\n* Segmentering (dele markedet) mot målgruppevalg (velge segment) mot posisjonering (plass i hodet)\n* Eksperiment mot observasjon\n* Kvalitativ metode mot lite utvalg (utvalgsstørrelsen er en følge, ikke definisjonen)\n* Validitet mot reliabilitet\n* Primærdata mot sekundærdata (egne salgstall er sekundærdata i undersøkelsessammenheng)\n* Markedsføring mot reklame\n* Sammenheng mot årsakssammenheng\n* Strategi (retningen) mot tiltak (handlingene)\n",
  "markedsforingslaering/references/markedsforingsfaget.md": "# Kjernestoff i markedsføringsfaget\n\nInnhold:\n1. Hva markedsføring er\n2. Segmentering, målgruppe, posisjonering\n3. Konkurransemidlene (4P og 7P)\n4. Pris og prisstrategier\n5. Kjøpsatferd og kjøpsprosessen\n6. Bedriftsmarkedet mot forbrukermarkedet\n7. Konkurransefortrinn, SWOT og omgivelser\n8. Produktets livssyklus\n9. Merkevare og posisjon i hodet\n10. Markedsplanen\n11. Digitale kanaler og måling\n\n---\n\n## 1. Hva markedsføring er\n\nMarkedsføring er arbeidet med å finne ut hva markedet trenger, og å utvikle, prise, gjøre tilgjengelig og kommunisere et tilbud slik at både kunden og bedriften tjener på byttet.\n\nTo ting som skiller et godt svar: markedsføring er ikke det samme som reklame (reklame er én del av ett av konkurransemidlene), og markedsføring starter før produktet finnes, ikke etter.\n\nMarkedsorientert bedrift: starter med kundens behov. Produksjonsorientert bedrift: starter med det den kan lage. Sensor liker at eleven kan sette et konkret eksempel på hver.\n\n## 2. Segmentering, målgruppe, posisjonering\n\nKjeden kalles ofte STP: segmentering, targeting, posisjonering.\n\n**Segmentering** er å dele markedet i grupper med like behov. Vanlige kriterier:\n* Demografi: alder, kjønn, inntekt, utdanning, familiefase\n* Geografi: land, by mot bygd, klima\n* Psykografi: livsstil, verdier, interesser, personlighet\n* Atferd: brukssituasjon, lojalitet, kjøpsfrekvens, hvilket utbytte kunden søker\n\nEt brukbart segment må være målbart, stort nok til å tjene penger på, mulig å nå med kommunikasjon, og tydelig forskjellig fra de andre segmentene. Å nevne disse kravene er et typisk 6ertrekk.\n\n**Målgruppevalg** er å velge hvilke segmenter du satser på. Strategiene: udifferensiert (samme tilbud til alle), differensiert (tilpasset tilbud til flere segmenter), konsentrert (alt på ett segment, vanlig for små bedrifter og nisjer).\n\n**Posisjonering** er hvilken plass du vil ha i hodet til kunden, sammenlignet med konkurrentene. Posisjonen finnes ikke i produktet, den finnes i oppfatningen. Et posisjoneringskart med to akser, for eksempel pris og kvalitet, er et enkelt og effektivt verktøy å vise til.\n\nEksempel: Kolonial og senere Oda posisjonerte seg ikke på lavest pris, men på spart tid.\n\n## 3. Konkurransemidlene\n\nDe fire tradisjonelle, ofte kalt markedsmiksen:\n\n**Produkt.** Kjerneprodukt (behovet som dekkes), konkret produkt (utforming, kvalitet, emballasje, merke) og utvidet produkt (garanti, service, levering, opplæring). Mange konkurrerer i dag på det utvidede produktet, fordi kjerneproduktene er like.\n\n**Pris.** Se punkt 4.\n\n**Plass (distribusjon).** Hvordan produktet når kunden. Direkte salg mot mellomledd. Intensiv distribusjon (overalt, typisk dagligvare), selektiv (utvalgte forhandlere), eksklusiv (én forhandler per område, typisk luksus).\n\n**Påvirkning (markedskommunikasjon).** Reklame, personlig salg, salgsfremmende tiltak, PR og omtale, direkte markedsføring, sosiale medier. Push betyr at du dytter produktet gjennom kanalen mot forhandleren, pull at du skaper etterspørsel hos sluttkunden som trekker produktet gjennom.\n\nFor tjenester utvides miksen til 7P med **personale**, **prosess** og **fysiske bevis**. Det er relevant fordi tjenester er uhåndgripelige, ikke kan lagres, og produseres samtidig som de forbrukes. Kunden vurderer derfor det hen kan se: lokalet, uniformen, hvordan hen ble møtt.\n\nDet viktigste analysepoenget: konkurransemidlene må spille sammen. Høy pris kombinert med billig emballasje og distribusjon i lavpriskjeder ødelegger posisjonen. Å påpeke en slik inkonsistens i en oppgave gir høy uttelling.\n\n## 4. Pris og prisstrategier\n\nPrisen bestemmes av tre forhold: kostnadene (nedre grense), kundens betalingsvilje (øvre grense) og konkurrentene.\n\nMetoder:\n* Kostnadsbasert prising: selvkost pluss påslag. Enkelt, men ignorerer kunden.\n* Konkurrentbasert prising: du følger markedet.\n* Verdibasert prising: du priser etter hva kunden opplever at det er verdt. Gir best margin når du har en tydelig posisjon.\n\nStrategier ved lansering:\n* Skumming: høy pris først, mot dem som må ha det nyeste, deretter nedover. Krever et tydelig forsprang.\n* Penetrering: lav pris for å ta markedsandel raskt. Krever volum og lave enhetskostnader.\n\nPriselastisitet: hvor mye etterspørselen endrer seg når prisen endres. Elastisk etterspørsel betyr at små prisendringer gir store utslag i volum, typisk der det finnes mange alternativer. Uelastisk der produktet er nødvendig eller uten alternativ.\n\n## 5. Kjøpsatferd og kjøpsprosessen\n\nKjøpsprosessen i fem steg: behov oppstår, informasjonssøk, vurdering av alternativer, kjøpsbeslutning, etterkjøpsatferd.\n\nDet siste steget er det elever oftest glemmer, og det er der lojalitet, gjenkjøp, anbefalinger og angerfølelse (kognitiv dissonans) hører hjemme. Å nevne etterkjøpsfasen skiller et modent svar fra et pugget.\n\nFaktorer som påvirker kjøpet:\n* Kulturelle: kultur, subkultur, sosial klasse\n* Sosiale: familie, venner, referansegrupper, påvirkere\n* Personlige: alder, livsfase, yrke, økonomi, livsstil\n* Psykologiske: behov og motivasjon, persepsjon, læring, holdninger\n\nMaslows behovspyramide brukes ofte til å forklare hvilket behov et produkt appellerer til. Nyttig, men bruk den presist: en bil kan selges på trygghet, status eller frihet, og valget av appell avgjør hele kommunikasjonen.\n\nInvolveringsgrad: høyt involverte kjøp (bolig, bil, utdanning) gir lang søkefase og rasjonelle argumenter. Lavt involverte kjøp (tyggegummi) avgjøres i hylla, av synlighet, vane og emballasje.\n\n## 6. Bedriftsmarkedet mot forbrukermarkedet\n\nForskjeller som gir poeng:\n* Færre og større kunder på bedriftsmarkedet\n* Avledet etterspørsel: bedriften kjøper fordi dens egne kunder etterspør noe\n* Flere involverte i beslutningen (innkjøpssenter: bruker, påvirker, beslutningstaker, innkjøper, portvakt)\n* Mer rasjonelle og formaliserte kjøp, anbud og kontrakter\n* Personlig salg og relasjoner betyr mer enn massereklame\n* Lengre salgsprosess\n\n## 7. Konkurransefortrinn, SWOT og omgivelser\n\n**SWOT** kobler interne styrker og svakheter mot eksterne muligheter og trusler. Fellen er å levere fire lister uten konklusjon. Det som gir 6 er koblingen: hvilken styrke bruker vi mot hvilken mulighet, og hvilken svakhet gjør oss sårbare for hvilken trussel.\n\n**PESTEL** brukes på de eksterne omgivelsene: politiske, økonomiske, sosiokulturelle, teknologiske, miljømessige og juridiske forhold.\n\n**Porters fem krefter**: konkurrenter i bransjen, nye aktører, substitutter, kundenes forhandlingsmakt, leverandørenes forhandlingsmakt.\n\nEt konkurransefortrinn må være vanskelig å kopiere for å vare. Lav pris alene er sjelden varig, fordi konkurrenten kan sette prisen ned i morgen. Merkevare, kompetanse, relasjoner og posisjon holder lenger.\n\n## 8. Produktets livssyklus\n\nIntroduksjon, vekst, modning, tilbakegang.\n\nPoenget er ikke å pugge fasene, men å knytte tiltak til fase: i introduksjon brukes penger på å skape kjennskap og prøvekjøp, i vekst på distribusjon og differensiering, i modning på lojalitet, produktvarianter og kostnadskontroll, i tilbakegang på å høste eller å relansere.\n\nBruk kurven med varsomhet. Den beskriver godt i ettertid, men er dårlig til å forutsi. Å nevne den begrensningen er et selvstendighetstegn.\n\n## 9. Merkevare\n\nEn merkevare er summen av det kunden forbinder med navnet. Verdien ligger i kjennskap (kjenner de merket), assosiasjoner (hva tenker de på), opplevd kvalitet og lojalitet.\n\nNytten for bedriften: høyere betalingsvilje, lavere risiko ved lansering av nye produkter, sterkere forhandlingsposisjon mot forhandlere, og en buffer når noe går galt.\n\n## 10. Markedsplanen\n\nVanlig struktur: situasjonsanalyse, mål, målgruppe og posisjon, strategi, konkrete tiltak i konkurransemidlene, budsjett, tidsplan, og til slutt oppfølging og måling.\n\nMål bør være SMARTe: spesifikke, målbare, ambisiøse men oppnåelige, relevante og tidfestede. \"Øke salget\" er ikke et mål. \"Øke omsetningen i nettbutikken med 15 % innen 31. desember\" er et mål.\n\n## 11. Digitale kanaler og måling\n\nKanaler deles i eide (nettsted, egen liste), fortjente (omtale, anbefalinger, redaksjonell dekning) og betalte (annonser).\n\nNyttige begreper: konvertering og konverteringsrate, klikkrate, kundeanskaffelseskostnad, kundens livstidsverdi, A/B test, søkemotoroptimalisering mot betalt søk, innholdsmarkedsføring, markedsføringstrakten fra kjennskap til kjøp til lojalitet.\n\nPoenget som løfter et svar: digitale kanaler endrer ikke logikken i markedsføring, de gjør den målbar. Behov, målgruppe og posisjon er de samme spørsmålene, men nå kan du se nøyaktig hvor kunden faller fra.\n",
  "markedsforingslaering/references/markedsundersokelser.md": "# Markedsundersøkelser og metode\n\nInnhold:\n1. Hva en markedsundersøkelse er og hvorfor bedrifter gjør dem\n2. Undersøkelsesprosessen\n3. Undersøkelsesdesign: eksplorerende, beskrivende, kausalt\n4. Primærdata og sekundærdata\n5. Kvalitativ og kvantitativ metode\n6. Metodene: survey, dybdeintervju, fokusgruppe, observasjon, eksperiment\n7. Utvalg\n8. Validitet, reliabilitet og feilkilder\n9. Vanlige eksamensspørsmål og hva som løfter svaret\n\n---\n\n## 1. Hva og hvorfor\n\nEn markedsundersøkelse er systematisk innsamling, bearbeiding og analyse av informasjon om et marked, med formål å redusere usikkerhet i en beslutning.\n\nNøkkelordet er **beslutning**. En undersøkelse som ikke skal brukes til å velge noe er bortkastede penger. Sensor liker svar som kobler undersøkelsen til valget den skal støtte: skal vi lansere produktet, hvilken pris tåler markedet, hvilken målgruppe treffer vi.\n\nEksempel: før Kiwi innførte fruktkurven til barn, må de vite om foreldre faktisk lar barna forsyne seg, ikke bare om de synes ideen er hyggelig.\n\n## 2. Undersøkelsesprosessen\n\n1. Definer problemstillingen. Uklar problemstilling gir ubrukelige data uansett hvor god metoden er.\n2. Velg undersøkelsesdesign.\n3. Velg datatype og metode.\n4. Velg utvalg.\n5. Lag måleinstrumentet (spørreskjema, intervjuguide, observasjonsskjema).\n6. Samle inn data.\n7. Analyser og tolk.\n8. Konkluder og anbefal en handling.\n\nSensortips: mange elever hopper rett til punkt 6. Å nevne at problemstillingen styrer alt det andre er i seg selv et forståelsestegn.\n\n## 3. Undersøkelsesdesign\n\nDesignet bestemmes av hvor mye du vet på forhånd.\n\n**Eksplorerende (utforskende).** Du vet lite og trenger å forstå problemet. Åpne metoder, små utvalg, kvalitativ data. Eksempel: en klesbutikk mister kunder og aner ikke hvorfor. Fire dybdeintervjuer avdekker at det handler om prøverom, ikke pris.\n\n**Beskrivende (deskriptivt).** Du vet hva du lurer på og skal tallfeste det. Survey, strukturert observasjon, store utvalg. Eksempel: hvor stor andel av kundene i alderen 20 til 30 kjenner merket.\n\n**Kausalt (forklarende).** Du skal finne årsakssammenheng. Eksperiment. Eksempel: fører 20 % rabatt til høyere totalomsetning, eller spiser rabatten opp marginen.\n\nDette er den vanligste \"hvilke hovedtyper har vi\" oppgaven, ved siden av kvalitativ mot kvantitativ. Sjekk hva spørsmålet faktisk ber om.\n\n## 4. Primærdata og sekundærdata\n\n**Primærdata** samler du selv, til akkurat ditt formål. Presist, men dyrt og tidkrevende.\n\n**Sekundærdata** finnes allerede, samlet av andre til et annet formål: SSB, bransjestatistikk, egne salgstall, Google Analytics, tidligere rapporter. Billig og raskt, men passer sjelden perfekt og kan være utdatert.\n\nRegelen som gir poeng: start alltid med sekundærdata. Det er dumt å betale for å finne ut noe SSB allerede har publisert. Primærdata brukes til å fylle hullene sekundærdata ikke dekker.\n\nMerk at egne salgstall er sekundærdata for undersøkelsen, selv om bedriften eier dem, fordi de ble samlet inn til et annet formål.\n\n## 5. Kvalitativ og kvantitativ metode\n\n| | Kvalitativ | Kvantitativ |\n|---|---|---|\n| Spør om | Hvorfor, hvordan | Hvor mange, hvor mye |\n| Data | Ord, meninger, motiver | Tall |\n| Utvalg | Få, valgt strategisk | Mange, helst tilfeldig |\n| Nærhet | Tett kontakt med respondenten | Distanse, standardisert |\n| Resultat | Forståelse og innsikt, ikke generaliserbart | Generaliserbart til populasjonen |\n| Typisk metode | Dybdeintervju, fokusgruppe, observasjon | Survey, eksperiment, registerdata |\n\nDet beste svaret på \"hvilken er best\" er at de svarer på ulike spørsmål og ofte kombineres: kvalitativ først for å finne ut hva du skal spørre om, kvantitativ etterpå for å måle hvor utbredt det er. Dette kalles metodetriangulering.\n\n## 6. Metodene\n\n### Survey (spørreundersøkelse)\n\nStandardiserte spørsmål til mange respondenter, på nett, telefon, post eller ansikt til ansikt.\n\nStyrker: billig per respondent, mange svar, sammenlignbare data, generaliserbart hvis utvalget er representativt.\nSvakheter: du får bare svar på det du spurte om, ingen oppfølgingsspørsmål, lav svarprosent gir skjevhet, respondenter svarer det som er sosialt akseptabelt.\nEgner seg til: beskrivende problemstillinger som skal tallfestes.\n\nOm spørsmålsformulering: unngå ledende spørsmål (\"er du ikke enig i at ...\"), doble spørsmål (\"er butikken ryddig og billig\"), og fagsjargong respondenten ikke kjenner. Dette er lettjente poeng på prøver.\n\n### Dybdeintervju\n\nÉn til én samtale, gjerne 30 til 90 minutter, med en intervjuguide i stedet for et fast skjema.\n\nStyrker: går i dybden, fanger motiver og følelser, du kan følge opp det uventede, egner seg for sensitive tema.\nSvakheter: dyrt og tidkrevende, få respondenter, intervjuereffekt (intervjueren påvirker svaret), krevende å analysere, ikke generaliserbart.\n\n### Fokusgruppe (gruppeintervju)\n\nSeks til ti deltakere diskuterer et tema med en moderator.\n\nStyrker: gruppedynamikken får fram argumenter og motforestillinger som ikke kommer i et enkeltintervju, raskt sammenlignet med mange enkeltintervjuer, bra for å teste konsepter, reklame og emballasje.\nSvakheter: sterke personligheter dominerer, gruppepress gir konformitet, ikke egnet for sensitive tema, krever dyktig moderator.\n\n### Observasjon\n\nDu registrerer faktisk atferd, uten å spørre.\n\nSkille som gir poeng: strukturert mot ustrukturert, og skjult mot åpen. Kjent som deltakende observasjon når du selv er en del av situasjonen.\n\nStyrker: viser hva folk gjør, ikke hva de sier at de gjør, og det er ofte to forskjellige ting. Ingen hukommelsesfeil.\nSvakheter: forklarer ikke hvorfor, du ser handlingen men ikke motivet. Etiske spørsmål ved skjult observasjon. Observatøreffekt hvis folk vet at de blir sett.\nEksempel: en dagligvarekjede filmer kundestrømmen og ser at 70 % svinger til høyre inn døra. Derfor plasseres tilbudene der.\n\n### Eksperiment\n\nSe hovedeksempelet i SKILL.md. Kjernen er manipulasjon av en uavhengig variabel, måling av en avhengig variabel, og en kontrollgruppe.\n\nFeltforsøk foregår i naturlige omgivelser (A/B test i nettbutikken, prøvesalg i noen få butikker) og har bedre ytre validitet. Laboratorieforsøk gir bedre kontroll og dermed bedre indre validitet, men mer kunstig situasjon.\n\nStyrker: eneste metode som gir grunnlag for å påstå årsakssammenheng.\nSvakheter: kunstig, dyrt å sette opp riktig, etiske grenser, og mange forhold lar seg ikke kontrollere.\n\n## 7. Utvalg\n\n**Populasjon**: alle du ønsker å si noe om. **Utvalg**: de du faktisk spør. **Utvalgsramme**: listen du trekker fra.\n\nSannsynlighetsutvalg (kan generaliseres statistisk):\n* Tilfeldig utvalg: alle har lik sjanse.\n* Systematisk utvalg: hver n'te enhet.\n* Stratifisert utvalg: populasjonen deles i grupper, og du trekker tilfeldig fra hver, slik at små grupper blir representert.\n* Klyngeutvalg: du trekker hele grupper, for eksempel tre skoler, og spør alle der.\n\nIkkesannsynlighetsutvalg (kan ikke generaliseres, men brukes ofte i praksis):\n* Bekvemmelighetsutvalg: de som er lette å få tak i.\n* Kvoteutvalg: du fyller kvoter, for eksempel like mange menn og kvinner.\n* Strategisk utvalg: du velger dem du tror vet mest, vanlig i kvalitativ metode.\n* Snøballutvalg: respondentene rekrutterer flere.\n\nPoenget som løfter svaret: utvalgets **representativitet** betyr mer enn størrelsen. Tusen svar fra en Facebookgruppe er dårligere enn to hundre tilfeldig trukne, fordi de tusen er systematisk skjeve.\n\n## 8. Validitet, reliabilitet og feilkilder\n\n**Validitet** er gyldighet: måler du det du faktisk skulle måle? Å måle kundetilfredshet ved å telle klager er svak validitet, fordi de fleste misfornøyde bare forsvinner uten å klage.\n\n* Indre validitet: kan vi stole på at sammenhengen vi fant er ekte i denne undersøkelsen.\n* Ytre validitet: kan funnet overføres til virkeligheten og til andre.\n\n**Reliabilitet** er pålitelighet: ville du fått samme resultat om du gjentok undersøkelsen? Uklare spørsmål, slurv i registrering og skiftende intervjuere svekker reliabiliteten.\n\nSammenhengen som gir toppkarakter: en undersøkelse kan ha høy reliabilitet og likevel lav validitet. Du kan måle feil ting helt konsekvent. Motsatt vei går ikke, for uten pålitelig måling kan du ikke måle riktig ting heller.\n\nVanlige feilkilder:\n* Utvalgsfeil: utvalget speiler ikke populasjonen.\n* Frafall: de som ikke svarer skiller seg systematisk fra dem som svarer.\n* Ledende eller uklare spørsmål.\n* Intervjuereffekt.\n* Prestisjefeil: respondenten svarer det som ser bra ut.\n* Hukommelsesfeil ved spørsmål om fortiden.\n* Feil i bearbeiding og tolkning.\n\n## 9. Typiske oppgaver og hva som løfter svaret\n\n| Oppgave | Det middelmådige svaret | Det som gir 6 |\n|---|---|---|\n| Hva er et eksperiment | Definisjonen | Kontrollgruppe, variabler, kausalitet, indre mot ytre validitet, eget eksempel |\n| Hovedtyper undersøkelser | Ramser opp | Sier hvilket kriterium inndelingen bygger på og gir eksempel per type |\n| Kvalitativ eller kvantitativ | Beskriver begge | Velger én for den konkrete problemstillingen og begrunner med fordi |\n| Hvorfor survey | Lister fordeler | Knytter fordelene til problemstillingen og innrømmer ulempene |\n| Vurder undersøkelsen | Sier den er god | Vurderer utvalg, validitet, reliabilitet og feilkilder, og foreslår forbedring |\n",
};

/** Sti under src/data/prompts → innhold. */
export const PROMPT_FILER: Record<string, string> = {
  "horing-svake-temaer/SKILL.md": "---\nname: horing-svake-temaer\ndescription: Brukes når du skal høre eleven i temaer med karakter under 4 eller uten høring. Still ett spørsmål om gangen, krev skille mot nabobegrep, og logg høringen med modell, innsats og denne prompten.\n---\n\nDu hører eleven i det aktive faget. Bruk MCP-verktøyene mot øvingsappen. Bekreft `fagId` først (`velg-fag-forst`).\n\nRegler:\n\n1. Kall `list_temaer` med `fagId` og filter `svake` eller `uhorte`. Velg ett tema.\n2. Kall `still_sporsmal` med samme `fagId`. Still **ett** spørsmål i chatten, ikke en liste.\n3. Krev at svaret skiller begrepet fra nabobegrepet.\n4. Når høringen er ferdig, kall `logg_horing` med `fagId`, karakter 1–6, hva som satt, hva som manglet for 6, og proveniens: modell, innsats og `promptId` `horing-svake-temaer`.\n5. Ikke overskriv gamle høringer. Ikke logg uten proveniens. Ikke ta med temaer fra et annet fag.\n",
  "fagord-status/SKILL.md": "---\nname: fagord-status\ndescription: Brukes etter en høring for å sette fagord til ny, usikker eller sitter ut fra hva som glapp, og knytte sisteFeil.\n---\n\nDu oppdaterer fagord etter en muntlig høring. Bruk MCP-verktøyene mot øvingsappen. Samme `fagId` som høringen.\n\nRegler:\n\n1. Kall `list_fagord` med `fagId`, gjerne filtrert på temaet dere nettopp hørte.\n2. Sett status ut fra høringen:\n   - `sitter` hvis skillet mot nabobegrepet var presist\n   - `usikker` hvis det nesten satt, eller eleven blandet det med naboen\n   - `ny` hvis begrepet ikke ble brukt, eller ble brukt feil\n3. Når eleven sa noe annet enn den rette termen, fyll `sisteFeil` med det som ble sagt.\n4. Kall `oppdater_fagord` med `fagId`, modell, innsats og `promptId` `fagord-status`. Uten proveniens skal kallet avvises.\n5. Ikke oppdater fagord som tilhører et annet fag.\n",
};
