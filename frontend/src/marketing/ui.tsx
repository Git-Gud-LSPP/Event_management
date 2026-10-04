import { useEffect, useRef, useState, type ReactNode } from "react";
import { reducedMotion } from "./lib";

/** Counts up once when visible. Writes textContent directly so React doesn't re-render per frame. */
export function Counter({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let raf = 0;
    el.textContent = fmt(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return (
    <span ref={ref} className="tabular-nums">
      {fmt(to)}
    </span>
  );
}

/**
 * Product clip: poster <img> paints first (good LCP), the muted loop fades in over it once playing.
 * Plays only while on screen; never autoplays under reduced motion (native controls instead).
 */
export function Clip({ name, label, url, priority = false }: { name: string; label: string; url: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [still] = useState(reducedMotion);

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  return (
    <figure className="overflow-hidden rounded-card border border-line bg-surface shadow-overlay">
      <div className="flex h-8 items-center gap-3 border-b border-line px-3" aria-hidden="true">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2 rounded-full border border-line-strong/60" />
          ))}
        </span>
        <span className="mx-auto font-mono text-[11px] text-ink-3">app.eventhq.com{url}</span>
        <span className="w-8" />
      </div>
      <div className="relative aspect-[16/10] bg-sunken">
        <img
          src={`/media/${name}.jpg`}
          srcSet={`/media/${name}-800.webp 800w, /media/${name}.webp 1600w`}
          sizes="(min-width: 1024px) 760px, 100vw"
          alt=""
          width={1600}
          height={1000}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <video
          ref={ref}
          aria-label={label}
          muted
          loop
          playsInline
          controls={still}
          preload={priority ? "metadata" : "none"}
          // The <img> above is the poster (responsive, LCP-friendly); the video only needs one when it's shown with controls.
          poster={still ? `/media/${name}.jpg` : undefined}
          width={1600}
          height={1000}
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${playing || still ? "opacity-100" : "opacity-0"}`}
        >
          <source src={`/media/${name}.mp4`} type="video/mp4" />
        </video>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

/** Brand mark: a 2x2 module grid with one module switched on. */
export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="2.5" width="8.5" height="8.5" rx="1.5" fill="var(--eh-accent)" />
      <rect x="2.5" y="13" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-ink">
      <Mark />
      EventHQ
    </span>
  );
}

/** Visible tag for anything that must be replaced with real data before launch. */
export const Placeholder = ({ children = "Placeholder" }: { children?: ReactNode }) => (
  <span className="inline-block rounded-control border border-dashed border-line-strong px-1.5 py-0.5 align-middle font-mono text-[11px] font-normal tracking-normal text-ink-3">
    {children}
  </span>
);

