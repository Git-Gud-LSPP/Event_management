# EventHQ: Low-fidelity Wireframes & Section Rationale

Status: Stage 4 deliverable. Desktop at 1280px. Mobile collapse noted per section. `[ ]` = control, `▶` = video clip.

## Landing page

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◇ EventHQ   Product  Modules  Pricing  Customers     Log in [Book a demo] [Start free] │  64px sticky, hairline bottom on scroll
├──────────────────────────────────────────────────────────────────────────┤
│ Every module your event        │ ┌──────────────────────────────────┐   │
│ needs. None it doesn't.        │ │ ▶ hero loop 16:10, poster first  │   │  split 5/7
│ Start free with the core...    │ │   (schedule → floor plan → AI)   │   │
│ [Start free] [Book a demo]     │ └──────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────┤
│  2,400+ events run last year   ◯ ◯ ◯ ◯ ◯ ◯  (placeholder marks)          │  one row
├──────────────────────────────────────────────────────────────────────────┤
│ Ten tabs open on show day. Or one.                                        │
│  Spreadsheet ─┐                                                           │
│  Group chat ──┤                                                           │
│  Email ───────┼──────────▶  [ EventHQ workspace ]  (lines draw on scroll) │  full-width SVG
│  Drive ───────┤                                                           │
│  Floor PDF ───┘ ...                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ Pick the modules. Skip the bloat.                                         │
│ (All)(Conference)(Festival)(Corporate)(Wedding)(Webinar)  [search]        │
│ ┌──────────────────────────────────────────┐ ┌──────────────────────┐    │
│ │ category column grid of module chips     │ │ Your stack           │    │  explorer 8/4,
│ │ ▢▢▢▢▢▢  ▢▢▢▢▢  ▢▢▢▢▢▢  ... 100+           │ │ 5 core (included)    │    │  panel sticky
│ │ (filter dims non-matching, never hides)  │ │ + 4 add-ons          │    │
│ │                                          │ │ Recommended: Starter │    │
│ └──────────────────────────────────────────┘ │ [Start free with...] │    │
│                                              └──────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│ Tabs/rail:  ● Run-of-show  ○ Floor plans  ○ Incidents  ○ Assistant       │  sticky rail left (4) +
│ copy for active item                │ ▶ clip for active item (16:10)    │  clip right (8), one
├──────────────────────────────────────────────────────────────────────────┤  section, not a zigzag
│ Start small. Grow by module.                                              │
│  ○───────────────○───────────────○   (hairline track draws)               │  3 nodes on one line
│  Start free      Add modules       Scale                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Built for how you run events.  [Conferences|Festivals|Corporate|...]      │  tabs + split panel
├──────────────────────────────────────────────────────────────────────────┤
│ Plugs into the tools you keep.   hub-and-spoke hairline diagram           │  centered diagram
├──────────────────────────────────────────────────────────────────────────┤
│ Pay for the modules you use.          (Monthly | Annual -20%)            │
│ Add-on modules you need: ──●────────── 4                                  │
│ ┌Free──┐┌Starter┐┌Growth★┐┌Enterprise┐   highlighted by slider          │  4 columns, hairline
│ └──────┘└───────┘└───────┘└──────────┘                                    │  dividers, no shadows
│ [Compare every feature ▾]  → full table (disclosure)                       │
├──────────────────────────────────────────────────────────────────────────┤
│ "Quote..."  big       │  -38%   3.1×   11      (counters)               │  quote + metrics
├──────────────────────────────────────────────────────────────────────────┤
│ Ready for your security review.  2×3 spec grid with icons                 │
├──────────────────────────────────────────────────────────────────────────┤
│ FAQ  (native <details>, 2 columns of questions)                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Your next event, one workspace.  [Start free] [Book a demo]               │  dark ink band? no:
├──────────────────────────────────────────────────────────────────────────┤  same theme, grid bg
│ footer 4 columns                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile (<768px):** nav collapses into a menu button (a `<details>` disclosure). The hero stacks with copy first and the video below. The consolidation diagram switches to a vertical layout. In the explorer, the stack panel becomes a sticky bottom bar ("4 add-ons · Starter · Continue"). The feature rail becomes horizontal scroll-snap tabs above the clip. Pricing cards stack, and the comparison table scrolls horizontally inside its own container. FAQ is one column.

## Section rationale

