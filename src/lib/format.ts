const nf = new Intl.NumberFormat("fr-FR");
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmt1 = (n: number) => nf1.format(n);

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** m/s -> "4:52 /km" */
export function fmtPace(metersPerSecond: number): string {
  if (!metersPerSecond) return "–";
  const secPerKm = 1000 / metersPerSecond;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return sec === 60 ? `${min + 1}:00 /km` : `${min}:${String(sec).padStart(2, "0")} /km`;
}

/** m/s -> "28,4 km/h" */
export const fmtSpeed = (metersPerSecond: number) => `${fmt1(metersPerSecond * 3.6)} km/h`;

export function fmtDate(isoLocal: string): string {
  // start_date_local is wall-clock time suffixed with Z: read it as UTC.
  return new Date(isoLocal).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
