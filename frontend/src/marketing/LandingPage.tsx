import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { isLoggedIn } from "../services/authApi";
import { BRANDS } from "../components/brands";
import { Dot, Mark, Wordmark } from "./ui";
import { eyebrow, h2, lede, muted, pad, pillDark, pillLight, wrap } from "./lib";
import { CompareTable, DemoPage, FeaturePage, PricingPage } from "./FeaturePage";
import { swapIn, useLandingMotion } from "./landingMotion";
import {
  AFTER_MODS, AI_STAGES, FEATURES, BEFORE_TOOLS, CAP_TIER, CATS, CERTS, COMPARE, DEFAULT_STACK, FAQS, FEED, FOOTER, HERO_BARS, HERO_MODULES,
  INT_FEATS, INT_ROWS, LOGO_ROW, METRICS, QUOTES, REG_FIELDS, SECURITY, SESSIONS, STEPS, TIER_CARDS, TIERS, TOOLS, USE_CASES,
  WORKSTREAMS, planFor, priceLabel, type Billing, type FeatureId,
} from "./landingData";

// v2 landing (claude.ai/design "EventOps Landing v2"). Motion lives in landingMotion.ts and attaches via data-* hooks.

const card = "rounded-[22px] bg-surface";
const navLink =
  "bg-[linear-gradient(#16231C,#16231C)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] pb-0.5 text-ink-2 transition-[background-size,color] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:bg-[length:100%_1px] hover:text-ink";
const Glow = () => (
  <div
    data-spot-glow
    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-[400ms] [background:radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,50%),rgba(63,138,100,.10),transparent_65%)]"
  />
);
const SectionHead = ({ kicker, title, sub, body }: { kicker: ReactNode; title: string; sub: string; body?: string }) => (
  <div className="mb-14 grid items-end gap-x-16 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
    <div data-reveal>
      <div className={`${eyebrow} mb-[18px] flex items-center gap-2`}>{kicker}</div>
      <h2 className={h2}>
        {title}
        <br />
        <span className={muted}>{sub}</span>
      </h2>
    </div>
    {body && <p data-reveal className={lede}>{body}</p>}
  </div>
);


