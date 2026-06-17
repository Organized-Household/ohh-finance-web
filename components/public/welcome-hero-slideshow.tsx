"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WelcomeSlideImage from "./welcome-slide-image";
import WelcomeSlidePhraseOverlay from "./welcome-slide-phrase-overlay";
import {
  WELCOME_PHRASE_ENTER_DELAY_MS,
  WELCOME_PHRASE_EXIT_LEAD_MS,
  WELCOME_SLIDES,
  WELCOME_SLIDE_DURATION_MS,
  WELCOME_TRANSITION_MS,
} from "./welcome-slides";

type TransitionPhase = "idle" | "prepare" | "running";

function getNextAvailableIndex(current: number, available: number[]) {
  if (available.length === 0) {
    return 0;
  }

  const pointer = available.indexOf(current);
  if (pointer === -1) {
    return available[0];
  }

  return available[(pointer + 1) % available.length];
}

export default function WelcomeHeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  const rafOneRef = useRef<number | null>(null);
  const rafTwoRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let canceled = false;

    WELCOME_SLIDES.forEach((slide, index) => {
      const probe = new window.Image();
      probe.onload = () => undefined;
      probe.onerror = () => {
        if (canceled) {
          return;
        }
        setFailedIndices((prev) => {
          if (prev.has(index)) {
            return prev;
          }
          const copy = new Set(prev);
          copy.add(index);
          return copy;
        });
      };
      probe.src = slide.imageSrc;
    });

    return () => {
      canceled = true;
    };
  }, []);

  const availableIndices = useMemo(() => {
    const values: number[] = [];

    for (let i = 0; i < WELCOME_SLIDES.length; i += 1) {
      if (!failedIndices.has(i)) {
        values.push(i);
      }
    }

    return values;
  }, [failedIndices]);

  const allImagesFailed = availableIndices.length === 0;

  const safeCurrentIndex = availableIndices.includes(currentIndex)
    ? currentIndex
    : (availableIndices[0] ?? 0);

  const activeSlide = WELCOME_SLIDES[safeCurrentIndex] ?? WELCOME_SLIDES[0];

  const handleAdvance = useCallback(() => {
    if (allImagesFailed) {
      return;
    }

    const baseIndex = availableIndices.includes(safeCurrentIndex)
      ? safeCurrentIndex
      : (availableIndices[0] ?? 0);

    const next = getNextAvailableIndex(baseIndex, availableIndices);

    if (next === baseIndex || availableIndices.length === 1) {
      setCurrentIndex(next);
      return;
    }

    setPhraseVisible(false);

    if (reducedMotion) {
      setCurrentIndex(next);
      return;
    }

    setNextIndex(next);
    setTransitionPhase("prepare");

    if (rafOneRef.current != null) {
      window.cancelAnimationFrame(rafOneRef.current);
    }
    if (rafTwoRef.current != null) {
      window.cancelAnimationFrame(rafTwoRef.current);
    }

    rafOneRef.current = window.requestAnimationFrame(() => {
      rafTwoRef.current = window.requestAnimationFrame(() => {
        setTransitionPhase("running");
      });
    });
  }, [allImagesFailed, availableIndices, reducedMotion, safeCurrentIndex]);

  useEffect(() => {
    if (transitionPhase !== "running" || nextIndex == null) {
      return;
    }

    if (transitionTimerRef.current != null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setCurrentIndex(nextIndex);
      setNextIndex(null);
      setTransitionPhase("idle");
      transitionTimerRef.current = null;
    }, WELCOME_TRANSITION_MS);

    return () => {
      if (transitionTimerRef.current != null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [nextIndex, transitionPhase]);

  useEffect(() => {
    if (allImagesFailed || transitionPhase !== "idle") {
      return;
    }

    const phraseIn = window.setTimeout(() => {
      setPhraseVisible(true);
    }, WELCOME_PHRASE_ENTER_DELAY_MS);

    const phraseOut = window.setTimeout(() => {
      setPhraseVisible(false);
    }, WELCOME_SLIDE_DURATION_MS - WELCOME_PHRASE_EXIT_LEAD_MS);

    const advance = window.setTimeout(() => {
      handleAdvance();
    }, WELCOME_SLIDE_DURATION_MS);

    return () => {
      window.clearTimeout(phraseIn);
      window.clearTimeout(phraseOut);
      window.clearTimeout(advance);
    };
  }, [allImagesFailed, handleAdvance, safeCurrentIndex, transitionPhase]);

  useEffect(() => {
    return () => {
      if (rafOneRef.current != null) {
        window.cancelAnimationFrame(rafOneRef.current);
      }
      if (rafTwoRef.current != null) {
        window.cancelAnimationFrame(rafTwoRef.current);
      }
      if (transitionTimerRef.current != null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const incomingSlide = nextIndex == null ? null : WELCOME_SLIDES[nextIndex];

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden bg-slate-900 sm:min-h-[460px]">
      {allImagesFailed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
      ) : (
        <>
          <WelcomeSlideImage
            slide={activeSlide}
            priority
            className={`will-change-transform ${
              transitionPhase === "running"
                ? "-translate-x-[101%] transition-transform duration-700 ease-out"
                : "translate-x-0 transition-none"
            }`}
          />

          {incomingSlide ? (
            <WelcomeSlideImage
              slide={incomingSlide}
              className={`will-change-transform ${
                transitionPhase === "running"
                  ? "translate-x-0 transition-transform duration-700 ease-out"
                  : "translate-x-[101%] transition-none"
              }`}
            />
          ) : null}
        </>
      )}

      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/22" />

      {!allImagesFailed ? (
        <WelcomeSlidePhraseOverlay
          phrase={activeSlide.phrase}
          phraseMaxWidth={activeSlide.phraseMaxWidth}
          phraseOffset={activeSlide.phraseOffset}
          phraseVerticalAlign={activeSlide.phraseVerticalAlign}
          visible={phraseVisible}
          reduceMotion={reducedMotion}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
          <p className="max-w-[48rem] bg-gradient-to-t from-slate-950/50 via-slate-950/20 to-transparent px-5 py-3 text-center text-3xl font-normal italic leading-tight text-slate-50 drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-[3.2rem]">
            Organized Household
          </p>
        </div>
      )}
    </div>
  );
}
