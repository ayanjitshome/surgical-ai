# Surgical AI Hub — YouTube Walkthrough Video Plan

A 6-to-8 minute screen-capture walkthrough of the Surgical AI Hub web app, narrated as a two-presenter dialogue, aimed at a broad YouTube audience that is curious about AI coding tools but not necessarily building with them yet.

## Who it's for

Developers, hobbyists, students, and tech-curious viewers on YouTube who have heard of AI coding assistants, feel the pain of rising token bills or tool overload, and want a clear mental map before they commit. Not aimed at ML specialists.

## Core features and experience

The video is the content product. The deliverables are:

1. A finished script (two-presenter dialogue, cold open, scene-by-scene narration, on-screen callout cues, b-roll notes, and a closing CTA block) that a creator can hand to voice talent and an editor.
2. A storyboard document that pairs each scripted line with the exact on-screen action: which page to open, where to point, which element to magnify, what to type into any form, what hover state to show.
3. A shot list the recorder can tick off while capturing: resolution, viewport dimensions, dark/light mode, cursor presence, and the sample inputs to use so a second take matches the first.
4. A short self-host instructions block for the video description, so viewers who want to try it have a one-paragraph starting point.

Scope stops at the printed/markdown artefacts above. The agent does **not** record screen capture, run editing software, generate voice audio, or publish anything on YouTube.

## User flow (the viewer's journey through the video)

The target structure for the 6-to-8 minute cut:

- **0:00 – 0:15 Cold open.** A developer scene: three browser tabs, a growing OpenAI bill, a half-written prompt, and the question "did that assistant just rewrite half my codebase?" End with a hard cut to the hub's home page.
- **0:15 – 0:40 Reveal and premise.** Both presenters introduce the hub and the single promise it makes: a map for choosing where AI pays off and where it quietly costs you.
- **0:40 – 1:40 Ecosystem Hub home.** Tour the layout, the budget verdict strip, and the tool cards. One magnified hover showing the colour language the app uses (green for safe, red for risk).
- **1:40 – 2:40 Decision Guide.** Click through the guided questions, land on a recommendation, show the "why" panel underneath.
- **2:40 – 3:40 Token Economy calculator.** This is the signature demo. Switch to Monthly plan mode, drag the sliders, toggle vendor chips, pin a favourite model, click Refresh now, and finish on the live "33 of 33 live" chip.
- **3:40 – 4:50 Risk and Reward page.** The emotional centre. Walk the four Concern cards briefly, then drag the Diminishing Returns slider from 40 to 120 mph with voiceover tying it back to AI use. End on the Task Delegation Matrix with the inverse-advice reveal.
- **4:50 – 5:30 Prompt Playbook and Builder.** Fast cut: open the playbook, highlight the anatomy, jump to the builder and generate one prompt with real BPE token count.
- **5:30 – 6:30 Adoption and Tradeoffs plus Tools catalogue.** Shorter, used as "there's more under the hood" rather than deep dives.
- **6:30 – 7:30 Closing.** Both presenters off-screen, final frame on the hub, three CTAs appear as pinned on-screen cards:
  - Share your biggest AI-tooling pain point in the comments.
  - Try it live on your own machine (link in description).
  - Star the repo and follow for updates.

Timings are indicative; the cut-down to 6 minutes drops the Adoption/Tools segment first, the stretch to 8 minutes slows the Risk and Reward walk-through.

## UI/UX feel

The video itself:

- **Voiceover.** Two presenters, named "Host" and "Dev" in the script. Host sets up each page in plain language; Dev adds the technical reaction. Casual but respectful of the audience, no jargon that is not immediately explained, no AI-slop vocabulary ("delve", "seamless", "unlock", "elevate" are all out, matching the project's Vale lint rules). No em-dashes in the script because the script must pass the same Vale lint if auto-captioned from it.
- **Pacing.** Average scene length 20-30 seconds. One soft cut per scene, max two magnifications per minute, one data-driven moment per minute.
- **Magnifications.** Rectangular zoom-and-highlight (not circular lens) with a 1.4x scale and a 300 ms ease. Used only when a specific chip, number, or chart point is being referenced. Over-magnifying is the single most common mistake in product tours; the script caps it.
- **Colour and overlay.** Keep the hub's own colour language intact; overlay titles are white on a 60% black bar, same font as the app (Inter) for continuity.
- **Captions.** Open captions baked into the video with the hub's accent colours for emphasis (red for risk-related words, green for safe-use words) so a muted scroll past the thumbnail still reads.
- **Music.** One under-track at -22 LUFS, drops out entirely during the Risk and Reward section so the voiceover and the chart land harder.

## Implementation phases

### Phase 1 — MVP, built now

The content artefacts listed in "Core features and experience":
- The full script with timings, speaker tags, and on-screen cues.
- The storyboard mapping script to screen actions.
- The shot list and sample inputs for the Token Economy and Prompt Builder segments so takes are repeatable.
- The description-ready self-host paragraph and CTA block.

Delivered as markdown under `/app/docs/youtube/` so it travels with the repo.

### Phase 2 — Production support (not built now)

- Thumbnail design brief (three A/B candidates aligned with the hub's palette).
- End-screen artwork copy (titles, CTA button text, repo QR).
- A chapter-marker list formatted for pasting into the YouTube description.

### Phase 3 — Series extension (not built now)

- Short-form cutdowns: a 60-second Shorts/Reels version centred on the Risk and Reward page, and a second 60-second cut centred on the Token Economy calculator.
- Follow-up episode scripts: one deep dive per feature (Prompt Builder, Token Economy, Risk and Reward).

## Assumptions

Choices made without asking, in the user's language and tone.

- Both presenters are off-screen the entire time; no face-cam insert. The hub is the star.
- Recording resolution is 1920 x 1080 at 60 fps, dark mode only, English UI copy. Switching themes mid-video is a distraction we skip.
- The browser used in the recording is Chromium with the hub's own cursor; no custom cursor overlay from the editor.
- Sample inputs for the Token Economy demo: Claude Sonnet 5.5 as the default model, 2000 prompts a day, 60% cached share, pin Opus 5.5 and GPT-6 Sol as favourites. Those numbers were picked so the "will $25 last the month?" verdict is visibly green at the start and visibly red after dragging a few sliders — a moment the script relies on.
- Risk and Reward demo starts the slider at 40 mph, pulls it to 70 mph for "sweet spot", and finishes at 110 mph for "cliff edge". Verdict colour transitions are the on-screen beats the voiceover is written around.
- Prompt Builder demo generates one prompt against a short pre-written seed topic ("add pagination to a FastAPI list endpoint") so the live BPE counter has something to count.
- The video uses only in-app content; no external slides, no code editor cutaways, no terminal windows. If the voiceover needs to describe code, it describes it over the Prompt Builder output on screen.
- The self-host paragraph for the description links to the repo's existing `README.md` quick-start section rather than re-authoring instructions in the video.
- "Follow for updates" in the CTA refers to the repo's own watch feature and whichever handle the creator wants to list; the script leaves a placeholder bracket.
- All on-screen typing in demos is pre-queued text pasted at ~45 wpm effective speed. Live typos are not part of the aesthetic.
- Music licence and voice talent are out of scope for the plan; the script is written to work with any reasonably paced delivery between 150 and 170 words per minute.
