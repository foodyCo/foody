"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

type CategoryPickerProps = {
  brand: string;
};

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export function CategoryPicker({ brand }: CategoryPickerProps) {
  const router = useRouter();

  return (
    <div className="px-[18px] pt-3.5 pb-4">
      <button
        type="button"
        onClick={() => router.push("/categories?source=search")}
        className={cn(
          "flex h-[52px] w-full cursor-pointer items-center gap-3 rounded-[18px] border-[0.5px] border-white/70 bg-white/60 px-4 text-left text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.7),inset_-1px_-1px_0_rgba(255,255,255,0.3),0_4px_14px_rgba(20,40,28,0.06)] backdrop-blur-[20px] backdrop-saturate-[180%]",
          PRESS_CLASSES
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-[10px] text-[17px] leading-none"
          style={{
            background: `${brand}66`,
            boxShadow: `0 4px 12px ${brand}55`,
          }}
        >
          <UtensilsCrossed size={17} strokeWidth={2.4} color="#15291C" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-[11px] leading-tight font-semibold tracking-[0.3px] text-[#5C6B62] uppercase">
            Категория
          </span>
          <span className="text-[15.5px] leading-snug font-bold tracking-[-0.2px] text-[#15291C]">
            Все категории
          </span>
        </span>
        <span className="grid size-[26px] place-items-center rounded-full bg-[rgba(20,40,28,0.06)]">
          <ChevronRight size={14} strokeWidth={2.4} color="#15291C" />
        </span>
      </button>
    </div>
  );
}
