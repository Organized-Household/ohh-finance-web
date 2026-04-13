"use client";

type WelcomeSlidePhraseOverlayProps = {
  phrase: string;
  phraseMaxWidth: string;
  phraseOffset: string;
  phraseVerticalAlign?: "top" | "bottom";
  visible: boolean;
  reduceMotion: boolean;
};

export default function WelcomeSlidePhraseOverlay({
  phrase,
  phraseMaxWidth,
  phraseOffset,
  phraseVerticalAlign = "bottom",
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
      className={`pointer-events-none absolute inset-0 flex justify-center px-4 sm:px-6 lg:px-8 ${
        phraseVerticalAlign === "top" ? "items-start" : "items-end"
      } ${phraseOffset}`}
    >
      <p
        className={`${phraseMaxWidth} text-balance bg-gradient-to-t from-slate-950/45 via-slate-950/20 to-transparent px-5 py-3 text-center text-3xl font-normal italic leading-tight text-slate-50 drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] transition duration-500 sm:text-4xl lg:text-[3.2rem] ${motionClass}`}
      >
        {phrase}
      </p>
    </div>
  );
}
