"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, SlidersHorizontal } from "lucide-react";

import { SearchHeader } from "@/components/search/search-header";
import { SectionHeader } from "@/components/search/section-header";
import { RecentSearches } from "@/components/search/recent-searches";
import { PopularTags } from "@/components/search/popular-tags";
import { SearchFilterSheet } from "@/components/search/search-filter-sheet";
import { PRICE_MAX, PRICE_MIN } from "@/components/search/price-range-slider";
import {
  saveRecentQueries,
  useRecentSearchQueries,
} from "@/components/search/recent-search-store";
import type { FoodCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

type SearchComposerProps = {
  brand: string;
  popularTags: string[];
  popularCategories: FoodCategory[];
};

export function SearchComposer({
  brand,
  popularTags,
  popularCategories,
}: SearchComposerProps) {
  const router = useRouter();
  const recentQueries = useRecentSearchQueries();

  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [price, setPrice] = useState({ from: PRICE_MIN, to: PRICE_MAX });
  const [showFilters, setShowFilters] = useState(false);

  const selectedCategory = useMemo(
    () => popularCategories.find((c) => c.id === selectedCategoryId) ?? null,
    [popularCategories, selectedCategoryId]
  );

  const priceTouched = price.from > PRICE_MIN || price.to < PRICE_MAX;
  const hasSelection =
    query.trim().length > 0 || selectedCategory !== null || priceTouched;

  const showResults = useCallback(
    (overrideQuery?: string) => {
      // Категория пока представлена текстовым запросом q (заглушка).
      // Приоритет: явный запрос из строки поиска, иначе выбранная категория.
      const q = (overrideQuery ?? query).trim() || selectedCategory?.label || "";
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (price.from > PRICE_MIN) params.set("price_min", String(price.from));
      if (price.to < PRICE_MAX) params.set("price_max", String(price.to));

      // Сохраняем текстовый запрос в недавние (категорию — нет).
      const typed = (overrideQuery ?? query).trim();
      if (typed) {
        const next = [typed, ...recentQueries.filter((r) => r !== typed)].slice(0, 12);
        saveRecentQueries(next);
      }

      const qs = params.toString();
      router.push(qs ? `/search/results?${qs}` : "/search/results");
    },
    [price, query, recentQueries, router, selectedCategory]
  );

  return (
    <div className="absolute inset-0 flex flex-col pt-2">
      <div className="hide-scroll flex-1 overflow-y-auto pb-[104px]">
        <SearchHeader
          query={query}
          onQueryChange={setQuery}
          onSubmitQuery={(q) => showResults(q)}
          placeholder="Найти блюдо"
          rightSlot={
            <button
              type="button"
              aria-label="Фильтры"
              onClick={() => setShowFilters(true)}
              className={cn(
                "relative grid size-[50px] shrink-0 place-items-center rounded-[18px] border-[0.5px] border-white/70 bg-white/60 text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.7),0_4px_14px_rgba(20,40,28,0.06)] backdrop-blur-[20px]",
                PRESS_CLASSES
              )}
            >
              <SlidersHorizontal size={20} strokeWidth={2.1} />
              {priceTouched && (
                <span className="absolute top-2 right-2 size-2.5 rounded-full border-2 border-white bg-[#2ECC71]" />
              )}
            </button>
          }
        />

        {/* Популярные категории — плиткой */}
        <div className="px-[18px] pt-3.5 pb-1">
          <SectionHeader
            icon={<LayoutGrid size={17} strokeWidth={2.25} color={brand} />}
            title="Популярные категории"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {popularCategories.map((category) => {
              const isActive = category.id === selectedCategoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryId(isActive ? null : category.id)
                  }
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-[36px] items-center gap-1.5 rounded-full border-[0.5px] px-3.5 text-[13.5px] font-semibold shadow-[0_4px_12px_rgba(20,40,28,0.09),inset_1px_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[20px] backdrop-saturate-[180%] transition-colors",
                    isActive
                      ? "border-transparent bg-[#2ECC71] text-white"
                      : "border-white/70 bg-neutral-100/69 text-[#15291C]",
                    PRESS_CLASSES
                  )}
                >
                  <span aria-hidden="true" className="text-[15px] leading-none">
                    {category.emoji}
                  </span>
                  {category.label}
                </button>
              );
            })}

            {/* Все категории → страница Блюда/Кухни/Формат */}
            <button
              type="button"
              onClick={() => router.push("/categories?source=search")}
              className={cn(
                "inline-flex h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-[#2ECC71] bg-white px-3.5 text-[13.5px] font-bold text-[#17913F]",
                PRESS_CLASSES
              )}
            >
              <LayoutGrid size={15} strokeWidth={2.4} />
              Все категории
            </button>
          </div>
        </div>

        <RecentSearches
          items={recentQueries}
          onChange={saveRecentQueries}
          onSubmitQuery={(q) => showResults(q)}
        />
        <PopularTags
          tags={popularTags}
          brand={brand}
          onSubmitQuery={(q) => showResults(q)}
        />
      </div>

      {/* Закреплённая кнопка «Показать» над нижней навигацией */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 px-4">
        <button
          type="button"
          onClick={() => showResults()}
          disabled={!hasSelection}
          className={cn(
            "pointer-events-auto flex h-[54px] w-full items-center justify-center rounded-[16px] text-[16px] font-extrabold transition-colors",
            hasSelection
              ? "bg-[#2ECC71] text-white shadow-[0_10px_24px_rgba(46,204,113,0.36)]"
              : "cursor-not-allowed border border-[rgba(20,40,28,0.10)] bg-white/70 text-[#AAB4AE] backdrop-blur-[20px]",
            PRESS_CLASSES
          )}
        >
          Показать
        </button>
      </div>

      <SearchFilterSheet
        open={showFilters}
        price={price}
        onPriceChange={setPrice}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}
