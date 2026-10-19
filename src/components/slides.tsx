"use client";

import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";
import { fmt1, fmtDate, fmtDuration, fmtInt } from "@/lib/format";
import type { ActivityHighlight, WrappedData } from "@/lib/wrapped/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { DONUT_COLORS, Donut, topSports } from "./Donut";
import { ShareCard } from "./ShareCard";

export interface SlideProps {
  data: WrappedData;
  active: boolean;
  onNext: () => void;
}

export interface SlideDef {
  id: string;
  label: string;
  Component: (props: SlideProps) => ReactNode;
  /** Only show the slide if there is something meaningful to display. */
  when?: (data: WrappedData) => boolean;
  /** Last slide: no auto-advance. */
  final?: boolean;
}

// ---------- Primitives ----------

function Shell({ kicker, title, kickerClass = "text-strava", children, footer, glow }: {
  kicker: string;
  title: string;
  kickerClass?: string;
  children: ReactNode;
  footer?: ReactNode;
  glow?: string;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between p-6">
      {glow && <div aria-hidden className={`absolute right-[-5rem] top-1/3 h-72 w-72 rounded-full blur-3xl ${glow}`} />}
      <header className="relative z-10 mt-16 animate-rise">
        <h2 className={`mb-1 text-xs font-extrabold uppercase tracking-widest ${kickerClass}`}>{kicker}</h2>
        <h3 className="text-3xl font-extrabold italic leading-tight">{title}</h3>
      </header>
      <div className="relative z-10 my-auto py-4">{children}</div>
      {footer && <footer className="relative z-10 mb-4 text-center text-xs text-white/60">{footer}</footer>}
    </div>
  );
}

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

function ActivityCard({ label, a, accent, extra }: { label: string; a: ActivityHighlight; accent: string; extra?: string }) {
  return (
    <div className="glass rounded-3xl border-l-4 p-5" style={{ borderLeftColor: accent }}>
      <span className="rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest" style={{ background: `${accent}33`, color: accent }}>
        {label}
      </span>
      <h4 className="mt-2 line-clamp-2 text-lg font-bold">{a.name}</h4>
      <p className="text-xs text-white/50">
        {a.sport} · {fmtDate(a.date)}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
        <Metric label="Distance" value={`${fmt1(a.distanceKm)} km`} />
        <Metric label="Durée" value={fmtDuration(a.movingTimeSec)} />
        <Metric label="D+" value={`${fmtInt(a.elevationM)} m`} />
      </div>
      {extra && <p className="mt-2 text-center text-xs font-semibold text-white/70">{extra}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-white/50">{label}</p>
      <p className="text-base font-extrabold">{value}</p>
    </div>
  );
}

function Pill({ emoji, label, value, style }: { emoji: string; label: string; value: string; style?: React.CSSProperties }) {
  return (
    <div className="glass-light animate-rise rounded-2xl p-4 text-center" style={style}>
      <p className="text-xl" aria-hidden>
        {emoji}
      </p>
      <p className="text-[10px] uppercase text-white/60">{label}</p>
      <p className="text-base font-extrabold">{value}</p>
    </div>
  );
}

// ---------- Slides ----------

function IntroSlide({ data, onNext }: SlideProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-between p-6 text-center">
      <div aria-hidden className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-strava/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -right-20 h-64 w-64 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />

      <div className="z-10 mt-20 animate-rise">
        <span className="mb-4 inline-block rounded-full border border-strava/40 bg-strava/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-strava">
          {data.isDemo ? "Profil démo" : "Rétrospective annuelle"}
        </span>
        <h1 className="mb-2 text-5xl font-extrabold italic leading-none tracking-tight">
          TON ANNÉE
          <br />
          <span className="text-gradient-strava text-6xl">SPORTIVE</span>
        </h1>
        <p className="text-3xl font-extrabold italic tracking-wider text-white/90">{data.year}</p>
      </div>

      <div className="relative z-10 flex animate-pop items-center justify-center" style={delay(200)}>
        <div className="h-48 w-48 animate-spin-slow rounded-full bg-gradient-to-tr from-strava via-orange-400 to-yellow-300 p-1">
          <div className="h-full w-full rounded-full bg-ink" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {data.athlete.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Strava CDN avatar
            <img src={data.athlete.avatarUrl} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="animate-float text-6xl drop-shadow-[0_0_20px_rgba(252,76,2,0.8)]" aria-hidden>
              🔥
            </span>
          )}
          <span className="mt-2 text-sm font-bold text-white/80">{data.athlete.handle}</span>
        </div>
      </div>

      <div className="z-10 mb-8 w-full animate-rise" style={delay(400)}>
        <p className="glass-light mb-4 rounded-2xl p-4 text-sm font-medium text-white/80">
          {data.athlete.name.split(" ")[0]}, prêt·e à revoir tes exploits, tes sueurs et tes Kudos de {data.year} ?
        </p>
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-strava py-4 text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-strava/40 transition hover:bg-strava-dark"
        >
          Découvrir mes stats →
        </button>
      </div>
    </div>
  );
}

