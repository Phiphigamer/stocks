export const POS = "#2bd47d";
export const NEG = "#ff5a6a";
export const ACCENT = "#38bdf8";
export const FLAT = "#9aa7c0";

export function sparkColor(changePct: number | null | undefined): string {
  if (changePct == null || !isFinite(changePct)) return FLAT;
  return changePct >= 0 ? POS : NEG;
}
