import { forwardRef } from "react";
import { APP_EMOJI, APP_NAME } from "@/lib/brand";
import { fmtInt } from "@/lib/format";
import type { WrappedData } from "@/lib/wrapped/types";

/**
 * Fixed 360x640 (9:16) poster, exported at pixelRatio 3 => 1080x1920,
 * the exact Instagram Story size. Uses only solid colors / gradients
 * (no backdrop-filter, no remote images) so the export is reliable.
 */
export const ShareCard = forwardRef<HTMLDivElement, { data: WrappedData }>(function ShareCard({ data }, ref) {
  const topSport = data.sports[0]?.label ?? "–";
  const stats = [
    { label: "Distance", value: `${fmtInt(data.totals.distanceKm)} km`, color: "#FFFFFF" },
    { label: "Dénivelé", value: `+${fmtInt(data.totals.elevationM)} m`, color: "#00FF66" },
    { label: "Temps actif", value: `${fmtInt(data.totals.movingHours)} h`, color: "#00F0FF" },
    { label: "Kudos", value: fmtInt(data.social.kudos), color: "#FBBF24" },
    { label: "Activités", value: fmtInt(data.totals.activities), color: "#FFFFFF" },
    { label: "Série max", value: `${data.routine.longestStreakDays} j`, color: "#FC4C02" },
  ];
  const initials = data.athlete.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={ref}
      className="relative flex h-[640px] w-[360px] shrink-0 flex-col overflow-hidden rounded-[28px] p-6 text-white"
      style={{ background: "linear-gradient(180deg, #1E1E24 0%, #0A0A0C 100%)", fontFamily: "var(--font-jakarta), sans-serif" }}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50" style={{ background: "radial-gradient(circle, #FC4C02 0%, transparent 70%)" }} />
      <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full opacity-40" style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)" }} />

      <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-extrabold uppercase italic tracking-widest">
          {APP_EMOJI} {APP_NAME}
        </span>
        <span className="rounded-full bg-strava/15 px-2.5 py-1 text-xs font-extrabold text-strava">{data.year}</span>
      </div>

      <div className="relative mt-6 text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr ${data.persona.gradient} text-4xl`}>
          {data.persona.emoji}
        </div>
        <p className="mt-3 text-2xl font-extrabold">{data.athlete.name}</p>
        <p className="text-gradient-gold text-sm font-extrabold">{data.persona.title}</p>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">{s.label}</p>
            <p className="text-lg font-extrabold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-between rounded-xl border border-strava/30 bg-strava/15 p-3 text-xs font-bold">
        <span className="text-white/80">Sport dominant</span>
        <span className="text-strava">{topSport}</span>
      </div>

      <div className="relative mt-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] text-white/70">{initials}</span>
        <span>Powered by Strava</span>
      </div>
    </div>
  );
});
