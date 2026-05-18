"use client";

import { Flame } from "lucide-react";

import { SectionHeader } from "@/components/search/section-header";
import { cn } from "@/lib/utils";

type PopularTagsProps = {
  tags: string[];
  brand: string;
  onSubmitQuery: (query: string) => void;
};

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export function PopularTags({ tags, brand, onSubmitQuery }: PopularTagsProps) {
  return (
    <div className="px-[18px] pb-7">
      <SectionHeader
        icon={<Flame size={17} strokeWidth={2.25} color={brand} />}
        title="Популярное"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSubmitQuery(tag)}
            className={cn(
              "inline-flex h-[30px] cursor-pointer items-center justify-center rounded-full border-[0.5px] border-transparent px-3 pt-px text-[12.5px] leading-none font-bold tracking-[0px] text-[#15291C] outline-none backdrop-blur-[20px] backdrop-saturate-[180%]",
              "focus-visible:ring-2 focus-visible:ring-[#15291C]/18 focus-visible:ring-offset-0",
              PRESS_CLASSES
            )}
            style={{
              background: `linear-gradient(115deg, rgba(189,247,208,0.1) 18%, rgba(189,247,208,0.16) 52%, rgba(100,218,189,0.09) 58%, rgba(189,247,208,0) 82%) padding-box, linear-gradient(${brand}14, ${brand}14) padding-box, linear-gradient(135deg, ${brand}15, rgba(115,232,159,0.42), rgba(100,218,189,0.33)) border-box`,
              boxShadow: "0 5px 14px rgba(20,40,28,0.11)",
            }}
          >
            <span className="leading-none">#{tag}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
