---
workflow: general-video
flow: automation
storyboard: no
message: "EventHQ is one workspace you build from modules, and it holds up on show day."
destination: website (landing page + in-app locked-module previews)
aspect: "16:10"
length: "hero 16s loop; four feature clips 8s loops"
language: en
audience: event agency ops leads, corporate event managers
---

## Intent
Product clips for the EventHQ landing page (docs/design/01-strategy.md). Autoplay muted, loop, lazy-load,
realistic UI and data, no lorem ipsum. Brief came from the user's landing-page spec ("Media assets").

## Deliverables
- hero.mp4/.webm/.jpg (16s): create event -> add modules -> run-of-show fills -> incident resolved -> loop
- schedule (8s), floorplan (8s), incidents (8s), assistant (8s), each with poster frame
Storyboards, durations and poster times: ../../docs/design/05-media.md

## Notes
- Inferred: 1600x1000 canvas, 30fps, silent (no audio track; plays muted on the web).
- Inferred: seamless loop (last ~0.8s returns to frame 0 state).
- Design truth: design.md (EventHQ "Rigging Plot" tokens).
