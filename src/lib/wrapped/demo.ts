import type { StravaAthlete, StravaSummaryActivity } from "../strava/types";

/**
 * Generates a realistic fake year of activities so the demo mode goes
 * through exactly the same computeWrapped() pipeline as real data.
 */

export const DEMO_PRESETS = ["marathoner", "trail", "commuter"] as const;
export type DemoPreset = (typeof DEMO_PRESETS)[number];

interface Template {
  sport_type: string;
  weight: number; // probability weight
  km: [number, number];
  speedKmh: [number, number];
  dPlusPerKm: [number, number];
  hours: [number, number]; // start hour range
  commute?: number; // probability
  group?: number;
  trainer?: boolean;
  weekdaysOnly?: boolean;
  names: string[];
}

interface PresetConfig {
  athlete: Pick<StravaAthlete, "firstname" | "lastname" | "username" | "city">;
  perWeek: number;
  kudos: [number, number];
  templates: Template[];
  gear: { id: string; name: string; kind: "bike" | "shoes" }[];
  epic: Partial<StravaSummaryActivity> & { name: string; sport_type: string; month: number };
}

const PRESETS: Record<DemoPreset, PresetConfig> = {
  marathoner: {
    athlete: { firstname: "Camille", lastname: "Runner", username: "roadrunner", city: "Paris" },
    perWeek: 5,
    kudos: [8, 35],
    gear: [{ id: "g1", name: "Nike Vaporfly 3", kind: "shoes" }],
    epic: { name: "Marathon de Paris 🏅", sport_type: "Run", month: 3, distance: 42195, moving_time: 10680, total_elevation_gain: 120, kudos_count: 142 },
    templates: [
      { sport_type: "Run", weight: 8, km: [6, 18], speedKmh: [10.5, 13.5], dPlusPerKm: [3, 10], hours: [6, 8], group: 0.2, names: ["Footing matinal", "Fractionné 10x400", "Sortie longue", "Seuil au parc", "Run avant le boulot"] },
      { sport_type: "Run", weight: 3, km: [8, 14], speedKmh: [11, 13], dPlusPerKm: [2, 8], hours: [18, 21], group: 0.5, names: ["Run du club", "Afterwork run", "VMA sur piste"] },
      { sport_type: "WeightTraining", weight: 1, km: [0, 0], speedKmh: [0, 0], dPlusPerKm: [0, 0], hours: [12, 13], names: ["Renfo gainage"] },
      { sport_type: "Ride", weight: 1, km: [25, 40], speedKmh: [24, 28], dPlusPerKm: [6, 12], hours: [9, 11], names: ["Vélo récup"] },
    ],
  },
  trail: {
    athlete: { firstname: "Léa", lastname: "Montagne", username: "traillover", city: "Annecy" },
    perWeek: 4,
    kudos: [12, 45],
    gear: [{ id: "g2", name: "Hoka Speedgoat 6", kind: "shoes" }],
    epic: { name: "UTMB OCC ⛰️", sport_type: "TrailRun", month: 7, distance: 56000, moving_time: 32400, total_elevation_gain: 3500, kudos_count: 210 },
    templates: [
      { sport_type: "TrailRun", weight: 6, km: [10, 30], speedKmh: [6, 9], dPlusPerKm: [25, 50], hours: [6, 9], group: 0.35, names: ["Semnoz par le ravin", "Tour du lac par les crêtes", "Dénivelé du dimanche", "Montée sèche au Parmelan"] },
      { sport_type: "Run", weight: 3, km: [6, 12], speedKmh: [10, 12], dPlusPerKm: [5, 15], hours: [12, 13], names: ["Footing pause dej'", "Fractionné côte"] },
      { sport_type: "Hike", weight: 2, km: [8, 20], speedKmh: [3.5, 5], dPlusPerKm: [40, 80], hours: [8, 10], group: 0.6, names: ["Rando refuge", "Lever de soleil au sommet"] },
      { sport_type: "BackcountrySki", weight: 1, km: [8, 15], speedKmh: [3, 5], dPlusPerKm: [60, 90], hours: [6, 8], names: ["Peau de phoque"] },
    ],
  },
  commuter: {
    athlete: { firstname: "Hugo", lastname: "Pédale", username: "velotafking", city: "Lyon" },
    perWeek: 9,
    kudos: [1, 12],
    gear: [{ id: "g3", name: "Gravel Origine Trail", kind: "bike" }],
    epic: { name: "Lyon → Mont Ventoux 🚴", sport_type: "Ride", month: 6, distance: 214000, moving_time: 30600, total_elevation_gain: 3100, kudos_count: 96 },
    templates: [
      { sport_type: "Ride", weight: 10, km: [8, 14], speedKmh: [20, 25], dPlusPerKm: [3, 8], hours: [7, 9], commute: 1, weekdaysOnly: true, names: ["Vélotaf matin", "Trajet boulot"] },
      { sport_type: "Ride", weight: 8, km: [8, 14], speedKmh: [20, 25], dPlusPerKm: [3, 8], hours: [17, 19], commute: 1, weekdaysOnly: true, names: ["Retour maison", "Vélotaf soir"] },
      { sport_type: "GravelRide", weight: 2, km: [50, 110], speedKmh: [22, 27], dPlusPerKm: [10, 18], hours: [8, 10], group: 0.6, names: ["Gravel dans les Monts d'Or", "Sortie club du samedi"] },
      { sport_type: "VirtualRide", weight: 1, km: [25, 40], speedKmh: [30, 34], dPlusPerKm: [5, 10], hours: [20, 22], trainer: true, names: ["Zwift – Watopia"] },
    ],
  },
};

