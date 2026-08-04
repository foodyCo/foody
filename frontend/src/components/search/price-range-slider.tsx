"use client";

import { useCallback, useState } from "react";

export const PRICE_MIN = 0;
export const PRICE_MAX = 3000;
export const PRICE_STEP = 50;

type PriceRangeSliderProps = {
  from: number;
  to: number;
  onChange: (next: { from: number; to: number }) => void;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Двойной слайдер «от — до» на двух наложенных нативных range-инпутах.
 * Поля значений редактируемые: можно вписать минимальную и максимальную
 * цену вручную (коммит по Enter / потере фокуса, с клампом в [0, 3000]).
 * Стили бегунков — в globals.css (.price-range).
 */
export function PriceRangeSlider({ from, to, onChange }: PriceRangeSliderProps) {
  const range = PRICE_MAX - PRICE_MIN;
  const leftPct = ((from - PRICE_MIN) / range) * 100;
  const rightPct = 100 - ((to - PRICE_MIN) / range) * 100;

  // Черновики полей: null → показываем значение из props; строка → идёт ввод.
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);

  const handleFrom = useCallback(
    (value: number) => {
      const next = Math.min(value, to - PRICE_STEP);
      onChange({ from: clamp(next, PRICE_MIN, PRICE_MAX), to });
    },
    [onChange, to]
  );

  const handleTo = useCallback(
    (value: number) => {
      const next = Math.max(value, from + PRICE_STEP);
      onChange({ from, to: clamp(next, PRICE_MIN, PRICE_MAX) });
    },
    [from, onChange]
  );

  const commitMin = useCallback(() => {
    if (minDraft === null) return;
    const parsed = minDraft === "" ? PRICE_MIN : Number(minDraft);
    // Не выше «до» минус шаг.
    const next = clamp(parsed, PRICE_MIN, to - PRICE_STEP);
    onChange({ from: next, to });
    setMinDraft(null);
  }, [minDraft, onChange, to]);

  const commitMax = useCallback(() => {
    if (maxDraft === null) return;
    // Пусто → верхний предел (без ограничения сверху).
    const parsed = maxDraft === "" ? PRICE_MAX : Number(maxDraft);
    const next = clamp(parsed, from + PRICE_STEP, PRICE_MAX);
    onChange({ from, to: next });
    setMaxDraft(null);
  }, [from, maxDraft, onChange]);

  return (
    <div>
      <div className="relative h-[22px]">
        <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[rgba(20,40,28,0.10)]" />
        <div
          className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#2ECC71]"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        <input
          type="range"
          className="price-range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={from}
          aria-label="Цена от"
          onChange={(e) => handleFrom(Number(e.target.value))}
        />
        <input
          type="range"
          className="price-range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={to}
          aria-label="Цена до"
          onChange={(e) => handleTo(Number(e.target.value))}
        />
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <label className="flex flex-1 items-center gap-1.5 rounded-[12px] border-[1.5px] border-[rgba(20,40,28,0.12)] bg-white px-3 py-2 focus-within:border-[#2ECC71]">
          <span className="text-[12px] font-medium text-[#8A958E]">от</span>
          <input
            inputMode="numeric"
            aria-label="Минимальная цена"
            value={minDraft ?? String(from)}
            onFocus={() => setMinDraft(String(from))}
            onChange={(e) => setMinDraft(digitsOnly(e.target.value))}
            onBlur={commitMin}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full min-w-0 bg-transparent text-[14px] font-bold text-[#15291C] tabular-nums outline-none"
          />
          <span className="text-[12px] text-[#8A958E]">₽</span>
        </label>
        <span className="text-[#8A958E]">—</span>
        <label className="flex flex-1 items-center gap-1.5 rounded-[12px] border-[1.5px] border-[rgba(20,40,28,0.12)] bg-white px-3 py-2 focus-within:border-[#2ECC71]">
          <span className="text-[12px] font-medium text-[#8A958E]">до</span>
          <input
            inputMode="numeric"
            aria-label="Максимальная цена"
            value={maxDraft ?? String(to)}
            onFocus={() => setMaxDraft(String(to))}
            onChange={(e) => setMaxDraft(digitsOnly(e.target.value))}
            onBlur={commitMax}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full min-w-0 bg-transparent text-[14px] font-bold text-[#15291C] tabular-nums outline-none"
          />
          <span className="text-[12px] text-[#8A958E]">₽</span>
        </label>
      </div>
    </div>
  );
}
