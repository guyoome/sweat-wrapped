import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { consumeOAuthState, saveSession } from "@/lib/session";
import { exchangeCode, getAthlete } from "@/lib/strava/client";

/** Strava redirects here with ?code=...&scope=...&state=... */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const home = (error: string) => NextResponse.redirect(`${env.appUrl}/?error=${error}`);

  if (searchParams.get("error")) return home("access_denied");
  if (!(await consumeOAuthState(searchParams.get("state")))) return home("invalid_state");

  const code = searchParams.get("code");
  const scope = searchParams.get("scope") ?? "";
  if (!code) return home("missing_code");
  // The user can uncheck scopes on the Strava consent screen.
  if (!scope.split(",").some((s) => s.startsWith("activity:read"))) return home("missing_scope");

  try {
    const token = await exchangeCode(code);
    // athleteId is used as cache key: never fall back to a shared value.
    const athleteId = token.athlete?.id ?? (await getAthlete(token.access_token)).id;
    await saveSession({
      athleteId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
      scope,
    });
  } catch {
    return home("token_exchange");
  }

  return NextResponse.redirect(`${env.appUrl}/wrapped`);
}
