export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const btn = "eh-press inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium";
export const buttonCls = {
  primary: `${btn} bg-ink text-paper hover:bg-ink-hover`,
  secondary: `${btn} bg-surface text-ink ring-1 ring-line hover:ring-ink`,
  ghost: `${btn} px-2 text-ink-2 hover:text-ink`,
};
