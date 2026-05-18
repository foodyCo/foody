"use client";

import { type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";

import { GlassSurface } from "@/components/feed/glass-surface";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type SearchInputGlassProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmitQuery: (query: string) => void;
  placeholder?: string;
  surfaceClassName?: string;
  contentClassName?: string;
  inputClassName?: string;
};

export function SearchInputGlass({
  query,
  onQueryChange,
  onSubmitQuery,
  placeholder = "Найти блюдо или ресторан",
  surfaceClassName,
  contentClassName,
  inputClassName,
}: SearchInputGlassProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      event.stopPropagation();
      return;
    }

    onSubmitQuery(trimmedQuery);
  }

  return (
    <GlassSurface
      className={cn(
        "h-[50px] rounded-[18px] ring-0 ring-transparent transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[rgba(34,139,34,0.18)] focus-within:after:border-[rgba(21,41,28,0.16)]",
        surfaceClassName
      )}
      highlight
    >
      <div
        className={cn(
          "flex h-[50px] items-center gap-2.5 px-3.5 text-[#3A4A40]",
          contentClassName
        )}
      >
        <Search size={20} strokeWidth={2} color="#5C6B62" />
        <Input
          aria-label="Поисковый запрос"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-auto flex-1 border-0 bg-transparent p-0 text-[15.5px] font-medium text-[#15291C] shadow-none outline-none placeholder:text-[#5C6B62] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15.5px]",
            inputClassName
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Очистить"
            onClick={() => onQueryChange("")}
            className={cn(
              "flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(20,40,28,0.08)] p-0 text-[#3A4A40]",
              PRESS_CLASSES
            )}
          >
            <X className="size-[11px] shrink-0" strokeWidth={2.4} />
          </button>
        )}
      </div>
    </GlassSurface>
  );
}
