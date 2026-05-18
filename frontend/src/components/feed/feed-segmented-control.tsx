"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type FeedSegmentedControlItem<T extends string> = {
  id: T;
  label: string;
};

type FeedSegmentedControlProps<T extends string> = {
  "aria-label": string;
  items: readonly [FeedSegmentedControlItem<T>, FeedSegmentedControlItem<T>];
  value: T;
  onValueChange: (next: T) => void;
  className?: string;
  buttonClassName?: string;
};

export function FeedSegmentedControl<T extends string>({
  "aria-label": ariaLabel,
  items,
  value,
  onValueChange,
  className,
  buttonClassName,
}: FeedSegmentedControlProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const activeIndex = items.findIndex((item) => item.id === value);
  const activeTabLeft = activeIndex <= 0 ? "3px" : "calc(50% + 1px)";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative grid min-w-[148px] flex-1 grid-cols-2 gap-0.5 rounded-full bg-[rgba(20,40,28,0.06)] p-[3px] max-[409px]:min-w-[116px]",
        className
      )}
    >
      <motion.span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] w-[calc(50%_-_4px)] rounded-full bg-white shadow-[0_4px_15px_rgba(20,40,28,0.11)]"
        initial={false}
        animate={{ left: activeTabLeft }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 520,
                damping: 42,
                mass: 0.55,
              }
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
              "relative grid h-[31px] min-w-0 cursor-pointer place-items-center overflow-hidden rounded-full px-1 pt-px font-sans text-[13px] leading-[1.1] font-extrabold tracking-[0px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/20 max-[409px]:text-[10.5px]",
              isActive ? "text-[#15291C]" : "text-[#5C6B62]",
              buttonClassName
            )}
          >
            <span className="relative z-[1] whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
