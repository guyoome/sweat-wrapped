import { connection, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAuthorizeUrl } from "@/lib/strava/client";
import { createOAuthState } from "@/lib/session";

/** Starts the Strava OAuth flow. */
export async function GET() {
  // Must run per request (fresh CSRF state): never prerender this handler.
  await connection();
  let url: string;
  try {
    url = getAuthorizeUrl(await createOAuthState());
  } catch (error) {
    // Missing STRAVA_CLIENT_ID / SESSION_SECRET: fail loudly in logs, gracefully in UI.
    console.error(error);
    return NextResponse.redirect(`${env.appUrl}/?error=config`);
  }
  return NextResponse.redirect(url);
}
