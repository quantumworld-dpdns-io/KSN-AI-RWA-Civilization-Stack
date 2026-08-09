"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DottedDivider,
  GlitchText,
  NothingButton,
  PillBadge,
} from "@dennislee928/nothingx-react-components";
import { LandingNothingHud } from "./LandingNothingHud";
import { Typewriter } from "./Typewriter";
import "./landing.css";

const MicrogridScene = dynamic(
  () => import("./MicrogridScene").then((m) => m.MicrogridScene),
  { ssr: false },
);

export function LandingPage() {
  const router = useRouter();
  const [typed, setTyped] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewport, setViewport] = useState(800);
  const [formulaVisible, setFormulaVisible] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);

  const onTyped = useCallback(() => setTyped(true), []);

  useEffect(() => {
    const sync = () => {
      setScrollY(window.scrollY);
      setViewport(window.innerHeight);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    const observe = (id: string, onHit: () => void, threshold = 0.3) => {
      const target = document.getElementById(id);
      if (!target) return () => undefined;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) onHit();
        },
        { threshold },
      );
      observer.observe(target);
      return () => observer.disconnect();
    };

    const cleanFormula = observe("sovereign-formula", () => setFormulaVisible(true), 0.35);
    const cleanHud = observe("nothing-signal-deck", () => setHudVisible(true), 0.2);
    return () => {
      cleanFormula();
      cleanHud();
    };
  }, []);

  const progress = Math.min(1, Math.max(0, scrollY / (viewport * 0.7)));
  const blur = progress * 7;

  return (
    <div className="landing">
      <MicrogridScene blur={blur} />
      <div className="landing-vignette" />

      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="KSN home">
          <strong>KSN</strong>
          <span>Civilization Stack</span>
        </Link>
        <div className="landing-nav-actions">
          <PillBadge variant="live">Oracle</PillBadge>
          <Link href="/console" className="landing-nav-cta">
            Console
          </Link>
        </div>
      </header>

      <section className="landing-hero" aria-label="Scene 10 introduction">
        <div className="landing-hero-inner">
          <p className="landing-kicker">AI × RWA · Kardashev Signal</p>
          <h1 className="landing-title">
            {typed ? (
              <GlitchText active>
                Scene 10: Sovereign Asset
              </GlitchText>
            ) : (
              <Typewriter text="Scene 10: Sovereign Asset" onDone={onTyped} />
            )}
          </h1>
          <p className={`landing-sub ${typed ? "visible" : ""}`}>
            Physical infrastructure becomes economically controlled by the AI entity —
            energy and compute collapsed into a single sovereign signal.
          </p>
        </div>
        <div className="landing-scroll-hint" aria-hidden>
          <span>Scroll</span>
          <i />
        </div>
      </section>

      <section
        id="nothing-signal-deck"
        className="landing-hud-section"
        aria-label="NothingX signal deck"
      >
        <div className={`landing-hud-wrap ${hudVisible ? "visible" : ""}`}>
          <p className="landing-formula-label">NothingX · signal deck</p>
          <LandingNothingHud agencyProgress={78} />
        </div>
      </section>

      <section
        id="sovereign-formula"
        className="landing-formula-section"
        aria-label="Sovereign efficiency formula"
      >
        <div className={`landing-formula-card ${formulaVisible ? "visible" : ""}`}>
          <p className="landing-formula-label">Civilization efficiency</p>
          <p className="landing-formula" aria-label="S of t equals P of t over H of t">
            <span>
              S<span className="eq">(</span>t<span className="eq">)</span>
            </span>
            <span className="eq">=</span>
            <span className="landing-fraction">
              <span className="num">
                P<span className="eq">(</span>t<span className="eq">)</span>
              </span>
              <span className="bar" />
              <span className="den">
                H<span className="eq">(</span>t<span className="eq">)</span>
              </span>
            </span>
          </p>
          <DottedDivider length={28} color="rgba(61, 255, 200, 0.45)" />
          <p className="landing-formula-note">
            Productive output over human dependency. As agency rises, the asset stops
            being managed — it becomes sovereign.
          </p>
          <NothingButton variant="primary" onClick={() => router.push("/console")}>
            Launch DApp →
          </NothingButton>
        </div>
      </section>
    </div>
  );
}
