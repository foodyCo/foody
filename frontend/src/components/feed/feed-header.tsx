"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import { UserAvatar } from "@/components/feed/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedTab = "new" | "subs";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "new", label: "Новое" },
  { id: "subs", label: "Подписки" },
];

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

type FeedHeaderProps = {
  brand: string;
  tab: FeedTab;
  onTabChange: (next: FeedTab) => void;
  currentUser: string | null;
};

export function FeedHeader({
  brand,
  tab,
  onTabChange,
  currentUser,
}: FeedHeaderProps) {
  const isLoggedIn = !!currentUser;
  const shouldReduceMotion = useReducedMotion();
  const activeTabLeft = tab === "new" ? "3px" : "calc(50% + 1px)";

  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2 pb-0 max-[409px]:px-3">
      <GlassSurface className="h-13">
        <div className="flex h-13 items-center gap-2 pr-2 pl-3 max-[409px]:gap-1 max-[409px]:pr-1.5 max-[409px]:pl-2">
          <div className="flex shrink-0 items-center gap-1.5 pr-0.5 max-[409px]:gap-1 max-[409px]:pr-0">
            <Image
              src="/Foody_LOGO.webp"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="size-9 shrink-0 object-contain max-[409px]:size-7.5"
              priority
            />
            <span className="font-sans text-[18px] font-black tracking-[-0.2px] text-[#15291C] max-[409px]:text-[14.5px]">
              Foody
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Лента"
            className="relative ml-0.5 grid min-w-[148px] flex-1 grid-cols-2 gap-0.5 rounded-full bg-[rgba(20,40,28,0.06)] p-[3px] max-[409px]:ml-0 max-[409px]:min-w-[116px]"
          >
            <motion.span
              aria-hidden="true"
              className="absolute top-[3px] bottom-[3px] w-[calc(50%_-_4px)] rounded-full bg-white shadow-[0_4px_15px_rgba(20,40,28,0.11)]"
              initial={false}
              animate={{ left: activeTabLeft }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 520,
                      damping: 42,
                      mass: 0.55,
                    }
              }
            />
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(t.id)}
                  className={cn(
                    "relative grid h-[31px] min-w-0 cursor-pointer place-items-center overflow-hidden rounded-full px-1 pt-px font-sans text-[13px] leading-[1.1] font-extrabold tracking-[0px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/20 max-[409px]:text-[10.5px]",
                    isActive ? "text-[#15291C]" : "text-[#5C6B62]"
                  )}
                >
                  <span className="relative z-[1] whitespace-nowrap">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              aria-label={currentUser}
              title={currentUser}
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-transparent p-0 text-[#15291C] outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
            >
              <UserAvatar name={currentUser} size={32} className="shadow-none" />
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              className={cn(
                "h-8 origin-center translate-z-0 cursor-pointer select-none rounded-full border border-transparent bg-transparent px-2.5 pt-px text-[10px] leading-[1.1] font-extrabold tracking-[0px] text-[#0B2F1D] outline-none will-change-transform max-[409px]:px-1.5 max-[409px]:text-[8.75px]",
                "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out [backface-visibility:hidden] [-webkit-tap-highlight-color:transparent]",
                canAnimate(shouldReduceMotion) && "active:scale-[0.94]"
              )}
              style={{
                background: `linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.0)) padding-box, linear-gradient(135deg, ${brand}99, #00800095   ) border-box`,
                boxShadow:
                  "0 8px 18px rgba(8,58,33,0.17), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(255,255,255,0.18)",
              }}
            >
              Регистрация
            </Button>
          )}
        </div>
      </GlassSurface>
    </header>
  );
}
