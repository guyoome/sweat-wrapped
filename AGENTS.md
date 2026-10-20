<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sweat Wrapped — repo guide for agents

"Spotify Wrapped"-style yearly recap of a user's Strava activities, presented as Instagram-like stories with a shareable PNG card. UI copy is **French** (keep it that way; informal "tu", inclusive "prêt·e").

## Stack & commands

- Next.js 16 (App Router, `cacheComponents: true` → dynamic data must sit inside `<Suspense>`; use `await connection()` for request-time values like the current year), React 19, TypeScript strict, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config`).
- `npm run dev` (port 3000) · `npm run build` · `npm run lint`. No test framework is set up.
- Verify a change with `npx tsc --noEmit && npm run lint && npm run build`.
- Only one `next dev` can run per directory: if one is already up, use it instead of starting another.
- Env vars: see `.env.example` (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `APP_URL`, `SESSION_SECRET` ≥ 32 chars). Read them only through `src/lib/env.ts`. Never print `.env.local` values.

## Data flow

1. `/` (`src/app/page.tsx`) → "Se connecter avec Strava" → `/api/auth/strava` (sets OAuth state cookie, redirects to Strava).
2. `/api/auth/callback` exchanges the code, stores tokens in an **encrypted httpOnly cookie** (`src/lib/session.ts`, AES-256-GCM, stateless — no DB).
3. `/wrapped?year=YYYY[&demo=preset]` renders `WrappedLoader` (client), which fetches `/api/wrapped`.
4. `/api/wrapped` refreshes the token if needed (must be a Route Handler so it can rewrite the cookie), then `buildWrappedForAthlete` (`src/lib/wrapped/service.ts`: Strava fetch + 10-min in-memory cache keyed by `athleteId:year`) → `computeWrapped` → JSON `WrappedData`.
5. `StoryPlayer` renders the slides from that data.

Strava API calls live only in `src/lib/strava/client.ts` (raw types in `strava/types.ts`). Mind the rate limit (100 req / 15 min per app).

## Where things live

| Need to… | Edit |
| --- | --- |
| Add/change a stat | `src/lib/wrapped/compute.ts` + the `WrappedData` type in `src/lib/wrapped/types.ts` |
| Add a sport label / calorie MET | `src/lib/wrapped/sports.ts` (`SPORTS` map, keyed by Strava `sport_type`) |
| Add a persona | `src/lib/wrapped/persona.ts` (`RULES`: score ≥ 1 qualifies, highest wins; fallback "Guerrier du Dimanche") |
| Add/edit a slide | `src/components/slides.tsx` → `SLIDES` array (`when` hides a slide without data, `final` = no auto-advance) |
| Story navigation, progress bars, sound | `src/components/StoryPlayer.tsx` |
| Share card (exported to PNG with `html-to-image`, fixed 360×640) | `src/components/ShareCard.tsx` |
| Demo profiles | `src/lib/wrapped/demo.ts` (`DEMO_PRESETS` + `PRESETS`) **and** the `DEMOS` list in `src/app/page.tsx` |
| App name / tagline / emoji | `src/lib/brand.ts` |
| Theme colors, animations, custom variants | `src/app/globals.css` |

## Conventions

- **Responsive:** mobile-first. Mobile and tablet (≤ 768px) share the full-width story layout; the custom `desktop:` variant (`width > 48rem`, defined in `globals.css`) switches to the two-column desktop layout. Use `desktop:`, not `md:`/`lg:`, for layout changes.
- **Slides:** wrap content in `Shell` (kicker + title + content + optional footer) so mobile/desktop layouts stay consistent. Use `animate-rise` / `animate-pop` with `style={delay(ms)}` for staggered entrances (they only play on the active slide). Use `AnimatedNumber` for big counters.
- **Styling:** Tailwind utilities only; theme tokens `strava`, `ink`, `neon-*`; `glass` / `glass-light` utilities for cards; `text-gradient-strava` / `text-gradient-gold` for headings.
- **Demo mode:** only enabled outside production (`env.demoEnabled`); `/api/wrapped` returns 404 for `demo=` in prod. Demo data goes through the same `computeWrapped` pipeline as real data and is deterministic (seeded PRNG), so check new stats against all presets.
- **Accessibility:** keep `aria-label`s, `aria-hidden` on decorative emojis, `inert` on inactive slides, `prefers-reduced-motion` support.
- **Privacy:** activity data is never stored; don't add persistence or logging of Strava data without asking.
- **Commits:** Conventional Commits (`feat(ui): …`, `fix(player): …`), split unrelated changes into separate commits.
