import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dot } from "./ui";
import { BookingForm } from "./BookingForm";
import { eyebrow, h2, lede, muted, pad, pillDark, pillLight, wrap } from "./lib";
import {
  AI_EXAMPLES, AI_STAGES, CAT_BLURBS, CATS, COMPARE, FAQS, FEATURES, NO, TIER_CARDS, TIERS, UC_DETAILS, USE_CASES, priceLabel,
  type Billing, type FeatureId,
} from "./landingData";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Product video with a chapter strip that seeks it. Media lives in public/media/<name>.mp4/.jpg. */
function DemoVideo({ name, chapters }: { name: string; chapters: readonly (readonly [number, string])[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [len, setLen] = useState(0);
  const [started, setStarted] = useState(false);
  const seek = (s: number) => {
    const v = video.current;
    if (!v) return;
    setStarted(true);
    v.currentTime = s;
    v.play().catch(() => {});
  };
  const end = len || chapters[chapters.length - 1][0] + 5;
  return (
    <div className="overflow-hidden rounded-[22px] bg-ink">
      <div className="relative aspect-video">
        <video
          ref={video}
          controls={started}
          playsInline
          preload="metadata"
          poster={`/media/${name}.jpg`}
          onLoadedMetadata={(e) => setLen(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          onPlay={() => setStarted(true)}
          className="absolute inset-0 block size-full object-cover"
        >
          <source src={`/media/${name}.mp4`} type="video/mp4" />
        </video>
        {!started && (
          <button
            type="button"
            onClick={() => seek(0)}
            aria-label="Play video"
            className="absolute inset-0 grid cursor-pointer place-items-center bg-[linear-gradient(180deg,rgba(22,35,28,0)_40%,rgba(22,35,28,.55)_100%)]"
          >
            <span className="flex items-center gap-3 rounded-full bg-paper py-3.5 pr-[22px] pl-4 text-[15px] text-ink shadow-[0_20px_40px_-16px_rgba(0,0,0,.5)]">
              <span className="grid size-[34px] place-items-center rounded-full bg-ink pl-0.5 text-xs text-paper">▶</span>
              Watch the walkthrough{len ? ` · ${mmss(Math.round(len))}` : ""}
            </span>
          </button>
        )}
      </div>
      <ol className="flex gap-1 overflow-x-auto p-2.5" aria-label="Chapters">
        {chapters.map(([s, l], i) => {
          const next = chapters[i + 1]?.[0] ?? end;
          const on = started && t >= s && t < next;
          const prog = Math.max(0, Math.min(100, ((t - s) / (next - s)) * 100));
          return (
            <li key={s} className="flex flex-[1_0_auto]">
              <button
                type="button"
                onClick={() => seek(s)}
                aria-current={on}
                className={`flex min-w-24 flex-1 cursor-pointer flex-col gap-1.5 rounded-[10px] px-3 py-2.5 text-left hover:bg-[#22322A] ${on ? "bg-[#22322A]" : ""}`}
              >
                <span className="block h-0.5 overflow-hidden rounded-[1px] bg-ink-hover" aria-hidden="true">
                  <span className="block h-full bg-ai" style={{ width: `${prog}%` }} />
                </span>
                <span className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="font-mono text-[10.5px] text-[#95A39A] tabular-nums">{mmss(s)}</span>
                  <span className={`text-[13px] ${on ? "text-paper" : "text-[#B7C4BA]"}`}>{l}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const Head = ({ kicker, title, sub, body, h1 = false }: { kicker: string; title: string; sub: string; body: string; h1?: boolean }) => {
  const H = h1 ? "h1" : "h2";
  return (
    <div className="mb-10 grid items-end gap-x-16 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
      <div>
        <div className={`${eyebrow} mb-[18px] flex items-center gap-2`}><Dot />{kicker}</div>
        <H className={h2}>{title}<br /><span className={muted}>{sub}</span></H>
      </div>
      <p className={lede}>{body}</p>
    </div>
  );
};

/** /demo: the full walkthrough video, then the booking form. */
export function DemoPage() {
  return (
    <>
      <section className={`${wrap} pt-[clamp(48px,7vw,88px)] pb-[clamp(40px,5vw,64px)]`}>
        <Head
          h1
          kicker="DEMO · 45 SECONDS"
          title="See a show day"
          sub="run on EventOps."
          body="Plan, schedule, staff, handle an incident with the AI copilot and book vendors. Then pick a time and we'll walk you through it live, on your own events."
        />
        <DemoVideo name="demo" chapters={[[0, "Intro"], [4, "Events"], [11, "Schedule"], [19, "My tasks"], [25, "Incidents + AI triage"], [34, "Vendors"], [41, "Wrap-up"]]} />
      </section>
      <section id="book" className={`${wrap} pb-24`}>
        <BookingForm />
      </section>
    </>
  );
}

/** /product, /ai, /use-cases: header, demo video, then that feature's detail. The landing keeps its own sections. */
export function FeaturePage({ id }: { id: FeatureId }) {
  const f = FEATURES[id];
  return (
    <>
      <section className={`${wrap} pt-[clamp(48px,7vw,88px)] pb-[clamp(40px,5vw,64px)]`}>
        <Head h1 kicker={f.kicker} title={f.title} sub={f.sub} body={f.lede} />
        <div className="mb-10 flex flex-wrap gap-2.5">
          <Link to="/signup" className={`${pillDark} px-5 py-3 text-[15px]`}>Start free →</Link>
          <Link to="/demo" className={`${pillLight} px-5 py-3 text-[15px]`}>Book a demo</Link>
        </div>
        <DemoVideo name={f.video} chapters={f.chapters} />
      </section>
      <section className={`${wrap} ${pad}`}>
        {id === "product" && <ProductDetail />}
        {id === "ai" && <AiDetail />}
        {id === "use-cases" && <UseCaseDetail />}
      </section>
    </>
  );
}

function ProductDetail() {
  return (
    <div className="flex flex-col gap-4">
      {CATS.map((c, i) => (
        <article key={c.n} id={c.n.toLowerCase().replace(/\s+/g, "-")} className="grid gap-x-12 gap-y-6 rounded-[22px] bg-surface p-[clamp(22px,3vw,36px)] lg:grid-cols-[320px_1fr]">
          <div>
            <div className={eyebrow}>0{i + 1} · WORKSPACE</div>
            <h2 className="mt-3 text-[28px] font-medium tracking-[-0.03em]">{c.n}</h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#56645B]">{CAT_BLURBS[c.n]}</p>
          </div>
          <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {c.m.map(([name, desc, tier]) => (
              <li key={name} className="flex flex-col gap-2 rounded-xl bg-[#F4F7F3] p-4">
                <span className="self-start rounded-full bg-surface px-[7px] py-0.5 font-mono text-[10px] tracking-[.04em] text-[#56645B]">{TIERS[tier].toUpperCase()}+</span>
                <span className="text-[15px] font-medium tracking-[-0.01em]">{name}</span>
                <span className="text-[13px] leading-[1.45] text-ink-3">{desc}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="mt-4 text-[15px] text-[#56645B]">
        Start with five modules free and add more as you grow. <a href="/#pricing" className="border-b border-ink text-ink">See pricing →</a>
      </p>
    </div>
  );
}

function AiDetail() {
  return (
    <>
      <div className="flex flex-col gap-4">
        {AI_STAGES.map((a) => {
          const [trigger, proposes, you] = AI_EXAMPLES[a.stage];
          return (
            <article key={a.n} className="grid gap-x-12 gap-y-6 rounded-[22px] bg-surface p-[clamp(22px,3vw,36px)] lg:grid-cols-[320px_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-[38px] place-items-center rounded-xl bg-[#DCEEE2] font-mono text-xs text-[#1F5A3F]">{a.n}</span>
                  <h2 className="text-[26px] font-medium tracking-[-0.03em]">{a.stage}</h2>
                </div>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#56645B]">{a.does}</p>
                <div className="mt-3 font-mono text-[11px] tracking-[.04em] text-ink-3">IN {a.where.toUpperCase()}</div>
              </div>
              <ol className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                {[["WHEN", trigger, "bg-[#F4F7F3]"], ["AI SUGGESTS", proposes, "bg-[#EEE9FA]"], ["YOU", you, "bg-[#DCEEE2]"]].map(([k, d, bg]) => (
                  <li key={k} className={`rounded-xl p-4 ${bg}`}>
                    <div className="font-mono text-[10.5px] tracking-[.06em] text-ink-3">{k}</div>
                    <div className="mt-2 text-[14.5px] leading-normal">{d}</div>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
      <div className="mt-16 grid gap-x-16 gap-y-8 lg:grid-cols-[1fr_2fr]">
        <h2 className={h2}>Guardrails<br /><span className={muted}>built in.</span></h2>
        <dl className="border-t border-line">
          {FAQS.slice(0, 2).map(([q, a]) => (
            <div key={q} className="border-b border-line py-5">
              <dt className="text-[17px]">{q}</dt>
              <dd className="mt-2 max-w-[680px] text-[15px] leading-[1.65] text-[#56645B]">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

const Bullets = ({ title, items, mark, cls }: { title: string; items: string[]; mark: string; cls: string }) => (
  <div>
    <div className="font-mono text-[10.5px] tracking-[.06em] text-ink-3">{title}</div>
    <ul className="mt-2 space-y-1.5">
      {items.map((x) => (
        <li key={x} className="flex gap-2"><span className={cls} aria-hidden="true">{mark}</span>{x}</li>
      ))}
    </ul>
  </div>
);

function UseCaseDetail() {
  return (
    <div className="flex flex-col gap-4">
      {USE_CASES.map((u, i) => {
        const d = UC_DETAILS[u.name];
        return (
          <article key={u.name} className="grid gap-x-12 gap-y-6 rounded-[22px] bg-surface p-[clamp(22px,3vw,36px)] lg:grid-cols-[1fr_1fr_220px]">
            <div>
              <div className={eyebrow}>0{i + 1} · {u.name.toUpperCase()}</div>
              <h2 className="mt-3 text-[26px] leading-tight font-medium tracking-[-0.03em]">{u.head}</h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#56645B]">{u.desc}</p>
            </div>
            <div className="grid gap-5 text-[14.5px]">
              <Bullets title="THE PROBLEM" items={d.pains} mark="•" cls="text-danger" />
              <Bullets title="WITH EVENTOPS" items={d.how} mark="✓" cls="text-live" />
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-[#E4EEE6] p-4">
              <div className="text-[34px] font-medium tracking-[-0.04em]">{u.metric}</div>
              <div className="-mt-2 text-xs text-[#56645B]">{u.metricLabel}</div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {u.stack.map((m) => (
                  <span key={m} className="rounded-full bg-surface px-2.5 py-1 text-xs">{m}</span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Plan comparison table. The landing shows the first group; /pricing shows every group. */
export function CompareTable({ groups, active }: { groups: typeof COMPARE; active?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line text-sm">
            <th className="w-[30%] px-5 py-4 font-medium"><span className="sr-only">Feature</span></th>
            {TIERS.map((n, i) => (
              <th key={n} scope="col" className={`px-5 py-4 font-medium ${i === active ? "text-accent" : ""}`}>{n}</th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.g}>
            <tr>
              <th colSpan={5} scope="colgroup" className="border-b border-line-soft bg-soft px-5 pt-[18px] pb-2 font-mono text-[11px] font-normal tracking-[.04em] text-ink-3">{g.g}</th>
            </tr>
            {g.rows.map(([l, v]) => (
              <tr key={l} className="border-b border-line-soft">
                <th scope="row" className="px-5 py-[13px] font-normal text-ink-2">{l}</th>
                {v.map((t, i) => (
                  <td key={i} className={`px-5 py-[13px] ${t === NO ? "text-[#B5C0B8]" : i === active ? "text-ink" : "text-ink-2"}`}>
                    {t === NO ? <><span aria-hidden="true">—</span><span className="sr-only">Not included</span></> : t}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

const BEST_FOR = [
  "A first event, or a small team trying the platform.",
  "Teams running a regular calendar of events.",
  "Portfolios of large, multi-track events.",
  "Organisations with 50+ events a year, procurement and security reviews.",
];
const ADD_ONS = [
  ["Overage packs", "Go over your attendee or event limit and nothing breaks: registration stays open, an admin is notified, and you buy a one-off pack or upgrade."],
  ["Onsite hardware", "Scanners, kiosks and badge printers rented per event on any paid plan. Enterprise includes onsite technicians for flagship events."],
  ["Migration", "We import attendees, past events and ticket history. Scale and Enterprise include a migration specialist."],
  ["Payment processing", "Paid tickets carry standard processing fees only, on every plan including Starter."],
];

/** /pricing: plans, what each tier unlocks, the full comparison, add-ons and billing questions. */
export function PricingPage() {
  const [billing, setBilling] = useState<Billing>("annual");
  return (
    <>
      <section className={`${wrap} pt-[clamp(48px,7vw,88px)] pb-[clamp(40px,5vw,64px)]`}>
        <Head
          h1
          kicker="PRICING"
          title="Start free."
          sub="Pay for the modules you use."
          body="Every plan includes the AI copilot. Plans differ by how many modules you can switch on, how many events and attendees you run, and the security and support you need."
        />
        <div className="mb-5 flex w-fit rounded-full bg-line-soft p-[3px] text-[13px]" role="group" aria-label="Billing cycle">
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
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          {TIER_CARDS.map((t, i) => (
            <div key={t.name} className="flex flex-col gap-4 rounded-2xl bg-surface p-[22px]">
              <span className="text-base font-medium">{t.name}</span>
              <div>
                <span className="text-[40px] font-medium tracking-[-0.05em]">{priceLabel(i, billing)}</span>
                <span className="text-[13px] opacity-70"> {i === 0 ? "forever" : i === 3 ? "" : billing === "annual" ? "/ mo, billed yearly" : "/ mo"}</span>
              </div>
              <p className="min-h-10 text-[13.5px] leading-normal text-ink-2">{BEST_FOR[i]}</p>
              <Link to={t.to} className={`rounded-full px-3.5 py-[11px] text-center text-sm ring-1 ${i === 3 ? "bg-surface text-ink ring-line-strong" : "bg-ink !text-paper ring-ink"}`}>{t.cta}</Link>
              <ul className="flex flex-col gap-[9px] border-t border-line-soft pt-4 text-[13.5px]">
                {t.feats.map((f) => (
                  <li key={f} className="flex gap-[9px]"><span className="text-live">✓</span>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={`${wrap} ${pad}`}>
        <h2 className={`${h2} mb-10`}>What each plan<br /><span className={muted}>unlocks.</span></h2>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {TIERS.map((tier, i) => {
            const caps = CATS.flatMap((c) => c.m.filter(([, , t]) => t === i).map(([n]) => [c.n, n] as const));
            return (
              <div key={tier} className="rounded-2xl bg-surface p-[22px]">
                <div className={eyebrow}>{i === 0 ? "INCLUDED FROM" : "ADDED IN"} {tier.toUpperCase()}</div>
                {caps.length ? (
                  <ul className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
                    {caps.map(([cat, n]) => (
                      <li key={n} className="flex flex-col">
                        <span>{n}</span>
                        <span className="text-xs text-ink-3">{cat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[13.5px] text-ink-2">Every module, plus custom-built modules, SCIM, data residency and a dedicated team.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={`${wrap} ${pad}`}>
        <h2 className={`${h2} mb-10`}>Compare<br /><span className={muted}>every plan.</span></h2>
        <CompareTable groups={COMPARE} />
      </section>

      <section className={`${wrap} ${pad} grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_2fr]`}>
        <h2 className={h2}>Add-ons<br /><span className={muted}>and billing.</span></h2>
        <div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {ADD_ONS.map(([k, d]) => (
              <div key={k} className="rounded-2xl bg-surface p-[22px]">
                <dt className="text-[16px] font-medium">{k}</dt>
                <dd className="mt-2 text-[13.5px] leading-normal text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
          <dl className="mt-8 border-t border-line">
            {[FAQS[3], FAQS[4], FAQS[5]].map(([q, a]) => (
              <div key={q} className="border-b border-line py-5">
                <dt className="text-[17px]">{q}</dt>
                <dd className="mt-2 max-w-[680px] text-[15px] leading-[1.65] text-[#56645B]">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
