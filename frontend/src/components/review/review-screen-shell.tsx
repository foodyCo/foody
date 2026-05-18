"use client";

import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { Palette } from "@/lib/mock-data";

export const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export const FIELD_SURFACE_CLASSES = cn(
  "h-[50px] rounded-[18px] border border-transparent bg-white",
  "shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)]",
  "ring-0 ring-transparent transition-shadow duration-150",
  "focus-within:ring-[3px] focus-within:ring-[rgba(34,139,34,0.26)] focus-within:ring-offset-1 focus-within:ring-offset-transparent focus-within:shadow-[0_10px_24px_rgba(20,40,28,0.1),0_0_0_1px_rgba(122,236,164,0.18),inset_1px_1px_0_rgba(255,255,255,0.78)] focus-within:after:border-[rgba(21,41,28,0.20)]"
);

export const FIELD_INPUT_CLASSES =
  "h-full border-0 bg-transparent px-3.5 py-0 text-[15.5px] leading-[50px] font-semibold text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15.5px]";

export const FIELD_TINT_CLASSES =
  "before:bg-white before:backdrop-blur-0 before:backdrop-saturate-100";

type ReviewBlob = {
  color: string;
  opacity: number;
  left: string;
  top: string;
  size: string;
};

const REVIEW_BACKGROUNDS: Record<Palette, { base: string; blobs: ReviewBlob[] }> = {
  fresh: {
    base: "#F3F6F2",
    blobs: [
      { color: "#46DA8F", opacity: 0.35, left: "76%", top: "18%", size: "19rem" },
      { color: "#8DE0B0", opacity: 0.55, left: "18%", top: "39%", size: "17rem" },
      { color: "#F5D08C", opacity: 0.70, left: "88%", top: "72%", size: "18rem" },
      { color: "#B8E6CC", opacity: 0.50, left: "16%", top: "88%", size: "20rem" },
    ],
  },
  citrus: {
    base: "#F8F5ED",
    blobs: [
      { color: "#FFC25C", opacity: 0.2, left: "78%", top: "17%", size: "18rem" },
      { color: "#2ECC71", opacity: 0.18, left: "17%", top: "41%", size: "17rem" },
      { color: "#FF9A6B", opacity: 0.15, left: "86%", top: "74%", size: "18rem" },
      { color: "#CDEBA8", opacity: 0.19, left: "18%", top: "88%", size: "20rem" },
    ],
  },
  dusk: {
    base: "#EEF4EF",
    blobs: [
      { color: "#2ECC71", opacity: 0.2, left: "78%", top: "18%", size: "19rem" },
      { color: "#1FA85C", opacity: 0.18, left: "18%", top: "42%", size: "17rem" },
      { color: "#254A38", opacity: 0.13, left: "88%", top: "73%", size: "18rem" },
      { color: "#8DE0B0", opacity: 0.18, left: "16%", top: "88%", size: "20rem" },
    ],
  },
};

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

export function getReviewChromeStyle(
  brand: string,
  fill = "#FFFFFF"
): CSSProperties {
  return {
    background: `linear-gradient(${fill}, ${fill}) padding-box, linear-gradient(140deg, color-mix(in srgb, ${brand} 44%, transparent), rgba(122,236,164,0.42), rgba(100,218,189,0.38), color-mix(in srgb, ${brand} 30%, transparent)) border-box`,
    boxShadow:
      "0 6px 14px rgba(20,40,28,0.09), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)",
  };
}

export function ReviewBackgroundBlobs({ palette }: { palette: Palette }) {
  const { base, blobs } = REVIEW_BACKGROUNDS[palette];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: base }}
    >
      {blobs.map((blob, index) => (
        <div
          key={index}
          className="absolute rounded-full blur-[72px]"
          style={{
            background: blob.color,
            height: blob.size,
            left: `calc(${blob.left} - (${blob.size} / 2))`,
            opacity: blob.opacity,
            top: `calc(${blob.top} - (${blob.size} / 2))`,
            width: blob.size,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_0%,rgba(255,255,255,0.46),transparent_62%)]" />
      <div className="absolute inset-0 bg-white/22" />
    </div>
  );
}

export function ReviewScreen({
  palette,
  children,
}: {
  palette: Palette;
  children: React.ReactNode;
}) {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <ReviewBackgroundBlobs palette={palette} />
      {children}
    </main>
  );
}

export function ReviewContentLayer({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[1] flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,245,240,0.88))] pt-12.5">
      {children}
    </div>
  );
}

export function ReviewScrollArea({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label": string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn("hide-scroll flex-1 overflow-y-auto px-[18px] pb-25", className)}
    >
      {children}
    </section>
  );
}

export function ReviewScreenHeader({
  brand,
  title,
  onBack,
}: {
  brand: string;
  title: string;
  onBack: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="mb-5 flex items-center gap-4 pt-2">
      <motion.button
        type="button"
        aria-label="Назад"
        title="Назад"
        onClick={onBack}
        className={cn(
          "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#15291C] outline-none",
          "border border-transparent",
          "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
        )}
        style={getReviewChromeStyle(brand, "rgba(255,255,255,0.80)")}
        whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
      >
        <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
      </motion.button>
      <h1 className="text-[24px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
        {title}
      </h1>
    </header>
  );
}
