"use client";

import Image from "next/image";
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
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={slide.imageSrc}
        alt={slide.alt}
        fill
        priority={priority}
        sizes="100vw"
        className={`object-cover ${slide.mobilePositionClass} ${slide.desktopPositionClass}`}
        onError={onError}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950"
        style={{ opacity: slide.scrimOpacity }}
      />
    </div>
  );
}
