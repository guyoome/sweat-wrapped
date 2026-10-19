import { NextResponse, type NextRequest } from "next/server";
import { clearSession, getSession, saveSession } from "@/lib/session";
import { refreshIfNeeded, StravaError } from "@/lib/strava/client";
import { computeWrapped } from "@/lib/wrapped/compute";
import { generateDemoYear, isDemoPreset } from "@/lib/wrapped/demo";
import { buildWrappedForAthlete, parseYear } from "@/lib/wrapped/service";

/**
 * GET /api/wrapped?year=2026            -> wrapped for the logged-in athlete
 * GET /api/wrapped?year=2026&demo=trail -> wrapped from generated demo data
 *
 * Implemented as a Route Handler (not in a Server Component) because a token
 * refresh must be able to write the updated session cookie.
 */
export async function GET(request: NextRequest) {
  const year = parseYear(request.nextUrl.searchParams.get("year"));
  const demo = request.nextUrl.searchParams.get("demo") ?? undefined;

  if (isDemoPreset(demo)) {
    const { athlete, activities } = generateDemoYear(demo, year);
    return NextResponse.json(computeWrapped(activities, athlete, year, { isDemo: true }));
  }

  let session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté à Strava." }, { status: 401 });
  }

  try {
    const refreshed = await refreshIfNeeded(session);
    if (refreshed) {
      session = refreshed;
      await saveSession(session);
    }
    const data = await buildWrappedForAthlete(session.athleteId, session.accessToken, year);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof StravaError) {
      if (error.status === 401 || error.status === 400) await clearSession();
      return NextResponse.json({ error: error.message }, { status: error.status === 429 ? 429 : 502 });
    }
    console.error(error);
    return NextResponse.json({ error: "Impossible de générer ton récap." }, { status: 500 });
  }
}
