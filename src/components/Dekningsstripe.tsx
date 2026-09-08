import type { TemaSegment } from "../lib/dekning";

export function Dekningsstripe({
  segmenter,
  tittel,
}: {
  segmenter: TemaSegment[];
  tittel?: string;
}) {
  if (segmenter.length === 0) {
    return (
      <div
        className="h-2 w-full rounded-full bg-[#9B9B93]/35"
        title={tittel ?? "Ingen temaer knyttet til målet"}
      />
    );
  }

  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full"
      title={tittel}
      role="img"
      aria-label={tittel}
    >
      {segmenter.map((s) => (
        <div
          key={s.temaId}
          className="h-full min-w-1 flex-1"
          style={{
            background: s.farge,
            opacity: s.karakter != null && s.moden ? 0.4 : 1,
          }}
          title={
            s.karakter == null
              ? `${s.navn}: ikke hørt`
              : s.moden
                ? `${s.navn}: ${s.karakter}, ikke hørt på ${s.dagerSiden} dager`
                : `${s.navn}: ${s.karakter}`
          }
        />
      ))}
    </div>
  );
}
