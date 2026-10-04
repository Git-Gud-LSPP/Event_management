import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileLock2, Fingerprint, KeyRound, Lock, Menu, ScrollText, ShieldCheck } from "lucide-react";
import { MODULES, EVENT_TYPES, type EventType } from "../billing/catalog";
import { isLoggedIn } from "../services/authApi";
import ModuleExplorer from "./ModuleExplorer";
import FeatureRail from "./FeatureRail";
import Pricing from "./Pricing";
import { ConsolidationDiagram, IntegrationHub } from "./Diagrams";
import { Clip, Counter, Mark, Placeholder, Wordmark } from "./ui";
import { buttonCls, useRevealAll } from "./lib";

const NAV = [
  ["Product", "#product"],
  ["Modules", "#modules"],
  ["Pricing", "#pricing"],
  ["Customers", "#customers"],
];

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<EventType | null>(null);
  useRevealAll(root);
  useEffect(() => {
    document.title = "EventHQ: the modular event operations platform";
  }, []);

  return (
    <div ref={root} className="eh-auto min-h-[100dvh] bg-paper font-sans text-ink antialiased">
      <a href="#main" className="sr-only z-50 rounded-control bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Proof />
        <Problem />
        <section id="modules" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <SectionHead title="Pick the modules. Skip the bloat." body="104 modules across planning, people, venue, sales and show day. Filter by the event you run, then build your stack." />
            <div className="mt-12">
              <ModuleExplorer filter={filter} setFilter={setFilter} />
            </div>
          </div>
        </section>
        <section id="product" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <SectionHead title="Built for show day, not just the sales page." />
            <div className="mt-12">
              <FeatureRail />
            </div>
          </div>
        </section>
        <HowItWorks />
        <UseCases onPick={setFilter} />
        <section id="integrations" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <SectionHead title="Plugs into the tools you keep." body="Calendars, payments, CRM, chat and storage. Connect them once and every module shares the data." center />
            <div className="mt-12">
              <IntegrationHub />
            </div>
            <p className="mt-6 text-center text-xs text-ink-3">
              <Placeholder>Illustrative</Placeholder> Integration list to be confirmed against shipped connectors.
            </p>
          </div>
        </section>
        <section id="pricing" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <SectionHead title="Pay for the modules you use." body="Free forever for the core. Pick add-ons per plan and swap them whenever an event calls for something different." />
            <div className="mt-12">
              <Pricing />
            </div>
          </div>
        </section>
        <Customers />
        <Security />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function SectionHead({ title, body, center }: { title: string; body?: string; center?: boolean }) {
  return (
    <div className={`eh-reveal max-w-[44rem] ${center ? "mx-auto text-center" : ""}`}>
      <h2 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink lg:text-[44px]">{title}</h2>
      {body && <p className={`mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-2 ${center ? "mx-auto" : ""}`}>{body}</p>}
    </div>
  );
}

function Nav() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const loggedIn = isLoggedIn();
  // Border appears once the page scrolls; an observer on a 1px sentinel avoids scroll listeners.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="absolute top-0 h-px w-px" aria-hidden="true" />
      <header className={`sticky top-0 z-40 border-b bg-paper/90 backdrop-blur transition-colors ${stuck ? "border-line" : "border-transparent"}`}>
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 md:px-6">
          <Link to="/" aria-label="EventHQ home">
            <Wordmark />
          </Link>
          <ul className="hidden items-center gap-6 text-sm text-ink-2 md:flex">
            {NAV.map(([label, href]) => (
              <li key={href}>
                <a href={href} className="transition-colors hover:text-ink">{label}</a>
              </li>
            ))}
          </ul>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {loggedIn ? (
              <Link to="/events" className={buttonCls.primary}>Open app</Link>
            ) : (
              <>
                <Link to="/login" className={buttonCls.ghost}>Log in</Link>
                <Link to="/contact-sales" className={buttonCls.secondary}>Book a demo</Link>
                <Link to="/signup" className={buttonCls.primary}>Start free</Link>
              </>
            )}
          </div>
          <details className="relative ml-auto md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-control border border-line-strong" aria-label="Menu">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-12 w-64 rounded-card border border-line bg-surface p-2 shadow-overlay">
              {NAV.map(([label, href]) => (
                <a key={href} href={href} className="block rounded-control px-3 py-3 text-ink hover:bg-sunken">{label}</a>
              ))}
              <div className="mt-2 grid gap-2 border-t border-line pt-3">
                <Link to="/signup" className={buttonCls.primary}>Start free</Link>
                <Link to="/contact-sales" className={buttonCls.secondary}>Book a demo</Link>
                <Link to="/login" className={buttonCls.ghost}>Log in</Link>
              </div>
            </div>
          </details>
        </nav>
      </header>
    </>
  );
}

