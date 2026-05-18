import type { Palette } from "@/lib/mock-data";

type Blob = {
  color: string;
  opacity: number;
  left: string;
  top: string;
};

const PALETTES: Record<Palette, { base: string; blobs: Blob[] }> = {
  fresh: {
    base: "#F4FAF3",
    blobs: [
      { color: "#46DA8F", opacity: 0.55, left: "20%", top: "18%" },
      { color: "#8DE0B0", opacity: 0.45, left: "85%", top: "8%" },
      { color: "#F5D08C", opacity: 0.2, left: "85%", top: "78%" },
      { color: "#B8E6CC", opacity: 0.4, left: "8%", top: "78%" },
    ],
  },
  citrus: {
    base: "#FFF8EC",
    blobs: [
      { color: "#FFC25C", opacity: 0.55, left: "15%", top: "14%" },
      { color: "#2ECC71", opacity: 0.4, left: "88%", top: "12%" },
      { color: "#FF9A6B", opacity: 0.35, left: "90%", top: "80%" },
      { color: "#CDEBA8", opacity: 0.45, left: "12%", top: "80%" },
    ],
  },
  dusk: {
    base: "#1A2620",
    blobs: [
      { color: "#2ECC71", opacity: 0.45, left: "20%", top: "20%" },
      { color: "#1FA85C", opacity: 0.5, left: "85%", top: "12%" },
      { color: "#254A38", opacity: 0.6, left: "90%", top: "78%" },
      { color: "#0F2E1F", opacity: 0.7, left: "8%", top: "80%" },
    ],
  },
};

type BackgroundBlobsProps = {
  palette: Palette;
};

export function BackgroundBlobs({ palette }: BackgroundBlobsProps) {
  const { base, blobs } = PALETTES[palette];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: base }}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute size-80 rounded-full blur-[60px]"
          style={{
            background: b.color,
            opacity: b.opacity,
            left: `calc(${b.left} - 160px)`,
            top: `calc(${b.top} - 160px)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.4),transparent_60%)]" />
    </div>
  );
}
