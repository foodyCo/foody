import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  size?: number;
  className?: string;
  src?: string | null;
};

// Единый дефолтный аватар: белый фон, зелёная обводка #2ECC71, тёмный инициал.
// Никакой генерации по имени — везде одинаково.
export function UserAvatar({ name, size = 36, className, src }: UserAvatarProps) {
  const initial = (name || "?").replace("@", "").slice(0, 1).toUpperCase();

  return (
    <Avatar
      className={cn(
        "shrink-0 border-[1.5px] border-[#2ECC71] after:hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <AvatarImage src={src} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback
        className="bg-white font-extrabold tracking-tight text-[#15291C]"
        style={{ fontSize: size * 0.42 }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
