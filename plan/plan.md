# Fix: Ecosystem map control bar icons invisible in dark mode

The ecosystem dependency map's floating control bar shows a visible button strip in dark mode but the glyphs inside (zoom in, zoom out, fit view) disappear. The custom Full-screen button next to them stays visible because it is a Lucide React icon rendered with an explicit colour prop. The three default React Flow buttons are not.

## Who it's for

Anyone viewing the ecosystem map in dark mode. Keyboard users relying on the button labels are already fine via `aria-label`; this fixes the visual regression only.

## Core features and experience

- The three default control buttons (zoom in, zoom out, fit view) match the custom Full-screen button in both themes: the glyph picks up the current theme's secondary text colour, and hover state matches the rest of the map's hover language.
- Light mode is unchanged visually; the same variable resolves to the darker secondary tone there, so a single rule covers both themes.
- Fullscreen (where the map wrapper enters the browser's top layer) keeps the same contrast; CSS variables inherit into that stacking context, so the fix carries over.

## User flow

1. Open the Ecosystem Hub.
2. The dependency map renders with a floating control bar in the bottom-left corner.
3. Toggle the theme between light and dark using the header toggle.
4. In both themes, the three default glyphs read clearly against the button background; the hover tint matches the rest of the map.

## UI/UX feel

- Glyph colour: the same `--text-secondary` already used by the custom Full-screen button, so the four buttons feel like one set.
- Hover tone: lifts to `--text-primary`, same gesture the rest of the app uses on interactive glyphs.
- No shape, spacing, or button-background change. Only the icon fill is corrected.

## Root cause

`index.css` already has the rule `.react-flow__controls-button svg { fill: var(--text-secondary); }`. In `@xyflow/react` v12 the control-bar icons are nested `<path>` elements with hard-coded `fill` presentation attributes, so a fill applied on the `<svg>` wrapper never reaches the painted glyph. The custom Full-screen button escapes this because it is a Lucide icon that receives `color` as a prop and whose paths use `currentColor`.

## Fix

A single CSS extension in `/app/frontend/src/index.css` so the rule reaches the nested paths and the `currentColor` case:

- `.react-flow__controls-button` gets `color: var(--text-secondary)` so any `currentColor` descendants pick it up.
- `.react-flow__controls-button svg, .react-flow__controls-button svg path` both get `fill: var(--text-secondary)` so the hard-coded path fills are overridden.
- `.react-flow__controls-button:hover svg, .react-flow__controls-button:hover svg path` lifts the glyph to `var(--text-primary)` on hover.

No JavaScript edits, no React Flow version bump, no theme-context changes.

## Verification

- Load the Ecosystem Hub in dark mode and confirm all four control buttons (zoom in, zoom out, fit view, full screen) render visible glyphs.
- Toggle to light mode and confirm no regression.
- Enter fullscreen on the map and confirm the glyphs stay visible in both themes.
- Keyboard-tab through the control bar and confirm the focus ring is still visible against the button backgrounds.
- Hand the fix to the `testing_agent` subagent for a formal pass before finish.

## Implementation phases

### Phase 1 — MVP, built now

- Edit `/app/frontend/src/index.css` to add the path-level selectors described above.
- Smoke-test manually in both themes.
- Hand off to `testing_agent` for verification.

### Phase 2 — Not built now

- Scan other third-party components whose icons rely on nested path fills (none known in the current codebase).

### Phase 3 — Not built now

- Replace the three default React Flow controls with Lucide-based `ControlButton` wrappers for full icon-set consistency with the custom Full-screen button.

## Assumptions

- The target contrast tone in each theme is the existing `--text-secondary` token, matching the custom Full-screen button. No new colour tokens are needed.
- Button backgrounds and borders in the current theming are already correct; only the glyph fill was broken.
- No change required to `EcosystemMap.jsx`. All changes are CSS-only.
- Hover tone can lift to `--text-primary` without exceeding contrast expectations; this mirrors how other interactive glyphs in the app respond.
- The `.dark` / `.light` class continues to live on a root element so the CSS variables cascade into the React Flow DOM, including inside browser fullscreen.
