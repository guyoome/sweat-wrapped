import "server-only";
import { getActivitiesForYear, getAthlete } from "../strava/client";
import { computeWrapped } from "./compute";
import type { WrappedData } from "./types";

// Tiny in-memory cache to stay well below Strava rate limits
// (default: 100 read requests / 15 min per app). Per-instance only:
// swap for Redis/KV if you deploy on several serverless instances.
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: WrappedData }>();

export async function buildWrappedForAthlete(
  athleteId: number,
  accessToken: string,
  year: number,
): Promise<WrappedData> {
  const key = `${athleteId}:${year}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  const [athlete, activities] = await Promise.all([
    getAthlete(accessToken),
    getActivitiesForYear(accessToken, year),
  ]);
  const data = computeWrapped(activities, athlete, year);

  cache.set(key, { at: Date.now(), data });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return data;
}

export function parseYear(value: string | null | undefined): number {
  const current = new Date().getFullYear();
  const year = Number(value);
  return Number.isInteger(year) && year >= 2009 && year <= current ? year : current;
}
