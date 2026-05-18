"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Plus,
  Rows3,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";

import { GlassSurface } from "@/components/feed/glass-surface";

export type NavTab = "feed" | "search" | "add" | "saved" | "me";

type TabItem = {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  href?: string;
};

const TABS: TabItem[] = [
  { id: "feed", label: "Лента", icon: Rows3, href: "/" },
  { id: "search", label: "Поиск", icon: Search, href: "/search" },
  {
    id: "add",
    label: "Создать пост",
    icon: Plus,
    primary: true,
    href: "/create",
  },
  { id: "saved", label: "Сохранённое", icon: Bookmark, href: "/saved" },
  { id: "me", label: "Профиль", icon: User, href: "/me" },
];
const POST_CARD_EXPANDED_EVENT = "foody:post-card-expanded";

type BottomTabBarProps = {
  brand: string;
};

export function BottomTabBar({ brand }: BottomTabBarProps) {
  const pathname = usePathname();
  const [isPostCardExpanded, setIsPostCardExpanded] = useState(false);

  useEffect(() => {
    function handlePostCardExpanded(event: Event) {
      const detail = (event as CustomEvent<{ expanded?: unknown }>).detail;

      if (typeof detail?.expanded === "boolean") {
        setIsPostCardExpanded(detail.expanded);
      }
    }

    window.addEventListener(POST_CARD_EXPANDED_EVENT, handlePostCardExpanded);

    return () => {
      window.removeEventListener(POST_CARD_EXPANDED_EVENT, handlePostCardExpanded);
    };
  }, []);

  const isActiveTab = (t: TabItem) => {
    if (t.href === undefined) return false;
    if (t.href === "/") return pathname === "/";
    // /me tab also matches /profile (redirect alias) and /me/edit
    if (t.id === "me") {
      return pathname === "/me" || pathname.startsWith("/me/") || pathname === "/profile" || pathname.startsWith("/profile/");
    }

    return pathname === t.href || pathname.startsWith(`${t.href}/`);
  };

  if (
    isPostCardExpanded ||
    pathname === "/new-review" ||
    pathname === "/create" ||
    pathname === "/categories"
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Главная навигация"
      className="absolute right-3.5 bottom-[18px] left-3.5 z-30 h-16 [@media(max-width:430px)_and_(max-height:860px)]:right-3 [@media(max-width:430px)_and_(max-height:860px)]:bottom-3 [@media(max-width:430px)_and_(max-height:860px)]:left-3 [@media(max-width:430px)_and_(max-height:860px)]:h-14"
    >
      <GlassSurface className="h-16 rounded-[28px] [@media(max-width:430px)_and_(max-height:860px)]:h-14 [@media(max-width:430px)_and_(max-height:860px)]:rounded-[24px]">
        <ul className="grid h-16 grid-cols-5 items-center px-2 [@media(max-width:430px)_and_(max-height:860px)]:h-14 [@media(max-width:430px)_and_(max-height:860px)]:px-1.5">
          {TABS.map((t) => {
            const isActive = isActiveTab(t);

            if (t.primary) {
              const primaryIcon = (
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  className="block [@media(max-width:430px)_and_(max-height:860px)]:size-11"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="plusRingF"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={brand} />
                      <stop offset="100%" stopColor="#1FA85C" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="25"
                    cy="25"
                    r="23"
                    fill="none"
                    stroke="url(#plusRingF)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M25 16v18M16 25h18"
                    stroke="url(#plusRingF)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              );

              return (
                <li key={t.id} className="grid min-w-0 place-items-center">
                  {t.href ? (
                    <Link
                      href={t.href}
                      aria-label={t.label}
                      className="grid size-[50px] cursor-pointer place-items-center border-0 bg-transparent p-0 [@media(max-width:430px)_and_(max-height:860px)]:size-11"
                      style={{ filter: `drop-shadow(0 6px 14px ${brand}55)` }}
                    >
                      <motion.span
                        className="grid place-items-center"
                        whileTap={{ scale: 0.85 }}
                      >
                        {primaryIcon}
                      </motion.span>
                    </Link>
                  ) : (
                    <motion.button
                      type="button"
                      aria-label={t.label}
                      whileTap={{ scale: 0.85 }}
                      className="grid size-[50px] cursor-pointer place-items-center border-0 bg-transparent p-0 [@media(max-width:430px)_and_(max-height:860px)]:size-11"
                      style={{ filter: `drop-shadow(0 6px 14px ${brand}55)` }}
                    >
                      {primaryIcon}
                    </motion.button>
                  )}
                </li>
              );
            }

            const Icon = t.icon;
            const isFilledBookmark = t.id === "saved" && isActive;
            const inner = (
              <>
                <motion.span
                  whileTap={{ scale: 0.85 }}
                  className="grid place-items-center"
                >
                  <Icon
                    className="size-[22px] [@media(max-width:430px)_and_(max-height:860px)]:size-5"
                    strokeWidth={isActive ? 2.4 : 1.8}
                    color={isActive ? brand : "#5C6B62"}
                    fill={isFilledBookmark ? brand : "none"}
                  />
                </motion.span>
                <span>{t.label}</span>
              </>
            );

            if (t.href) {
              return (
                <li key={t.id} className="min-w-0">
                  <Link
                    href={t.href}
                    aria-current={isActive ? "page" : undefined}
                    className="mx-auto flex min-h-[50px] w-full max-w-16 cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center text-[10.5px] font-semibold transition-colors [@media(max-width:430px)_and_(max-height:860px)]:min-h-11 [@media(max-width:430px)_and_(max-height:860px)]:py-1 [@media(max-width:430px)_and_(max-height:860px)]:text-[10px]"
                    style={{ color: isActive ? brand : "#5C6B62" }}
                  >
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li key={t.id} className="min-w-0">
                <button
                  type="button"
                  aria-label={t.label}
                  className="mx-auto flex min-h-[50px] w-full max-w-16 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 py-1.5 text-center text-[10.5px] font-semibold text-[#5C6B62] [@media(max-width:430px)_and_(max-height:860px)]:min-h-11 [@media(max-width:430px)_and_(max-height:860px)]:py-1 [@media(max-width:430px)_and_(max-height:860px)]:text-[10px]"
                >
                  {inner}
                </button>
              </li>
            );
          })}
        </ul>
      </GlassSurface>
    </nav>
  );
}
