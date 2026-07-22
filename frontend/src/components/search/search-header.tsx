"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SearchInputGlass } from "@/components/search/search-input-glass";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type SearchHeaderProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmitQuery: (query: string) => void;
  placeholder?: string;
  /** Элемент справа от строки поиска (например, кнопка фильтра). */
  rightSlot?: ReactNode;
};

export function SearchHeader({
  query,
  onQueryChange,
  onSubmitQuery,
  placeholder,
  rightSlot,
}: SearchHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="px-[18px] pt-1 pb-2.5">
      <button
        type="button"
        aria-label="Назад"
        onClick={handleBack}
        className={cn(
          "mb-2 grid size-10 place-items-center rounded-full border-[0.5px] border-white/70 bg-white/60 text-[#15291C] shadow-[0_4px_14px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[20px] backdrop-saturate-[180%]",
          PRESS_CLASSES
        )}
      >
        <ArrowLeft size={20} strokeWidth={2.3} />
      </button>

      <div className="mt-3 flex items-center gap-2.5">
        <SearchInputGlass
          query={query}
          onQueryChange={onQueryChange}
          onSubmitQuery={onSubmitQuery}
          placeholder={placeholder}
          surfaceClassName="min-w-0 flex-1"
        />
        {rightSlot}
      </div>
    </div>
  );
}
