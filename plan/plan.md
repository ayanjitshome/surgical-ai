# Token Economy — Optimal Model Suggestion

The Token Economy page learns the user's usage from the sliders already on screen and does the model-shopping for them. Instead of trying one model at a time against the dropdown, the user sees the single cheapest capable model that fits their budget and four runner-ups ready to swap in with one click.

## Who it's for

Developers and tech leads who use the Token Economy page to size a monthly AI coding bill. They know their rough prompt rhythm (prompts per hour, hours per day, days per month) and a monthly budget. They do not want to click twenty-plus models to see which one does not blow their budget.

## Core features and experience

- A **Spotlight** card at the top of the results area always shows the recommended model: the cheapest one above a minimum capability tier that still fits all current slider inputs and the monthly budget.
- The Spotlight card carries the model name and vendor, projected monthly spend, headroom under budget (for example "$47 under your $500 budget"), per-prompt cost, cached-share savings, and a one-line reason ("Cheapest capable model that fits your 500 prompts a day").
- A **Ranked shortlist** of four runners-up sits beside or beneath the Spotlight. Each row carries vendor glyph, model name, projected monthly spend, delta against the Spotlight (`+$12 /mo`), and a `Swap in` button that promotes that row into the Spotlight. The old Spotlight demotes into the row the user just swapped from — nothing is hidden, the comparison is reversible with one click.
- A **capability floor** keeps the shortlist honest: models flagged as basic or tiny in the LiteLLM metadata never win, even when they are cheaper. This stops the suggestion from always being the cheapest no-name model.
- An **over-budget state**: when zero models fit, the Spotlight still shows the cheapest capable model, framed in a red-tinted warning strip that calls out the overage ("$54 over your $500 budget"). The user is never left with nothing to look at.
- The **existing manual dropdown stays** as a visible override, placed next to the Spotlight with the label "Pick manually". Choosing a model from it immediately promotes that model into the Spotlight; a small "Back to recommended" link reverts.
- Everything recalculates **live**: as the user drags any slider or edits the budget, the Spotlight and shortlist refresh in-place with the same smooth number animation the page already uses.
- **Pinned favorites** keep their star but do not jump the ranking. If a pinned model is also the current winner, a small pin glyph appears next to its name.

## User flow

1. The user lands on Token Economy. The sliders are at the saved or default values. The Spotlight card already shows the recommended model for those values.
2. The user slides "Prompts per hour" up. The Spotlight animates to a new model (or stays and shows a tighter headroom). The shortlist re-sorts.
3. The user glances at the shortlist, sees "Claude Haiku +$8 /mo", clicks `Swap in`. Haiku takes the Spotlight; the previous winner slides into row one.
4. The user raises the monthly budget. The red over-budget strip (if any) disappears; a bigger-ticket model may now surface at the top.
5. The user wants to try a specific model from memory. They open the "Pick manually" dropdown, pick it, and it takes the Spotlight with the same card and metrics. A small "Back to recommended" link brings auto-pick back.

## UI/UX feel

- Visual tone matches the existing Token Economy page: dark card surfaces, cyan accent, Apple-HIG restrained type. No new palette.
- The Spotlight card is physically larger than any model row today — generous padding, a strong price number, a short honest reason line. It reads like a verdict, not a suggestion.
- Shortlist rows are compact and scannable, cost first, delta second, vendor glyph aligned left.
- The over-budget state uses the same red tint the Risk & Reward page uses, not a new red, so the aesthetic stays unified.
- All transitions reuse the existing number-roll and card-lift motion. No new animation vocabulary.
- Three design concepts were considered. **Concept B — Spotlight plus ranked shortlist — is the one being built.** The other two are left here so the user can see what was passed over.
  - Concept A: Winner card with a Why-this ribbon. Minimalist Apple-reveal feel, a single verdict with an "Explore alternatives" drawer. Rejected for feeling too opaque — the comparison was one click away rather than always on screen.
  - Concept C: Budget thermometer with model markers. A horizontal budget bar with every eligible model placed as a dot. Rejected as more playful than developer-serious; it also scales badly when there are twenty-plus models.

## Implementation phases

### Phase 1 — MVP, built now

- Add the Spotlight + Ranked shortlist layout, replacing the current "results" area of the Token Economy page.
- Compute recommendations live from the current slider state against the LiteLLM pricing cache the page already uses.
- Enforce the minimum capability tier so basic or tiny models cannot win, even when cheaper.
- Keep the current manual dropdown as a visible override next to the Spotlight, with a "Back to recommended" link.
- Render the over-budget warning state when nothing fits.
- Reuse the existing cards, number-roll animation, and colour tokens; no new palette or motion vocabulary.

### Phase 2 — Not built now

- Pin-aware alternates: pinned models surface in the shortlist even if they fall outside the top four by cost.
- Share link: encode the current slider state and winner into a URL so a user can send the exact scenario to a teammate.
- "Fit my budget" button that trims the sliders proportionally until the current Spotlight comes under budget on its own.

### Phase 3 — Not built now

- Quality dial on the Spotlight card: a two-position toggle "Cheapest / Best fit", where "Best fit" weighs latency and long-context behaviour alongside cost.
- Vendor allow/block list that persists across sessions and biases the shortlist.
- A 90-day usage history ribbon above the Spotlight showing how recommended models have shifted as prices move.

## Assumptions

- "Cheapest above a minimum capability tier" is interpreted as excluding models that LiteLLM metadata or an app-side allow-list marks as basic or tiny. The exact tier floor is a short list maintained in the app; it is not asked from the user per calculation.
- "Capability tier" uses signals already in the pricing cache (max context, provider family, token price band). No new third-party integration is added.
- Monthly spend is the number the page already computes from the sliders; the suggestion engine never introduces its own cost formula.
- Four runner-ups is the right number for a short, scannable list on desktop; the layout gracefully drops to two rows on narrow widths.
- The over-budget state does not block anything; the user can still swap, pin, or override. The warning strip is informational, not destructive.
- "Pick manually" preserves the full current catalogue; the recommendation never hides a model, only re-orders what the user sees first.
- No change to the sliders, the pricing refresh cadence, or the model-picker filter chips that already exist.
- Light and dark mode are both supported out of the gate because the existing cards already respond to the theme tokens.
