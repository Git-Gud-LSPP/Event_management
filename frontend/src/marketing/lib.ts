import { useEffect, type RefObject } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One observer for the whole page: adds `is-in` to every `.eh-reveal` / `[data-inview]` once it enters. */
export function useRevealAll(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>(".eh-reveal, [data-inview]");
    if (!els?.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root]);
}

const btn = "eh-press inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium";
export const buttonCls = {
  primary: `${btn} bg-accent text-accent-ink hover:brightness-110`,
  secondary: `${btn} border border-line-strong text-ink hover:bg-sunken`,
  ghost: `${btn} px-2 text-ink-2 hover:text-ink`,
};
