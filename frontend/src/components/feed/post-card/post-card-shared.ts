export const TEXT_PRIMARY = "#15291C";
export const HEART_COLOR = "#E5443B";
export const STAR_COLOR = "#FFB400";

export const ICON_PULSE_ANIMATION = { scale: [1, 0.86, 1.08, 1] };
export const ICON_PULSE_TRANSITION = { duration: 0.28, ease: "easeOut" } as const;

export function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}
