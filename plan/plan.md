# Claude Code Setup Playbook — in-app chapter experience

Turn the uploaded setup playbook into a dedicated page inside Surgical AI
Hub, reached from a new sidebar entry placed directly under Risk & Reward.
Reads as eight chapters, each opened one at a time from a landing grid.

## Who it's for

Engineers who are using Claude Code in anger and want to stop prompting
blind. The playbook assumes some familiarity with a terminal, git, and a
modern codebase; it does not teach those. The reader is here to make their
sessions faster, safer, and more repeatable, not to install Claude Code
for the first time.

## Core features and experience

- **Sidebar entry.** New Claude Code Playbook item sits immediately below
  Risk & Reward in the primary nav. Shown on every screen, same visual
  weight as the other top-level pages.
- **Landing grid: eight chapter cards.** One row of headline numbers at
  the top ("8 chapters · ~25 min read · afternoon to apply"), then a
  responsive grid of eight cards, each with a chapter number, a colored
  mini-icon drawn from Lucide, a one-line promise, and a two-line what
  you will take away. Cards are keyboard-focusable, tap-and-go on mobile,
  and show a ticked state once the chapter has been opened in this
  browser.
- **Chapter reader.** Clicking a card swaps the grid for a full-bleed
  reading pane with the chapter title, a back-to-grid arrow, previous and
  next chapter buttons, a thin reading-progress bar at the very top of
  the viewport, and the chapter body itself. The URL carries the chapter
  slug so links and refreshes land on the same place.
- **Copyable code.** Every code block has a copy button that lives
  quietly in the top-right of the block and flashes a confirmation when
  pressed.
- **Anchor on every heading.** Hovering any heading reveals a small link
  icon; clicking copies a deep link to that exact section.
- **Interactive setup checklist.** Chapter 7 (Setup checklist) renders
  the nine bullet points as real checkboxes. Tick state is stored in the
  browser and persists across visits; a small "Reset list" link below
  the checklist clears it.
- **Filterable tables.** The three big tables (the six layers, the
  personal-versus-team paths, and the hook events) each get a short
  search input above them and lightweight column filters (vendor /
  scope / event type depending on the table). Below a certain row count
  the filter UI stays out of the way.
- **Reading tone.** No marketing fluff, no em-dashes, no AI-slop
  vocabulary. Short sentences, concrete nouns, exact file paths. The
  page's voice must sound like the rest of the Hub, especially the
  existing Prompt Playbook and Token Economy pages.
- **Mobile.** Chapter grid collapses to a single column; sticky previous
  and next chapter buttons live at the bottom of the viewport inside a
  chapter; code blocks horizontally scroll rather than wrapping.
- **Print.** `window.print()` produces a clean document with every
  chapter in order and no app chrome, for teams who still want a PDF to
  share around.

## Chapter list

1. **Why setup beats prompting.** The six layers at a glance (the first
   big table), and the rule-of-thumb sentence on when to reach for
   each one.
2. **The folder map.** Where `~/.claude` lives versus the repo's
   `.claude`, the personal-vs-team table, and the precedence rules when
   two settings collide.
3. **CLAUDE.md, the always-on brief.** What belongs in it and what
   doesn't, the starter template, the three ways to stop it bloating,
   and a short note on auto memory.
4. **Skills.** When to write one, where to put it, the SKILL.md anatomy
   with a real example, the frontmatter fields that matter, and the
   starter skills worth having.
5. **Subagents.** When a subagent beats a skill, the priority table,
   how to create one, the frontmatter fields, and the delegation
   patterns.
6. **Settings, permissions, and hooks.** The permissions block, the
   permission modes, the lifecycle events table, a worked PostToolUse
   hook, and the other settings worth knowing.
7. **MCP servers and plugins.** Adding servers, scoping them to a
   single subagent, installing plugins, and the quality-of-life extras
   (statusline, output styles, /doctor, /context).
