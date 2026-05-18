"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { getSearchResultsHref } from "@/lib/search";

type UseSearchSubmitOptions = {
  onSubmitted?: (query: string) => void;
};

export function useSearchSubmit({ onSubmitted }: UseSearchSubmitOptions = {}) {
  const router = useRouter();

  return useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) return;

      onSubmitted?.(trimmedQuery);
      router.push(getSearchResultsHref(trimmedQuery));
    },
    [onSubmitted, router]
  );
}
