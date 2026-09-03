import { karakterFarge } from "../lib/colors";
import type { Karakter } from "../lib/types";

type Props = {
  karakter: Karakter | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "text-xl",
  md: "text-4xl",
  lg: "text-5xl",
};

export function KarakterTall({ karakter, size = "md", className = "" }: Props) {
  return (
    <span
      className={`font-serif font-semibold leading-none tabular-nums ${sizeClass[size]} ${className}`}
      style={{ color: karakterFarge(karakter) }}
    >
      {karakter ?? "–"}
    </span>
  );
}
