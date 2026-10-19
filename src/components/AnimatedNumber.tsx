"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  active: boolean;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** Counts from 0 to `value` (ease-out) each time the slide becomes active. */
export function AnimatedNumber({ value, active, decimals = 0, duration = 1400, className }: Props) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min((now - start) / duration, 1);
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value, duration]);

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span className={className} aria-label={new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimals }).format(value)}>
      <span aria-hidden>{formatted}</span>
    </span>
  );
}
