// Strava sport_type -> French label, family and MET (for calorie estimation
// when Strava gives no kilojoules).

type Family = "run" | "ride" | "swim" | "foot" | "other";

interface SportInfo {
  label: string;
  family: Family;
  met: number;
}

const SPORTS: Record<string, SportInfo> = {
  Run: { label: "Course à pied", family: "run", met: 9.8 },
  TrailRun: { label: "Trail", family: "run", met: 10.5 },
  VirtualRun: { label: "Tapis de course", family: "run", met: 9 },
  Ride: { label: "Vélo de route", family: "ride", met: 8 },
  GravelRide: { label: "Gravel", family: "ride", met: 8.5 },
  MountainBikeRide: { label: "VTT", family: "ride", met: 8.5 },
  EBikeRide: { label: "Vélo électrique", family: "ride", met: 4 },
  EMountainBikeRide: { label: "VTT électrique", family: "ride", met: 5 },
  VirtualRide: { label: "Home trainer", family: "ride", met: 7.5 },
  Velomobile: { label: "Vélomobile", family: "ride", met: 7 },
  Swim: { label: "Natation", family: "swim", met: 8 },
  Walk: { label: "Marche", family: "foot", met: 3.5 },
  Hike: { label: "Randonnée", family: "foot", met: 6 },
  AlpineSki: { label: "Ski alpin", family: "other", met: 5.5 },
  BackcountrySki: { label: "Ski de rando", family: "foot", met: 9 },
  NordicSki: { label: "Ski de fond", family: "foot", met: 9 },
  Snowboard: { label: "Snowboard", family: "other", met: 5 },
  Rowing: { label: "Aviron", family: "other", met: 7 },
  Kayaking: { label: "Kayak", family: "other", met: 5 },
  WeightTraining: { label: "Musculation", family: "other", met: 5 },
  Workout: { label: "Entraînement", family: "other", met: 6 },
  Crossfit: { label: "CrossFit", family: "other", met: 8 },
  Yoga: { label: "Yoga", family: "other", met: 2.5 },
  RockClimbing: { label: "Escalade", family: "other", met: 7.5 },
  Tennis: { label: "Tennis", family: "other", met: 7 },
  Padel: { label: "Padel", family: "other", met: 6 },
  Soccer: { label: "Football", family: "other", met: 7 },
};

export function sportInfo(sportType: string): SportInfo {
  return SPORTS[sportType] ?? { label: sportType.replace(/([a-z])([A-Z])/g, "$1 $2"), family: "other", met: 6 };
}

export const isRun = (t: string) => sportInfo(t).family === "run";
export const isRide = (t: string) => sportInfo(t).family === "ride";
