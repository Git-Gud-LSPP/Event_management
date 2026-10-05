import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { reducedMotion } from "./lib";

gsap.registerPlugin(ScrollTrigger);

// Landing-page motion, ported from the v2 design. Everything hangs off data-* hooks in the markup.
// Under reduced motion none of this runs and the page renders in its final, static state.

const fmt = (v: number, pre = "", suf = "", dec = 0) =>
  pre + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;

export interface LandingMotion {
  /** Smooth-scroll to a page Y (falls back to native smooth scroll). */
  scrollTo: (y: number) => void;
  /** Use-case picker: scrolls the pinned section when it's pinned, else returns false. */
  pickUc: (i: number) => boolean;
  /** True once gsap is driving the page (for the small state-change tweens). */
  on: boolean;
}

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>, setUc: (i: number) => void) {
  const api = useRef<LandingMotion>({
    scrollTo: (y) => window.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" }),
    pickUc: () => false,
    on: false,
  });
  // Keep the latest setter without re-running the effect.
  const setUcRef = useRef(setUc);
  useEffect(() => {
    setUcRef.current = setUc;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
    const offs: (() => void)[] = [];
    const on = (el: EventTarget, ev: string, fn: EventListener) => {
      el.addEventListener(ev, fn);
      offs.push(() => el.removeEventListener(ev, fn));
    };

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let ucST: ScrollTrigger | null = null;
    const scrollTo = (y: number) => lenis.scrollTo(y, { duration: 1.3 });
    api.current = {
      on: true,
      scrollTo,
      pickUc: (i) => {
        if (!ucST) return false;
        scrollTo(ucST.start + ((i + 0.5) / 6) * (ucST.end - ucST.start));
        return true;
      },
    };

    // In-page anchors go through Lenis so they ease like the rest of the page.
    on(document, "click", (e) => {
      const a = (e.target as Element).closest?.('a[href^="#"]');
      const id = a?.getAttribute("href");
      if (!id || id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      scrollTo(t.getBoundingClientRect().top + window.scrollY - 64);
    });

    const ctx = gsap.context(() => {
      const orb = $("[data-orb]");
      if (orb) gsap.set(orb, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.from("[data-hero-in]", { y: 28, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.2 });
      gsap.from("[data-word-in]", { yPercent: 110, rotate: 4, duration: 1.15, ease: "power4.out", stagger: 0.07 });
      gsap.from("[data-hero-frame]", { y: 80, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.4 });
      const frame = $("[data-hero-frame]");
      if (frame) {
        gsap.fromTo(frame, { rotateX: 14, scale: 0.93, transformPerspective: 1400, transformOrigin: "50% 0%" }, { rotateX: 0, scale: 1, ease: "none", scrollTrigger: { trigger: frame, start: "top 92%", end: "top 18%", scrub: 0.6 } });
        gsap.to("[data-blob]", { yPercent: 14, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
      }
      gsap.to("[data-blob]", { rotate: 12, scale: 1.12, xPercent: 4, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to("[data-orb]", { scale: 1.12, rotate: 30, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to("[data-live]", { opacity: 0.25, duration: 0.8, yoyo: true, repeat: -1 });
      gsap.to("[data-scroll-prog]", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

      // Nav hides on scroll down, returns on scroll up, gains a shadow once scrolled.
      const nav = $("[data-nav]");
      if (nav) {
        let hid = false, sh = false;
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const y = self.scroll(), h = self.direction === 1 && y > 480, s = y > 8;
            if (h !== hid) {
              hid = h;
              gsap.to(nav, { yPercent: h ? -100 : 0, duration: 0.5, ease: "power3.out" });
            }
            if (s !== sh) {
              sh = s;
              gsap.to(nav, { boxShadow: s ? "0 12px 30px -20px rgba(20,45,30,.3)" : "0 0px 0px 0px rgba(20,45,30,0)", duration: 0.3 });
            }
          },
        });
      }

      gsap.set("[data-reveal]", { y: 40, opacity: 0, filter: "blur(8px)" });
      ScrollTrigger.batch("[data-reveal]", { start: "top 90%", once: true, onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: 0.09, clearProps: "filter,transform" }) });
      const cta = $("[data-cta]");
      if (cta) gsap.fromTo(cta, { scale: 0.93 }, { scale: 1, ease: "none", scrollTrigger: { trigger: cta, start: "top bottom", end: "top 35%", scrub: 0.6 } });

      heroLoop(root);
      diagram(root);
      clips(root);
      const tweens = misc(root);
      hovers(root, on, tweens);
    }, root);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      // Feature cards stack: each sticks a little lower and shrinks as the next one arrives.
      const cards = gsap.utils.toArray<HTMLElement>("[data-stack]", root);
      cards.forEach((el, i) => {
        gsap.set(el, { position: "sticky", top: 84 + i * 20, transformOrigin: "50% 0%" });
        const next = cards[i + 1];
        if (next) gsap.to(el, { scale: 0.95, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: `top ${84 + (i + 1) * 20}px`, scrub: true } });
      });
    });
    mm.add("(min-width: 900px) and (min-height: 720px)", () => {
      // Use cases: pinned section, scroll position picks the case.
      const outer = $("[data-uc-outer]"), inner = $("[data-uc-sticky]"), fill = $("[data-uc-fill]"), n = 6;
      if (!outer || !inner) return;
      gsap.set(outer, { height: `${n * 55 + 100}vh` });
      gsap.set(inner, { position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 48, paddingBottom: 48 });
      gsap.set("[data-uc-track]", { display: "block" });
      let last = -1;
      ucST = ScrollTrigger.create({
        trigger: outer,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (fill) gsap.set(fill, { scaleX: self.progress });
          const i = Math.min(n - 1, Math.floor(self.progress * n));
          if (i !== last) setUcRef.current((last = i));
        },
      });
      return () => {
        ucST = null;
      };
    }, root);

    const refresh = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => {
      clearTimeout(refresh);
      offs.forEach((f) => f());
      ctx.revert();
      mm.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      api.current = { ...api.current, on: false, pickUc: () => false, scrollTo: (y) => window.scrollTo({ top: y, behavior: "smooth" }) };
    };
  }, [rootRef]);

  return api;
}

