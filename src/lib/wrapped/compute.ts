import type { StravaAthlete, StravaSummaryActivity } from "../strava/types";
import { fmtPace, fmtSpeed } from "../format";
import { pickPersona } from "./persona";
import { isRide, isRun, sportInfo } from "./sports";
import type { ActivityHighlight, SportShare, WrappedData } from "./types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const TIME_SLOTS = [
  { id: "early", label: "Lève-tôt", emoji: "🌅", from: 0, to: 8 },
  { id: "morning", label: "Matinal", emoji: "☀️", from: 8, to: 12 },
  { id: "lunch", label: "Pause dej'", emoji: "🥪", from: 12, to: 14 },
  { id: "afternoon", label: "Après-midi", emoji: "🌤️", from: 14, to: 18 },
  { id: "evening", label: "Afterwork", emoji: "🌆", from: 18, to: 21 },
  { id: "night", label: "Oiseau de nuit", emoji: "🌙", from: 21, to: 24 },
];

const EVEREST_M = 8849;
const EIFFEL_M = 330;
const EARTH_KM = 40075;
const PIZZA_KCAL = 900;
const CROISSANT_KCAL = 230;
const DEFAULT_WEIGHT_KG = 70;

// start_date_local is wall-clock time with a misleading "Z": always read it as UTC.
const local = (a: StravaSummaryActivity) => new Date(a.start_date_local);
const dayKey = (a: StravaSummaryActivity) => a.start_date_local.slice(0, 10);
const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

function highlight(a: StravaSummaryActivity): ActivityHighlight {
  return {
    id: a.id,
    name: a.name,
    sport: sportInfo(a.sport_type).label,
    date: a.start_date_local,
    distanceKm: a.distance / 1000,
    movingTimeSec: a.moving_time,
    elevationM: a.total_elevation_gain,
    kudos: a.kudos_count,
    speedLabel: isRide(a.sport_type) ? fmtSpeed(a.average_speed) : fmtPace(a.average_speed),
  };
}

function maxBy<T>(items: T[], value: (item: T) => number): T | null {
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const v = value(item);
    if (v > bestValue) {
      best = item;
      bestValue = v;
    }
  }
  return best && bestValue > 0 ? best : null;
}

function estimateCalories(a: StravaSummaryActivity, weightKg: number): number {
  // For power-based rides, kJ of mechanical work ≈ kcal burned (≈24% efficiency).
  if (a.kilojoules && isRide(a.sport_type)) return a.kilojoules;
  return sportInfo(a.sport_type).met * weightKg * (a.moving_time / 3600);
}

function longestStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...days].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (Date.parse(sorted[i]) - Date.parse(sorted[i - 1])) / 86400000;
    current = diff === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-${Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7)}`;
}

/** Weeks elapsed in the year so far (whole year if it is over). */
function weeksElapsed(year: number, now = new Date()): number {
  const start = Date.UTC(year, 0, 1);
  const end = Math.min(Date.UTC(year + 1, 0, 1), now.getTime());
  return Math.max(1, Math.ceil((end - start) / (7 * 86400000)));
}

export function computeWrapped(
  activities: StravaSummaryActivity[],
  athlete: StravaAthlete,
  year: number,
  options: { isDemo?: boolean; now?: Date } = {},
): WrappedData {
  const weight = athlete.weight || DEFAULT_WEIGHT_KG;
  const n = activities.length;

  // --- Totals
  let distance = 0;
  let elevation = 0;
  let moving = 0;
  let elapsed = 0;
  let calories = 0;
  let kudos = 0;
  let comments = 0;
  let photos = 0;
  let prs = 0;
  let achievements = 0;
  let group = 0;
  let commutes = 0;
  let commuteDistance = 0;
  let indoor = 0;
  let weekend = 0;
  let earliestMinutes = Infinity;

  const months = new Array(12).fill(0);
  const weekdays = new Array(7).fill(0);
  const slots = new Array(TIME_SLOTS.length).fill(0);
  const days = new Set<string>();
  const weeks = new Set<string>();
  const bySport = new Map<string, { count: number; distance: number; moving: number }>();
  const byGear = new Map<string, number>();

  for (const a of activities) {
    const d = local(a);
    const hour = d.getUTCHours();

    distance += a.distance;
    elevation += a.total_elevation_gain;
    moving += a.moving_time;
    elapsed += Math.max(a.elapsed_time, a.moving_time);
    calories += estimateCalories(a, weight);
    kudos += a.kudos_count;
    comments += a.comment_count;
    photos += a.total_photo_count ?? a.photo_count;
    prs += a.pr_count ?? 0;
    achievements += a.achievement_count;
    if (a.athlete_count > 1) group++;
    if (a.commute) {
      commutes++;
      commuteDistance += a.distance;
    }
    if (a.trainer) indoor++;

    months[d.getUTCMonth()]++;
    weekdays[d.getUTCDay()]++;
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) weekend++;
    slots[TIME_SLOTS.findIndex((s) => hour >= s.from && hour < s.to)]++;
    earliestMinutes = Math.min(earliestMinutes, hour * 60 + d.getUTCMinutes());
    days.add(dayKey(a));
    weeks.add(isoWeek(d));

    const sport = bySport.get(a.sport_type) ?? { count: 0, distance: 0, moving: 0 };
    sport.count++;
    sport.distance += a.distance;
    sport.moving += a.moving_time;
    bySport.set(a.sport_type, sport);

    if (a.gear_id) byGear.set(a.gear_id, (byGear.get(a.gear_id) ?? 0) + a.distance);
  }

  // --- Sports breakdown (by moving time: fairer across sports than distance)
  const sports: SportShare[] = [...bySport.entries()]
    .map(([sportType, s]) => ({
      sportType,
      label: sportInfo(sportType).label,
      count: s.count,
      distanceKm: s.distance / 1000,
      hours: s.moving / 3600,
      percent: pct(s.moving, moving),
    }))
    .sort((a, b) => b.hours - a.hours);

  // --- Routine
  const favMonthIndex = months.indexOf(Math.max(...months));
  const favWeekdayIndex = weekdays.indexOf(Math.max(...weekdays));
  const favSlotIndex = slots.indexOf(Math.max(...slots));
  const streak = longestStreak([...days]);
  const activeWeeksPercent = Math.min(100, pct(weeks.size, weeksElapsed(year, options.now)));

  // --- Records
  const runs = activities.filter((a) => isRun(a.sport_type) && a.distance >= 5000 && !a.trainer);
  const rides = activities.filter((a) => isRide(a.sport_type) && a.distance >= 20000 && !a.trainer && !a.sport_type.startsWith("E"));
  const hardestBySuffer = maxBy(activities, (a) => a.suffer_score ?? 0);
  const hardestByHr = maxBy(activities, (a) => (a.moving_time >= 1200 ? a.average_heartrate ?? 0 : 0));
  const hardest = hardestBySuffer
    ? { ...highlight(hardestBySuffer), metric: `Effort relatif : ${hardestBySuffer.suffer_score}` }
    : hardestByHr
      ? { ...highlight(hardestByHr), metric: `FC moyenne : ${Math.round(hardestByHr.average_heartrate!)} bpm` }
      : null;

  // --- Gear
  const gearList = [
    ...(athlete.bikes ?? []).map((g) => ({ ...g, kind: "bike" as const })),
    ...(athlete.shoes ?? []).map((g) => ({ ...g, kind: "shoes" as const })),
  ];
  const topGearEntry = maxBy([...byGear.entries()], ([, d]) => d);
  const topGearInfo = topGearEntry && gearList.find((g) => g.id === topGearEntry[0]);
  const topGear =
    topGearEntry && topGearInfo
      ? { name: topGearInfo.name, distanceKm: topGearEntry[1] / 1000, kind: topGearInfo.kind }
      : null;

  const distanceKm = distance / 1000;
  const mostLoved = maxBy(activities, (a) => a.kudos_count);

  const { persona, traits } = pickPersona({
    activities: n,
    activeDays: days.size,
    distanceKm,
    elevationM: elevation,
    elevationPerKm: distanceKm ? elevation / distanceKm : 0,
    earlyPercent: pct(slots[0], n),
    nightPercent: pct(slots[TIME_SLOTS.length - 1], n),
    weekendPercent: pct(weekend, n),
    commutePercent: pct(commutes, n),
    groupPercent: pct(group, n),
    kudosPerActivity: n ? kudos / n : 0,
    activeWeeksPercent,
    sportsOver10Percent: sports.filter((s) => s.percent >= 10).length,
    longestStreakDays: streak,
  });

  const displayName = `${athlete.firstname} ${athlete.lastname}`.trim();

  return {
    year,
    isDemo: Boolean(options.isDemo),
    athlete: {
      name: displayName || "Athlète",
      handle: athlete.username ? `@${athlete.username}` : `@${athlete.firstname || "athlete"}`,
      avatarUrl: athlete.profile && athlete.profile.startsWith("http") ? athlete.profile : null,
      city: athlete.city ?? null,
    },
    totals: {
      activities: n,
      activeDays: days.size,
      distanceKm,
      elevationM: elevation,
      movingHours: moving / 3600,
      pauseHours: (elapsed - moving) / 3600,
      calories,
    },
    equivalents: {
      everest: elevation / EVEREST_M,
      eiffelTowers: elevation / EIFFEL_M,
      earthTourPercent: pct(distanceKm, EARTH_KM),
      pizzas: calories / PIZZA_KCAL,
      croissants: calories / CROISSANT_KCAL,
    },
    sports,
    routine: {
      activitiesByMonth: months,
      favoriteMonth: { index: favMonthIndex, label: MONTHS[favMonthIndex], count: months[favMonthIndex] },
      favoriteWeekday: { label: WEEKDAYS[favWeekdayIndex], count: weekdays[favWeekdayIndex] },
      timeSlot: {
        id: TIME_SLOTS[favSlotIndex].id,
        label: TIME_SLOTS[favSlotIndex].label,
        emoji: TIME_SLOTS[favSlotIndex].emoji,
        percent: pct(slots[favSlotIndex], n),
      },
      longestStreakDays: streak,
      activeWeeksPercent,
    },
    records: {
      longest: (() => {
        const a = maxBy(activities, (x) => x.distance);
        return a ? highlight(a) : null;
      })(),
      biggestClimb: (() => {
        const a = maxBy(activities, (x) => x.total_elevation_gain);
        return a ? highlight(a) : null;
      })(),
      fastestRun: (() => {
        const a = maxBy(runs, (x) => x.average_speed);
        return a ? highlight(a) : null;
      })(),
      fastestRide: (() => {
        const a = maxBy(rides, (x) => x.average_speed);
        return a ? highlight(a) : null;
      })(),
      hardest,
    },
    social: {
      kudos,
      kudosPerActivity: n ? kudos / n : 0,
      comments,
      photos,
      prs,
      achievements,
      groupPercent: pct(group, n),
      mostLoved: mostLoved ? highlight(mostLoved) : null,
    },
    fun: {
      commutes,
      commuteKm: commuteDistance / 1000,
      indoor,
      topGear,
      earliestStart: Number.isFinite(earliestMinutes)
        ? `${String(Math.floor(earliestMinutes / 60)).padStart(2, "0")}h${String(earliestMinutes % 60).padStart(2, "0")}`
        : null,
    },
    persona,
    traits,
  };
}
