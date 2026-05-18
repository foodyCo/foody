"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "motion/react";

const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/search": 1,
  "/search/results": 2,
  "/new-review": 2.5,
  "/saved": 3,
  "/me": 4,
};

type TransitionMode = "none" | "horizontal" | "new-review-enter" | "new-review-exit";

type RouteTransition = {
  direction: number;
  mode: TransitionMode;
};

function isNewReviewPath(pathname: string) {
  return pathname === "/new-review";
}

function getTransition(prev: string | null, current: string): RouteTransition {
  if (prev === null || prev === current) {
    return { direction: 0, mode: "none" };
  }

  if (isNewReviewPath(current)) {
    return { direction: 1, mode: "new-review-enter" };
  }

  if (isNewReviewPath(prev)) {
    return { direction: 1, mode: "new-review-exit" };
  }

  const a = TAB_ORDER[prev];
  const b = TAB_ORDER[current];
  if (a === undefined || b === undefined) {
    return { direction: 0, mode: "none" };
  }

  return { direction: Math.sign(b - a), mode: "horizontal" };
}

const exitVariants: Variants = {
  exit: (transition: RouteTransition) => {
    if (transition.mode === "new-review-exit") {
      return { opacity: 1, y: "100%" };
    }

    if (transition.mode === "horizontal") {
      return {
        opacity: 1,
        x: transition.direction === 0 ? 0 : `${transition.direction * -100}%`,
      };
    }

    return { opacity: 1, x: 0, y: 0 };
  },
};

type Snap = {
  pathname: string;
  children: React.ReactNode;
  transition: RouteTransition;
};

function isPathnameSettling(pathname: string) {
  return (
    typeof window !== "undefined" &&
    window.location.pathname !== pathname
  );
}

export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [snap, setSnap] = useState<Snap>({
    pathname,
    children,
    transition: { direction: 0, mode: "none" },
  });

  if (snap.pathname !== pathname) {
    setSnap({
      pathname,
      children,
      transition: getTransition(snap.pathname, pathname),
    });
  } else if (snap.children !== children && !isPathnameSettling(pathname)) {
    setSnap({
      pathname,
      children,
      transition: { direction: 0, mode: "none" },
    });
  }

  const initialX =
    snap.transition.mode === "horizontal" && snap.transition.direction !== 0
      ? `${snap.transition.direction * 100}%`
      : 0;
  const initialY = snap.transition.mode === "new-review-enter" ? "100%" : 0;
  const initialOpacity = 1;
  const transitionDuration = snap.transition.mode === "none" ? 0 : 0.32;

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="sync" custom={snap.transition}>
        <motion.div
          key={snap.pathname}
          custom={snap.transition}
          variants={exitVariants}
          initial={{ x: initialX, y: initialY, opacity: initialOpacity }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit="exit"
          transition={{
            duration: transitionDuration,
            ease: [0.32, 0.72, 0, 1],
          }}
          className="absolute inset-0"
          style={{ willChange: "transform" }}
        >
          {snap.children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
