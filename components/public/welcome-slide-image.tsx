"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { WelcomeSlide } from "./welcome-slides";

type WelcomeSlideImageProps = {
  slide: WelcomeSlide;
  priority?: boolean;
  className?: string;
  onError?: () => void;
};

export default function WelcomeSlideImage({
  slide,
  priority = false,
  className = "",
  onError,
}: WelcomeSlideImageProps) {
  const mobileFitClass = slide.fitModeMobile === "contain" ? "object-contain" : "object-cover";
  const desktopFitClass = slide.fitModeDesktop === "contain" ? "lg:object-contain" : "lg:object-cover";

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={slide.imageSrc}
        alt={slide.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 70vw, 100vw"
        className={`${mobileFitClass} ${desktopFitClass} object-[var(--mobile-pos)] lg:object-[var(--desktop-pos)]`}
        style={
          {
            "--desktop-pos": slide.desktopObjectPosition,
            "--mobile-pos": slide.mobileObjectPosition,
          } as CSSProperties
        }
        onError={onError}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950"
        style={{ opacity: slide.scrimStrength }}
      />
    </div>
  );
}
