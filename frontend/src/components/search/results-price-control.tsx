"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { SearchFilterSheet } from "@/components/search/search-filter-sheet";
import { PRICE_MAX, PRICE_MIN } from "@/components/search/price-range-slider";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

function toNum(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function formatPriceLabel(min: number, max: number) {
  const hasMin = min > PRICE_MIN;
  const hasMax = max < PRICE_MAX;
  if (hasMin && hasMax) return `${min}–${max} ₽`;
  if (hasMax) return `до ${max} ₽`;
  if (hasMin) return `от ${min} ₽`;
  return "Цена";
}

/**
 * Кнопка-фильтр цены на странице результатов. Показывает текущее значение
 * (напр. «до 1000 ₽») и открывает шторку со слайдером — цену можно менять
 * прямо здесь, не возвращаясь в поиск. Пишет price_min/price_max в URL,
 * сохраняя q/category и прочие параметры.
 */
export function ResultsPriceControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFrom = toNum(searchParams.get("price_min"), PRICE_MIN);
  const currentTo = toNum(searchParams.get("price_max"), PRICE_MAX);
  const isActive = currentFrom > PRICE_MIN || currentTo < PRICE_MAX;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: currentFrom, to: currentTo });

  const applyPrice = useCallback(
    (from: number, to: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (from > PRICE_MIN) params.set("price_min", String(from));
      else params.delete("price_min");
      if (to < PRICE_MAX) params.set("price_max", String(to));
      else params.delete("price_max");

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const openSheet = useCallback(() => {
    setDraft({ from: currentFrom, to: currentTo });
    setOpen(true);
  }, [currentFrom, currentTo]);

  const closeAndApply = useCallback(() => {
    setOpen(false);
    if (draft.from !== currentFrom || draft.to !== currentTo) {
      applyPrice(draft.from, draft.to);
    }
  }, [applyPrice, currentFrom, currentTo, draft]);

  const clearPrice = useCallback(() => {
    applyPrice(PRICE_MIN, PRICE_MAX);
  }, [applyPrice]);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="Фильтр по цене"
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-bold transition-colors",
          isActive
            ? "border-[#2ECC71] bg-[#2ECC71] text-white"
            : "border-[rgba(20,40,28,0.14)] bg-white text-[#15291C]",
          PRESS_CLASSES
        )}
      >
        <SlidersHorizontal size={15} strokeWidth={2.3} />
        {formatPriceLabel(currentFrom, currentTo)}
      </button>

      {isActive && (
        <button
          type="button"
          onClick={clearPrice}
          aria-label="Сбросить цену"
          className={cn(
            "grid size-[34px] shrink-0 place-items-center rounded-full border-[1.5px] border-[rgba(20,40,28,0.14)] bg-white text-[#5C6B62]",
            PRESS_CLASSES
          )}
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      )}

      <SearchFilterSheet
        open={open}
        price={draft}
        onPriceChange={setDraft}
        onClose={closeAndApply}
      />
    </>
  );
}
