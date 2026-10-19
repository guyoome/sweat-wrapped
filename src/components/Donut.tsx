import type { SportShare } from "@/lib/wrapped/types";

export const DONUT_COLORS = ["#FC4C02", "#00FF66", "#00F0FF", "#FFE600", "#A855F7"];

/** Groups sports beyond the 4th into "Autres". */
export function topSports(sports: SportShare[]) {
  if (sports.length <= 5) return sports;
  const rest = sports.slice(4);
  return [
    ...sports.slice(0, 4),
    {
      sportType: "Other",
      label: "Autres",
      count: rest.reduce((s, x) => s + x.count, 0),
      distanceKm: rest.reduce((s, x) => s + x.distanceKm, 0),
      hours: rest.reduce((s, x) => s + x.hours, 0),
      percent: rest.reduce((s, x) => s + x.percent, 0),
    },
  ];
}

/** Lightweight SVG doughnut chart (no chart library needed). */
export function Donut({ sports, active }: { sports: SportShare[]; active: boolean }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const lengths = sports.map((s) => (s.percent / 100) * circumference);
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <svg viewBox="0 0 180 180" className="h-48 w-48 -rotate-90" role="img" aria-label="Répartition du temps par sport">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="22" />
      {sports.map((s, i) => (
        <circle
          key={s.sportType}
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
          strokeWidth="22"
          strokeDasharray={`${active ? Math.max(lengths[i] - 2, 0) : 0} ${circumference}`}
          strokeDashoffset={-offsets[i]}
          style={{ transition: `stroke-dasharray 900ms cubic-bezier(.22,1,.36,1) ${i * 150}ms` }}
        />
      ))}
    </svg>
  );
}