export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const page = pathname.slice(1) || "home";
  const pricingRef = useRef<HTMLElement>(null);
  const [cat, setCat] = useState(0);
  const [sel, setSel] = useState<Set<string>>(() => new Set(DEFAULT_STACK));
  const [billing, setBilling] = useState<Billing>("annual");
  const [count, setCount] = useState(18);
  const [uc, setUc] = useState(0);
  const [faq, setFaq] = useState(0);
  const motion = useLandingMotion(root, setUc);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = page === "demo" ? "Book a demo" : page === "pricing" ? "Pricing" : FEATURES[page as FeatureId]?.nav;
    document.title = t ? `${t} · EventOps` : "EventOps: AI-assisted event operations";
  }, [page]);

  // Small swap-in tweens on state changes. The first run (mount) is skipped.
  const first = useRef(true);
  useEffect(() => void (motion.current.on && !first.current && swapIn.useCase()), [uc, motion]);
  useEffect(() => void (motion.current.on && !first.current && swapIn.category()), [cat, motion]);
  useEffect(() => void (motion.current.on && !first.current && swapIn.faq()), [faq, motion]);
  useEffect(() => void (motion.current.on && !first.current && swapIn.price()), [billing, motion]);
  useEffect(() => void (first.current = false), []);

  const selNames = [...sel];
  const stackTier = planFor(selNames.length, Math.max(0, ...selNames.map((n) => CAP_TIER[n] ?? 0)));
  const byCount = planFor(selNames.length);
  const activeTier = planFor(count);
  const toggle = (name: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (!n.delete(name)) n.add(name);
      return n;
    });
  const seePlan = () => {
    setCount(Math.max(1, selNames.length));
    const el = pricingRef.current;
    if (el) motion.current.scrollTo(el.getBoundingClientRect().top + window.scrollY - 60);
  };
  const pickUc = (i: number) => motion.current.pickUc(i) || setUc(i);
  const useCase = USE_CASES[uc];

  return (
    <div ref={root} className="min-h-[100dvh] overflow-x-clip bg-paper font-sans text-ink antialiased">
      <a href="#main" className="sr-only z-[200] rounded-full bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <div data-scroll-prog className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left scale-x-0 bg-live" />

      <div className="flex flex-wrap items-center justify-center gap-3 bg-ink px-5 py-[9px] text-center text-[13px] text-paper">
        <span className="font-mono text-[11px] tracking-[.06em] text-ai">NEW</span>
        <span>EventOps AI now works across every stage — plan, staff, source, run and debrief.</span>
        <a href={page === "home" ? "#ai" : "/#ai"} className="border-b border-[#4C5E53] !text-paper">See how →</a>
      </div>

      {/* 1. NAV */}
      <nav data-nav className="sticky top-0 z-50 border-b border-line bg-[rgba(245,244,241,.82)] backdrop-blur-[14px]">
        <div className={`${wrap} flex h-[60px] items-center justify-between gap-6`}>
          <div className="flex items-center gap-10">
            <Link to="/" aria-label="EventOps home"><Wordmark /></Link>
            <div className="hidden gap-[26px] text-sm min-[900px]:flex">
              {[["Platform", "#platform"], ["Product", "/product"], ["AI", "/ai"], ["Use cases", "/use-cases"], ["Pricing", "/pricing"], ["Customers", "#customers"]].map(([l, h]) =>
                h.startsWith("/") ? (
                  <Link key={h} to={h} className={`${navLink} ${pathname === h ? "!bg-[length:100%_1px] !text-ink" : ""}`}>{l}</Link>
                ) : (
                  <a key={h} href={page === "home" ? h : `/${h}`} className={navLink}>{l}</a>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {loggedIn ? (
              <Link to="/events" className="hidden px-3 py-2 text-ink-2 min-[900px]:block">Open app</Link>
            ) : (
              <Link to="/login" className="hidden px-3 py-2 text-ink-2 min-[900px]:block">Log in</Link>
            )}
            <Link to="/demo" className={`${pillLight} px-3.5 py-2`}>Book a demo</Link>
            <Link data-magnetic to="/signup" className={`${pillDark} px-[15px] py-[9px]`}>Start free</Link>
          </div>
        </div>
      </nav>

      <main id="main">
        {page === "demo" ? <DemoPage /> : page === "pricing" ? <PricingPage /> : page in FEATURES ? <FeaturePage id={page as FeatureId} /> : <>
        {/* 2. HERO */}
        <header id="top" className={`${wrap} pt-[clamp(56px,9vw,112px)]`}>
          <div className="grid items-end gap-x-16 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
            <div>
              <div data-hero-in className="mb-7 inline-flex items-center gap-2 font-mono text-xs tracking-[.04em] text-[#56645B]">
                <Dot c="bg-[#8A75D1]" />AI-ASSISTED EVENT OPERATIONS
              </div>
              <h1 className="m-0 text-[clamp(44px,6.6vw,88px)] leading-[.98] font-medium tracking-[-0.045em] text-balance">
                {"Run every event from one platform.".split(" ").map((w, i) => (
                  <span key={i}>
                    <span className="-mb-[.1em] inline-block overflow-hidden pb-[.1em] align-top">
                      <span data-word-in className="inline-block">{w}</span>
                    </span>{" "}
                  </span>
                ))}
              </h1>
            </div>
            <div className="pb-2">
              <p data-hero-in className="m-0 mb-7 max-w-[480px] text-lg leading-normal text-pretty text-[#56645B]">
                Events, tasks, schedules, staff, vendors, incidents and floor plans in one workspace — with an AI copilot at every stage that spots problems early and drafts the fix for you to approve.
              </p>
              <div data-hero-in className="flex flex-wrap items-center gap-2.5">
                <Link data-magnetic to="/signup" className={`${pillDark} px-5 py-[13px] text-[15px]`}>
                  Start free <span data-arrow className="inline-block">→</span>
                </Link>
                <Link data-magnetic to="/demo" className={`${pillLight} px-5 py-3 text-[15px]`}>Book a demo</Link>
              </div>
              <div data-hero-in className="mt-[18px] font-mono text-[11.5px] tracking-[.02em] text-ink-3">AI INCLUDED ON EVERY PLAN · NO CARD REQUIRED</div>
            </div>
          </div>
          <HeroFilm />
        </header>

        {/* 3. SOCIAL PROOF */}
        <section id="customers" className="pt-[clamp(96px,11vw,144px)] pb-[clamp(56px,7vw,96px)]">
          <div data-reveal className={`${wrap} mb-9`}>
            <div className={eyebrow}>EVENTS RUN ON EVENTOPS IN 2026</div>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span data-num data-to="38400" className="text-[clamp(40px,5vw,60px)] font-medium tracking-[-0.05em] tabular-nums">38,400</span>
              <span className="text-[15px] text-[#56645B]">by 2,100 teams, from 40-person offsites to 90,000-attendee expos.</span>
            </div>
          </div>
          <div data-logo-wrap className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div data-logo-marq className="flex w-max gap-3">
              {LOGO_ROW.map(([n, cls], i) => (
                <div key={i} aria-hidden={i >= LOGO_ROW.length / 2} className={`grid h-20 min-w-[200px] flex-none place-items-center rounded-[18px] bg-surface px-9 text-ink-2 transition-colors duration-[350ms] hover:bg-accent-soft hover:text-accent ${cls}`}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PROBLEM → SOLUTION */}
        <section id="platform">
          <div className={`${wrap} ${pad}`}>
            <div className="grid items-end gap-x-16 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
              <div data-reveal>
                <div className={`${eyebrow} mb-[18px]`}>WHY EVENTOPS</div>
                <h2 className={h2}>Eight tools. Eight logins.<br /><span className={muted}>One run-of-show.</span></h2>
              </div>
              <p data-reveal className={lede}>
                Most event teams run on spreadsheets, group chats, email threads with vendors and a whiteboard floor plan — and find out about a delay when it's already a problem. EventOps puts tasks, schedule, staff, vendors, incidents and floor plan in one place, so the AI can see how one late AV check ripples into the keynote.
              </p>
            </div>
            <HubDiagram />
            <div className="mt-14 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
              <div data-cap-a className="flex flex-col gap-5 rounded-[22px] bg-[#E8EEE7] p-[clamp(22px,2.6vw,32px)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] tracking-[.06em] text-ink-3">BEFORE</span>
                  <span className="rounded-full bg-danger-soft px-[11px] py-[5px] text-xs text-danger">Problems found too late</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[clamp(44px,5vw,64px)] leading-none font-medium tracking-[-0.05em] text-[#56645B]">8</span>
                  <span className="text-lg tracking-[-0.01em] text-[#56645B]">tools · 8 logins · 8 sources of truth</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BEFORE_TOOLS.map((p) => (
                    <span key={p} className="rounded-full bg-[#DEE6DD] px-[11px] py-1.5 text-[12.5px] text-ink-3 line-through decoration-[rgba(110,124,115,.55)]">{p}</span>
                  ))}
                </div>
              </div>
              <div data-cap-b className="flex flex-col gap-5 rounded-[22px] bg-[#DCEEE2] p-[clamp(22px,2.6vw,32px)] motion-safe:opacity-45">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] tracking-[.06em] text-accent">WITH EVENTOPS</span>
                  <span className="inline-flex items-center gap-[7px] rounded-full bg-surface px-[11px] py-[5px] text-xs text-ai-ink"><Dot c="bg-[#8A75D1]" />AI watching every dependency</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[clamp(44px,5vw,64px)] leading-none font-medium tracking-[-0.05em]">1</span>
                  <span className="text-lg tracking-[-0.01em] text-[#1F3A2B]">workspace · one live run-of-show</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AFTER_MODS.map((p) => (
                    <span key={p} className="rounded-full bg-surface px-[11px] py-1.5 text-[12.5px]">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI AT EVERY STAGE */}
        <section id="ai">
          <div className={`${wrap} ${pad}`}>
            <SectionHead
              kicker={<><Dot c="bg-[#8A75D1]" />AI-ASSISTED AT EVERY STAGE</>}
              title="A copilot from brief"
              sub="to debrief."
              body="EventOps AI sees your tasks, schedule, staff, vendors, incidents and floor plan together. At each stage it does the legwork and hands you a decision — it suggests, you approve. Nothing is sent or changed without a click."
            />
            <div data-reveal className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
              {AI_STAGES.map((a) => (
                <div key={a.n} data-spot className={`${card} relative flex min-h-[250px] flex-col gap-4 overflow-hidden p-[22px] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-[0_28px_56px_-36px_rgba(20,45,30,.4)]`}>
                  <Glow />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-[38px] place-items-center rounded-xl bg-[#DCEEE2] font-mono text-xs text-[#1F5A3F]">{a.n}</span>
                      <span className="text-lg font-medium tracking-[-0.02em]">{a.stage}</span>
                    </div>
                    <span className="text-right text-xs text-ink-3">{a.where}</span>
                  </div>
                  <div className="relative flex flex-col gap-[7px] rounded-2xl bg-[#F2F6F1] px-4 py-3.5">
                    <div className="flex items-center gap-[7px] font-mono text-[10.5px] tracking-[.06em] text-accent"><Dot c="bg-[#8A75D1]" />AI SUGGESTS</div>
                    <div className="text-[15px] leading-[1.45] text-pretty">{a.does}</div>
                  </div>
                  <div className="relative mt-auto flex items-center justify-between gap-3">
                    <span className="font-mono text-[10.5px] tracking-[.06em] text-[#6E7C73]">YOU</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#DCEEE2] px-3.5 py-2 text-[13px] font-medium text-[#1F5A3F]"><span className="text-[11px]">✓</span>{a.you}</span>
                  </div>
                </div>
              ))}
            </div>
            <div data-reveal className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
              {[
                ["SUGGESTS, NEVER SENDS", "Every reassignment, vendor request and attendee notice waits for a human click."],
                ["SHOWS ITS WORK", "Ask “why?” on any suggestion and see the tasks, people and timings behind it."],
                ["GETS BETTER EACH EVENT", "Debrief lessons feed the next plan — the jammed printer gets a backup this time."],
              ].map(([k, d]) => (
                <div key={k} className="rounded-[22px] bg-[#E4EEE6] p-[22px]">
                  <div className="font-mono text-[11px] tracking-[.06em] text-accent">{k}</div>
                  <div className="mt-2 text-[14.5px] leading-normal text-[#2B3830]">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. MODULE EXPLORER */}
        <section id="modules">
          <div className={`${wrap} ${pad}`}>
            <SectionHead
              kicker="MODULE EXPLORER"
              title="Seven workspaces."
              sub="AI in every one."
              body="Everything your ops team touches on the day, in one place. Pick the capabilities your next event needs and we'll tell you which plan covers them."
            />
            <div data-reveal className="grid overflow-hidden rounded-2xl bg-surface [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              <div className="bg-[#EEF3ED] p-3" role="tablist" aria-label="Workspaces">
                {CATS.map((c, i) => (
                  <button
                    key={c.n}
                    type="button"
                    role="tab"
                    aria-selected={i === cat}
                    onClick={() => setCat(i)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-[11px] text-sm hover:bg-sunken ${i === cat ? "bg-surface text-ink" : "text-[#56645B]"}`}
                  >
                    <span>{c.n}</span>
                    <span className={`font-mono text-[11px] ${muted}`}>{c.m.length}</span>
                  </button>
                ))}
              </div>
              <div className="min-w-0 p-5 md:col-span-2" role="tabpanel">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                  <div className="text-lg font-medium tracking-[-0.02em]">{CATS[cat].n}</div>
                  <div className={`font-mono text-[11px] ${muted}`}>{CATS[cat].m.length} CAPABILITIES · CLICK TO ADD</div>
                </div>
                <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                  {CATS[cat].m.map(([name, desc, tier]) => {
                    const on = sel.has(name);
                    return (
                      <button
                        key={name}
                        data-mod
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(name)}
                        className={`flex min-h-32 cursor-pointer flex-col gap-2.5 rounded-xl p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${on ? "bg-accent-soft" : "bg-[#F4F7F3]"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-surface px-[7px] py-0.5 font-mono text-[10px] tracking-[.04em] text-[#56645B]">{TIERS[tier].toUpperCase()}+</span>
                          <span className={`grid size-[18px] place-items-center rounded-[5px] text-[11px] text-paper ring-1 ring-line ${on ? "bg-ink" : "bg-surface"}`}>{on ? "✓" : ""}</span>
                        </div>
                        <div className="text-[15px] font-medium tracking-[-0.01em]">{name}</div>
                        <div className="text-[13px] leading-[1.45] text-ink-3">{desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-4 bg-[#EEF3ED] p-5">
                <div>
                  <div className="font-mono text-[11px] tracking-[.04em] text-ink-3">YOUR STACK</div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-[44px] font-medium tracking-[-0.05em]">{selNames.length}</span>
                    <span className="text-sm text-ink-3">modules</span>
                  </div>
                </div>
                <div className="flex max-h-[180px] flex-wrap gap-1.5 overflow-auto">
                  {selNames.map((n) => (
                    <button key={n} type="button" onClick={() => toggle(n)} aria-label={`Remove ${n}`} className="cursor-pointer rounded-full bg-surface px-[9px] py-[5px] text-xs ring-1 ring-transparent hover:ring-ink">
                      {n} ×
                    </button>
                  ))}
                </div>
                <div className="mt-auto border-t border-line pt-4" aria-live="polite">
                  <div className="text-[13px] text-ink-3">Recommended plan</div>
                  <div className="mt-1 text-[22px] font-medium tracking-[-0.02em]">
                    {TIERS[stackTier]}{" "}
                    <span className="text-sm font-normal text-ink-3">
                      {stackTier === 3 ? "custom pricing" : stackTier === 0 ? "free" : `${priceLabel(stackTier, billing)} / mo`}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs leading-[1.4] ${muted}`}>
                    {stackTier > byCount
                      ? `Needed because one module you picked starts on ${TIERS[stackTier]}.`
                      : `Covers up to ${["5", "25", "60", "102"][stackTier]} modules. Swap any time.`}
                  </div>
                  <button type="button" onClick={seePlan} className={`${pillDark} mt-3.5 w-full cursor-pointer justify-center px-3.5 py-[11px] text-sm`}>
                    See pricing for this stack →
                  </button>
                  <Link to="/product" className="mt-2.5 block text-center text-sm text-ink-2 hover:text-ink">Learn more about each workspace →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FEATURE DEEP-DIVES */}
        <section>
          <div className={`${wrap} ${pad} flex flex-col gap-[clamp(72px,10vw,128px)]`}>
            <div data-reveal className="max-w-[720px]">
              <div className={`${eyebrow} mb-[18px]`}>IN THE PRODUCT</div>
              <h2 className={h2}>Four moments every event has.<br /><span className={muted}>AI on every one.</span></h2>
            </div>
            <Features />
          </div>
        </section>

        {/* 7. HOW IT WORKS */}
        <section>
          <div className={`${wrap} ${pad}`}>
            <div data-reveal className="mb-14">
              <div className={`${eyebrow} mb-[18px]`}>HOW IT WORKS</div>
              <h2 className={h2}>Start small.<br /><span className={muted}>Grow without migrating.</span></h2>
            </div>
            <div data-steps className="relative">
              <div className="absolute inset-x-0 top-[15px] h-px bg-line" />
              <div data-step-line className="absolute inset-x-0 top-[15px] h-px origin-left bg-ink" />
              <div className="relative grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
                {STEPS.map((s) => (
                  <div key={s.n} data-step>
                    <div className="grid size-[31px] place-items-center rounded-full border border-ink bg-paper font-mono text-[11px]">{s.n}</div>
                    <h3 className="mt-7 mb-2.5 text-2xl font-medium tracking-[-0.03em]">{s.t}</h3>
                    <p className="m-0 max-w-[340px] text-[15px] leading-[1.6] text-[#56645B]">{s.d}</p>
                    <div className="mt-6 flex flex-col gap-2 rounded-xl bg-surface p-3.5 text-[12.5px]">
                      {s.rows.map(([a, b, c]) => (
                        <div key={a} className="flex items-center justify-between border-b border-line-soft py-1.5">
                          <span>{a}</span>
                          <span className={`font-mono text-[10.5px] ${c}`}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. USE CASES (dark) */}
        <section id="use-cases" data-uc-outer className="bg-ink text-paper">
          <div data-uc-sticky className={`${wrap} ${pad}`}>
            <div className="mb-10 flex items-center justify-between gap-6">
              <div className="font-mono text-xs tracking-[.04em] text-[#AFBDB4]">USE CASES BY EVENT TYPE</div>
              <div data-uc-track className="hidden flex-[0_1_320px]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#AFBDB4] tabular-nums">0{uc + 1} / 06</span>
                  <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-[#2E3E35]">
                    <div data-uc-fill className="h-full origin-left scale-x-0 bg-live" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid items-start gap-x-[72px] gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
              <div className="flex flex-col">
                {USE_CASES.map((u, i) => (
                  <button
                    key={u.name}
                    type="button"
                    aria-pressed={i === uc}
                    onClick={() => pickUc(i)}
                    className={`flex cursor-pointer items-baseline gap-4 py-1.5 text-left leading-[1.1] tracking-[-0.04em] transition-[font-size,color] duration-[550ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:text-paper ${i === uc ? "text-[clamp(36px,4.8vw,64px)] font-medium text-paper" : "text-[clamp(22px,2.6vw,34px)] text-[#7F8E85]"}`}
                  >
                    <span className={`font-mono text-xs tracking-normal transition-colors ${i === uc ? "text-[#A9D8BC]" : "text-ink-3"}`}>0{i + 1}</span>
                    {u.name}
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-[18px] bg-[#1F2F26]" aria-live="polite">
                <div data-uc-media className="relative grid aspect-video place-items-center bg-[repeating-linear-gradient(135deg,#24352C_0_10px,#203028_10px_20px)]">
                  <span className="font-mono text-[11px] tracking-[.04em] text-ink-3">{useCase.photo}</span>
                  <div className="absolute bottom-4 left-4 rounded-xl bg-surface px-3.5 py-3 text-ink">
                    <div className="text-[26px] font-medium tracking-[-0.04em]">{useCase.metric}</div>
                    <div className="text-xs text-[#56645B]">{useCase.metricLabel}</div>
                  </div>
                </div>
                <div data-uc-body className="p-6">
                  <h3 className="m-0 mb-2.5 text-[22px] font-medium tracking-[-0.02em]">{useCase.head}</h3>
                  <p className="m-0 text-[15px] leading-[1.6] text-[#C3CFC7]">{useCase.desc}</p>
                  <div className="mt-5 mb-2.5 font-mono text-[11px] tracking-[.04em] text-[#AFBDB4]">TYPICAL STACK</div>
                  <div className="flex flex-wrap gap-1.5">
                    {useCase.stack.map((m) => (
                      <span key={m} className="rounded-full bg-[#2A3B31] px-2.5 py-1.5 text-[12.5px] text-[#E4ECE6]">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. INTEGRATIONS */}
        <section>
          <div className="mx-auto max-w-[1280px] py-[clamp(56px,7vw,96px)]">
            <div className="px-[clamp(20px,4vw,40px)]">
              <SectionHead
                kicker="INTEGRATIONS"
                title="Plugs into the stack"
                sub="you're keeping."
                body="120+ native integrations sync attendees, leads and revenue both ways. Anything else connects through the open API, webhooks or Zapier."
              />
            </div>
            <div data-marq-wrap className="flex flex-col gap-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
              {INT_ROWS.map((row, r) => (
                <div key={r} {...(r ? { "data-marq-rev": "" } : { "data-marq": "" })} className="flex w-max gap-3">
                  {row.map(([n, c, k], i) => (
                    <div key={i} aria-hidden={i >= row.length / 2} className="flex items-center gap-3 rounded-xl bg-surface px-5 py-3.5 whitespace-nowrap ring-1 ring-transparent transition-[transform,box-shadow] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:shadow-[0_14px_28px_-18px_rgba(20,45,30,.35)] hover:ring-ink">
                      <span className="grid size-[26px] place-items-center rounded-[7px] bg-[#E4EEE6] text-[11px] font-semibold">
                        {BRANDS[n] ? createElement(BRANDS[n].Icon, { size: 16, color: BRANDS[n].color, "aria-hidden": true }) : k}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{n}</div>
                        <div className={`text-[11.5px] ${muted}`}>{c}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-14 grid gap-5 px-[clamp(20px,4vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
              <div data-reveal className="overflow-auto rounded-2xl bg-ink p-5 font-mono text-[12.5px] leading-[1.75] text-[#DCE6DE]">
                <div className="mb-3 flex justify-between text-[11px] text-ink-3"><span>POST /v2/webhooks</span><span>attendee.checked_in</span></div>
                <div className="text-[#95A39A]">{"{"}</div>
                <div className="pl-4"><K>"event"</K>: <V>"lisbon-summit-26"</V>,</div>
                <div className="pl-4"><K>"attendee"</K>: {"{"} <K>"id"</K>: <V>"att_2291"</V>, <K>"tier"</K>: <V>"all-access"</V> {"}"},</div>
                <div className="pl-4"><K>"modules"</K>: [<V>"check-in"</V>, <V>"badging"</V>, <V>"lead-capture"</V>],</div>
                <div className="pl-4"><K>"crm_sync"</K>: {"{"} <K>"salesforce"</K>: <V>"queued"</V> {"}"}</div>
                <div className="text-[#95A39A]">{"}"}</div>
              </div>
              <div data-reveal className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
                {INT_FEATS.map((f) => (
                  <div key={f.t} className="flex min-h-[190px] flex-col gap-[18px] rounded-[20px] bg-surface p-[22px] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-[0_28px_56px_-36px_rgba(20,45,30,.4)]">
                    <div className="flex items-center justify-between gap-2.5">
                      <span className={`grid size-[42px] place-items-center rounded-[13px] font-mono text-[15px] font-medium ${f.cls}`}>{f.g}</span>
                      <span className="rounded-full bg-[#F2F6F1] px-[9px] py-[5px] font-mono text-[10.5px] tracking-[.04em] text-[#56645B]">{f.meta}</span>
                    </div>
                    <div className="mt-auto">
                      <div className="text-[16.5px] font-medium tracking-[-0.015em]">{f.t}</div>
                      <div className="mt-1.5 text-[13.5px] leading-normal text-pretty text-ink-3">{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 10. PRICING */}
        <section id="pricing" ref={pricingRef}>
          <div className={`${wrap} ${pad}`}>
            <div data-reveal className="mx-auto mb-14 max-w-[720px] text-center">
              <div className={`${eyebrow} mb-[18px]`}>PRICING</div>
              <h2 className={h2}>Start free.<br /><span className={muted}>Pay for the modules you use.</span></h2>
            </div>

            <div data-reveal className="mb-5 rounded-2xl bg-surface px-[clamp(18px,3vw,32px)] py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label htmlFor="mod-count" className="flex items-baseline gap-2.5">
                  <span className="text-[15px] text-[#56645B]">I need</span>
                  <span className="text-[34px] font-medium tracking-[-0.04em] tabular-nums">{count}</span>
                  <span className="text-[15px] text-[#56645B]">modules</span>
                </label>
                <div className="flex rounded-full bg-line-soft p-[3px] text-[13px]" role="group" aria-label="Billing cycle">
                  {(["monthly", "annual"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={billing === b}
                      onClick={() => setBilling(b)}
                      className={`cursor-pointer rounded-full px-3.5 py-[7px] ${billing === b ? "bg-surface shadow-[0_1px_2px_rgba(0,0,0,.08)]" : ""}`}
                    >
                      {b === "monthly" ? "Monthly" : <>Annual <span className="text-accent">−18%</span></>}
                    </button>
                  ))}
                </div>
              </div>
              <input id="mod-count" type="range" min={1} max={102} value={count} onChange={(e) => setCount(+e.target.value)} className="mt-[22px] mb-1.5 w-full accent-ink" />
              <div className={`relative h-[18px] font-mono text-[10.5px] ${muted}`} aria-hidden="true">
                <span className="absolute left-0">1</span>
                <span className="absolute left-[4%] hidden -translate-x-1/2 sm:inline">5 · STARTER</span>
                <span className="absolute left-[23.8%] -translate-x-1/2">25 · GROWTH</span>
                <span className="absolute left-[58.4%] -translate-x-1/2">60 · SCALE</span>
                <span className="absolute right-0">102 · ENTERPRISE</span>
              </div>
            </div>

            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              {TIER_CARDS.map((t, i) => {
                const a = i === activeTier;
                return (
                  <div
                    key={t.name}
                    data-reveal
                    className={`relative flex flex-col gap-4 rounded-2xl p-[22px] transition-[background-color,transform,box-shadow] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-34px_rgba(20,45,30,.4)] ${a ? "bg-ink text-paper" : "bg-surface text-ink"}`}
                  >
                    <div className="flex min-h-[22px] items-center justify-between">
                      <span className="text-base font-medium">{t.name}</span>
                      {a && <span className="rounded-full bg-[#CFE6D6] px-2 py-[3px] font-mono text-[10px] tracking-[.04em] text-ink">FITS YOUR STACK</span>}
                    </div>
                    <div>
                      <span data-price className="inline-block text-[40px] font-medium tracking-[-0.05em]">{priceLabel(i, billing)}</span>
                      <span className="text-[13px] opacity-70"> {i === 0 ? "forever" : i === 3 ? "" : billing === "annual" ? "/ mo, billed yearly" : "/ mo"}</span>
                    </div>
                    <div className="min-h-10 text-[13.5px] leading-normal opacity-75">{t.desc}</div>
                    <Link
                      to={t.to}
                      className={`rounded-full px-3.5 py-[11px] text-center text-sm ring-1 ${a ? "bg-paper !text-ink ring-paper" : i === 3 ? "bg-surface text-ink ring-line-strong" : "bg-ink !text-paper ring-ink"}`}
                    >
                      {t.cta}
                    </Link>
                    <div className={`flex flex-col gap-[9px] border-t pt-4 text-[13.5px] ${a ? "border-[#2E3E35]" : "border-line-soft"}`}>
                      {t.feats.map((f) => (
                        <div key={f} className="flex gap-[9px]"><span className="text-live">✓</span><span>{f}</span></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div data-reveal className="mt-5 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-[#E4EEE6] px-[clamp(18px,3vw,28px)] py-[22px]">
              <div>
                <div className="text-lg font-medium tracking-[-0.02em]">Running 50+ events a year or need custom modules?</div>
                <div className="mt-1 text-sm text-[#56645B]">Enterprise includes volume pricing, SSO/SCIM, data residency, a 99.99% SLA and onsite support.</div>
              </div>
              <Link data-magnetic to="/demo" className={`${pillDark} px-[18px] py-[11px] text-sm whitespace-nowrap`}>Talk to sales →</Link>
            </div>

            <div className="mt-16">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="m-0 text-2xl font-medium tracking-[-0.03em]">Compare plans</h3>
                <Link to="/pricing" className={`${pillLight} px-3.5 py-2 text-sm`}>See the full breakdown →</Link>
              </div>
              <CompareTable groups={COMPARE.slice(0, 1)} active={activeTier} />
            </div>
          </div>
        </section>

        {/* 11. TESTIMONIALS */}
        <section>
          <div className={`${wrap} ${pad}`}>
            <blockquote data-reveal className="mx-auto mb-[72px] max-w-[900px] text-center">
              <p className="m-0 text-[clamp(24px,3vw,36px)] leading-tight tracking-[-0.03em] text-balance">
                “We replaced eleven tools with EventOps in one quarter. Check-in lines disappeared, sponsors got reports the same night, and my team finally works on the event instead of the spreadsheet.”
              </p>
              <footer className="mt-6 text-sm text-ink-3">Priya Raman, VP Global Events · Halcyon</footer>
            </blockquote>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
              {QUOTES.map((q) => (
                <figure key={q.n} data-reveal data-spot className="relative m-0 flex flex-col gap-5 rounded-2xl bg-surface p-6">
                  <Glow />
                  <div className="text-[clamp(36px,4vw,48px)] font-medium tracking-[-0.05em]">{q.m}</div>
                  <div className="-mt-3.5 text-[13px] text-ink-3">{q.ml}</div>
                  <blockquote className="m-0 flex-1 text-[15px] leading-[1.55] text-[#2B3830]">“{q.q}”</blockquote>
                  <figcaption className="flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-[34px] place-items-center rounded-full bg-[#E4EEE6] text-[11px]">{q.i}</span>
                      <div>
                        <div className="text-[13.5px] font-medium">{q.n}</div>
                        <div className={`text-xs ${muted}`}>{q.r}</div>
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-16 border-t border-line">
              {METRICS.map((m) => (
                <div key={m.l} data-reveal className="grid items-center gap-x-10 gap-y-2 border-b border-line py-[22px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
                  <div className="text-sm text-[#56645B]">{m.l}</div>
                  <div data-num data-to={m.to} data-dec={m.dec} data-pre={m.pre} data-suf={m.suf} className="text-[clamp(40px,5vw,64px)] font-medium tracking-[-0.05em] tabular-nums">
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 12. SECURITY */}
        <section>
          <div className={`${wrap} ${pad}`}>
            <div className="grid gap-x-16 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
              <div data-reveal>
                <div className={`${eyebrow} mb-[18px]`}>SECURITY &amp; ENTERPRISE</div>
                <h2 className={h2}>Built for the<br /><span className={muted}>procurement review.</span></h2>
                <p className="mt-5 mb-7 max-w-[420px] text-base leading-[1.6] text-[#56645B]">
                  Attendee data is personal data. We treat it that way — audited controls, regional hosting and the admin tooling large teams need.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CERTS.map((c) => (
                    <span key={c} className="rounded-lg bg-accent-soft px-3 py-2 font-mono text-[11.5px] tracking-[.03em] text-[#1F5A3F]">{c}</span>
                  ))}
                </div>
              </div>
              <div data-reveal className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))] lg:col-span-2">
                {SECURITY.map((s) => (
                  <div key={s.k} data-spot className="relative flex min-h-[170px] flex-col gap-2.5 rounded-[20px] bg-surface p-6 transition-colors duration-[350ms] hover:bg-[#F6FBF7]">
                    <Glow />
                    <span className="font-mono text-[11px] tracking-[.04em] text-accent">{s.k}</span>
                    <div className="text-[17px] font-medium tracking-[-0.02em]">{s.t}</div>
                    <div className="text-[13.5px] leading-normal text-ink-3">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 13. FAQ */}
        <section>
          <div className={`${wrap} ${pad} grid gap-x-16 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]`}>
            <div data-reveal>
              <h2 className={h2}>Questions<br /><span className={muted}>teams ask first.</span></h2>
              <p className="mt-5 text-[15px] text-[#56645B]">
                Something else? <Link to="/demo" className="border-b border-ink">Ask a product specialist</Link>.
              </p>
            </div>
            <div className="border-t border-line lg:col-span-2">
              {FAQS.map(([q, a], i) => (
                <div key={q} className="border-b border-line">
                  <h3 className="m-0">
                    <button
                      type="button"
                      aria-expanded={faq === i}
                      aria-controls={`faq-${i}`}
                      onClick={() => setFaq((f) => (f === i ? -1 : i))}
                      className="flex w-full cursor-pointer items-center justify-between gap-5 py-5 text-left text-[17px] font-normal tracking-[-0.01em] hover:text-accent"
                    >
                      <span>{q}</span>
                      <span aria-hidden="true" className={`text-xl text-ink-3 transition-transform duration-300 ${faq === i ? "rotate-45" : ""}`}>+</span>
                    </button>
                  </h3>
                  {faq === i && (
                    <p id={`faq-${i}`} data-faq-a className="m-0 mb-[22px] max-w-[680px] overflow-hidden text-[15px] leading-[1.65] text-[#56645B]">{a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        </>}

        {/* 14. FINAL CTA */}
        {page !== "demo" && (
        <section id="demo">
          <div className={`${wrap} ${pad}`}>
            <div data-cta className="relative overflow-hidden rounded-3xl bg-[#E5EEE6] px-6 py-[clamp(72px,11vw,140px)] text-center">
              <div data-orb style={{ transform: "translate(-50%,-50%)" }} className="absolute top-1/2 left-1/2 aspect-square w-[min(620px,90%)] rounded-full opacity-85 blur-[40px] [background:radial-gradient(circle_at_40%_40%,#F1F8EE_0%,#BFE0CB_36%,#8DC3A3_62%,rgba(141,195,163,0)_72%)]" />
              <div className="relative">
                <h2 data-reveal className="mx-auto max-w-[760px] text-[clamp(38px,5.6vw,72px)] leading-none font-medium tracking-[-0.045em] text-balance">Your next event, on one platform.</h2>
                <p data-reveal className="mx-auto mt-5 mb-8 max-w-[460px] text-[17px] text-[#2B3830]">Free to start, AI included. A 30-minute demo if you'd rather see it first.</p>
                <div data-reveal className="flex flex-wrap justify-center gap-2.5">
                  <Link data-magnetic to="/signup" className={`${pillDark} px-[22px] py-3.5 text-[15px]`}>Start free <span data-arrow className="inline-block">→</span></Link>
                  <Link data-magnetic to="/demo" className={`${pillLight} px-[22px] py-[13px] text-[15px]`}>Book a demo</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>

      {/* 15. FOOTER */}
      <footer>
        <div className={`${wrap} pt-16 pb-8`}>
          <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            <div className="min-w-60 sm:col-span-2">
              <Wordmark />
              <p className="mt-3.5 max-w-[280px] text-sm leading-[1.55] text-ink-3">AI-assisted event operations. Plan, staff, source, run and debrief in one workspace.</p>
            </div>
            {FOOTER.map((c) => (
              <div key={c.h}>
                <div className="mb-3.5 font-mono text-[11px] tracking-[.04em] text-ink-3">{c.h}</div>
                {/* ponytail: footer links are design placeholders; point them at real pages as they ship. */}
                <ul className="flex flex-col items-start gap-[9px] text-sm">
                  {c.l.map((l) => (
                    <li key={l}><span className="text-[#2B3830]">{l}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`mt-14 flex flex-wrap justify-between gap-4 border-t border-line pt-5 text-[12.5px] ${muted}`}>
            <span>© 2026 EventOps, Inc.</span>
            <div className="flex flex-wrap gap-5"><span>Privacy</span><span>Terms</span><span>DPA</span><span>Status</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const K = ({ children }: { children: ReactNode }) => <span className="text-ai">{children}</span>;
const V = ({ children }: { children: ReactNode }) => <span className="text-[#EBDDAE]">{children}</span>;

/** Hero "product film": a static mock of a live event day that landingMotion animates on a loop. */
function HeroFilm() {
  return (
    <div data-hero-frame className="relative mt-14 overflow-hidden rounded-[22px] bg-[#CFE5D6] p-[clamp(14px,4.5vw,64px)]">
      <div data-blob className="absolute -inset-1/4 blur-[24px] [background:radial-gradient(40%_48%_at_22%_30%,#EAF4E6_0%,rgba(234,244,230,0)_70%),radial-gradient(36%_46%_at_80%_22%,#9CCBAE_0%,rgba(156,203,174,0)_72%),radial-gradient(44%_50%_at_62%_86%,#B5DAC3_0%,rgba(181,218,195,0)_70%),radial-gradient(30%_40%_at_8%_92%,#8FC2A3_0%,rgba(143,194,163,0)_70%),radial-gradient(18%_22%_at_88%_78%,#D9CEF3_0%,rgba(217,206,243,0)_70%)]" />
      <div data-hmock role="img" aria-label="EventOps on a live event day: task, staff and incident counters, a tasks-per-15-minutes chart and a live ops feed where the AI flags a delay and reroutes catering." className="relative overflow-hidden rounded-xl bg-[#EFF4EE] text-xs shadow-[0_40px_90px_-30px_rgba(25,70,45,.35)]">
        <div aria-hidden="true">
          <div className="flex h-[42px] items-center justify-between gap-3 border-b border-sunken px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Mark className="size-3.5" />
              <span className="whitespace-nowrap text-ink-3">Northwind Events</span>
              <span className="text-[#C4CEC6]">/</span>
              <span className="truncate font-medium">TechSummit 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-[9px] py-[3px] font-mono text-[10.5px] text-[#2A6E4B]">
                <span data-live className="size-1.5 rounded-full bg-[#3C9A68]" />LIVE · AUG 9
              </span>
              <span className="grid size-[22px] place-items-center rounded-full bg-[#D6E4D9] text-[9px]">MK</span>
            </div>
          </div>
          <div className="flex min-h-[380px]">
            <div className="hidden w-[210px] flex-none bg-sunken px-2.5 py-3.5 min-[900px]:block">
              <div className="px-2 pb-2.5 font-mono text-[10px] tracking-[.05em] text-[#6E7C73]">AI ASSIST · PER AREA</div>
              {HERO_MODULES.map(([name, s]) => (
                <div key={name} data-hrow={s === 2 ? "1" : "0"} className={`flex items-center justify-between rounded-md px-2 py-[7px] ${s ? "text-ink" : "text-[#6E7C73]"}`}>
                  <span>{name}</span>
                  <span data-htoggle={s === 2 ? "1" : "0"} className={`relative h-3 w-[22px] rounded-full ${s === 2 ? "bg-live" : s ? "bg-ink" : "bg-[#CBD6CC]"}`}>
                    <span data-hknob={s === 2 ? "1" : "0"} className="absolute top-0.5 size-2 rounded-full bg-white" style={{ left: s ? 12 : 2 }} />
                  </span>
                </div>
              ))}
            </div>
            <div className="grid min-w-0 flex-1 content-start gap-3.5 p-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
              <div className="col-span-full grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
                {[["Tasks done", 148, 92, "+12 since 8:00", true], ["Staff on site", 46, 31, "of 48 rostered", false], ["Incidents resolved", 14, 9, "avg. 7 min to close", true]].map(([l, v, from, s, good]) => (
                  <div key={l as string} className="rounded-[10px] bg-surface p-3">
                    <div className="text-[11px] text-ink-3">{l}</div>
                    <div data-hc={v} data-from={from} className="mt-1.5 text-2xl tracking-[-0.03em] tabular-nums">{v}</div>
                    <div className={`mt-0.5 text-[10.5px] ${good ? "text-[#2A6E4B]" : "text-ink-3"}`}>{s}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-[10px] bg-surface p-3.5">
                <div className="flex justify-between text-[11px] text-ink-3"><span>Tasks closed per 15 min</span><span className="font-mono">ALL TEAMS</span></div>
                <div className="mt-3.5 flex h-[150px] items-end gap-[5px]">
                  {HERO_BARS.map((h, i) => (
                    <div key={i} data-hbar={h} className={`h-full flex-1 origin-bottom rounded-t-[3px] ${i === 4 ? "bg-live" : "bg-ink"}`} style={{ transform: `scaleY(${h})` }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[9.5px] text-[#84918A]"><span>08:00</span><span>10:00</span><span>12:00</span></div>
              </div>
              <div className="rounded-[10px] bg-surface p-3.5">
                <div className="mb-2 flex justify-between text-[11px] text-ink-3"><span>Live ops feed</span><span className="font-mono">AI WATCHING</span></div>
                <div className="h-[176px] overflow-hidden">
                  <div data-feed>
                    {FEED.map(([i, n, c, t], k) => (
                      <div key={k} className="flex h-11 items-center gap-2.5 border-b border-line-soft">
                        <span className="grid size-[26px] flex-none place-items-center rounded-[7px] bg-[#E4EEE6] text-[9.5px]">{i}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{n}</div>
                          <div className="text-[10.5px] text-[#6E7C73]">{c}</div>
                        </div>
                        <span className="font-mono text-[10px] text-[#6E7C73]">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div data-toast className="absolute right-4 bottom-4 flex items-center gap-2.5 rounded-[10px] bg-ink px-3.5 py-2.5 text-xs text-paper opacity-0 shadow-[0_12px_30px_-10px_rgba(0,0,0,.4)]">
            <Dot c="bg-ai" />AI: catering rerouted to Dock A — 3 owners notified
          </div>
          <div data-cursor className="pointer-events-none absolute top-[80%] left-[72%] size-4 rounded-full border-[1.5px] border-ink bg-white/85 opacity-0 shadow-[0_4px_10px_rgba(0,0,0,.25)]" />
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] tracking-[.04em]">
        <span>● PRODUCT FILM — LIVE EVENT DAY, 0:08 LOOP</span>
        <span>EVENT OVERVIEW / OPS FEED / AI INCIDENT ASSIST</span>
      </div>
    </div>
  );
}

/** Eight scattered tools that the scroll pulls into one EventOps hub. */
function HubDiagram() {
  return (
    <div data-diagram role="img" aria-label="Diagram: eight separate tools (spreadsheets, email blasts, ticket vendor, badge software, survey tool, payment links, CRM exports, group chats) connect into EventOps and become modules." className="relative mt-16 aspect-[1000/460] w-full">
      <svg viewBox="0 0 1000 460" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <circle cx="500" cy="230" r="120" fill="none" stroke="#E1E8E0" />
        <circle cx="500" cy="230" r="190" fill="none" stroke="#E6ECE5" />
        {TOOLS.map((t) => (
          <path key={t.a} data-hub-line d={t.d} fill="none" stroke="#16231C" />
        ))}
        {TOOLS.map((t) => (
          <circle key={t.a} data-pulse r="2.5" fill="#3F8A64" cx={t.x} cy={t.y} style={{ opacity: 0 }} />
        ))}
      </svg>
      <div aria-hidden="true">
        <div data-hub className="absolute top-1/2 left-1/2 grid aspect-square w-[clamp(84px,14%,140px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-center text-paper shadow-[0_0_0_10px_#E3F1E7]">
          <div>
            <div className="relative mx-auto mb-1.5 size-[18px] rounded-[5px] bg-paper"><span className="absolute right-[3px] bottom-[3px] size-1.5 rounded-[2px] bg-live" /></div>
            <div className="text-[clamp(10px,1.2vw,14px)] font-medium">EventOps</div>
          </div>
        </div>
        {TOOLS.map((t) => (
          <div
            key={t.a}
            data-tool
            data-dx={t.dx}
            data-dy={t.dy}
            data-r={t.r}
            className="absolute grid -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface px-[clamp(8px,1.4vw,14px)] py-[clamp(4px,.8vw,8px)] text-[clamp(9px,1.15vw,13px)] whitespace-nowrap shadow-[0_8px_20px_-12px_rgba(20,45,30,.3)]"
            style={{ left: t.left, top: t.top }}
          >
            <span data-tool-a className="[grid-area:1/1] text-ink-3">{t.a}</span>
            <span data-tool-b className="[grid-area:1/1] opacity-0">{t.b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FeatureCopy = ({ k, t, d, rows }: { k: string; t: string; d: string; rows: [string, string][] }) => (
  <div data-reveal>
    <div className="font-mono text-xs tracking-[.04em] text-accent">{k}</div>
    <h3 className="my-3.5 text-[clamp(26px,2.8vw,36px)] leading-[1.08] font-medium tracking-[-0.03em]">{t}</h3>
    <p className="m-0 max-w-[460px] text-base leading-[1.6] text-[#56645B]">{d}</p>
    <dl className="mt-7 border-t border-line">
      {rows.map(([a, b]) => (
        <div key={a} className="flex justify-between border-b border-line py-3 text-sm">
          <dt>{a}</dt>
          <dd className="m-0 font-mono">{b}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const ClipFrame = ({ kind, title, n, children, bar = "bg-live" }: { kind: string; title: string; n: string; children: ReactNode; bar?: string }) => (
  <div data-clip={kind} data-tilt data-reveal aria-hidden="true" className="overflow-hidden rounded-2xl bg-[#F2F6F1] shadow-[0_30px_60px_-40px_rgba(20,45,30,.25)]">
    <div className="flex items-center justify-between border-b border-sunken px-4 py-3 text-xs">
      <span className="font-medium">{title}</span>
      <span className={`font-mono text-[10.5px] ${muted}`}>CLIP {n} · 0:06</span>
    </div>
    {children}
    <div className="h-0.5 bg-line-soft"><div data-prog className={`h-full origin-left scale-x-0 ${bar}`} /></div>
  </div>
);

const stackCard = "grid items-center gap-x-16 gap-y-10 rounded-3xl bg-surface p-[clamp(20px,3.5vw,48px)] shadow-[0_-24px_48px_-36px_rgba(20,45,30,.22)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]";

function Features() {
  return (
    <>
      <div data-stack className={stackCard}>
        <FeatureCopy
          k="01 — PLAN · EVENTS & TASKS"
          t="Paste the brief. Get a run-of-show."
          d="Create an event and EventOps AI drafts the task list — owners, start times, durations and dependencies — grouped into workstreams. Edit anything, then assign it to your team in one click."
          rows={[["Tasks drafted from a brief", "~40 s"], ["Dependencies mapped for you", "auto"]]}
        />
        <ClipFrame kind="reg" title="New event · TechSummit 2026" n="01">
          <div className="grid h-[340px] gap-3.5 overflow-hidden p-4 text-xs [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
            <div className="flex flex-col gap-2">
              <div className={`font-mono text-[10px] tracking-[.04em] ${muted}`}>AI-DRAFTED TASKS</div>
              {REG_FIELDS.map(([l, t, w]) => (
                <div key={l} data-field className="rounded-lg bg-surface px-2.5 py-2">
                  <div className="flex justify-between text-ink-2"><span>{l}</span><span className="font-mono text-[9.5px] text-[#84918A]">{t}</span></div>
                  <div className="mt-[7px] h-1.5 rounded-[3px] bg-sunken" style={{ width: w }} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className={`font-mono text-[10px] tracking-[.04em] ${muted}`}>WORKSTREAMS</div>
              {WORKSTREAMS.map(([n, p, v, s]) => (
                <div key={n} className="rounded-lg bg-surface p-2.5">
                  <div className="flex justify-between"><span className="font-medium">{n}</span><span>{p}</span></div>
                  <div className="mt-[9px] h-1 overflow-hidden rounded-sm bg-line-soft">
                    <div data-fill={v} className="h-full origin-left bg-[#6F9BD6]" style={{ transform: `scaleX(${v})` }} />
                  </div>
                  <div className={`mt-1.5 text-[10.5px] ${muted}`}>{s}</div>
                </div>
              ))}
              <div data-pub className="mt-auto flex items-center justify-between rounded-full bg-ink px-3 py-2.5 text-paper">
                <span>Assign to team</span>
                <span data-cc data-from="0" data-to="16" className="font-mono text-[10.5px] text-ai">16</span>
              </div>
            </div>
          </div>
        </ClipFrame>
      </div>

      <div data-stack className={stackCard}>
        <ClipFrame kind="scan" title="Incidents · TechSummit 2026" n="02" bar="bg-[#7DB394]">
          <div className="flex h-[340px] flex-col gap-2.5 overflow-hidden p-4 text-xs">
            <div data-inc className="rounded-xl bg-surface p-3">
              <div className="flex justify-between gap-2">
                <span className="rounded-full bg-danger-soft px-2 py-0.5 font-mono text-[10px] tracking-[.03em] text-danger">CRITICAL</span>
                <span className={`font-mono text-[10px] ${muted}`}>8:47 AM · MAIN STAGE</span>
              </div>
              <div className="mt-2 text-[13px] font-medium">Main Stage AV failure — audio out</div>
              <div className="mt-1 leading-[1.45] text-ink-3">House PA lost signal during setup. Backup system not responding.</div>
            </div>
            <div data-att className="rounded-xl bg-ai-soft p-3">
              <div className="flex items-center gap-[7px] font-mono text-[10px] tracking-[.04em] text-ai-ink"><Dot c="bg-[#8A75D1]" />AI TRIAGE</div>
              <div className="mt-1.5 leading-normal text-[#2B3830]">Assigned owner is a no-show → reassign to Marcus Chen. 2 backup lavs at Bay Audio, 1.1 km away. Keynote safe if fixed by 9:30.</div>
            </div>
            <div data-ok className="grid rounded-full bg-sunken px-3 py-[9px] text-center font-medium">
              <span data-ok-a className="[grid-area:1/1] text-ink-3">Triaging…</span>
              <span data-ok-b className="[grid-area:1/1] text-[#1F5A3F] opacity-0">✓ Approved · Marcus &amp; SoundWave notified</span>
            </div>
            <div className="rounded-[10px] bg-surface px-3 py-2.5">
              <div className="flex justify-between text-ink-2"><span>SoundWave tech en route</span><span className={`font-mono text-[10px] ${muted}`}>ETA 9:15</span></div>
              <div className="mt-[9px] h-1 overflow-hidden rounded-sm bg-sunken"><div data-badge className="h-full origin-left bg-[#6F9BD6]" /></div>
            </div>
          </div>
        </ClipFrame>
        <FeatureCopy
          k="02 — RESPOND · INCIDENTS & STAFF"
          t="Something breaks. It’s already triaged."
          d="Anyone on staff reports an incident from their phone. AI reads it, sets severity, checks who is actually on site, suggests an owner and nearby vendors who can help — and you approve with one tap."
          rows={[["Report to suggested owner", "seconds"], ["Unowned critical incidents", "0"]]}
        />
      </div>

      <div data-stack className={stackCard}>
        <FeatureCopy
          k="03 — RE-PLAN · SCHEDULE & DEPENDENCIES"
          t="A schedule that sees the knock-on effects."
          d="Every task knows what it depends on. When one slips, AI predicts the cascade on the Gantt, flags what now collides, and proposes a fix — compress, reorder or reassign — with owners notified once you apply it."
          rows={[["Delay cascades caught before they hit", "live"], ["Owner updates sent manually", "0"]]}
        />
        <ClipFrame kind="agenda" title="Schedule · Aug 9" n="03">
          <div className="flex h-[340px] flex-col gap-2.5 p-4 text-[11.5px]">
            <div className={`grid grid-cols-[44px_1fr_1fr_1fr] font-mono text-[10px] tracking-[.03em] ${muted}`}><span /><span>TECHNICAL</span><span>PRODUCTION</span><span>LOGISTICS</span></div>
            <div className="grid flex-1 grid-cols-[44px_1fr]">
              <div className="grid grid-rows-4 font-mono text-[10px] text-[#84918A]"><span>07:00</span><span>08:00</span><span>09:00</span><span>10:00</span></div>
              <div className="relative border-r border-b border-line-soft bg-[linear-gradient(#EDF2EC_1px,transparent_1px),linear-gradient(90deg,#EDF2EC_1px,transparent_1px)] bg-[length:33.333%_25%]">
                {SESSIONS.map((s) => (
                  <div key={s.n} data-sess className={`absolute m-[3px] h-[calc(25%-6px)] w-[calc(33.333%-6px)] overflow-hidden rounded-[7px] px-2 py-[7px] ${s.cls}`} style={{ left: s.l, top: s.t }}>
                    <div className="font-medium">{s.n}</div>
                    <div className="mt-0.5 text-[10.5px] opacity-70">{s.p}</div>
                  </div>
                ))}
                <div data-conflict className="absolute top-1/2 left-0 m-[3px] h-[calc(25%-6px)] w-[calc(33.333%-6px)] rounded-[7px] bg-danger-soft px-2 py-[7px] shadow-[inset_0_0_0_1.5px_#C9668E]">
                  <div className="font-medium">Keynote rehearsal</div>
                  <div className="mt-0.5 text-[10.5px] opacity-70">P. Nair · +35 min</div>
                </div>
              </div>
            </div>
            <div data-resolve className="grid rounded-[10px] bg-danger-soft px-3 py-[9px]">
              <span data-res-a className="[grid-area:1/1] text-danger">AV check +15 min → sound check and rehearsal now collide with the keynote</span>
              <span data-res-b className="[grid-area:1/1] text-[#2A6E4B] opacity-0">AI fix applied — 5-min walkthrough · Priya &amp; Marcus notified</span>
            </div>
          </div>
        </ClipFrame>
      </div>

      <div data-stack className={stackCard}>
        <ClipFrame kind="roi" title="Debrief · TechSummit 2026" n="04">
          <div className="flex h-[340px] flex-col gap-3.5 p-4 text-xs">
            <div className="grid grid-cols-3 gap-2.5">
              {[["Tasks on time", "40", "92", "%", "92%"], ["Staff hours", "0", "1846", "", "1,846"], ["Incidents closed", "0", "18", "", "18"]].map(([l, from, to, suf, v]) => (
                <div key={l} className="rounded-[10px] bg-surface p-2.5">
                  <div className="text-[11px] text-ink-3">{l}</div>
                  <div data-cc data-from={from} data-to={to} data-suf={suf} className="mt-1 text-[22px] tracking-[-0.03em]">{v}</div>
                </div>
              ))}
            </div>
            <div className="relative flex-1 rounded-[10px] bg-surface p-3">
              <div className="flex justify-between text-[11px] text-ink-3"><span>Tasks closed vs. plan</span><span className="font-mono">AHEAD BY 2 H</span></div>
              <svg viewBox="0 0 400 140" preserveAspectRatio="none" className="mt-1.5 h-[calc(100%-20px)] w-full overflow-visible">
                {[35, 70, 105].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#EDF2EC" />)}
                <path data-line d="M0 128 C 40 120, 60 100, 90 104 S 150 72, 190 78 S 250 44, 290 50 S 360 18, 400 14" fill="none" stroke="#3F8A64" strokeWidth="2" />
                <path d="M0 132 C 50 128, 90 122, 140 118 S 250 100, 300 98 S 370 88, 400 84" fill="none" stroke="#C4CEC6" strokeDasharray="3 4" />
              </svg>
            </div>
            <div data-chip className="flex items-center gap-2 rounded-[10px] bg-ai-soft px-3 py-[9px] text-ai-ink"><Dot c="bg-[#8A75D1]" />AI debrief drafted · 4 lessons saved for next event</div>
          </div>
        </ClipFrame>
        <FeatureCopy
          k="04 — DEBRIEF · REPORTS & LESSONS"
          t="The debrief writes itself."
          d="Tasks, delays, incidents, vendor spend and staff hours are already in one place — so AI drafts the wrap-up the night of the event, and carries what went wrong into the plan for the next one."
          rows={[["Time to stakeholder debrief", "same night"], ["Lessons reused next event", "automatic"]]}
        />
      </div>
    </>
  );
}
