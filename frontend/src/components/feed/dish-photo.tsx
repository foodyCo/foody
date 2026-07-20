import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#F6C453", "#E76F51", "#2A9D8F"],
  ["#FFB4A2", "#E5989B", "#6D597A"],
  ["#A7C957", "#6A994E", "#386641"],
  ["#F4A261", "#E9C46A", "#264653"],
  ["#E07A5F", "#F2CC8F", "#81B29A"],
  ["#CDB4DB", "#FFC8DD", "#FFAFCC"],
  ["#FFD6A5", "#FDFFB6", "#CAFFBF"],
  ["#90DBF4", "#A9DEF9", "#E4C1F9"],
];

type DishPhotoProps = {
  seed: number;
  height?: CSSProperties["height"];
  label?: string;
  labelClassName?: string;
  src?: string | null;
  alt?: string;
};

export function DishPhoto({
  seed,
  height = 360,
  label,
  labelClassName,
  src,
  alt,
}: DishPhotoProps) {
  if (src) {
    return (
      <div className="relative w-full overflow-hidden bg-neutral-100" style={{ height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || label || ""}
          // draggable=false — иначе на ПК зажатие мыши на картинке запускает
          // нативный drag-and-drop изображения и перехватывает свайп карусели.
          draggable={false}
          className="absolute inset-0 size-full select-none object-cover [-webkit-user-drag:none]"
          loading="eager"
        />
        {label && (
          <div
            className={cn(
              "absolute bottom-2.5 left-3 font-mono text-[10px] tracking-[0.3px] text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]",
              labelClassName
            )}
          >
            {label}
          </div>
        )}
      </div>
    );
  }

  const palette = PALETTES[seed % PALETTES.length];
  const angle = (seed * 47) % 360;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height,
        background: `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 14px, rgba(0,0,0,0.04) 14px 28px)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
      {label && (
        <div
          className={cn(
            "absolute bottom-2.5 left-3 font-mono text-[10px] tracking-[0.3px] text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]",
            labelClassName
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}