8. **The daily workflow and the checklist.** The explore-plan-code-
   verify-ship loop, the debugging loop, context hygiene, prompting
   habits, the interactive setup checklist, and the common-mistakes
   table.

## User flow

1. Reader clicks Claude Code Playbook in the sidebar.
2. Landing grid appears. They see eight chapters, pick one.
3. Chapter opens full-bleed with the reading-progress bar at the top
   and previous / next controls visible.
4. They copy a code block with one click, bookmark a specific heading
   if they want, or tick an item off the setup checklist.
5. They hit back, pick another chapter, or close the tab. Checklist
   state and opened-chapter ticks persist on their next visit.

## UI/UX feel

Matches the current Surgical AI Hub language: the dark-but-warm palette,
rounded 10-pixel cards, subtle elevation shadows, Lucide icons tinted
from the existing accent set (the same blue, green, violet, orange, red
used across Decision Guide, Token Economy, Risk & Reward). Each chapter
card gets one of those accents and keeps it as the chapter's tint colour
throughout the reader, so the eye tracks the chapter even inside a long
scroll. Typography stays with the existing Hub type scale; no new font
families. Motion is restrained: a 150 ms crossfade between grid and
chapter, hover lifts on cards, a quick slide on the previous / next
transition. No carousels, no auto-playing anything.

## Implementation phases

### Phase 1 — MVP, built now

Everything described above, in one shipment:

- Sidebar entry below Risk & Reward.
- Landing grid with all eight chapters.
- Chapter reader with reading-progress bar, previous / next, back, and
  deep-linkable URL per chapter.
- Full playbook content converted to the Hub's voice (no em-dashes, no
  AI-slop words), rendered as styled React, with every table, bullet
  list, and code block from the source preserved.
- Copy buttons on all code blocks.
- Hover-to-reveal anchor link on every heading.
- Interactive, browser-persisted setup checklist in Chapter 8.
- Filterable layers / scope / hook-events tables in Chapters 1, 2, 6.
- Opened-chapter tick marks persisted in the browser.
- Mobile layout and print styles.

### Phase 2 — Not built now

- Per-chapter "ask an expert" box that routes a question into the main
  Hub assistant pre-seeded with that chapter as context.
- Export the ticked state as a Markdown report for team review.
- Dark / light theme toggle specific to the reader (the Hub is
  currently dark-only).

### Phase 3 — Not built now

- Second playbook (Codex, Cursor, etc.) using the same reader frame,
  turning the single-page experience into a Playbooks library.
- Embedded, sandboxed terminal demos of key commands (`/init`,
  `/doctor`, `/memory`).

## Assumptions

- The playbook is a reference the reader returns to, not a tutorial
  with forced order. No chapter is locked; any card is clickable at any
  time.
- Content is authored as structured React, not as raw Markdown rendered
  at runtime. This keeps the page's voice consistent and the tables
  properly filterable, and it also lets the Vale linter run over the
  JSX text the way it does on the rest of the app.
- Ticked state and opened-chapter state live in the browser only. No
  backend, no account, no sync across devices. The "Reset list" link is
  the only way to clear it.
- Images from the source are not reproduced; the playbook is text-first
  and the source has no figures beyond its tables and code blocks.
- The sidebar icon for the new entry is a Lucide book or terminal glyph
  (`BookOpen` or `Terminal`) tinted in a fresh accent not already used
  by neighbouring items, so it sits distinctly under Risk & Reward.
- The page is read-only. Nothing in it writes to disk, calls the
  backend, or needs any new API endpoint. The three existing endpoints
  (`/api/pricing`, `/api/tools`, `/api/ecosystem`) are untouched.
- The page's slug is `/claude-code-playbook`. Deep links to chapters
  take the form `/claude-code-playbook/<chapter-slug>`.
- Only the explicitly chosen interactive touches are added (copy code,
  heading anchors, interactive setup checklist, filterable tables);
  nothing else is invented.
