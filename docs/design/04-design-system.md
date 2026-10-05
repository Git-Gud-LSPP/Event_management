# EventHQ Design System: "Rigging Plot"

Status: Stage 5 deliverable. Source of truth for values: `frontend/src/index.css`. This replaces the deleted `DESIGN.md` (Lattice).

## Concept

Event people read technical drawings all day: lighting plots, site maps, stage plans, run-of-show sheets. The EventHQ look borrows that language. Thin 1px lines connect things, a faint measuring grid appears where content is being placed, mono labels carry data, and a single signal color marks what's live or actionable. **Lines carry meaning.** A hairline either separates content, connects two things, or measures something. It is never decoration on its own.

What keeps it from looking like a generic SaaS template: no gradients or blobs, no purple, no drop-shadowed cards on everything. The palette is cool graphite plus one vermilion "cue light" accent, the color of a stage manager's go light.

## Color tokens

| Token | Light | Dark | Use | Contrast (on bg) |
|---|---|---|---|---|
| `paper` | `#F6F7F5` | `#0E1211` | Page background | |
| `surface` | `#FDFDFC` | `#151A18` | Cards, inputs, media frames | |
| `sunken` | `#EEF0ED` | `#0A0D0C` | Wells, table headers, code | |
| `ink` | `#111614` | `#ECEEED` | Primary text, headings | 17.0 / 16.3 |
| `ink-2` | `#4A524E` | `#A7B0AB` | Body copy, secondary | 7.5 / 8.5 |
| `ink-3` | `#626B66` | `#8A938E` | Captions, metadata (min 12px) | 5.1 / 6.0 |
| `line` | `#DCE0DD` | `#232A27` | Hairlines, dividers (decorative) | n/a |
| `line-strong` | `#7F8883` | `#5A645F` | Input borders, control outlines (WCAG 1.4.11 ≥3:1) | 3.3 / 3.1 |
| `accent` | `#B83A0B` | `#FF7A45` | Primary CTA, active state, focus ring, live lines | 5.4 / 7.3 |
| `accent-ink` | `#FDFDFC` | `#0E1211` | Text on accent | 5.7 / 7.3 |
| `accent-soft` | `#F8E7DF` | `#2A1A12` | Selected chip fill, highlight wash | |

Status colors (app only, semantic, never decorative): success `emerald-700`, warning `amber-700`, danger `red-700`, each with a `-50` wash. A status color always comes with an icon or text so it never relies on color alone.

