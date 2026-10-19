import type { Persona } from "./types";

/** Signals extracted from the year, used to score each persona. */
export interface PersonaSignals {
  activities: number;
  activeDays: number;
  distanceKm: number;
  elevationM: number;
  elevationPerKm: number;
  earlyPercent: number; // started before 8:00
  nightPercent: number; // started after 21:00
  weekendPercent: number;
  commutePercent: number;
  groupPercent: number;
  kudosPerActivity: number;
  activeWeeksPercent: number;
  sportsOver10Percent: number;
  longestStreakDays: number;
}

interface PersonaRule extends Persona {
  /** Returns a score; > 1 means the threshold is met. Highest score wins. */
  score: (s: PersonaSignals) => number;
}

const RULES: PersonaRule[] = [
  {
    id: "summit",
    title: "Chasseur de Sommets",
    emoji: "🏔️",
    description: "Le plat t'ennuie. Tu ne jures que par le D+ et la vue depuis les cimes.",
    gradient: "from-emerald-500 to-teal-300",
    score: (s) => Math.min(s.elevationPerKm / 25, s.elevationM / 15000),
  },
  {
    id: "stakhanov",
    title: "Le Stakhanoviste",
    emoji: "🔥",
    description: "Un jour sans sport est un jour perdu. Ton canapé a oublié ta forme.",
    gradient: "from-red-500 to-orange-400",
    score: (s) => s.activeDays / 250,
  },
  {
    id: "swiss",
    title: "L'Horloge Suisse",
    emoji: "⏱️",
    description: "Pluie, neige ou canicule : chaque semaine, tu es au rendez-vous.",
    gradient: "from-sky-500 to-indigo-400",
    score: (s) => (s.activities >= 40 ? s.activeWeeksPercent / 92 : 0),
  },
  {
    id: "early",
    title: "Lève-tôt Légendaire",
    emoji: "🌅",
    description: "Le soleil se lève, toi tu as déjà fini ta séance. Respect.",
    gradient: "from-amber-400 to-pink-500",
    score: (s) => s.earlyPercent / 40,
  },
  {
    id: "night",
    title: "Guerrier de la Nuit",
    emoji: "🌙",
    description: "Frontale vissée sur la tête, tu t'entraînes quand la ville dort.",
    gradient: "from-violet-600 to-indigo-400",
    score: (s) => s.nightPercent / 25, // started after 21:00
  },
  {
    id: "commuter",
    title: "Roi du Vélotaf",
    emoji: "🚲",
    description: "Le bouchon du matin ? Connais pas. Ton trajet boulot est ton terrain de jeu.",
    gradient: "from-lime-400 to-emerald-500",
    score: (s) => s.commutePercent / 30,
  },
  {
    id: "asphalt",
    title: "Dévoreur d'Asphalte",
    emoji: "🛣️",
    description: "Les kilomètres défilent, rien ne t'arrête. Ton compteur crie grâce.",
    gradient: "from-orange-500 to-red-500",
    score: (s) => s.distanceKm / 5000,
  },
  {
    id: "star",
    title: "Star du Club",
    emoji: "⭐",
    description: "Chaque sortie déclenche une pluie de Kudos. Tes abonnés t'adorent.",
    gradient: "from-yellow-300 to-orange-500",
    score: (s) => s.kudosPerActivity / 20,
  },
  {
    id: "pack",
    title: "Animal de Meute",
    emoji: "🐺",
    description: "Seul on va plus vite, ensemble on va plus loin. Toi, tu as choisi.",
    gradient: "from-fuchsia-500 to-rose-400",
    score: (s) => s.groupPercent / 45,
  },
  {
    id: "swissknife",
    title: "Couteau Suisse",
    emoji: "🧰",
    description: "Course, vélo, natation, muscu… Tu ne choisis pas, tu cumules.",
    gradient: "from-cyan-400 to-blue-600",
    score: (s) => s.sportsOver10Percent / 4,
  },
];

const FALLBACK: Persona = {
  id: "sunday",
  title: "Guerrier du Dimanche",
  emoji: "☕",
  description: "Régulier quand l'envie est là, toujours partant pour une sortie café-croissant.",
  gradient: "from-amber-500 to-orange-500",
};

export function pickPersona(signals: PersonaSignals): { persona: Persona; traits: string[] } {
  const scored = RULES.map((rule) => ({ rule, score: rule.score(signals) }))
    .filter((r) => Number.isFinite(r.score) && r.score >= 1)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const traits = signals.weekendPercent >= 50 ? ["Week-end warrior"] : [];
    return { persona: FALLBACK, traits };
  }

  const { score: _score, ...persona } = scored[0].rule;
  void _score;
  return {
    persona,
    traits: scored.slice(1, 4).map((r) => `${r.rule.emoji} ${r.rule.title}`),
  };
}
