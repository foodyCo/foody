"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

// Левая навигация для десктопа (lg+). На мобиле скрыта — там нижний бар.
export function DesktopSidebar() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.primary);
  const createItem = NAV_ITEMS.find((item) => item.primary);
  const CreateIcon = createItem?.icon;

  return (
    <aside className="absolute top-0 left-0 z-20 hidden h-full w-[245px] flex-col gap-1 border-r border-[rgba(20,40,28,0.06)] bg-white/70 px-4 py-6 backdrop-blur-[18px] backdrop-saturate-[180%] lg:flex">
      <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Foody" className="size-8 shrink-0 object-contain" />
        <span className="text-[22px] font-extrabold tracking-[-0.3px] text-[#15291C]">
          Foody
        </span>
      </Link>

      {items.map((item) => {
        const active = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl px-3 py-2.5 text-[16px] font-bold transition-colors",
              active
                ? "bg-[rgba(46,204,113,0.12)] text-[#15291C]"
                : "text-[#5C6B62] hover:bg-[rgba(20,40,28,0.05)]"
            )}
          >
            <Icon
              className="size-6 shrink-0"
              strokeWidth={active ? 2.4 : 1.9}
              color={active ? "#2ECC71" : "#5C6B62"}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {createItem && CreateIcon && (
        <Link
          href={createItem.href}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#2ECC71] px-4 py-3 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(46,204,113,0.35)] transition-colors hover:bg-[#27b866]"
        >
          <CreateIcon className="size-5 shrink-0" strokeWidth={2.6} />
          <span>{createItem.label}</span>
        </Link>
      )}
    </aside>
  );
}