| # | Section | Why it exists / why this layout |
|---|---|---|
| 1 | Sticky nav | The three intents (log in, demo, signup) are always one click away. "Start free" is the only filled button, so signup stays the visual default. |
| 2 | Hero, split | Passes the 5-second test: a headline that is the promise, plus a video showing the product, not a mood image. Copy on the left reads first in an F-pattern, and the video is muted with a static poster first for LCP. |
| 3 | Proof strip | Answers "is anyone using this?" right after the promise and before any commitment. One metric beats a wall of numbers. |
| 4 | Consolidation diagram | Makes the pain (tool sprawl) visible, then resolves it in one motion. Lines drawing in signify "connected", which is the brand metaphor. |
| 5 | Module explorer | The hero concept. 100+ modules are shown at once, which makes the breadth tangible, but grouped into 10 categories with filters that *dim* rather than hide, so nothing feels lost. Choosing modules turns browsing into a sales qualifier: the panel names the plan. |
| 6 | Feature rail | 4 deep-dives in one pinned interaction instead of 4 zigzag rows. That's less scroll, it avoids zigzag fatigue, and only one video plays at a time (performance). |
| 7 | How it works | Explains the business model ("free, then add modules") as a sequence. That cuts down pricing anxiety before the pricing section. |
| 8 | Use cases | Self-identification. Each tab names modules for that event type, which feeds back into the explorer filter. |
| 9 | Integrations | Removes the "will it fit our stack?" objection. A hub diagram reuses the hairline language. |
| 10 | Pricing | The slider maps "how many add-ons do I need" to a tier, so the visitor gets an answer instead of having to compare. Enterprise is visible with its own path, and the full table is collapsed so it doesn't dominate the page. |
| 11 | Testimonials + metrics | Outcome proof after price, where doubt peaks. Counters animate once, so movement draws attention to the numbers. |
| 12 | Security | Unblocks Tomás (the corporate buyer) and his IT review. A spec grid scans quickly. |
| 13 | FAQ | Answers the modular-specific objections: limits, swapping, downgrading. Native `<details>` is keyboard-accessible with no JS. |
| 14 | Final CTA | Repeats the two intents with the risk reversal for visitors who scrolled the whole page. |
| 15 | Footer | Standard wayfinding and legal. |

## App screens (key frames)

```
SIGN UP                          ONBOARDING (step 2 of 3)            RECOMMENDED STACK
┌───────────────────────┐        ┌──────────────────────────────┐   ┌──────────────────────────────┐
│ ◇ EventHQ             │        │ ━━━━━━━━━━━━━━━━━━━──────── │   │ Your starting stack           │
│ Start free            │        │ What do you run?             │   │ Included: ▢Events ▢Tasks ...  │
│ [G Continue w/ Google]│        │ ┌Conf┐┌Fest┐┌Corp┐           │   │ Suggested: ☑Floor plan ☑Vend… │
│ [M Continue w/ MS   ] │        │ └────┘└────┘└────┘ ...       │   │ Starter covers this ($49)     │
│ ── or ──              │        │            [Back] [Continue] │   │ [Go to workspace] [Try Starter]│
│ Work email [________] │        │ Skip                         │   └──────────────────────────────┘
│ [Continue]            │        └──────────────────────────────┘
└───────────────────────┘

MARKETPLACE                                           LOCKED MODULE PREVIEW
┌─────────┬──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ All     │ [search /]          3 of 5 slots ━━━ │   │ 🔒 Floor Plan                         │
│ Plan    │ Recommended for festivals            │   │ Draw venues and place stations...    │
│ People  │ ▢card ▢card ▢card                    │   │ ▶ clip                     ✓ bullets │
│ Venue   │ All modules                          │   │ Included in Starter (1 slot) & up    │
│ ...     │ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢                     │   │ [Add to my plan]  [Back to events]   │
└─────────┴──────────────────────────────────────┘   └──────────────────────────────────────┘

SLOT LIMIT DIALOG               PLAN & BILLING                         CANCEL (step 2)
┌────────────────────────┐      ┌──────────────────────────────────┐  ┌──────────────────────────┐
│ All 5 slots used       │      │ Starter · monthly · renews Nov 5 │  │ Before you go            │
│ Swap one out:          │      │ Slots ━━━━━━━━━━━── 5/5          │  │ • 5 add-ons go read-only │
│ ○ Inventory · 41d ago  │      │ Events 4/10   Seats 9/25         │  │ • Free plan from Nov 5   │
│ ○ Vendors · today      │      │ [Change plan][Switch to annual]  │  │ • Export any time        │
│ ── or ──               │      │ Your add-ons (swap/remove)       │  │ [Keep plan] [Cancel sub] │
│ [Upgrade to Growth]    │      │ Danger zone: Cancel subscription │  └──────────────────────────┘
└────────────────────────┘      └──────────────────────────────────┘
```