**Theme rule.** Public pages use `.eh-auto` and follow the system light/dark setting. The app stays light until the app-wide redesign (TODO #0) adds `.eh-auto` to `MainLayout`. A page never mixes the two.

## Typography

Fonts: **Geist** (UI and display) and **Geist Mono** (data, labels, numbers), both self-hosted variable woff2 with `font-display: swap`.

| Role | Size / line-height | Weight | Tracking | Tailwind |
|---|---|---|---|---|
| Display (hero) | 40 → 60px / 1.02 | 560 | -0.035em | `text-[40px] lg:text-[60px]` |
| H2 | 30 → 44px / 1.05 | 560 | -0.03em | `text-3xl lg:text-[44px]` |
| H3 | 20px / 1.25 | 560 | -0.01em | `text-xl` |
| Body L | 18px / 1.55 | 400 | 0 | `text-lg` |
| Body | 16px / 1.55 | 400 | 0 | `text-base` |
| Small | 14px / 1.45 | 400-500 | 0 | `text-sm` |
| Label (mono) | 12px / 1.3 | 500 | 0.02em | `font-mono text-xs` |

Rules: max line length 65ch for body. Numbers in tables and meters use `font-mono tabular-nums`. Uppercase micro-labels are rationed to at most 1 per 3 sections on marketing pages.

## Spacing (4/8pt)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128` (Tailwind `1 2 3 4 6 8 12 16 24 32`).
Section padding is 96px desktop and 64px mobile. Container is `max-w-[1200px]` with a 16px gutter on mobile and 24px from md. Grid is 12 columns, 24px gap on desktop and 1 column below 768px.

## Shape

| Element | Radius |
|---|---|
| Buttons, inputs, chips, module cells | `6px` (`rounded-control`) |
| Cards, media frames, dialogs, panels | `10px` (`rounded-card`) |
| Status badges, toggles, slider thumb | full |

## Elevation

Hairline first. Depth comes from lines and surface color, not shadow.
- **e0:** `border border-line` on `paper`. The default for groups.
- **e1:** `bg-surface border border-line`. Cards, media.
- **e2:** e1 plus `shadow-overlay` (tinted, never pure black). Only for things floating above the page: dialogs, menus, the sticky stack bar.

## Iconography

`lucide-react` (already a dependency): outline glyphs at 1.5px stroke, 16px inline and 20px standalone, in `currentColor`. That matches the hairline weight. No filled icons, no emoji.

## Components (key specs)

- **Button primary:** `bg-accent text-accent-ink`, 40px tall (44px on touch), 16px horizontal padding, 6px radius, weight 500. Press: translateY(1px) scale(.985) over 150ms. One per view.
- **Button secondary:** `border border-line-strong text-ink`, hover `bg-sunken`.
- **Button ghost:** text-only with `ink-2` → `ink` on hover.
- **Input:** label above, 40px tall, `border-line-strong`, error text below in `red-700` with an icon, `aria-describedby` wired.
- **Module cell:** 6px radius with a 1px line. Selected = `bg-accent-soft border-accent`. Locked = lock glyph plus `ink-3`. Roadmap = dashed border.
- **Meter (slots/usage):** a hairline track (1px line), a 2px accent fill and a mono `3/5` label. Not a thick filled bar.
- **Dialog:** native `<dialog>` (focus trap, Esc, inert background for free) at e2 with a 10px radius.
- **Disclosure / FAQ:** native `<details><summary>`.

## Motion

| Token | Value | Use |
|---|---|---|
| micro | 150-180ms | hover, press, toggles |
| ui | 240ms | tabs, dialog open, pricing number swap |
| reveal | 560ms, stagger 60ms | section entry |
| draw | 1400ms `ease-in-out-quint`, stagger 90ms | hairline diagrams |
| ease | `cubic-bezier(.16,1,.3,1)` out-expo | default |

Patterns (all CSS transforms/opacity plus one IntersectionObserver hook, no animation library):
- `.eh-reveal`: fade and rise when entering the viewport (hierarchy).
- `.eh-draw`: SVG stroke draws itself with `pathLength="1"` (storytelling: tools connect).
- `.eh-cell`: module grid assembles in a diagonal cascade (shows breadth arriving in order).
- Counters: count up once in view over 1200ms.
- Pricing toggle: numbers cross-fade and slide 4px.
- `prefers-reduced-motion: reduce` puts everything in its final state with no transitions. Videos show their poster and don't autoplay.

## Responsive

| Breakpoint | Behavior |
|---|---|
| < 768 | Single column. Nav goes into a disclosure menu. The explorer's stack panel becomes a sticky bottom bar. The feature rail becomes scroll-snap tabs. Tables scroll inside their own container. Touch targets ≥ 44px. |
| 768-1023 | 2-column grids. Explorer panel below the grid. |
| ≥ 1024 | Full layouts. Sticky explorer panel and sticky feature rail. |

## Accessibility (WCAG 2.2 AA)

- Contrast is validated above. Text tokens are ≥ 4.5:1 and control borders ≥ 3:1.
- Every interactive element is reachable by keyboard and has the visible accent focus ring (2.4.7) with no clipping under sticky headers (`scroll-margin-top`, 2.4.11).
- Target size ≥ 24×24 (2.5.8), and 44px on touch.
- A skip link to `#main`, landmarks (`header/nav/main/footer`) and one `h1`.
- Videos: muted, no audio track, so captions aren't needed. Each has a text description (`aria-label` plus a visible caption), pause control from the native controls on focus, and posters. Under reduced motion they don't autoplay (2.2.2).
- The filter, toggle, slider and tabs use native elements or proper ARIA (`aria-pressed`, `role=tablist`, `<input type=range>` with `aria-valuetext`).
- Placeholder content is labeled visibly and in the accessible name.
