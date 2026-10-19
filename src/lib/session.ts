import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Stateless session: Strava tokens are stored in an httpOnly cookie,
 * encrypted with AES-256-GCM so they are never readable client-side
 * and cannot be tampered with.
 */

export const SESSION_COOKIE = "sw_session";
export const OAUTH_STATE_COOKIE = "sw_oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  athleteId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
  scope: string;
}

function key(): Buffer {
  return createHash("sha256").update(env.sessionSecret).digest();
}

export function seal(data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function unseal<T>(value: string): T | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
  path: "/",
});

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value ? unseal<Session>(value) : null;
}

/** Only callable from Route Handlers / Server Functions. */
export async function saveSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, seal(session), { ...cookieOptions(), maxAge: SESSION_MAX_AGE });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function createOAuthState(): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, { ...cookieOptions(), maxAge: 600 });
  return state;
}

export async function consumeOAuthState(received: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);
  return Boolean(expected && received && expected === received);
}