function countTo(tl: gsap.core.Timeline, el: HTMLElement, at: number, dur: number) {
  const d = el.dataset, o = { v: +(d.from ?? 0) };
  tl.fromTo(o, { v: +(d.from ?? 0) }, { v: +(d.to ?? d.hc ?? 0), duration: dur, ease: "power2.out", onUpdate: () => void (el.textContent = fmt(o.v, d.pre, d.suf)) }, at);
}

/** Hero product film: counters tick, bars grow, the feed scrolls and a cursor flips the Incidents AI toggle. */
function heroLoop(root: HTMLElement) {
  const mock = root.querySelector<HTMLElement>("[data-hmock]");
  if (!mock) return;
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
  mock.querySelectorAll<HTMLElement>("[data-hc]").forEach((el) => {
    const d = el.dataset, o = { v: +d.from! };
    tl.fromTo(o, { v: +d.from! }, { v: +d.hc!, duration: 7.6, ease: "none", onUpdate: () => void (el.textContent = fmt(o.v)) }, 0);
  });
  tl.fromTo(mock.querySelectorAll("[data-hbar]"), { scaleY: 0.08 }, { scaleY: (_i: number, el: HTMLElement) => +el.dataset.hbar!, duration: 1.4, ease: "power3.out", stagger: 0.05 }, 0);
  const feed = mock.querySelector("[data-feed]");
  if (feed) {
    tl.set(feed, { y: 0 }, 0);
    [1.2, 2.8, 4.4, 6].forEach((t, i) => tl.to(feed, { y: -44 * (i + 1), duration: 0.6, ease: "power3.inOut" }, t));
  }
  const cur = mock.querySelector<HTMLElement>("[data-cursor]"), tog = mock.querySelector<HTMLElement>('[data-htoggle="1"]');
  const knob = mock.querySelector('[data-hknob="1"]'), row = mock.querySelector('[data-hrow="1"]');
  if (cur && tog && tog.offsetParent) {
    let tx = tog.offsetWidth / 2 - 8, ty = tog.offsetHeight / 2 - 8;
    for (let el: HTMLElement | null = tog; el && el !== mock; el = el.offsetParent as HTMLElement | null) {
      tx += el.offsetLeft;
      ty += el.offsetTop;
    }
    tl.fromTo(cur, { left: mock.offsetWidth * 0.7, top: mock.offsetHeight * 0.82, opacity: 0 }, { opacity: 1, duration: 0.3 }, 2)
      .to(cur, { left: tx, top: ty, duration: 1.2, ease: "power2.inOut" }, 2.1)
      .to(cur, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, 3.3)
      .fromTo(tog, { backgroundColor: "#CBD6CC" }, { backgroundColor: "#3F8A64", duration: 0.2 }, 3.4)
      .fromTo(knob, { left: 2 }, { left: 12, duration: 0.25, ease: "back.out(2)" }, 3.4)
      .fromTo(row, { color: "#6E7C73" }, { color: "#16231C", duration: 0.2 }, 3.4)
      .to(cur, { opacity: 0, duration: 0.4 }, 4.2);
  }
  const toast = mock.querySelector("[data-toast]");
  tl.fromTo(toast, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 3.6)
    .to(toast, { y: 10, opacity: 0, duration: 0.4 }, 7.2)
    .to({}, { duration: 0.4 }, 7.6);
}

