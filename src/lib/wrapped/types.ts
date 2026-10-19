export interface ActivityHighlight {
  id: number;
  name: string;
  sport: string; // localized label
  date: string; // ISO local date
  distanceKm: number;
  movingTimeSec: number;
  elevationM: number;
  kudos: number;
  /** Formatted pace (min/km) or speed (km/h) depending on sport */
  speedLabel: string;
}

export interface SportShare {
  sportType: string;
  label: string;
  count: number;
  distanceKm: number;
  hours: number;
  percent: number; // share of moving time
}

export interface Persona {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
}

export interface WrappedData {
  year: number;
  isDemo: boolean;
  athlete: {
    name: string;
    handle: string;
    avatarUrl: string | null;
    city: string | null;
  };
  totals: {
    activities: number;
    activeDays: number;
    distanceKm: number;
    elevationM: number;
    movingHours: number;
    pauseHours: number;
    calories: number;
  };
  equivalents: {
    everest: number;
    eiffelTowers: number;
    earthTourPercent: number;
    pizzas: number;
    croissants: number;
  };
  sports: SportShare[];
  routine: {
    activitiesByMonth: number[]; // 12 entries
    favoriteMonth: { index: number; label: string; count: number };
    favoriteWeekday: { label: string; count: number };
    timeSlot: { id: string; label: string; emoji: string; percent: number };
    longestStreakDays: number;
    activeWeeksPercent: number;
  };
  records: {
    longest: ActivityHighlight | null;
    biggestClimb: ActivityHighlight | null;
    fastestRun: ActivityHighlight | null;
    fastestRide: ActivityHighlight | null;
    hardest: (ActivityHighlight & { metric: string }) | null;
  };
  social: {
    kudos: number;
    kudosPerActivity: number;
    comments: number;
    photos: number;
    prs: number;
    achievements: number;
    groupPercent: number;
    mostLoved: ActivityHighlight | null;
  };
  fun: {
    commutes: number;
    commuteKm: number;
    indoor: number;
    topGear: { name: string; distanceKm: number; kind: "bike" | "shoes" } | null;
    earliestStart: string | null; // "05:12"
  };
  persona: Persona;
  traits: string[]; // secondary badges
}
