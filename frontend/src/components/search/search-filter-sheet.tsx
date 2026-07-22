"use client";

import { X } from "lucide-react";

import {
  PriceRangeSlider,
  PRICE_MAX,
  PRICE_MIN,
} from "@/components/search/price-range-slider";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type PriceRange = { from: number; to: number };

type SearchFilterSheetProps = {
  open: boolean;
  price: PriceRange;
  onPriceChange: (next: PriceRange) => void;
  onClose: () => void;
};

export function SearchFilterSheet({
  open,
  price,
  onPriceChange,
  onClose,
}: SearchFilterSheetProps) {
  if (!open) return null;

  const priceTouched = price.from > PRICE_MIN || price.to < PRICE_MAX;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрыть фильтры"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(20,40,28,0.28)]"
      />

      <div className="relative rounded-t-[26px] bg-[#E7E9E7] px-[18px] pt-3 pb-6 shadow-[0_-18px_40px_rgba(20,40,28,0.22)]">
        <div className="mx-auto mb-3 h-[5px] w-[42px] rounded-full bg-[rgba(20,40,28,0.14)]" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-extrabold tracking-[-0.3px] text-[#15291C]">
            Фильтры
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className={cn(
              "grid size-9 place-items-center rounded-full bg-white text-[#15291C] shadow-[0_2px_8px_rgba(20,40,28,0.10)]",
              PRESS_CLASSES
            )}
          >
            <X className="size-5" strokeWidth={2.2} />
          </button>
        </div>

        <p className="mb-2 text-[12.5px] font-bold tracking-[0.3px] text-[#5C6B62] uppercase">
          Цена, ₽
        </p>
        <div className="rounded-[18px] border border-white/70 bg-white/60 px-4 pt-4 pb-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.7)]">
          <PriceRangeSlider
            from={price.from}
            to={price.to}
            onChange={onPriceChange}
          />
        </div>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPriceChange({ from: PRICE_MIN, to: PRICE_MAX })}
            disabled={!priceTouched}
            className={cn(
              "h-12 flex-1 rounded-[14px] border-[1.5px] text-[15px] font-extrabold transition-colors",
              priceTouched
                ? "border-[rgba(20,40,28,0.14)] bg-white text-[#15291C]"
                : "cursor-not-allowed border-[rgba(20,40,28,0.08)] bg-white/60 text-[#AAB4AE]",
              PRESS_CLASSES
            )}
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "h-12 flex-[1.4] rounded-[14px] bg-[#2ECC71] text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(46,204,113,0.32)]",
              PRESS_CLASSES
            )}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
