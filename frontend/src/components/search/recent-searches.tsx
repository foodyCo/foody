"use client";

import { Clock, X } from "lucide-react";

import { SectionHeader } from "@/components/search/section-header";
import { cn } from "@/lib/utils";

type RecentSearchesProps = {
  items: string[];
  onChange: (items: string[]) => void;
  onSubmitQuery: (query: string) => void;
};

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] will-change-transform [-webkit-tap-highlight-color:transparent]";

export function RecentSearches({
  items,
  onChange,
  onSubmitQuery,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-[18px] pb-4">
      <SectionHeader
        icon={<Clock size={15} strokeWidth={2} color="#3A4A40" />}
        title="Последнее"
        action={
          <button
            type="button"
            onClick={() => onChange([])}
            className={cn(
              "inline-flex cursor-pointer border-0 bg-transparent p-1 text-[13px] font-semibold text-[#3A4A40]",
              PRESS_CLASSES
            )}
          >
            Очистить
          </button>
        }
      />

      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((q) => (
          <div
            key={q}
            onClick={() => onSubmitQuery(q)}
            className={cn(
              "inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-full border-[0.5px] border-white/70 bg-neutral-100/69 pr-1.5 pl-3 text-[13.5px] font-medium text-[#15291C] shadow-[0_4px_12px_rgba(20,40,28,0.09),inset_1px_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[20px] backdrop-saturate-[180%]",
              PRESS_CLASSES
            )}
          >
            <span>{q}</span>
            <button
              type="button"
              aria-label={`Удалить запрос «${q}»`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(items.filter((x) => x !== q));
              }}
              className={cn(
                "grid size-[22px] cursor-pointer place-items-center rounded-full border-0 bg-[rgba(20,40,28,0.08)] text-[#3A4A40]",
                PRESS_CLASSES
              )}
            >
              <X size={10} strokeWidth={2.4} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
