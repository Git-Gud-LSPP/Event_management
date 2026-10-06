export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const btn = "eh-press inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium";
export const buttonCls = {
  primary: `${btn} bg-ink text-paper hover:bg-ink-hover`,
  secondary: `${btn} bg-surface text-ink ring-1 ring-line hover:ring-ink`,
  ghost: `${btn} px-2 text-ink-2 hover:text-ink`,
};

// Shared marketing-page styles (landing, feature pages, demo).
export const wrap = "mx-auto max-w-[1280px] px-[clamp(20px,4vw,40px)]";
export const pad = "py-[clamp(56px,7vw,96px)]";
export const eyebrow = "font-mono text-xs tracking-[.04em] text-ink-3";
export const h2 = "m-0 text-[clamp(34px,4.4vw,56px)] leading-[1.02] font-medium tracking-[-0.04em]";
export const muted = "text-[#6E7C73]";
export const lede = "m-0 max-w-[520px] text-base leading-[1.6] text-pretty text-[#56645B]";
export const pillDark = "inline-flex items-center gap-2.5 rounded-full bg-ink text-paper hover:bg-ink-hover hover:text-paper";
export const pillLight = "inline-flex items-center gap-2.5 rounded-full bg-surface text-ink ring-1 ring-transparent hover:ring-ink";
