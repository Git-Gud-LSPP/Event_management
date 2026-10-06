import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "./lib";

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
        <span className="mx-auto font-mono text-[11px] text-ink-3">app.eventops.com{url}</span>
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

/** Brand mark: an ink tile with one green module switched on. */
export function Mark({ className = "size-5" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 rounded-[5px] bg-ink ${className}`} aria-hidden="true">
      <span className="absolute right-[20%] bottom-[20%] size-[35%] rounded-[2px] bg-live" />
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-[9px] text-base font-semibold tracking-[-0.02em] text-ink">
      <Mark />
      EventOps
    </span>
  );
}

export const Dot = ({ c = "bg-live", className = "" }: { c?: string; className?: string }) => (
  <span className={`size-1.5 shrink-0 rounded-full ${c} ${className}`} aria-hidden="true" />
);
