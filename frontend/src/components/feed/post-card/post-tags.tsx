import { cn } from "@/lib/utils";

import { canAnimate } from "./post-card-shared";

type PostTagsProps = {
  mainTag?: string;
  restTags: string[];
  brand: string;
  shouldReduceMotion: boolean | null;
  onTagClick: (tag: string) => void;
};

export function PostTags({
  mainTag,
  restTags,
  brand,
  shouldReduceMotion,
  onTagClick,
}: PostTagsProps) {
  return (
    <div className="mt-auto px-3.5 pb-3.5 max-[430px]:mt-0 max-[430px]:pb-3 [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pb-2.5">
      <span
        aria-hidden="true"
        className="mb-2 block h-px w-full rounded-full bg-[rgba(20,40,28,0.1)] max-[390px]:mb-1.5 [@media(max-width:430px)_and_(max-height:860px)]:mb-1.5"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {mainTag && (
          <TagButton
            isMain
            brand={brand}
            onClick={() => onTagClick(mainTag)}
            shouldReduceMotion={shouldReduceMotion}
          >
            {mainTag}
          </TagButton>
        )}
        {restTags.map((tag) => (
          <TagButton
            key={tag}
            brand={brand}
            onClick={() => onTagClick(tag)}
            shouldReduceMotion={shouldReduceMotion}
          >
            {tag}
          </TagButton>
        ))}
      </div>
    </div>
  );
}

type TagButtonProps = {
  children: string;
  brand: string;
  isMain?: boolean;
  shouldReduceMotion: boolean | null;
  onClick: () => void;
};

function TagButton({
  children,
  brand,
  isMain = false,
  shouldReduceMotion,
  onClick,
}: TagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "origin-center cursor-pointer select-none border-0 outline-none",
        "inline-flex items-center justify-center rounded-full",
        "transition-transform duration-150 ease-out [-webkit-tap-highlight-color:transparent]",
        canAnimate(shouldReduceMotion) && "active:scale-[0.94]",
        isMain
          ? "h-7 bg-[linear-gradient(135deg,#BDF7D0,#73E89F)] px-3 text-[12.5px] font-extrabold tracking-[0px] text-[#06301A] [@media(max-width:430px)_and_(max-height:860px)]:h-[26px] [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:text-[12px]"
          : "h-[26px] bg-[rgba(46,204,113,0.14)] px-2.5 text-[11.5px] font-bold tracking-[0px] text-[#0E8A4F] [@media(max-width:430px)_and_(max-height:860px)]:h-6 [@media(max-width:430px)_and_(max-height:860px)]:px-2 [@media(max-width:430px)_and_(max-height:860px)]:text-[11px]"
      )}
      style={
        isMain
          ? {
              boxShadow: `0 4px 12px ${brand}33, inset 1px 1px 0 rgba(255,255,255,0.65)`,
            }
          : undefined
      }
    >
      <span
        className={cn(
          "flex h-full items-center justify-center",
          isMain ? "leading-[28px]" : "leading-[26px]"
        )}
      >
        {children}
      </span>
    </button>
  );
}
