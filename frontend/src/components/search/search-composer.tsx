"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

import { CategoryModeToggle } from "@/components/categories/category-mode-toggle";
import { SearchInputGlass } from "@/components/search/search-input-glass";
import { RecentSearches } from "@/components/search/recent-searches";
import { PopularTags } from "@/components/search/popular-tags";
import {
  saveRecentQueries,
  useRecentSearchQueries,
} from "@/components/search/recent-search-store";
import type {
  CategoryChip,
  CategoryGroups,
} from "@/components/search/results-category-control";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type Tab = "dishes" | "cuisines" | "formats";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "dishes", label: "Блюда" },
  { id: "cuisines", label: "Кухни" },
  { id: "formats", label: "Формат" },
];

type SearchComposerProps = {
  brand: string;
  popularTags: string[];
  categoryGroups: CategoryGroups;
};

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Назад"
      onClick={onClick}
      className={cn(
        "grid size-[50px] shrink-0 place-items-center rounded-[18px] border-[0.5px] border-white/70 bg-white/60 text-[#15291C] shadow-[0_4px_14px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[20px] backdrop-saturate-[180%]",
        PRESS_CLASSES
      )}
    >
      <ArrowLeft size={20} strokeWidth={2.3} />
    </button>
  );
}

export function SearchComposer({
  brand,
  popularTags,
  categoryGroups,
}: SearchComposerProps) {
  const router = useRouter();
  const recentQueries = useRecentSearchQueries();

  const [mode, setMode] = useState<"browse" | "input">("browse");
  const [tab, setTab] = useState<Tab>("dishes");
  const [query, setQuery] = useState("");

  const goToResults = useCallback(
    (rawQuery: string) => {
      const q = rawQuery.trim();
      if (!q) return;
      const next = [q, ...recentQueries.filter((r) => r !== q)].slice(0, 12);
      saveRecentQueries(next);
      router.push(`/search/results?q=${encodeURIComponent(q)}`);
    },
    [recentQueries, router]
  );

  const goToCategory = useCallback(
    (chip: CategoryChip) => {
      // Категория пока — текстовый запрос q (заглушка).
      router.push(`/search/results?q=${encodeURIComponent(chip.label)}`);
    },
    [router]
  );

  function leaveSearch() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  // ---------- Экран поиска (ввод) ----------
  if (mode === "input") {
    return (
      <div className="absolute inset-0 flex flex-col pt-2">
        <div className="flex items-center gap-2.5 px-[18px] pt-1 pb-2.5">
          <BackButton onClick={() => setMode("browse")} />
          <SearchInputGlass
            query={query}
            onQueryChange={setQuery}
            onSubmitQuery={goToResults}
            placeholder="Найти блюдо"
            surfaceClassName="min-w-0 flex-1"
            autoFocus
          />
        </div>

        <div className="hide-scroll flex-1 overflow-y-auto pb-24 pt-2">
          <RecentSearches
            title="История"
            items={recentQueries}
            onChange={saveRecentQueries}
            onSubmitQuery={goToResults}
          />
          <PopularTags
            tags={popularTags}
            brand={brand}
            onSubmitQuery={goToResults}
          />
        </div>
      </div>
    );
  }

  // ---------- Браузинг категорий ----------
  const tiles = categoryGroups[tab];

  return (
    <div className="absolute inset-0 flex flex-col pt-2">
      <div className="flex items-center gap-2.5 px-[18px] pt-1 pb-2.5">
        <BackButton onClick={leaveSearch} />
        <button
          type="button"
          onClick={() => setMode("input")}
          className={cn(
            "flex h-[50px] min-w-0 flex-1 items-center gap-2.5 rounded-[18px] border-[0.5px] border-white/70 bg-white/60 px-3.5 text-left shadow-[0_4px_14px_rgba(20,40,28,0.06),inset_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[20px] backdrop-saturate-[180%]",
            PRESS_CLASSES
          )}
        >
          <Search size={20} strokeWidth={2} color="#5C6B62" />
          <span className="text-[15.5px] font-medium text-[#5C6B62]">
            Искать на Foody
          </span>
        </button>
      </div>

      <div className="px-[18px] pb-3">
        <CategoryModeToggle
          aria-label="Тип категории"
          items={TABS}
          value={tab}
          onValueChange={setTab}
        />
      </div>

      <div className="hide-scroll flex-1 overflow-y-auto px-[18px] pb-28">
        <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5">
          {tiles.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => goToCategory(chip)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 outline-none",
                PRESS_CLASSES
              )}
            >
              <span className="grid aspect-square w-full place-items-center rounded-[18px] bg-white text-[24px] shadow-[0_6px_16px_rgba(20,40,28,0.07),inset_0_0_0_1.5px_#2ECC71] max-[380px]:text-[22px]">
                <span aria-hidden="true">{chip.emoji}</span>
              </span>
              <span className="line-clamp-2 w-full text-center text-[10.5px] leading-[1.15] font-bold text-[#15291C] [overflow-wrap:anywhere] max-[380px]:text-[10px]">
                {chip.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
