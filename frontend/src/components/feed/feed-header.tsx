"use client";

import { FeedSegmentedControl } from "@/components/feed/feed-segmented-control";
import { GlassSurface } from "@/components/feed/glass-surface";

export type FeedTab = "new" | "subs";

const TABS: readonly [
  { id: "new"; label: string },
  { id: "subs"; label: string },
] = [
  { id: "new", label: "Новое" },
  { id: "subs", label: "Подписки" },
];

type FeedHeaderProps = {
  tab: FeedTab;
  onTabChange: (next: FeedTab) => void;
};

export function FeedHeader({ tab, onTabChange }: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2 pb-0 max-[409px]:px-3">
      <GlassSurface className="h-13">
        <div className="flex h-13 items-center gap-2 pr-2 pl-3 max-[409px]:gap-1 max-[409px]:pr-1.5 max-[409px]:pl-2">
          {/* Логотип/иконка — только на мобиле; на десктопе он есть в сайдбаре слева. */}
          <div className="flex shrink-0 items-center gap-2 pr-0.5 max-[409px]:gap-1.5 max-[409px]:pr-0 lg:hidden">
            <img
              src="/logo.png"
              alt="Foody"
              className="size-7 shrink-0 object-contain max-[409px]:size-6"
            />
            <span className="font-sans text-[20px] font-extrabold tracking-[-0.3px] text-[#15291C] max-[409px]:text-[16px]">
              Foody
            </span>
          </div>

          <FeedSegmentedControl
            aria-label="Лента"
            items={TABS}
            value={tab}
            onValueChange={onTabChange}
            className="ml-0.5 max-[409px]:ml-0"
          />
        </div>
      </GlassSurface>
    </header>
  );
}
