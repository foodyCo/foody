"use client";

import { SearchInputGlass } from "@/components/search/search-input-glass";

type SearchHeaderProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmitQuery: (query: string) => void;
};

export function SearchHeader({
  query,
  onQueryChange,
  onSubmitQuery,
}: SearchHeaderProps) {
  return (
    <div className="px-[18px] pt-1 pb-2.5">
      <h1 className="mb-3 text-[34px] leading-tight font-extrabold tracking-[-0.6px] text-[#15291C]">
        Поиск
      </h1>

      <SearchInputGlass
        query={query}
        onQueryChange={onQueryChange}
        onSubmitQuery={onSubmitQuery}
      />
    </div>
  );
}
