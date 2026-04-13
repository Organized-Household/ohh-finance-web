"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WelcomeSlideImage from "./welcome-slide-image";
import WelcomeSlidePhraseOverlay from "./welcome-slide-phrase-overlay";
import {
  WELCOME_PHRASE_ENTER_DELAY_MS,
  WELCOME_PHRASE_EXIT_LEAD_MS,
  WELCOME_SLIDES,
  WELCOME_SLIDE_DURATION_MS,
  WELCOME_TRANSITION_MS,
} from "./welcome-slides";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
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

  const handleAdvance = useCallback(() => {
    if (allImagesFailed) {
      return;
    }

    const next = getNextAvailableIndex(currentIndex, availableIndices);

    if (next === currentIndex || availableIndices.length === 1 || reducedMotion) {
      setCurrentIndex(next);
      setPhraseVisible(false);
      return;
    }

    setNextIndex(next);
    setIsTransitioning(true);
  }, [allImagesFailed, availableIndices, currentIndex, reducedMotion]);

  useEffect(() => {
    if (!isTransitioning || nextIndex == null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex(nextIndex);
      setNextIndex(null);
      setIsTransitioning(false);
    }, WELCOME_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [isTransitioning, nextIndex]);

  useEffect(() => {
    if (allImagesFailed || isTransitioning) {
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
  }, [allImagesFailed, currentIndex, handleAdvance, isTransitioning]);

  const activeSlide = WELCOME_SLIDES[currentIndex] ?? WELCOME_SLIDES[0];
  const incomingIndex = nextIndex == null ? null : nextIndex;
  const incomingSlide = incomingIndex == null ? null : WELCOME_SLIDES[incomingIndex];

  function markFailed(index: number) {
    setFailedIndices((prev) => {
      if (prev.has(index)) {
        return prev;
      }

      const copy = new Set(prev);
      copy.add(index);

      setCurrentIndex((current) => {
        if (!copy.has(current)) {
          return current;
        }

        const available: number[] = [];
        for (let i = 0; i < WELCOME_SLIDES.length; i += 1) {
          if (!copy.has(i)) {
            available.push(i);
          }
        }

        return available.length === 0 ? current : getNextAvailableIndex(current, available);
      });

      return copy;
    });
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-xl border border-slate-300 bg-slate-900 shadow-sm sm:h-[360px] lg:h-[620px]">
      {allImagesFailed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
      ) : (
        <>
          <WelcomeSlideImage
            slide={activeSlide}
            priority
            onError={() => markFailed(currentIndex)}
            className={`transition-all duration-700 ease-in-out ${
              reducedMotion
                ? "opacity-100"
                : isTransitioning
                  ? "-translate-x-full opacity-100"
                  : "translate-x-0 opacity-100"
            }`}
          />

          {!reducedMotion && incomingSlide ? (
            <WelcomeSlideImage
              slide={incomingSlide}
              onError={() => {
                if (incomingIndex != null) {
                  markFailed(incomingIndex);
                }
              }}
              className={`transition-all duration-700 ease-in-out ${
                isTransitioning ? "translate-x-0 opacity-100" : "translate-x-full opacity-100"
              }`}
            />
          ) : null}
        </>
      )}

      {!allImagesFailed ? (
        <WelcomeSlidePhraseOverlay
          phrase={activeSlide.phrase}
          alignment={activeSlide.phraseAlignment}
          textMaxWidth={activeSlide.textMaxWidth}
          visible={phraseVisible}
          reduceMotion={reducedMotion}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-start px-4 sm:px-6 lg:px-8 xl:px-10 lg:pr-[44%]">
          <p className="max-w-[30rem] rounded-md bg-slate-950/30 px-3 py-2 text-xl font-semibold leading-tight text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:text-2xl lg:text-3xl">
            Organized Household
          </p>
        </div>
      )}
    </div>
  );
}
