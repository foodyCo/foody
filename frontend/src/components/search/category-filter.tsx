"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export type CategoryChip = {
  id: string;
  label: string;
  emoji: string;
};

type CategoryFilterProps = {
  chips: CategoryChip[];
  className?: string;
};

/**
 * Фильтр по категории на странице результатов. Категория пока представлена
 * текстовым запросом `q` (заглушка — как навигация из «Все категории»), при
 * этом фильтр по цене (price_min/price_max) и прочие параметры сохраняются —
 * так цена и категория работают одновременно. TODO: заменить `q` на
 * отдельный параметр категории, когда бек подвяжем.
 */
export function CategoryFilter({ chips, className }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQuery = (searchParams.get("q") ?? "").trim().toLowerCase();

  const toggleCategory = useCallback(
    (chip: CategoryChip) => {
      const params = new URLSearchParams(searchParams.toString());
      const isActive = chip.label.trim().toLowerCase() === currentQuery;
      // Повторный тап по активной категории — снимаем её (цена остаётся).
      if (isActive) params.delete("q");
      else params.set("q", chip.label);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [currentQuery, pathname, router, searchParams]
  );

  if (chips.length === 0) return null;

  return (
    <div
      aria-label="Фильтр по категории"
      className={cn(
        "hide-scroll flex gap-2 overflow-x-auto pt-2.5 pb-1",
        className ?? "px-3.5 max-[409px]:px-3"
      )}
    >
      {chips.map((chip) => {
        const isActive = chip.label.trim().toLowerCase() === currentQuery;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => toggleCategory(chip)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold transition-colors",
              isActive
                ? "border-[#2ECC71] bg-[#2ECC71] text-white"
                : "border-[#2ECC71] bg-white text-[#15291C]",
              PRESS_CLASSES
            )}
          >
            <span aria-hidden="true" className="text-[14px] leading-none">
              {chip.emoji}
            </span>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
