import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

export const env = {
  get stravaClientId() {
    return required("STRAVA_CLIENT_ID");
  },
  get stravaClientSecret() {
    return required("STRAVA_CLIENT_SECRET");
  },
  get sessionSecret() {
    const secret = required("SESSION_SECRET");
    if (secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters long.");
    }
    return secret;
  },
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  /** Demo profiles are a dev-only tool: hidden and disabled in production. */
  get demoEnabled() {
    return process.env.NODE_ENV !== "production";
  },
};