/** Small deterministic PRNG (mulberry32) so a preset always looks the same. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isDemoPreset(value: string | undefined): value is DemoPreset {
  return DEMO_PRESETS.includes(value as DemoPreset);
}

export function generateDemoYear(preset: DemoPreset, year: number, now = new Date()) {
  const cfg = PRESETS[preset];
  const rand = rng(preset.length * 7919 + year);
  const between = ([min, max]: [number, number]) => min + rand() * (max - min);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const totalWeight = cfg.templates.reduce((s, t) => s + t.weight, 0);

  const activities: StravaSummaryActivity[] = [];
  const end = Math.min(Date.UTC(year + 1, 0, 1), now.getTime());
  let id = 1;

  for (let day = Date.UTC(year, 0, 1); day < end; day += 86400000) {
    const month = new Date(day).getUTCMonth();
    const weekday = new Date(day).getUTCDay();
    const templates = cfg.templates.filter((t) => !t.weekdaysOnly || (weekday > 0 && weekday < 6));
    const dayWeight = templates.reduce((s, t) => s + t.weight, 0);
    // More activity in spring/summer (peak in June, low in December).
    const seasonality = 1 + 0.35 * Math.cos(((month - 5) / 12) * Math.PI * 2);
    const expected = (cfg.perWeek / 7) * seasonality * (dayWeight / totalWeight);
    let count = expected > 1 ? Math.floor(expected) + (rand() < expected % 1 ? 1 : 0) : rand() < expected ? 1 : 0;

    while (count-- > 0) {
      let r = rand() * dayWeight;
      const tpl = templates.find((t) => (r -= t.weight) < 0) ?? templates[0];
      const km = between(tpl.km);
      const speed = between(tpl.speedKmh);
      const moving = km > 0 ? Math.round((km / speed) * 3600) : Math.round(between([2400, 4200]));
      const hour = Math.floor(between([tpl.hours[0], tpl.hours[1] + 0.99]));
      const start = new Date(day + hour * 3600000 + Math.floor(rand() * 60) * 60000).toISOString();

      activities.push({
        id: id++,
        name: pick(tpl.names),
        sport_type: tpl.sport_type,
        type: tpl.sport_type,
        distance: Math.round(km * 1000),
        moving_time: moving,
        elapsed_time: Math.round(moving * between([1.02, 1.15])),
        total_elevation_gain: Math.round(km * between(tpl.dPlusPerKm)),
        start_date: start,
        start_date_local: start,
        achievement_count: rand() < 0.3 ? Math.ceil(rand() * 4) : 0,
        pr_count: rand() < 0.1 ? 1 : 0,
        kudos_count: Math.round(between(cfg.kudos)),
        comment_count: rand() < 0.2 ? Math.ceil(rand() * 3) : 0,
        athlete_count: rand() < (tpl.group ?? 0.05) ? 2 + Math.floor(rand() * 5) : 1,
        photo_count: rand() < 0.15 ? 1 : 0,
        trainer: Boolean(tpl.trainer),
        commute: rand() < (tpl.commute ?? 0),
        gear_id: km > 0 ? cfg.gear[0].id : null,
        average_speed: km > 0 ? (km * 1000) / moving : 0,
        max_speed: km > 0 ? ((km * 1000) / moving) * 1.6 : 0,
        average_heartrate: Math.round(between([135, 165])),
        has_heartrate: true,
        suffer_score: Math.round((moving / 60) * between([0.6, 1.4])),
      });
    }
  }

  // The "race of the year".
  const { month: epicMonth, ...epic } = cfg.epic;
  const epicDate = new Date(Date.UTC(year, epicMonth, 18, 8, 30)).toISOString();
  if (Date.parse(epicDate) < end) {
    const distance = epic.distance ?? 0;
    const moving = epic.moving_time ?? 3600;
    activities.push({
      ...activities[0],
      ...epic,
      id: id++,
      type: epic.sport_type,
      start_date: epicDate,
      start_date_local: epicDate,
      elapsed_time: Math.round(moving * 1.05),
      average_speed: distance / moving,
      athlete_count: 12,
      pr_count: 3,
      commute: false,
      trainer: false,
      suffer_score: Math.round((moving / 60) * 2.2),
    });
  }

  const athlete: StravaAthlete = {
    id: 0,
    ...cfg.athlete,
    weight: 68,
    bikes: cfg.gear.filter((g) => g.kind === "bike").map((g) => ({ id: g.id, name: g.name, distance: 0 })),
    shoes: cfg.gear.filter((g) => g.kind === "shoes").map((g) => ({ id: g.id, name: g.name, distance: 0 })),
  };

  return { athlete, activities };
}
