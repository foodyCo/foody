"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type SegmentItem<T extends string> = {
  id: T;
  label: string;
};

type CategoryModeToggleProps<T extends string> = {
  "aria-label": string;
  items: readonly SegmentItem<T>[];
  value: T;
  onValueChange: (next: T) => void;
  className?: string;
};

/**
 * Сегментированный переключатель на произвольное число сегментов
 * (в отличие от FeedSegmentedControl, который жёстко на два).
 * Стиль — светлый трек + белый «бегунок» под активным сегментом.
 */
export function CategoryModeToggle<T extends string>({
  "aria-label": ariaLabel,
  items,
  value,
  onValueChange,
  className,
}: CategoryModeToggleProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const count = items.length;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value)
  );
  // Трек имеет паддинг 3px с каждой стороны → полезная ширина = 100% - 6px.
  const segmentWidth = `calc((100% - 6px) / ${count})`;
  const activeLeft = `calc(3px + ${activeIndex} * (100% - 6px) / ${count})`;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative grid w-full rounded-full bg-[rgba(20,40,28,0.06)] p-[3px]",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] rounded-full bg-white shadow-[0_4px_15px_rgba(20,40,28,0.11)]"
        style={{ width: segmentWidth }}
        initial={false}
        animate={{ left: activeLeft }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 520, damping: 42, mass: 0.55 }
        }
      />
      {items.map((item) => {
        const isActive = value === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(item.id)}
            className={cn(
              "relative z-[1] grid h-[34px] min-w-0 cursor-pointer place-items-center overflow-hidden rounded-full px-1 font-sans text-[14px] leading-[1.1] font-extrabold tracking-[0px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/20",
              isActive ? "text-[#15291C]" : "text-[#5C6B62]"
            )}
          >
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
