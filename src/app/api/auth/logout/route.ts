import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clearSession, getSession } from "@/lib/session";
import { deauthorize } from "@/lib/strava/client";

/** Revokes the app's access on Strava and clears the session cookie. */
export async function POST() {
  const session = await getSession();
  if (session) await deauthorize(session.accessToken);
  await clearSession();
  return NextResponse.redirect(`${env.appUrl}/`, { status: 303 });
}
