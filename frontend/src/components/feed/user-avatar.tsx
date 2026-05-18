import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#FFD6A5", "#FF8FAB"],
  ["#A7C957", "#386641"],
  ["#FFC25C", "#E76F51"],
  ["#90DBF4", "#A78BFA"],
  ["#F2CC8F", "#81B29A"],
  ["#CDB4DB", "#FFAFCC"],
];

type UserAvatarProps = {
  name: string;
  size?: number;
  className?: string;
  src?: string | null;
};

export function UserAvatar({ name, size = 36, className, src }: UserAvatarProps) {
  const seed = name.charCodeAt(1) || 7;
  const [from, to] = PALETTES[seed % PALETTES.length];
  const initial = (name || "?").replace("@", "").slice(0, 1).toUpperCase();

  return (
    <Avatar
      className={cn(
        "shrink-0 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.55)] after:hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? <AvatarImage src={src} alt={name} className="object-cover" /> : null}
      <AvatarFallback
        className="font-extrabold tracking-tight text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          fontSize: size * 0.42,
        }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