function TotalsSlide({ data, active }: SlideProps) {
  const { totals, equivalents } = data;
  const analogy =
    equivalents.everest >= 1
      ? { emoji: "🏔️", text: <>Ton dénivelé équivaut à <strong className="text-neon-green">{fmt1(equivalents.everest)} fois l&apos;Everest</strong>. Une vraie chèvre de montagne.</> }
      : equivalents.earthTourPercent >= 1
        ? { emoji: "🌍", text: <>Tu as parcouru <strong className="text-strava">{fmt1(equivalents.earthTourPercent)}% du tour de la Terre</strong>. Prêt·e pour le tour complet ?</> }
        : { emoji: "🗼", text: <>Tu as grimpé l&apos;équivalent de <strong className="text-neon-green">{fmt1(equivalents.eiffelTowers)} Tours Eiffel</strong>.</> };

  const cards = [
    { label: "Distance totale", emoji: "🛣️", value: totals.distanceKm, unit: "km", color: "text-strava", bg: "KM" },
    { label: "Dénivelé positif", emoji: "⛰️", value: totals.elevationM, unit: "m", color: "text-neon-green", bg: "D+" },
    { label: "Temps d'effort", emoji: "⏱️", value: totals.movingHours, unit: "heures", color: "text-neon-cyan", bg: "H" },
  ];

  return (
    <Shell kicker="Volume global" title="LES GRANDS CHIFFRES" glow="bg-strava/20" footer={`${fmtInt(totals.activities)} activités sur ${totals.activeDays} jours différents`}>
      <div className="space-y-4">
        {cards.map((c, i) => (
          <div key={c.label} className="glass relative animate-rise overflow-hidden rounded-3xl p-5" style={delay(150 * i)}>
            <div aria-hidden className="absolute bottom-3 right-3 text-7xl font-extrabold italic text-white/5">{c.bg}</div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/60">
              <span aria-hidden>{c.emoji}</span> {c.label}
            </p>
            <p className="flex items-baseline gap-2">
              <AnimatedNumber value={c.value} active={active} className="text-4xl font-extrabold tracking-tight" />
              <span className={`text-xl font-bold ${c.color}`}>{c.unit}</span>
            </p>
          </div>
        ))}
        <div className="flex animate-rise items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-strava/20 to-purple-600/20 p-4" style={delay(500)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-strava text-lg" aria-hidden>
            {analogy.emoji}
          </span>
          <p className="text-xs font-semibold leading-relaxed text-white/90">{analogy.text}</p>
        </div>
      </div>
    </Shell>
  );
}

function SportsSlide({ data, active }: SlideProps) {
  const sports = topSports(data.sports);
  const top = data.sports[0];
  return (
    <Shell kicker="Diversité d'effort" title="TES DISCIPLINES" kickerClass="text-neon-cyan">
      <div className="glass flex animate-rise flex-col items-center rounded-3xl p-5">
        <div className="relative">
          <Donut sports={sports} active={active} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold">{data.sports.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">sport{data.sports.length > 1 ? "s" : ""}</span>
          </div>
        </div>
        <ul className="mt-5 w-full space-y-2">
          {sports.map((s, i) => (
            <li key={s.sportType} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} aria-hidden />
                {s.label}
              </span>
              <span className="text-white/70">
                {fmtInt(s.hours)} h · <strong className="text-white">{Math.round(s.percent)}%</strong>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {top && (
        <p className="glass-light mt-4 animate-rise rounded-2xl p-4 text-center text-sm" style={delay(300)}>
          Ton sport de cœur : <strong className="text-strava">{top.label}</strong> avec {fmtInt(top.count)} sorties et {fmtInt(top.distanceKm)} km.
        </p>
      )}
    </Shell>
  );
}

function RoutineSlide({ data }: SlideProps) {
  const { routine } = data;
  const max = Math.max(...routine.activitiesByMonth, 1);
  const initials = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return (
    <Shell kicker="Tes habitudes" title="LA ROUTINE" kickerClass="text-neon-yellow">
      <div className="glass animate-rise rounded-3xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/60">Activités par mois</p>
        <div className="flex h-28 items-end gap-1.5" role="img" aria-label={`Mois le plus actif : ${routine.favoriteMonth.label}`}>
          {routine.activitiesByMonth.map((count, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${i === routine.favoriteMonth.index ? "bg-strava" : "bg-white/20"}`}
                style={{ height: `${(count / max) * 96}px` }}
              />
              <span className="text-[9px] font-bold text-white/50">{initials[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm">
          Pic de forme en <strong className="text-strava">{routine.favoriteMonth.label}</strong> ({routine.favoriteMonth.count} activités)
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Pill emoji={routine.timeSlot.emoji} label="Ton créneau" value={`${routine.timeSlot.label} · ${Math.round(routine.timeSlot.percent)}%`} style={delay(150)} />
        <Pill emoji="📅" label="Jour sacré" value={routine.favoriteWeekday.label} style={delay(250)} />
        <Pill emoji="🔥" label="Plus longue série" value={`${routine.longestStreakDays} jours d'affilée`} style={delay(350)} />
        <Pill emoji="📈" label="Semaines actives" value={`${Math.round(routine.activeWeeksPercent)}%`} style={delay(450)} />
      </div>
    </Shell>
  );
}

function RecordsSlide({ data }: SlideProps) {
  const { records } = data;
  const fastest = records.fastestRun ?? records.fastestRide;
  return (
    <Shell kicker="Records personnels" title="LE CHEF-D'ŒUVRE DE L'ANNÉE" kickerClass="text-neon-yellow" footer="« Les jambes font mal sur le moment, les souvenirs restent pour toujours. »">
      <div className="space-y-4">
        {records.longest && (
          <div className="animate-rise">
            <ActivityCard label="Plus longue sortie" a={records.longest} accent="#FC4C02" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {records.biggestClimb && (
            <Pill emoji="⛰️" label="Plus gros D+" value={`+${fmtInt(records.biggestClimb.elevationM)} m`} style={delay(150)} />
          )}
          {fastest && <Pill emoji="⚡" label={records.fastestRun ? "Run le + rapide" : "Ride le + rapide"} value={fastest.speedLabel} style={delay(250)} />}
          {records.hardest && (
            <div className="glass-light col-span-2 animate-rise rounded-2xl p-4" style={delay(350)}>
              <p className="text-[10px] uppercase text-white/60">🫀 Le jour où ton cœur a failli sortir de ta poitrine</p>
              <p className="mt-1 truncate font-extrabold">{records.hardest.name}</p>
              <p className="text-xs text-white/60">
                {fmtDate(records.hardest.date)} · {records.hardest.metric}
              </p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function SocialSlide({ data, active }: SlideProps) {
  const { social } = data;
  const solo = Math.round(100 - social.groupPercent);
  return (
    <Shell kicker="Communauté & soutien" title="IMPACT SOCIAL" kickerClass="text-neon-pink">
      <div className="space-y-5 text-center">
        <div className="relative mx-auto inline-block animate-pop">
          <div aria-hidden className="absolute inset-0 rounded-full bg-orange-500/30 blur-2xl" />
          <div className="glass relative mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full border-2 border-strava/50">
            <span className="animate-bounce text-4xl" aria-hidden>
              👍
            </span>
            <AnimatedNumber value={social.kudos} active={active} className="text-4xl font-extrabold" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Kudos</span>
          </div>
        </div>
        <p className="glass mx-auto max-w-xs animate-rise rounded-2xl p-4 text-sm font-medium" style={delay(200)}>
          En moyenne <strong className="text-strava">{fmt1(social.kudosPerActivity)} Kudos</strong> par activité. Tes abonnés ont chauffé le bouton pouce !
        </p>
        {social.mostLoved && (
          <p className="glass-light animate-rise rounded-2xl p-3 text-xs" style={delay(300)}>
            ❤️ Ta sortie la plus aimée : <strong>{social.mostLoved.name}</strong> ({social.mostLoved.kudos} Kudos)
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Pill emoji={solo >= 50 ? "🐺" : "👯"} label="Solo vs groupe" value={`${solo}% / ${100 - solo}%`} style={delay(400)} />
          <Pill emoji="🏆" label="Records & trophées" value={`${fmtInt(social.prs)} PR · ${fmtInt(social.achievements)}`} style={delay(500)} />
        </div>
      </div>
    </Shell>
  );
}

function FunSlide({ data }: SlideProps) {
  const { equivalents, totals, fun } = data;
  const items = [
    { emoji: "🍕", text: <>Tu as brûlé environ <strong>{fmtInt(totals.calories)} kcal</strong>, soit <strong className="text-strava">{fmtInt(equivalents.pizzas)} pizzas</strong> ou {fmtInt(equivalents.croissants)} croissants.</> },
    totals.pauseHours >= 1 && { emoji: "🚦", text: <><strong className="text-neon-yellow">{fmtInt(totals.pauseHours)} heures</strong> passées à l&apos;arrêt : feux rouges, ravitos et pauses café.</> },
    fun.topGear && { emoji: fun.topGear.kind === "bike" ? "🚲" : "👟", text: <>Ton/ta <strong>{fun.topGear.name}</strong> a encaissé <strong className="text-neon-cyan">{fmtInt(fun.topGear.distanceKm)} km</strong> cette année. Désolé pour l&apos;amorti.</> },
    fun.commutes > 0 && { emoji: "💼", text: <><strong>{fun.commutes} trajets</strong> boulot à la force des jambes ({fmtInt(fun.commuteKm)} km).</> },
    fun.earliestStart && { emoji: "⏰", text: <>Départ le plus matinal : <strong className="text-neon-green">{fun.earliestStart}</strong>. Le réveil s&apos;en souvient encore.</> },
  ].filter(Boolean) as { emoji: string; text: ReactNode }[];

  return (
    <Shell kicker="Le saviez-vous ?" title="LES STATS INSOLITES" kickerClass="text-neon-green" glow="bg-neon-green/10">
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="glass flex animate-rise items-center gap-3 rounded-2xl p-4" style={delay(i * 150)}>
            <span className="text-3xl" aria-hidden>
              {item.emoji}
            </span>
            <p className="text-sm leading-snug text-white/90">{item.text}</p>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function PersonaSlide({ data, onNext }: SlideProps) {
  const { persona, traits } = data;
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <header className="mt-16 animate-rise text-center">
        <h2 className="mb-1 text-xs font-extrabold uppercase tracking-widest text-neon-yellow">Analyse de profil</h2>
        <h3 className="text-2xl font-extrabold italic">TON PERSONA SPORTIF</h3>
      </header>

      <div className="glass relative my-auto overflow-hidden rounded-3xl border border-neon-yellow/30 p-6 text-center">
        <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon-yellow/10 blur-2xl" />
        <div className={`mx-auto mb-4 flex h-24 w-24 animate-pop items-center justify-center rounded-2xl bg-gradient-to-tr ${persona.gradient} text-5xl shadow-lg`} style={delay(200)}>
          <span aria-hidden>{persona.emoji}</span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-neon-yellow">Badge officiel {data.year}</span>
        <h4 className="text-gradient-gold mb-2 mt-3 animate-rise text-3xl font-extrabold" style={delay(400)}>
          {persona.title}
        </h4>
        <p className="animate-rise text-sm font-medium leading-relaxed text-white/80" style={delay(500)}>
          {persona.description}
        </p>
        {traits.length > 0 && (
          <div className="mt-4 flex animate-rise flex-wrap justify-center gap-2" style={delay(700)}>
            {traits.map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={onNext} className="mb-6 w-full rounded-2xl bg-white py-4 text-sm font-extrabold uppercase tracking-wider text-black transition hover:bg-white/90">
        Voir ma carte récap →
      </button>
    </div>
  );
}

function ShareSlide({ data, active }: SlideProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: ["#FC4C02", "#00FF66", "#FFE600", "#00F0FF"] });
  }, [active]);

  async function exportPng(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
    return (await fetch(dataUrl)).blob();
  }

  async function handleShare() {
    setBusy(true);
    setFeedback(null);
    try {
      const blob = await exportPng();
      if (!blob) return;
      const file = new File([blob], `sweat-wrapped-${data.year}.png`, { type: "image/png" });
      // Native share sheet on mobile (Instagram, WhatsApp…), download elsewhere.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${APP_NAME} ${data.year}` });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        setFeedback("Image téléchargée !");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setFeedback("Export impossible, réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-between p-4 pt-16">
      <header className="animate-rise text-center">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-strava">Carte de fin d&apos;année</h2>
        <h3 className="text-2xl font-extrabold italic">PRÊT À PARTAGER !</h3>
      </header>

      {/* Visual scale only: the export uses the unscaled 360x640 node. */}
      <div className="flex h-[470px] w-[265px] items-start justify-center" aria-label="Aperçu de la carte récapitulative">
        <div className="origin-top scale-[0.735]">
          <ShareCard ref={cardRef} data={data} />
        </div>
      </div>

      <div className="w-full space-y-2 pb-4">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="w-full rounded-2xl bg-strava py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-strava/30 transition hover:bg-strava-dark disabled:opacity-60"
        >
          {busy ? "Génération…" : "📲 Partager ma story"}
        </button>
        <p className="h-4 text-center text-xs text-white/60" aria-live="polite">
          {feedback}
        </p>
      </div>
    </div>
  );
}

export const SLIDES: SlideDef[] = [
  { id: "intro", label: "Introduction", Component: IntroSlide },
  { id: "totals", label: "Les grands chiffres", Component: TotalsSlide },
  { id: "sports", label: "Disciplines", Component: SportsSlide, when: (d) => d.sports.length > 0 },
  { id: "routine", label: "Routine", Component: RoutineSlide },
  { id: "records", label: "Records", Component: RecordsSlide, when: (d) => Boolean(d.records.longest) },
  { id: "social", label: "Social", Component: SocialSlide },
  { id: "fun", label: "Stats insolites", Component: FunSlide },
  { id: "persona", label: "Persona", Component: PersonaSlide },
  { id: "share", label: "Carte à partager", Component: ShareSlide, final: true },
];
