export type Palette = "fresh" | "citrus" | "dusk";
export type Density = "comfortable" | "cozy";

export type Tweaks = {
  brand: string;
  palette: Palette;
  density: Density;
};

export const DEFAULT_TWEAKS: Tweaks = {
  brand: "#2ECC71",
  palette: "fresh",
  density: "comfortable",
};
