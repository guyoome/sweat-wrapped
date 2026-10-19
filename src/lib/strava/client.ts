import "server-only";
import { env } from "../env";
import type { Session } from "../session";
import type { StravaAthlete, StravaSummaryActivity, StravaTokenResponse } from "./types";

const OAUTH_BASE = "https://www.strava.com/oauth";
const API_BASE = "https://www.strava.com/api/v3";

// read: public profile, activity:read_all: includes "Only me" activities,
// profile:read_all: needed to get bikes/shoes names on the athlete.
export const STRAVA_SCOPES = ["read", "activity:read_all", "profile:read_all"];

export class StravaError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.stravaClientId,
    redirect_uri: `${env.appUrl}/api/auth/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES.join(","),
    state,
  });
  return `${OAUTH_BASE}/authorize?${params}`;
}

async function tokenRequest(body: Record<string, string>): Promise<StravaTokenResponse> {
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.stravaClientId,
      client_secret: env.stravaClientSecret,
      ...body,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new StravaError(`Strava token request failed (${res.status})`, res.status);
  }
  return res.json();
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

/** Returns a refreshed session if the access token expires within 5 minutes, else null. */
export async function refreshIfNeeded(session: Session): Promise<Session | null> {
  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt - now > 300) return null;
  const token = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  return {
    ...session,
    accessToken: token.access_token,
    refreshToken: token.refresh_token, // Strava may rotate it: always keep the latest
    expiresAt: token.expires_at,
  };
}

export async function deauthorize(accessToken: string) {
  await fetch(`${OAUTH_BASE}/deauthorize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => undefined);
}

async function api<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 429) {
    throw new StravaError("Limite d'appels Strava atteinte, réessaie dans 15 minutes.", 429);
  }
  if (res.status === 401) {
    throw new StravaError("Session Strava expirée, reconnecte-toi.", 401);
  }
  if (!res.ok) {
    throw new StravaError(`Erreur API Strava (${res.status})`, res.status);
  }
  return res.json();
}

export function getAthlete(accessToken: string) {
  return api<StravaAthlete>("/athlete", accessToken);
}

/** Fetches every activity of a calendar year (paginated, 200 per page). */
export async function getActivitiesForYear(
  accessToken: string,
  year: number,
): Promise<StravaSummaryActivity[]> {
  // Pad by one day on each side to absorb timezones, then filter on local date.
  const after = Math.floor(Date.UTC(year, 0, 1) / 1000) - 86400;
  const before = Math.floor(Date.UTC(year + 1, 0, 1) / 1000) + 86400;
  const perPage = 200;
  const all: StravaSummaryActivity[] = [];

  for (let page = 1; page <= 20; page++) {
    const batch = await api<StravaSummaryActivity[]>(
      `/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=${perPage}`,
      accessToken,
    );
    all.push(...batch);
    if (batch.length < perPage) break;
  }

  return all.filter((a) => a.start_date_local.startsWith(String(year)));
}
