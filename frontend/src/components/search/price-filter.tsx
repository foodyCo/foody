"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type PricePreset = {
  id: string;
  label: string;
  min: string;
  max: string;
};

// Пороги в рублях. Пустая строка = граница не задана.
const PRICE_PRESETS: PricePreset[] = [
  { id: "any", label: "Любая", min: "", max: "" },
  { id: "lt300", label: "до 300 ₽", min: "", max: "300" },
  { id: "300-600", label: "300–600 ₽", min: "300", max: "600" },
  { id: "600-1000", label: "600–1000 ₽", min: "600", max: "1000" },
  { id: "gt1000", label: "от 1000 ₽", min: "1000", max: "" },
];

// Оставляем только цифры (защита от ввода мусора).
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

type PriceFilterProps = {
  /** Куда переходить при выборе. По умолчанию — текущий путь (уточнение
   *  результатов). На вкладке поиска передаём "/search/results" — чтобы
   *  открыть результаты, отфильтрованные по цене. */
  targetPath?: string;
  /** Переопределяет горизонтальные отступы контейнера. */
  className?: string;
};

export function PriceFilter({ targetPath, className }: PriceFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentMin = searchParams.get("price_min") ?? "";
  const currentMax = searchParams.get("price_max") ?? "";

  const matchedPreset = PRICE_PRESETS.find(
    (preset) => preset.min === currentMin && preset.max === currentMax
  );
  // Цена задана, но не совпадает ни с одним пресетом → активна «Своя цена».
  const isCustomActive = !matchedPreset && (!!currentMin || !!currentMax);

  const [showCustom, setShowCustom] = useState(isCustomActive);
  const [customMin, setCustomMin] = useState(currentMin);
  const [customMax, setCustomMax] = useState(currentMax);

  const applyPrice = useCallback(
    (min: string, max: string, destinationOverride?: string) => {
      // Сохраняем остальные параметры (q, tag_name, category_id…),
      // меняем только цену.
      const params = new URLSearchParams(searchParams.toString());
      if (min) params.set("price_min", min);
      else params.delete("price_min");
      if (max) params.set("price_max", max);
      else params.delete("price_max");

      const destination = destinationOverride ?? targetPath ?? pathname;
      const qs = params.toString();
      router.push(qs ? `${destination}?${qs}` : destination);
    },
    [pathname, router, searchParams, targetPath]
  );

  function handleApplyCustom() {
    let min = digitsOnly(customMin);
    let max = digitsOnly(customMax);
    // Если перепутали местами — меняем.
    if (min && max && Number(min) > Number(max)) {
      [min, max] = [max, min];
      setCustomMin(min);
      setCustomMax(max);
    }
    applyPrice(min, max);
  }

  const canApplyCustom = !!digitsOnly(customMin) || !!digitsOnly(customMax);

  return (
    <div
      aria-label="Фильтр по цене"
      className={cn("pt-2.5 pb-1", className ?? "px-3.5 max-[409px]:px-3")}
    >
      <div className="hide-scroll flex gap-2 overflow-x-auto">
        {PRICE_PRESETS.map((preset) => {
          const isActive = matchedPreset?.id === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setShowCustom(false);
                applyPrice(preset.min, preset.max);
              }}
              aria-pressed={isActive}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold transition-colors",
                isActive
                  ? "border-[#2ECC71] bg-[#2ECC71] text-white"
                  : "border-[#2ECC71] bg-white text-[#15291C]",
                PRESS_CLASSES
              )}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Своя цена */}
        <button
          type="button"
          onClick={() => setShowCustom((prev) => !prev)}
          aria-pressed={isCustomActive}
          aria-expanded={showCustom}
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold transition-colors",
            isCustomActive
              ? "border-[#2ECC71] bg-[#2ECC71] text-white"
              : "border-[#2ECC71] bg-white text-[#15291C]",
            PRESS_CLASSES
          )}
        >
          Своя цена
        </button>
      </div>

      {showCustom && (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            inputMode="numeric"
            value={customMin}
            onChange={(e) => setCustomMin(digitsOnly(e.target.value))}
            placeholder="от, ₽"
            aria-label="Цена от"
            className="h-10 min-w-0 flex-1 rounded-[12px] border-[1.5px] border-[rgba(20,40,28,0.12)] bg-white px-3 text-[14px] font-semibold text-[#15291C] outline-none placeholder:font-medium placeholder:text-[#AAB4AE] focus:border-[#2ECC71]"
          />
          <span className="text-[#8A958E]">—</span>
          <input
            inputMode="numeric"
            value={customMax}
            onChange={(e) => setCustomMax(digitsOnly(e.target.value))}
            placeholder="до, ₽"
            aria-label="Цена до"
            className="h-10 min-w-0 flex-1 rounded-[12px] border-[1.5px] border-[rgba(20,40,28,0.12)] bg-white px-3 text-[14px] font-semibold text-[#15291C] outline-none placeholder:font-medium placeholder:text-[#AAB4AE] focus:border-[#2ECC71]"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!canApplyCustom}
            className={cn(
              "h-10 shrink-0 rounded-[12px] px-4 text-[14px] font-extrabold transition-colors",
              canApplyCustom
                ? "bg-[#2ECC71] text-white"
                : "cursor-not-allowed bg-[rgba(20,40,28,0.08)] text-[#AAB4AE]",
              PRESS_CLASSES
            )}
          >
            Применить
          </button>
        </div>
      )}
    </div>
  );
}