function Hero() {
  return (
    <section className="eh-grid-bg relative overflow-hidden pt-12 lg:pt-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h1 className="max-w-[18ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-5xl lg:max-w-none lg:text-[64px]">
          Every module your event needs.
          <span className="block text-ink-3">None it doesn't.</span>
        </h1>
        <div className="mt-8 grid gap-10 pb-16 lg:mt-10 lg:grid-cols-12 lg:gap-12 lg:pb-24">
          <div className="lg:col-span-4">
            <p className="max-w-[38ch] text-lg leading-relaxed text-ink-2">
              Start free with the core toolkit. Add floor plans, vendors, ticketing and 100+ more modules as you grow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className={`${buttonCls.primary} h-11 px-5`}>
                Start free <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link to="/contact-sales" className={`${buttonCls.secondary} h-11 px-5`}>Book a demo</Link>
            </div>
          </div>
          <div className="lg:col-span-8">
            <Clip
              name="hero"
              url="/events"
              priority
              label="Product tour: a festival is created, the core modules switch on, Floor Plan and Incidents are added from the catalog, and the run-of-show fills in."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Invented customer marks (monogram + name) until real logos are cleared for use.
const CUSTOMERS = ["Northbound Live", "Fieldhouse", "Corvid & Co", "Tallis Summit", "Marrowgate", "Halden Group"];

function Proof() {
  return (
    <section aria-label="Customers" className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-10 md:px-6 lg:grid-cols-12">
        <p className="lg:col-span-3">
          <span className="block text-3xl font-semibold tracking-[-0.03em] text-ink">
            <Counter to={2400} suffix="+" />
          </span>
          <span className="text-sm text-ink-2">events run on EventHQ last year</span>{" "}
          <Placeholder />
        </p>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:col-span-9 lg:grid-cols-6" aria-label="Placeholder customer logos">
          {CUSTOMERS.map((c, i) => (
            <li key={c} className="flex items-center gap-2 text-ink-3" title="Placeholder logo">
              <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
                {i % 3 === 0 && <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />}
                {i % 3 === 1 && <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />}
                {i % 3 === 2 && <path d="M12 2 22 20H2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />}
                <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">{c[0]}</text>
              </svg>
              <span className="text-[15px] font-semibold tracking-[-0.01em]">{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="border-t border-line py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionHead
          title="Ten tabs open on show day. Or one."
          body="Spreadsheets for the schedule, a chat for the crew, email for vendors, a PDF for the floor plan. EventHQ turns each of them into a connected module, so one change reaches everyone."
        />
        <div className="mt-14">
          <ConsolidationDiagram />
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  ["Start free", "Create a workspace in under a minute. Events, tasks, schedule, staff and documents are included."],
  ["Add modules", "Turn on vendors, floor plans or ticketing when an event calls for them. Swap them out when it doesn't."],
  ["Scale", "Move to Growth or Enterprise when your team, events or security review demand it."],
];

function HowItWorks() {
  return (
    <section className="border-t border-line py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionHead title="Start small. Grow by module." />
        <ol data-inview className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden="true"
            className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px origin-top scale-y-0 bg-line-strong transition-transform duration-[1400ms] ease-[var(--ease-in-out-quint)] motion-reduce:scale-100 motion-reduce:transition-none md:left-0 md:top-[5px] md:h-px md:w-full md:origin-left md:scale-x-0 md:scale-y-100 [.is-in>&]:scale-100"
          />
          {STEPS.map(([title, body], i) => (
            <li key={title} className="eh-reveal relative pl-8 md:pl-0 md:pt-10" style={{ "--i": i * 4 } as React.CSSProperties}>
              <span className={`absolute left-0 top-1 size-[11px] rounded-full border md:top-0 ${i === 0 ? "border-accent bg-accent" : "border-line-strong bg-paper"}`} aria-hidden="true" />
              <h3 className="text-xl font-semibold tracking-[-0.01em] text-ink">{title}</h3>
              <p className="mt-2 max-w-[34ch] leading-relaxed text-ink-2">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const USE_CASES: Record<EventType, string> = {
  conference: "Agendas, speakers, sponsors and badge check-in, all against one schedule.",
  festival: "Site plans, crew rosters, vendor load-ins and live incident logs across multiple stages.",
  corporate: "Offsites, kickoffs and webinars with procurement, SSO and approvals your IT team will sign off.",
  wedding: "Supplier coordination, seating plans and a day-of timeline couples and crew share.",
  webinar: "Registration, reminders and post-event surveys without a separate tool.",
};

function UseCases({ onPick }: { onPick: (t: EventType) => void }) {
  const [tab, setTab] = useState<EventType>("festival");
  const mods = MODULES.filter((m) => !m.core && m.types.includes(tab) && m.types.length <= 3).slice(0, 8);
  const label = EVENT_TYPES.find((t) => t.id === tab)!.label.toLowerCase();
  return (
    <section className="border-t border-line bg-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionHead title="Built for how you run events." />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div role="tablist" aria-label="Event types" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:col-span-3 lg:mx-0 lg:flex-col lg:px-0">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="usecase-panel"
                onClick={() => setTab(t.id)}
                className={`eh-press h-10 shrink-0 rounded-control px-3 text-left text-[15px] ${
                  tab === t.id ? "bg-surface font-medium text-ink shadow-[inset_0_0_0_1px_var(--eh-line)]" : "text-ink-2 hover:text-ink"
                }`}
              >
                {t.plural}
              </button>
            ))}
          </div>
          <div id="usecase-panel" role="tabpanel" className="lg:col-span-9">
            <p key={tab} className="eh-swap max-w-[48ch] text-2xl font-medium leading-snug tracking-[-0.015em] text-ink">{USE_CASES[tab]}</p>
            <p className="mt-8 text-sm text-ink-3">Modules {label} teams add most</p>
            <ul className="mt-3 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
              {mods.map((m) => (
                <li key={m.id} className="bg-surface p-4">
                  <p className="text-[15px] font-medium text-ink">{m.name}</p>
                  <p className="mt-1 text-sm text-ink-2">{m.blurb}</p>
                </li>
              ))}
            </ul>
            <a href="#modules" onClick={() => onPick(tab)} className={`${buttonCls.ghost} mt-6 px-0 text-ink`}>
              See every {label} module <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Customers() {
  return (
    <section id="customers" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-14 px-4 md:px-6 lg:grid-cols-12">
        <figure className="eh-reveal lg:col-span-7">
          <blockquote className="text-[26px] font-medium leading-[1.25] tracking-[-0.02em] text-ink lg:text-[34px]">
            “We replaced four tools and a very long spreadsheet. Our crew finally works from the same plan.”
          </blockquote>
          <figcaption className="mt-6 text-sm text-ink-2">
            <span className="font-medium text-ink">Amara Lindqvist</span>, Head of Production, Northbound Live <Placeholder />
          </figcaption>
        </figure>
        <div className="lg:col-span-5">
          <dl className="grid grid-cols-3 gap-6 border-y border-line py-6 lg:grid-cols-1 lg:border-y-0 lg:border-l lg:py-0 lg:pl-10">
            {[
              [<Counter key="a" to={38} prefix="-" suffix="%" />, "planning hours per event"],
              [<Counter key="b" to={3.1} decimals={1} suffix="×" />, "faster incident resolution"],
              [<Counter key="c" to={11} />, "tools retired"],
            ].map(([n, label], i) => (
              <div key={i}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink lg:text-[44px]">{n}</dd>
                <dd className="mt-2 text-sm text-ink-2">{label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-ink-3 lg:pl-10">
            <Placeholder /> Case-study metrics pending customer approval.
          </p>
          <figure className="mt-10 lg:pl-10">
            <blockquote className="text-[17px] leading-relaxed text-ink-2">
              “Adding the floor plan module for one festival and dropping it after was exactly what we needed.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-ink-2">
              <span className="font-medium text-ink">Daniel Achterberg</span>, Ops Director, Fieldhouse Agency <Placeholder />
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

const SECURITY = [
  [Fingerprint, "SSO/SAML and SCIM", "Enterprise sign-in and provisioning through your identity provider."],
  [KeyRound, "Role-based access", "Organizers plan, staff see what they're assigned. Custom roles on Growth."],
  [ScrollText, "Audit log", "Every change, who made it and when, exportable for review."],
  [Lock, "Encryption", "TLS in transit and AES-256 at rest for every workspace."],
  [FileLock2, "GDPR-ready", "DPA, data export and deletion on request, EU hosting option."],
  [ShieldCheck, "SOC 2 Type II", "Audit in progress. Report available under NDA once issued."],
] as const;

function Security() {
  return (
    <section id="security" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionHead title="Ready for your security review." />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map(([Icon, title, body], i) => (
            <li key={title} className="eh-reveal bg-paper p-6" style={{ "--i": i } as React.CSSProperties}>
              <Icon className="size-5 text-ink" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-4 font-medium text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-3">
          <Placeholder /> Compliance claims must be verified before publishing.
        </p>
      </div>
    </section>
  );
}

const FAQ = [
  ["What's included for free?", "Events, tasks, schedule, staff, documents and the AI assistant, with 2 active events and 5 seats. No time limit and no card."],
  ["How does picking modules work?", "Starter lets you turn on any 5 add-on modules and Growth any 20. Swap one for another whenever you like; data in the old module is kept."],
  ["What happens when I hit my module limit?", "You choose: swap a module out, or upgrade. We never switch anything off without asking."],
  ["Can I downgrade or cancel?", "Yes, from Plan & billing at any time. Paid access runs to the end of the billing period, and you can export everything."],
  ["Do you charge per seat?", "No. Each plan includes a seat allowance for the whole workspace. Enterprise seats are custom."],
  ["Can I move from spreadsheets or another tool?", "Import events, staff and vendors from CSV. On Growth and Enterprise we help you migrate."],
  ["Is the AI assistant included?", "Yes, on every plan. Free includes 50 assistant actions a month."],
  ["What does 'In development' mean on a module?", "It's on our public roadmap but not shipped yet. You can ask to be notified from the in-app catalog."],
];

function Faq() {
  return (
    <section className="border-t border-line py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionHead title="Questions, answered." />
        <div className="mt-10 grid gap-x-12 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-ink">
                {q}
                <span className="font-mono text-ink-3 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="pb-5 leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="eh-grid-bg border-t border-line py-24 lg:py-32">
      <div className="eh-reveal mx-auto max-w-[1200px] px-4 text-center md:px-6">
        <Mark className="mx-auto size-10" />
        <h2 className="mt-6 text-[36px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink lg:text-[56px]">Your next event, one workspace.</h2>
        <p className="mx-auto mt-4 max-w-[44ch] text-lg text-ink-2">Free forever for the core. Add modules when you need them.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className={`${buttonCls.primary} h-11 px-5`}>Start free</Link>
          <Link to="/contact-sales" className={`${buttonCls.secondary} h-11 px-5`}>Book a demo</Link>
        </div>
      </div>
    </section>
  );
}

const FOOTER: [string, [string, string][]][] = [
  ["Product", [["Modules", "#modules"], ["Pricing", "#pricing"], ["Integrations", "#product"], ["Security", "#customers"], ["Changelog", "#"]]],
  ["Use cases", EVENT_TYPES.map((t) => [t.plural, "#modules"])],
  ["Company", [["About", "#"], ["Careers", "#"], ["Contact sales", "/contact-sales"]]],
  ["Legal", [["Terms", "#"], ["Privacy", "#"], ["DPA", "#"]]],
];

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Wordmark />
          <p className="mt-3 max-w-[30ch] text-sm text-ink-2">The modular event operations platform.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {FOOTER.map(([h, links]) => (
            <nav key={h} aria-label={h}>
              <h2 className="text-sm font-medium text-ink">{h}</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                {links.map(([l, href]) => (
                  <li key={l}>
                    {href.startsWith("/") ? <Link to={href} className="hover:text-ink">{l}</Link> : <a href={href} className="hover:text-ink">{l}</a>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-xs text-ink-3 md:px-6">© 2026 EventHQ</p>
      </div>
    </footer>
  );
}
