# EventHQ: Media Assets

Status: Stage 8 deliverable. Source: `videos/eventhq-clips/` (HyperFrames, one project per clip, shared `assets/`, run `sh sync-assets.sh` after editing them).
Web output: `frontend/public/media/<name>.{mp4,webm,jpg}`.

## Tools used and fallbacks

| Need | Tool | Notes |
|---|---|---|
| Product video clips | **HyperFrames** (HTML → video, GSAP timelines) + ffmpeg 9.0.2 | Every clip passes `hyperframes check` (lint, layout, motion, WCAG contrast). |
| Product mockups | Built from the clips' real-UI recreations; device frame is the page's `Clip` browser chrome | No image-generation tool was available in this environment, so there are no generated photos. |
| Illustrations | Hairline SVG in code (`frontend/src/marketing/Diagrams.tsx`) | Matches the design system's 1px-line language. |
| Diagrams | Consolidation story, integration hub, how-it-works track | Strokes draw themselves (`pathLength=1` + `.eh-draw`). |
| Customer logos | Invented monogram marks, labeled **Placeholder** | Replace with real, cleared SVG logos. |

## Specs (all clips)

- Canvas 1600×1000 (**16:10**), 30fps, silent, seamless loop (the last ~0.8s returns to the frame-0 state).
- UI authored at 2× web size, because clips display at about 0.5× on the page. Body text ≥ 19px on canvas, about 10px on screen at the smallest.
- Web encode: H.264 MP4 (`+faststart`, CRF 27). VP9 WebM was tried and came out 40-60% larger on this flat UI content, so it was dropped. Poster JPG at the frame listed below.
- Playback (in `Clip`): muted, `playsInline`, loop, `preload="none"` (hero: `metadata`). Plays only while ≥35% visible, and only one feature clip is mounted at a time. Under `prefers-reduced-motion` it shows the poster with native controls and no autoplay.
- No layout shift: width/height attributes plus `aspect-[16/10]`, with the poster `<img>` painting first (hero has `fetchpriority=high`).
- Data is realistic and consistent across clips: Hollow Pines Festival 2027 (Aug 13-15), headliner Marlow Fields, an incident at Gate B at 21:42, and crew names reused across clips.

## Storyboards

### hero: 16s, poster at 9.5s
| Time | Beat | What it proves |
|---|---|---|
| 0.0-2.4 | Events page. "Create event" press, then the *Hollow Pines Festival 2027* card lands with an accent border. | Starting is instant. |
| 2.4-5.3 | "Add modules" drawer slides in. Floor Plan → **On**, Incidents → **On**. Slot meter goes 0 → 2 of 5, and both modules appear in the sidebar tagged *New*. Ticketing shows *In development*. | The modular model, honestly. |
| 5.7-8.0 | Switch to Run-of-show. Six bars draw in along the hour axis, then the now-line appears. | The core plan fills in. |
| 9.9-13.8 | Toast: **High** "Spill near Gate B" → "Assigned to Rui Okafor" → "Resolved in 6 min". | Show-day operations. |
| 14.4-15.0 | Crossfade back to the frame-0 events page. | Seamless loop. |

### schedule: 8s, poster at 4.8s
Gantt for Sat 14 (16:00-23:30). At 0.9s the headliner bar lifts with an accent ring. 1.3-2.3s: it's dragged +30 min, with a "19:30 to 21:00" tag. 2.5-3.3s: Crew call, Shuttles and Fireworks shift with it and their borders turn accent. 3.0s: dependency links draw. 3.9s: toast "3 items moved with the headliner. 14 crew notified." 6.9-8.0s: reset.

### floorplan: 8s, poster at 5.5s
Grid canvas with a tool rail. 0.2-1.5s: the hall outline draws itself, and the 42 m dimension appears. 1.8s: Main stage drops in with a dashed selection showing "18 × 8 m". Then FOH, two bars, a first-aid point and exits drop in. 4.8s: a "Saved to Hollow Pines Festival 2027" chip. 7.0-8.0s: reset to the empty canvas.

### incidents: 8s, poster at 5.5s
Incident list with 4 resolved rows. 0.6s: rows push down and "Spill near Gate B" (High) slides in with an accent wash, and the sidebar shows "1 open". 1.4s: a detail panel opens with a timestamped trail: 21:42 Reported, then 21:43 Assigned to Rui Okafor (status → In progress). 4.0s: 21:48 Resolved (status → Resolved), and the open count clears. 7.0-8.0s: reset.

### assistant: 8s, poster at 5.5s
Assistant panel (Ctrl K) over the Events page. 0.3-1.5s: the request appears word by word: "Assign tomorrow's load-in tasks to the stage crew." 1.65s: thinking dots. 2.75s: "Done. I created 5 tasks for Thu, Aug 12…", then five task rows with owners stagger in, then "View in My Tasks" and "Undo" actions. 7.1-8.0s: reset.

## Re-rendering

```bash
cd videos/eventhq-clips
sh sync-assets.sh                       # after editing assets/
npx hyperframes check <clip>            # must pass
npx hyperframes render <clip> -o renders/<clip>.mp4 --fps 30 --crf 18
sh encode-web.sh                        # MP4 + poster into frontend/public/media
```
