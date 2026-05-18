"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import { motion, useAnimationControls } from "motion/react";

import { cn } from "@/lib/utils";

import { canAnimate } from "./post-card/post-card-shared";

const SUBSCRIBE_PRESS_TRANSITION = { duration: 0.08, ease: "easeOut" } as const;
const SUBSCRIBE_RETURN_TRANSITION = {
  damping: 28,
  mass: 0.55,
  stiffness: 520,
  type: "spring",
} as const;
const SUBSCRIBE_STATE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const;
export const SUBSCRIBE_STATE_SETTLE_MS = 240;

export const FULLSCREEN_SUBSCRIBE_BUTTON = {
  base:
    "relative h-7 shrink-0 cursor-pointer select-none overflow-hidden rounded-full border border-transparent pt-px leading-none font-extrabold tracking-[0px] text-[#0B2F1D] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [-webkit-tap-highlight-color:transparent]",
  regular: "px-2.5 text-[10.5px]",
  compact: "px-2 text-[9.75px]",
  smallRegular: "max-[380px]:h-6 max-[380px]:px-1.5 max-[380px]:text-[8.75px]",
  smallCompact: "max-[380px]:h-6.5 max-[380px]:px-2 max-[380px]:text-[9px]",
  proCompact:
    "[@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:h-7 [@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:px-2 [@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:text-[9px]",
  largeCompact:
    "[@media(min-width:401px)_and_(min-height:880px)]:h-7 [@media(min-width:401px)_and_(min-height:880px)]:px-1.75 [@media(min-width:401px)_and_(min-height:880px)]:text-[10.5px]",
} as const;

type SubscribeStyleButtonProps = {
  active?: boolean;
  ariaBusy?: boolean;
  ariaLabel: string;
  ariaPressed?: boolean;
  brand: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  muted?: boolean;
  shouldReduceMotion: boolean | null;
  style?: CSSProperties;
  title?: string;
  onClick?: () => Promise<void> | void;
};

export function SubscribeStyleButton({
  active = false,
  ariaBusy,
  ariaLabel,
  ariaPressed,
  brand,
  children,
  className,
  disabled = false,
  muted = false,
  shouldReduceMotion,
  style,
  title,
  onClick,
}: SubscribeStyleButtonProps) {
  const scaleControls = useAnimationControls();
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const isBusy = disabled || isAnimating;

  function pressButton() {
    if (!shouldAnimate || isBusy) {
      return;
    }

    void scaleControls.start({
      scale: 0.94,
      transition: SUBSCRIBE_PRESS_TRANSITION,
    });
  }

  function releaseButton() {
    if (!shouldAnimate) {
      return;
    }

    void scaleControls.start({
      scale: 1,
      transition: SUBSCRIBE_RETURN_TRANSITION,
    });
  }

  async function handleClick() {
    if (isBusy) {
      return;
    }

    setIsAnimating(true);

    if (!shouldAnimate) {
      try {
        await onClick?.();
      } finally {
        setIsAnimating(false);
      }

      return;
    }

    try {
      await scaleControls.start({
        scale: 1,
        transition: SUBSCRIBE_RETURN_TRANSITION,
      });
      await onClick?.();
    } finally {
      window.setTimeout(() => {
        setIsAnimating(false);
      }, SUBSCRIBE_STATE_SETTLE_MS);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    pressButton();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    releaseButton();
  }

  return (
    <motion.button
      type="button"
      aria-busy={ariaBusy}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      disabled={isBusy}
      title={title ?? ariaLabel}
      className={cn(
        FULLSCREEN_SUBSCRIBE_BUTTON.base,
        "disabled:cursor-not-allowed disabled:opacity-70",
        muted && "text-[#4F5A54]",
        className
      )}
      animate={scaleControls}
      initial={{ scale: 1 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={releaseButton}
      onPointerDown={pressButton}
      onPointerLeave={releaseButton}
      onPointerUp={releaseButton}
      style={{
        boxShadow: `0 8px 18px ${brand}1F, inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)`,
        ...style,
      }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit]"
        animate={{ opacity: active && !muted ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(120deg, ${brand}E6, rgba(122,236,164,0.78), rgba(100,218,189,0.66), ${brand}A8)`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-[inherit]"
        animate={{ opacity: !active && !muted ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(135deg, ${brand}72 0%, rgba(189,247,208,0.68) 85%, ${brand}35 100%)`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-[inherit]"
        animate={{ opacity: muted ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(224,229,226,0.88) 0%, rgba(208,216,211,0.80) 85%, rgba(190,199,194,0.60) 100%)",
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-[inherit]"
        animate={{ opacity: active && !muted ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(226,255,235,0.78))",
        }}
      />
      <span className="relative z-[1] grid place-items-center">{children}</span>
    </motion.button>
  );
}
