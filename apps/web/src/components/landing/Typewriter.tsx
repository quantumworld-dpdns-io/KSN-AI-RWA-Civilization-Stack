"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  cursor?: boolean;
  onDone?: () => void;
};

export function Typewriter({
  text,
  speedMs = 42,
  startDelayMs = 400,
  className,
  cursor = true,
  onDone,
}: TypewriterProps) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    setShown("");
    setDone(false);

    const startId = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
          onDone?.();
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs, onDone]);

  return (
    <span className={className}>
      {shown}
      {cursor && !done ? <span className="landing-cursor" aria-hidden /> : null}
    </span>
  );
}
