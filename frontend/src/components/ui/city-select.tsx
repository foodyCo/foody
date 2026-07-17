"use client";

import * as React from "react";

import { GlassSurface } from "@/components/feed/glass-surface";

// Фиксированный список городов. Бэкенд хранит city как свободную строку,
// поэтому ограничение — только на фронте.
export const CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Екатеринбург",
  "Ростов-на-Дону",
  "Воронеж",
  "Краснодар",
  "Сочи",
  "Казань",
  "Владивосток",
] as const;

type CitySelectProps = {
  value: string;
  onChange: (city: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  surfaceClassName?: string;
  inputClassName?: string;
  autoComplete?: string;
};

export function CitySelect({
  value,
  onChange,
  name,
  id,
  placeholder = "Город",
  icon,
  surfaceClassName,
  inputClassName,
  autoComplete = "off",
}: CitySelectProps) {
  const [open, setOpen] = React.useState(false);

  const query = value.trim().toLowerCase();
  const matches = query
    ? CITIES.filter((c) => c.toLowerCase().includes(query))
    : [...CITIES];
  // Не показываем меню, если введён ровно один город из списка (уже выбран).
  const isExact = CITIES.some((c) => c.toLowerCase() === query);
  const showMenu = open && matches.length > 0 && !(isExact && matches.length === 1);

  function select(city: string) {
    onChange(city);
    setOpen(false);
  }

  return (
    <div className="relative">
      <GlassSurface className={surfaceClassName}>
        {icon}
        <input
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          role="combobox"
          aria-expanded={showMenu}
          aria-autocomplete="list"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className={inputClassName}
        />
      </GlassSurface>

      {showMenu && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50">
          <GlassSurface className="max-h-60 overflow-y-auto rounded-[16px] border border-white/65 bg-white/70 py-1 shadow-[0_12px_30px_rgba(20,40,28,0.16)]">
            <ul role="listbox">
              {matches.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={city === value}
                    // onMouseDown срабатывает раньше onBlur инпута — выбор не теряется.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(city);
                    }}
                    className="flex w-full cursor-pointer items-center px-4 py-2.5 text-left text-[15px] font-semibold text-[#15291C] hover:bg-white/60"
                  >
                    {city}
                  </button>
                </li>
              ))}
            </ul>
          </GlassSurface>
        </div>
      )}
    </div>
  );
}
