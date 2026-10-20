import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { APP_EMOJI, APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { getSession } from "@/lib/session";

const ERRORS: Record<string, string> = {
  access_denied: "Connexion annulée sur Strava.",
  invalid_state: "Session de connexion expirée, réessaie.",
  missing_code: "Strava n'a pas renvoyé de code d'autorisation.",
  missing_scope: "Il faut autoriser l'accès à tes activités pour générer le récap.",
  token_exchange: "Échec de la connexion avec Strava.",
  config: "L'app n'est pas configurée (STRAVA_CLIENT_ID manquant, voir .env.example).",
};

const DEMOS = [
  { id: "marathoner", label: "Le Marathonien", emoji: "🏃" },
  { id: "trail", label: "La Traileuse", emoji: "⛰️" },
  { id: "commuter", label: "Le Vélotafeur", emoji: "🚲" },
];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-between overflow-hidden bg-ink px-6 py-10 text-center desktop:grid desktop:max-w-none desktop:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] desktop:grid-rows-[auto_auto] desktop:content-center desktop:gap-x-24 desktop:gap-y-10 desktop:px-[max(4rem,calc((100vw-72rem)/2))] desktop:text-left">
      <div aria-hidden className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-strava/30 blur-3xl desktop:h-[36rem] desktop:w-[36rem]" />
      <div aria-hidden className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl desktop:h-[36rem] desktop:w-[36rem]" />

      <header className="relative z-10 mt-8 desktop:col-start-1 desktop:row-start-1 desktop:mt-0 desktop:self-end">
        <span className="inline-block rounded-full border border-strava/40 bg-strava/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-strava">
          {APP_EMOJI} {APP_NAME}
        </span>
        <h1 className="mt-4 text-5xl font-extrabold italic leading-none tracking-tight desktop:mt-6 desktop:text-7xl">
          TON ANNÉE
          <br />
          <span className="text-gradient-strava text-6xl desktop:text-8xl">EN MOUVEMENT</span>
        </h1>
        <p className="mt-4 text-base font-bold text-white/90 desktop:mt-6 desktop:text-xl">{APP_TAGLINE}</p>
        <p className="mt-2 text-sm text-white/70 desktop:max-w-lg desktop:text-base">
          Connecte ton compte Strava : on analyse tes activités et on te sert ton récap façon story, prêt à partager.
        </p>
      </header>

      <Suspense fallback={<div className="my-10 h-64 animate-pulse rounded-2xl bg-white/5 desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:my-0" />}>
        <Actions searchParams={searchParams} />
      </Suspense>

      <footer className="relative z-10 space-y-1 text-[11px] text-white/40 desktop:col-start-1 desktop:row-start-2 desktop:self-start">
        <p className="font-bold uppercase tracking-widest">Powered by Strava</p>
        <p>Tes données sont lues à la volée et ne sont jamais stockées.</p>
      </footer>
    </main>
  );
}

/** Dynamic part (cookies + search params), streamed inside a Suspense boundary. */
async function Actions({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { error } = await searchParams;
  const session = await getSession();
  // Current year depends on request time: opt out of prerendering explicitly.
  await connection();
  const year = new Date().getFullYear();
  const years = [year, year - 1, year - 2];
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <section className="relative z-10 my-10 space-y-4 desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:my-0">
      {errorMessage && (
        <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/15 p-3 text-sm font-semibold text-red-200">
          {errorMessage}
        </p>
      )}

      {session ? (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Choisis ton année</p>
          <div className="grid grid-cols-3 gap-2">
            {years.map((y) => (
              <Link
                key={y}
                href={`/wrapped?year=${y}`}
                className="rounded-2xl bg-strava py-4 text-lg font-extrabold shadow-lg shadow-strava/30 transition hover:bg-strava-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {y}
              </Link>
            ))}
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-xs text-white/50 underline underline-offset-4 hover:text-white">
              Se déconnecter et révoquer l&apos;accès Strava
            </button>
          </form>
        </div>
      ) : (
        // Strava brand guidelines: use the official orange "Connect with Strava" button.
        <a
          href="/api/auth/strava"
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-strava py-4 text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-strava/40 transition hover:bg-strava-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <StravaLogo />
          Se connecter avec Strava
        </a>
      )}

      <div className="glass-light rounded-2xl p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/60">Ou essaie un profil démo</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMOS.map((d) => (
            <Link
              key={d.id}
              href={`/wrapped?demo=${d.id}&year=${year}`}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs font-bold transition hover:border-strava"
            >
              <span className="mb-1 block text-xl" aria-hidden>
                {d.emoji}
              </span>
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StravaLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}