/** Problem → solution hub: scattered tools fly in, lines draw to EventOps, labels flip to modules. */
function diagram(root: HTMLElement) {
  const wrap = root.querySelector("[data-diagram]");
  if (!wrap) return;
  const paths = gsap.utils.toArray<SVGPathElement>("[data-hub-line]", root);
  paths.forEach((p) => {
    const L = p.getTotalLength();
    p.style.strokeDasharray = `${L}`;
    p.style.strokeDashoffset = `${L}`;
  });
  const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: "top 80%", end: "bottom 40%", scrub: 0.8 } });
  tl.from("[data-tool]", { x: (_i: number, el: HTMLElement) => +el.dataset.dx!, y: (_i: number, el: HTMLElement) => +el.dataset.dy!, rotate: (_i: number, el: HTMLElement) => +el.dataset.r!, duration: 1, ease: "none" }, 0)
    .from("[data-hub]", { scale: 0.4, opacity: 0, duration: 0.5 }, 0.55)
    .to(paths, { strokeDashoffset: 0, duration: 0.7, stagger: 0.04 }, 0.7)
    .to("[data-tool-a]", { opacity: 0, duration: 0.25 }, 1.1)
    .to("[data-tool-b]", { opacity: 1, duration: 0.25 }, 1.15)
    .to("[data-tool]", { backgroundColor: "#DCEEE2", color: "#16231C", duration: 0.25 }, 1.15)
    .to("[data-cap-a]", { opacity: 0.6, scale: 0.98, duration: 0.3 }, 1.1)
    .to("[data-cap-b]", { opacity: 1, duration: 0.3 }, 1.1);
  gsap.utils.toArray<SVGCircleElement>("[data-pulse]", root).forEach((c, i) => {
    const p = paths[i];
    if (!p) return;
    const L = p.getTotalLength(), o = { t: 0 };
    gsap.to(o, {
      t: 1, duration: 2.2, delay: i * 0.27, repeat: -1, repeatDelay: 0.8, ease: "power1.in",
      onUpdate: () => {
        const pt = p.getPointAtLength(o.t * L);
        c.setAttribute("cx", `${pt.x}`);
        c.setAttribute("cy", `${pt.y}`);
        c.style.opacity = tl.progress() > 0.85 && o.t < 0.9 ? "1" : "0";
      },
    });
  });
}

