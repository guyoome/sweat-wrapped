"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { APP_EMOJI, APP_NAME } from "@/lib/brand";
import type { WrappedData } from "@/lib/wrapped/types";
import { SLIDES } from "./slides";

const SLIDE_MS = 7000;
const HOLD_MS = 220; // press longer than this = pause (Instagram-like)
const SWIPE_PX = 50;

export function StoryPlayer({ data }: { data: WrappedData }) {
  const slides = useMemo(() => SLIDES.filter((s) => !s.when || s.when(data)), [data]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const press = useRef<{ x: number; y: number; t: number; holdTimer?: number; held: boolean } | null>(null);

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(slides.length - 1, i))), [slides.length]);
  const next = useCallback(() => setIndex((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Little synth "blip" on every slide change.
  useEffect(() => {
    if (muted) return;
    try {
      const ctx = (audioRef.current ??= new AudioContext());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(300 + index * 80, t);
      osc.frequency.exponentialRampToValueAtTime(600 + index * 80, t + 0.15);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      /* Web Audio not supported */
    }
  }, [index, muted]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onPointerDown = (e: PointerEvent) => {
    const holdTimer = window.setTimeout(() => {
      if (press.current) press.current.held = true;
      setPaused(true);
    }, HOLD_MS);
    press.current = { x: e.clientX, y: e.clientY, t: Date.now(), holdTimer, held: false };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    clearTimeout(p.holdTimer);
    if (p.held) {
      setPaused(false);
      return;
    }
    const dx = e.clientX - p.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - p.y)) {
      if (dx < 0) next();
      else prev();
      return;
    }
    // Let buttons/links inside slides handle their own clicks.
    if ((e.target as HTMLElement).closest("button, a, input, [data-interactive]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 3) prev();
    else next();
  };

  if (data.totals.activities === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-ink p-6 text-center">
        <p className="text-5xl" aria-hidden>
          🛋️
        </p>
        <h1 className="text-2xl font-extrabold italic">Aucune activité en {data.year}</h1>
        <p className="text-sm text-white/70">Le canapé a gagné cette année… Essaie une autre année !</p>
        <Link href="/" className="rounded-2xl bg-strava px-6 py-3 text-sm font-extrabold uppercase">
          Retour
        </Link>
      </main>
    );
  }

  const current = slides[index];

  return (
    <main className="flex h-dvh items-center justify-center bg-[#08080a] sm:p-4">
      <div
        className="relative h-full w-full max-w-md select-none overflow-hidden bg-ink shadow-2xl sm:h-[844px] sm:rounded-[40px] sm:border-8 sm:border-[#1E1E24]"
        role="region"
        aria-roledescription="carrousel"
        aria-label={`Récap ${data.year}`}
      >
        {/* Progress bars + controls */}
        <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 pt-5">
          <div className="mb-3 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                aria-label={`Aller à : ${s.label}`}
                aria-current={i === index ? "step" : undefined}
              >
                {i < index && <span className="block h-full w-full bg-white" />}
                {i === index && (
                  <span
                    key={`fill-${index}`}
                    className="story-fill block h-full w-full bg-white"
                    style={{
                      animationDuration: `${SLIDE_MS}ms`,
                      animationPlayState: paused || current.final ? "paused" : "running",
                    }}
                    onAnimationEnd={() => !current.final && next()}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <Link href="/" className="flex items-center gap-2" aria-label="Retour à l'accueil">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-strava text-[11px]" aria-hidden>
                {APP_EMOJI}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/90">{APP_NAME} &apos;{String(data.year).slice(2)}</span>
            </Link>
            <div className="flex gap-2">
              <ControlButton label={paused ? "Lecture" : "Pause"} onClick={() => setPaused((p) => !p)}>
                {paused ? "▶" : "❚❚"}
              </ControlButton>
              <ControlButton label={muted ? "Activer le son" : "Couper le son"} onClick={() => setMuted((m) => !m)}>
                {muted ? "🔇" : "🔊"}
              </ControlButton>
            </div>
          </div>
        </div>

        {/* Slides */}
        <div className="relative h-full w-full touch-pan-y" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (press.current = null)}>
          {slides.map((s, i) => {
            const { Component } = s;
            return (
              <section
                key={s.id}
                className="slide no-scrollbar absolute inset-0 overflow-y-auto transition-transform duration-500 ease-out"
                style={{ transform: `translateX(${(i - index) * 100}%)` }}
                data-active={i === index}
                aria-hidden={i !== index}
                inert={i !== index}
                aria-roledescription="slide"
                aria-label={`${i + 1} sur ${slides.length} : ${s.label}`}
              >
                {Math.abs(i - index) <= 1 && <Component data={data} active={i === index} onNext={next} />}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] backdrop-blur-md transition hover:bg-white/20"
    >
      {children}
    </button>
  );
}
