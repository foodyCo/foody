import { MapPin, Star } from "lucide-react";

import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { STAR_COLOR } from "./post-card-shared";

type PostDetailsProps = {
  post: Post;
  brand: string;
  expanded?: boolean;
};

export function PostDetails({ post, brand, expanded = false }: PostDetailsProps) {
  return (
    <>
      <div className="px-4 pb-1 max-[390px]:pb-0.5 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5">
        <h3 className="text-[19px] leading-[1.2] font-extrabold tracking-[-0.4px] text-[#15291C] max-[390px]:text-[18px] [@media(max-width:430px)_and_(max-height:860px)]:text-[17px]">
          {post.dish}
        </h3>
      </div>

      <div className="px-4 pt-1 pb-2.5 max-[390px]:pb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-1.5">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-[9px] bg-[rgba(20,40,28,0.05)] px-2.5 py-[5px] text-[12.5px] font-semibold text-[#13251a]">
          <MapPin className="size-[11px] shrink-0" strokeWidth={2.2} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {post.place}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-2.5 max-[390px]:pb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-1.5">
        <div
          className={cn(
            "relative isolate inline-flex rounded-[9px] p-px",
            "bg-[rgba(83,145,105,0.07)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,1),0_10px_28px_rgba(20,40,28,0.012)]"
          )}
          style={{
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0), 0 10px 28px rgba(20,40,28,0.012), -4px 6px 24px ${brand}05`,
          }}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:py-1",
              "border-0",
              "bg-[linear-gradient(135deg,rgba(220,255,232,1),rgba(232,255,240,0.60))]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0),inset_0_-1px_0_rgba(20,40,28,0)]",
              "backdrop-blur-[14px] backdrop-saturate-[100%]"
            )}
          >
            <span className="text-[10.5px] font-bold tracking-[0.38px] text-[#647268] uppercase">
              Цена
            </span>
            <span className="text-[16.5px] leading-none font-extrabold tracking-[-0.18px] text-[#203829] tabular-nums">
              {post.price}
            </span>
          </span>
        </div>
        <div className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.4px] text-[#5C6B62] uppercase">
            Оценка
          </span>
          <span className="inline-flex items-center gap-1 text-[18px] font-extrabold tracking-[-0.3px] text-[#15291C]">
            <Star
              className="size-3.5"
              color={STAR_COLOR}
              fill={STAR_COLOR}
              strokeWidth={0}
            />{" "}
            {post.rating}
          </span>
        </div>
      </div>

      <p
        className="mx-3 mb-3 rounded-[14px] bg-[rgba(20,40,28,0.04)] px-3 py-2.5 font-[family-name:var(--font-roboto)] text-[15px] leading-[1.62] font-medium text-pretty text-[#15291C] max-[390px]:mb-2 max-[390px]:py-2 max-[390px]:text-[14.5px] max-[390px]:leading-[1.5] [@media(max-width:430px)_and_(max-height:860px)]:mx-2.5 [@media(max-width:430px)_and_(max-height:860px)]:mb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:py-1.5 [@media(max-width:430px)_and_(max-height:860px)]:text-[14px] [@media(max-width:430px)_and_(max-height:860px)]:leading-[1.42]"
      >
        <span
          className={
            expanded
              ? "block whitespace-pre-wrap"
              : "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
          }
        >
          {post.text}
        </span>
      </p>
    </>
  );
}