/** The four feature clips: 6-second loops that only play while on screen. */
function clips(root: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-clip]", root).forEach((clip) => {
    const type = clip.dataset.clip, q = (s: string) => clip.querySelectorAll(s);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true });
    tl.fromTo(q("[data-prog]"), { scaleX: 0 }, { scaleX: 1, duration: 6, ease: "none" }, 0);
    clip.querySelectorAll<HTMLElement>("[data-cc]").forEach((el) => countTo(tl, el, 1, 3));
    if (type === "reg") {
      tl.fromTo(q("[data-field]"), { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.3, duration: 0.45, ease: "power3.out" }, 0.1)
        .fromTo(q("[data-fill]"), { scaleX: 0.05 }, { scaleX: (_i: number, el: HTMLElement) => +el.dataset.fill!, duration: 2.6, ease: "power2.out", stagger: 0.2 }, 1.2)
        .to(q("[data-pub]"), { scale: 1.04, duration: 0.2, yoyo: true, repeat: 3 }, 4.2);
    } else if (type === "scan") {
      tl.fromTo(q("[data-inc]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.2)
        .fromTo(q("[data-att]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 1.2)
        .fromTo(q("[data-ok]"), { backgroundColor: "#E6ECE5" }, { backgroundColor: "#CFE6D6", duration: 0.35 }, 2.6)
        .fromTo(q("[data-ok-a]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 2.6)
        .fromTo(q("[data-ok-b]"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2.7)
        .fromTo(q("[data-badge]"), { scaleX: 0 }, { scaleX: 1, duration: 2, ease: "power1.inOut" }, 2.9);
    } else if (type === "agenda") {
      tl.fromTo(q("[data-sess]"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, stagger: 0.18, duration: 0.45, ease: "power3.out" }, 0.1)
        .fromTo(q("[data-conflict]"), { opacity: 0, left: "0%", boxShadow: "inset 0 0 0 1.5px #C9668E", backgroundColor: "#F4DCE6" }, { opacity: 1, duration: 0.35 }, 1.4)
        .to(q("[data-conflict]"), { x: 4, duration: 0.06, yoyo: true, repeat: 5 }, 1.9)
        .to(q("[data-conflict]"), { left: "33.333%", boxShadow: "inset 0 0 0 1px #DCEBDD", backgroundColor: "#E3F1E7", duration: 0.8, ease: "power3.inOut" }, 3.2)
        .fromTo(q("[data-resolve]"), { backgroundColor: "#F4DCE6" }, { backgroundColor: "#E3F1E7", duration: 0.3 }, 3.6)
        .fromTo(q("[data-res-a]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 3.6)
        .fromTo(q("[data-res-b]"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 3.7);
    } else if (type === "roi") {
      const p = clip.querySelector<SVGPathElement>("[data-line]")!, L = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 3, ease: "power2.inOut" }, 0.4)
        .fromTo(q("[data-chip]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 3.8);
    }
    ScrollTrigger.create({ trigger: clip, start: "top 85%", end: "bottom 10%", onToggle: (s) => void (s.isActive ? tl.play() : tl.pause()) });
  });
}

function misc(root: HTMLElement) {
  const steps = root.querySelector("[data-steps]");
  if (steps) {
    gsap.fromTo("[data-step-line]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 75%", end: "top 30%", scrub: 0.6 } });
    gsap.from("[data-step]", { y: 30, opacity: 0, stagger: 0.15, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: steps, start: "top 80%", once: true } });
  }
  const lm = root.querySelector("[data-logo-marq]");
  const logo = lm ? gsap.to(lm, { xPercent: -50, duration: 42, ease: "none", repeat: -1 }) : null;
  const m1 = root.querySelector("[data-marq]"), m2 = root.querySelector("[data-marq-rev]");
  const marq: gsap.core.Tween[] = [];
  if (m1) marq.push(gsap.to(m1, { xPercent: -50, duration: 50, ease: "none", repeat: -1 }));
  if (m2) marq.push(gsap.fromTo(m2, { xPercent: -50 }, { xPercent: 0, duration: 56, ease: "none", repeat: -1 }));
  root.querySelectorAll<HTMLElement>("[data-num]").forEach((el) => {
    const d = el.dataset, o = { v: 0 };
    gsap.to(o, { v: +d.to!, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%", once: true }, onUpdate: () => void (el.textContent = fmt(o.v, d.pre, d.suf, +(d.dec ?? 0))) });
  });
  return { logo, marq };
}

function hovers(root: HTMLElement, on: (el: EventTarget, ev: string, fn: EventListener) => void, { logo, marq }: ReturnType<typeof misc>) {
  const mouse = (fn: (e: MouseEvent) => void) => fn as EventListener;
  gsap.utils.toArray<HTMLElement>("[data-magnetic]", root).forEach((el) => {
    const xT = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }), yT = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const ar = el.querySelector("[data-arrow]");
    on(el, "mousemove", mouse((e) => {
      const r = el.getBoundingClientRect();
      xT((e.clientX - r.left - r.width / 2) * 0.28);
      yT((e.clientY - r.top - r.height / 2) * 0.35);
    }));
    on(el, "mouseenter", () => ar && gsap.to(ar, { x: 4, duration: 0.35, ease: "power3.out" }));
    on(el, "mouseleave", () => {
      xT(0);
      yT(0);
      if (ar) gsap.to(ar, { x: 0, duration: 0.35, ease: "power3.out" });
    });
  });
  gsap.utils.toArray<HTMLElement>("[data-tilt]", root).forEach((el) => {
    if (el.parentElement) el.parentElement.style.perspective = "1200px";
    const rx = gsap.quickTo(el, "rotateX", { duration: 0.6, ease: "power3.out" }), ry = gsap.quickTo(el, "rotateY", { duration: 0.6, ease: "power3.out" });
    on(el, "mousemove", mouse((e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 6);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
    }));
    on(el, "mouseleave", () => (rx(0), ry(0)));
  });
  gsap.utils.toArray<HTMLElement>("[data-spot]", root).forEach((el) => {
    const glow = el.querySelector<HTMLElement>("[data-spot-glow]");
    on(el, "mousemove", mouse((e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
    on(el, "mouseenter", () => glow && (glow.style.opacity = "1"));
    on(el, "mouseleave", () => glow && (glow.style.opacity = "0"));
  });
  const cta = root.querySelector("[data-cta]"), orb = root.querySelector("[data-orb]");
  if (cta && orb) {
    const ox = gsap.quickTo(orb, "x", { duration: 1.4, ease: "power3.out" }), oy = gsap.quickTo(orb, "y", { duration: 1.4, ease: "power3.out" });
    on(cta, "mousemove", mouse((e) => {
      const r = cta.getBoundingClientRect();
      ox((e.clientX - r.left - r.width / 2) * 0.35);
      oy((e.clientY - r.top - r.height / 2) * 0.35);
    }));
    on(cta, "mouseleave", () => (ox(0), oy(0)));
  }
  const lw = root.querySelector("[data-logo-wrap]");
  if (lw && logo) {
    on(lw, "mouseenter", () => gsap.to(logo, { timeScale: 0.15, duration: 0.6 }));
    on(lw, "mouseleave", () => gsap.to(logo, { timeScale: 1, duration: 0.6 }));
  }
  // Integration marquees pause on hover and speed up with scroll velocity.
  const wrap = root.querySelector("[data-marq-wrap]");
  let hover = false, timer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => marq.forEach((t) => gsap.to(t, { timeScale: hover ? 0 : 1, duration: 0.8, overwrite: true }));
  if (wrap) {
    on(wrap, "mouseenter", () => ((hover = true), settle()));
    on(wrap, "mouseleave", () => ((hover = false), settle()));
  }
  if (marq.length)
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (hover) return;
        const ts = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 5);
        marq.forEach((t) => gsap.to(t, { timeScale: ts, duration: 0.25, overwrite: true }));
        clearTimeout(timer);
        timer = setTimeout(settle, 150);
      },
    });
}

/** Small tweens that play when landing-page state changes (skipped when motion is off). */
export const swapIn = {
  useCase: () => {
    gsap.fromTo("[data-uc-media]", { scale: 1.06, opacity: 0.35 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power3.out" });
    gsap.fromTo("[data-uc-body] > *", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: "power3.out" });
  },
  category: () => gsap.fromTo("[data-mod]", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power3.out", clearProps: "transform" }),
  faq: () => {
    const el = document.querySelector("[data-faq-a]");
    if (el) gsap.from(el, { height: 0, opacity: 0, duration: 0.45, ease: "power3.out", clearProps: "height" });
    setTimeout(() => ScrollTrigger.refresh(), 60);
  },
  price: () => gsap.fromTo("[data-price]", { yPercent: -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" }),
  refresh: () => setTimeout(() => ScrollTrigger.refresh(), 60),
};
