"use client";

import type { PhraseAlignment } from "./welcome-slides";

type WelcomeSlidePhraseOverlayProps = {
  phrase: string;
  alignment: PhraseAlignment;
  textMaxWidth?: string;
  visible: boolean;
  reduceMotion: boolean;
};

const alignmentClassMap: Record<PhraseAlignment, string> = {
  "top-left": "items-start justify-start pt-8 sm:pt-10 lg:pt-12",
  "center-left": "items-center justify-start",
  "bottom-left": "items-end justify-start pb-8 sm:pb-10 lg:pb-12",
  "top-center": "items-start justify-center pt-8 sm:pt-10 lg:pt-12",
  "bottom-center": "items-end justify-center pb-8 sm:pb-10 lg:pb-12",
};

export default function WelcomeSlidePhraseOverlay({
  phrase,
  alignment,
  textMaxWidth,
  visible,
  reduceMotion,
}: WelcomeSlidePhraseOverlayProps) {
  const motionClass = reduceMotion
    ? visible
      ? "opacity-100"
      : "opacity-0"
    : visible
      ? "translate-y-0 opacity-100"
      : "translate-y-2 opacity-0";

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex px-4 sm:px-6 lg:px-8 xl:px-10 lg:pr-[44%] ${alignmentClassMap[alignment]}`}
    >
      <p
        className={`${textMaxWidth ?? "max-w-[30rem]"} rounded-md bg-slate-950/28 px-3 py-2 text-xl font-semibold leading-tight text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition duration-500 sm:text-2xl lg:text-3xl ${motionClass}`}
      >
        {phrase}
      </p>
    </div>
  );
}
