"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";

import { FeedSegmentedControl } from "@/components/feed/feed-segmented-control";
import { GlassSurface } from "@/components/feed/glass-surface";
import { UserAvatar } from "@/components/feed/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedTab = "new" | "subs";

const TABS: readonly [
  { id: "new"; label: string },
  { id: "subs"; label: string },
] = [
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

          <FeedSegmentedControl
            aria-label="Лента"
            items={TABS}
            value={tab}
            onValueChange={onTabChange}
            className="ml-0.5 max-[409px]:ml-0"
          />

          {isLoggedIn ? (
            <Link
              href="/me"
              aria-label={currentUser}
              title={currentUser}
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-transparent p-0 text-[#15291C] outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
            >
              <UserAvatar name={currentUser} size={32} className="shadow-none" />
            </Link>
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
