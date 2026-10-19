"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WrappedData } from "@/lib/wrapped/types";
import { StoryPlayer } from "./StoryPlayer";

type State =
  | { status: "loading" }
  | { status: "error"; message: string; unauthorized: boolean }
  | { status: "ready"; data: WrappedData };

const LOADING_STEPS = [
  "Connexion à Strava…",
  "Récupération de tes activités…",
  "Calcul de ton dénivelé…",
  "Comptage des Kudos…",
  "Analyse de ta personnalité sportive…",
];

export function WrappedLoader({ year, demo }: { year?: string; demo?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (demo) params.set("demo", demo);

    fetch(`/api/wrapped?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: body.error ?? "Erreur inconnue", unauthorized: res.status === 401 });
        } else {
          setState({ status: "ready", data: body as WrappedData });
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setState({ status: "error", message: "Connexion impossible.", unauthorized: false });
        }
      });

    return () => controller.abort();
  }, [year, demo]);

  useEffect(() => {
    if (state.status !== "loading") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, [state.status]);

  if (state.status === "ready") return <StoryPlayer data={state.data} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      {state.status === "loading" ? (
        <>
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-strava" aria-hidden />
          <p className="text-sm font-semibold text-white/80" role="status" aria-live="polite">
            {LOADING_STEPS[step]}
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl" aria-hidden>
            😵
          </p>
          <p role="alert" className="text-sm font-semibold text-white/80">
            {state.message}
          </p>
          {state.unauthorized ? (
            <a href="/api/auth/strava" className="rounded-2xl bg-strava px-6 py-3 text-sm font-extrabold uppercase tracking-wider">
              Se connecter avec Strava
            </a>
          ) : (
            <Link href="/" className="rounded-2xl bg-strava px-6 py-3 text-sm font-extrabold uppercase tracking-wider">
              Retour à l&apos;accueil
            </Link>
          )}
        </>
      )}
    </main>
  );
}
